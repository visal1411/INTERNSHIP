# AgroScale Implementation Specification

Detailed description of what must be created, modified, and configured to deploy AgroScale publicly. This is a **build-time reference** — every section specifies the exact behavior of each artifact.

---

## Architecture Summary

All services run inside Docker on a single Ubuntu VPS behind a TLS-terminating edge server:

```
ESP32 ──HTTPS──► edge (nginx) ──proxy_pass /api──► backend:3002
Browser ──HTTPS──► edge (nginx) ──serves SPA────────────┘
                                                │
                                    ┌───────────┴────────────┐
                                    ▼                        ▼
                             postgres:5432            ml_service:5000
```

No WebSocket. HTTP POST for ESP32 data, optional SSE for live dashboard updates.

---

## Files to Create

### 1. `backend/.dockerignore` — **Modify** (block secrets leaking into image)

Append `.env` to the existing file. The current file explicitly comments that `.env` was "removed for now". This is a security fix:

```
.env
.env.*
```

Without this, the Docker build context copies secrets into image layers. Every `docker history` exposes them.

---

### 2. `frontend/Dockerfile` — **Create**

Purpose: build the React SPA into a static nginx image.

**Behavior spec:**
- Stage 1 — build: `node:22-alpine`, copy `package*.json`, run `npm ci`, copy all source, run `npm run build` (outputs to `dist/`).
- Stage 2 — serve: `nginx:1.27-alpine`, copy `dist/` from build stage into `/usr/share/nginx/html`.
- Copy a custom `nginx.conf` (see next item) into `/etc/nginx/conf.d/default.conf`.
- Expose port 80 (internal); the edge server (another nginx or Caddy) maps 443 → 80 internally.
- No `CMD` needed — default nginx CMD is correct.

**Why multi-stage:** the final image contains only nginx + static files (~30 MB vs ~350 MB with Node).

---

### 3. `frontend/nginx.conf` — **Create**

Purpose: serve the SPA and reverse-proxy all `/api` traffic to the backend.

**Behavior spec:**
```
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback — any path that doesn't match a file → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy — all /api/* requests go to the Express backend
    location /api/ {
        proxy_pass http://backend:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # If SSE is later added to any /api endpoint:
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

**Key behaviors:**
- SPA routing: Vite builds with client-side routing (`react-router` not yet used, but `try_files` handles future routes too — no harm).
- `/api` prefix is preserved in the proxy pass (backend mounts at `/api/v1/*`), so the frontend uses relative paths consistently with the Vite dev proxy.
- `proxy_buffering off` is already included for when SSE is added — no nginx reconfiguration needed later.
- `proxy_read_timeout 300s` handles long-running classification requests (ML call has a 3 s timeout, but other operations may be slow).

---

### 4. `ML_Train/Dockerfile` — **Create**

Purpose: build a container that runs the FastAPI ML prediction server with a pre-trained model.

**Behavior spec:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python train.py

EXPOSE 5000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
```

**Key behaviors:**
- `train.py` runs at build time → `model.pkl` is baked into the image. No runtime training needed; the container starts fast.
- `uvicorn --host 0.0.0.0` is required — without `--host`, uvicorn binds only to `127.0.0.1` and the container is unreachable.
- Exposes port 5000 internally; the Docker network handles routing from `backend` via `http://ml_service:5000`.
- `cattle_dataset.csv` is included in the image (required by `train.py` during build).
- If `cattle_dataset.csv` grows large, use a multi-stage build to exclude it from the final image.

**If the dataset is not present at build time:** the build will fail at `RUN python train.py`. Either commit `cattle_dataset.csv` to the repo, or mount it as a build-arg volume during the build. Currently it exists at `ML_Train/cattle_dataset.csv`.

---

### 5. `docker-compose.prod.yml` — **Create** (production compose file)

Purpose: orchestrate all four services for deployment.

**Service specs:**

| Service | Image / Build | Internal Port | Depends On | Healthcheck |
|---|---|---|---|---|
| `postgres` | `postgres:15-alpine` | 5432 | — | `pg_isready -U agro_user -d agro_scale_db` (5s interval) |
| `backend` | Build from `./backend` | 3002 | postgres (healthy) | `curl -f http://localhost:3002/health` |
| `ml_service` | Build from `./ML_Train` | 5000 | — | `curl -f http://localhost:5000/docs` |
| `frontend` | Build from `./frontend` | 80 | backend | `curl -f http://localhost:80` |

**Postgres spec:**
- User: `agro_user`, Password: `agro_password`, Database: `agro_scale_db`
- **No host port exposed** — the Postgres port (5433) is only needed for local dev. Production backend talks to it over the Docker network at `postgres:5432`. This is a security improvement over the current dev compose.
- Named volume `postgres_data` persists across restarts/rebuilds.
- Healthcheck: `pg_isready`, interval 5s, timeout 5s, retries 5.

**Backend spec:**
- Build context: `./backend`, Dockerfile: `Dockerfile`
- `env_file`: `./backend/.env`
- `environment:` block overrides (same as current dev compose):
  - `PORT=3002`
  - `DATABASE_URL=postgresql://agro_user:agro_password@postgres:5432/agro_scale_db?schema=public`
  - `ML_SERVICE_URL=http://ml_service:5000`
- `depends_on`: postgres with `condition: service_healthy`
- `restart: always`
- `healthcheck`: `curl -f http://localhost:3002/health || exit 1` (requires `curl` in the image — add `apt-get install -y curl` to the Dockerfile, or use a different healthcheck)
- **Note:** the existing backend Dockerfile does NOT include `curl`. Two options: (a) add `curl` to the Dockerfile, or (b) remove the healthcheck from compose and rely on `depends_on` only. Recommendation: keep the healthcheck for production; it's worth the 1 MB image size increase.

**ML service spec:**
- Build context: `./ML_Train`, Dockerfile: `Dockerfile`
- `restart: always`
- No env vars needed (model is baked in at build time)
- `healthcheck`: `curl -f http://localhost:5000/docs || exit 1` (or `python -c "import requests; requests.get('http://localhost:5000/docs')"` — but `curl` is simpler)
- **Note:** same curl dependency issue. `python:3.11-slim` does not include curl by default. Options: (a) `apt-get install -y curl` in the Dockerfile, (b) use a python-based healthcheck, or (c) skip it. Recommendation: `apt-get install -y curl` in the ML Dockerfile (simple, small image).

**Frontend spec:**
- Build context: `./frontend`, Dockerfile: `Dockerfile`
- Port: `80:80` (the edge server/proxy maps this to 443 externally)
- `depends_on`: backend (but no healthcheck condition — just basic dependency)
- `restart: always`

**Volume spec:**
```yaml
volumes:
  postgres_data:
```

**Network spec:**
All services on the default compose network (Docker Compose creates one automatically). All internal service-to-service communication uses service names as hostnames (`postgres`, `backend`, `ml_service`).

---

### 6. `backend/.env` — **Create** (production, on server only)

This file must exist on the production server inside the repo at `backend/.env`. It is loaded by both the Dockerfile build (for `prisma generate`) and at runtime by the backend.

```env
PORT=3002
DATABASE_URL=postgresql://agro_user:agro_password@postgres:5432/agro_scale_db?schema=public
IOT_API_KEY=<generate with: openssl rand -base64 48>
JWT_SECRET=<generate with: openssl rand -base64 48>
ML_SERVICE_URL=http://ml_service:5000
FRONTEND_URL=https://<your-domain>
```

**Critical values:**
- `DATABASE_URL` host is `postgres` (Docker Compose service name), port `5432` (internal Postgres port, NOT host port 5433).
- `ML_SERVICE_URL` host is `ml_service` (Docker Compose service name), port `5000`.
- `FRONTEND_URL` must exactly match the public origin including `https://` — this is what CORS checks against.
- `IOT_API_KEY` — this exact string must also be programmed into every ESP32 device.
- `JWT_SECRET` — any strong random string; tokens last 7 days (hardcoded in `authService.login`).

**How to generate secrets:**
```bash
openssl rand -base64 48
```

---

### 7. ESP32 Firmware Specification

The ESP32 firmware must implement one function: POST a weight reading to the server over HTTPS.

**Request:**
```
POST https://<your-domain>/api/v1/iot/measurements
Content-Type: application/json
x-api-key: <IOT_API_KEY from backend/.env>

{
  "device_id": "esp32-gateway-01",
  "cow_id": "TAG-001",
  "weight_kg": 350.5,
  "measured_at": "2026-09-14T10:00:00Z"
}
```

**Field constraints (Zod schema in `backend/src/schemas/iot.schema.js`):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `device_id` | string | yes | Must match a `Device.deviceId` already in the DB (seeded: `esp32-gateway-01`, `esp32-gateway-02`) |
| `cow_id` | string | yes | Arbitrary tag string; auto-creates a placeholder cow if not found |
| `weight_kg` | number (positive) | yes | Weight in kilograms; float precision |
| `measured_at` | ISO 8601 string | no | Backend rejects timestamps >5 minutes in the future; omit to use server time |

**Response codes the firmware must handle:**

| Code | Meaning | Firmware action |
|---|---|---|
| `201` | Success | Store locally, update display |
| `400` | Invalid payload | Log error, check field names/types |
| `401` | Wrong `x-api-key` | Check API key matches backend `.env` |
| `429` | Rate limited (60/min/IP) | Back off, retry after `Retry-After` header value |
| `500` | ML service down | Retry later (this is temporary; ML service will recover) |

**HTTPS requirements:**
- Let's Encrypt root CA (ISRG Root X1) must be embedded in the ESP32 firmware for TLS verification.
- The ESP32 `WiFiClientSecure` library supports this — provide the PEM-formatted root cert.
- Alternatively, if using a reverse proxy that terminates TLS, the ESP32 can connect to port 80 internally over HTTP if the VPS is on the same LAN — but for public deployment over the internet, HTTPS is mandatory.

**Reading cadence:**
- At most 1 reading per 5 seconds (conservative, avoids rate limits).
- Rate limit is 60/min per IP. Multiple ESP32s behind the same router share this bucket.
- If you have N devices reading every X seconds: `N * (60/X) ≤ 60`.

---

## Files to Modify

### 8. `frontend/src/App.tsx` — **Modify** (fix dead polling endpoint)

**Current behavior (line 84):**
```js
const res = await fetch('/api/devices');
```
This endpoint does not exist in the backend. It 404s silently every 3 seconds.

**Required change:**
Replace `/api/devices` polling with either:
- (a) Call `/api/v1/dashboard/summary` (returns `{ totalCows, avgWeight, alerts, recentWeighIns }`) — the data the dashboard actually needs.
- (b) Remove the device polling entirely and connect the `Devices` page directly to its own endpoint.
- (c) If live device status is needed, create a new backend endpoint `GET /api/v1/devices` (JWT-protected) that returns the device list with status.

**Decision required:** which approach (a, b, or c) to take. The simplest for now is (b) — remove the dead polling and display static device info from the seed data.

---

### 9. `frontend/src/pages/Home.tsx` — **Modify** (fix hardcoded units and connect to real API)

**Current behavior:**
- All weight values are hardcoded in "lbs" (e.g., `value="1,180 lbs"`, `trend="-5 lbs from last month"`).
- No API calls — the dashboard is pure mock data.

**Required changes:**
- Remove hardcoded values.
- Fetch `GET /api/v1/dashboard/summary` (JWT Bearer) to populate stat cards.
- Fetch `GET /api/v1/dashboard/trends` (JWT Bearer) to populate the 30-day chart.
- Display weight in **kg** (matching backend storage) or add a configurable unit toggle.

---

### 10. `frontend/src/pages/Devices.tsx` — **Modify** (connect to real device endpoint)

**Current behavior:**
- Receives `scalesData` prop from `App.tsx`, which is populated from the dead `/api/devices` poll.

**Required change:**
- Either (a) connect to a new backend device endpoint, or (b) display device info from seed data statically until a proper devices API is built.
- Remove references to `0 lbs` / `currentReading: '0 lbs'` — units should be kg.

---

### 11. `backend/Dockerfile` — **Modify** (add curl for healthcheck)

Append to the existing Dockerfile before `EXPOSE 3002`:
```dockerfile
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

This enables the compose healthcheck to work. Without it, the healthcheck fails and Docker marks the backend as unhealthy.

---

### 12. `backend/src/services/classificationService.js` — **Modify** (add WeightStandard fallback)

**Current behavior:**
```js
const classify = async (breed, sex, ageMonths, weightKg) => {
  try {
    const mlResult = await mlClient.predictWeightStatus(breed, sex, ageMonths, weightKg);
    return mlResult;
  } catch (err) {
    throw new Error('Classification failed because the ML service is unavailable.');
  }
};
```
If ML is down, this throws a hard error — the IoT measurement POST returns 500. Fully-registered cows (breed+sex+DOB set) cannot be weighed.

**Required change — add fallback to WeightStandard table:**
```js
// After the ML call fails, query WeightStandard for the breed/sex/age range
// and return a label ("healthy", "overweight", "underweight") based on
// whether weightKg falls within minHealthyWeight..maxHealthyWeight.
// The prisma import already exists but is unused.
```

**Behavior spec for fallback:**
1. Catch the ML error.
2. Query `prisma.weightStandard.findMany({ where: { breed, sex, ageMinMonths: { lte: ageMonths }, ageMaxMonths: { gte: ageMonths } } })`.
3. If a matching record exists:
   - `weightKg < minHealthyWeight` → `{ label: "underweight", confidence: 0.7 }`
   - `weightKg > maxHealthyWeight` → `{ label: "overweight", confidence: 0.7 }`
   - else → `{ label: "healthy", confidence: 0.7 }`
4. If no matching record → `{ label: "unknown", confidence: 0 }`.
5. This ensures measurements are never rejected due to ML unavailability.

---

### 13. `frontend/src/services/dashboardService.ts` — **Create** (new file)

Purpose: centralized API client for dashboard endpoints.

**Behavior spec:**
```ts
// Uses authService.getToken() to attach Bearer header
// GET /api/v1/dashboard/summary → { totalCows, avgWeightKg, alerts, recentWeighIns }
// GET /api/v1/dashboard/trends  → [{ date, avgWeight }] (30-day daily data)
// All calls use relative paths (/api/...) so they work with both Vite dev proxy and nginx reverse proxy
```

---

### 14. `frontend/src/services/deviceService.ts` — **Create** (new file)

Purpose: API client for device endpoints (if a `GET /api/v1/devices` endpoint is added to the backend).

**Behavior spec:**
- `getToken()` for Bearer header.
- `GET /api/v1/devices` → `[{ deviceId, farmerId, createdAt }]` (basic; status fields would come from the IoT ingestion log).
- If no backend endpoint exists yet, this service is a placeholder.

---

## Deployment Steps (on the server)

### Step 1 — Provision server
```bash
# Ubuntu 22.04/24.04
apt update && apt upgrade -y
apt install -y ufw git
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Docker
curl -fsSL https://get.docker.com | sh
```

### Step 2 — Clone and configure
```bash
cd /opt
git clone <your-repo-url> agroscale
cd agroscale
git checkout dev1
```

### Step 3 — Create production `.env`
```bash
cd backend
cp .env.example .env
# Edit .env with production values (use openssl rand for secrets)
IOT_KEY=$(openssl rand -base64 48)
JWT_KEY=$(openssl rand -base64 48)
# Set DATABASE_URL, ML_SERVICE_URL, FRONTEND_URL, IOT_API_KEY, JWT_SECRET
```

### Step 4 — Build and deploy
```bash
cd /opt/agroscale
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 5 — Seed database (one-time)
```bash
docker compose -f docker-compose.prod.yml exec backend node prisma/seed.js
```

### Step 6 — Register ESP32 devices (one-time)
```bash
docker compose -f docker-compose.prod.yml exec backend \
  node scripts/adminCreateFarmer.js \
  --name "Farmer Name" \
  --phone "012345678" \
  --password "securepassword" \
  --device "esp32-gateway-01"
```

### Step 7 — HTTPS (with Caddy, recommended for simplicity)
```bash
apt install -y caddy
```
Create `/etc/caddy/Caddyfile`:
```
your.domain {
    reverse_proxy frontend:80
}
```
Then `systemctl restart caddy`. Caddy auto-provisions Let's Encrypt certs.

**Alternative with nginx + certbot:**
```bash
apt install -y nginx certbot python3-certbot-nginx
```
Configure nginx to listen on 80, proxy to frontend:80, then `certbot --nginx -d your.domain`.

---

## Verification Checklist

After deployment, verify each item:

| Item | How to verify | Expected |
|---|---|---|
| Frontend loads | `curl -I https://your.domain` | 200 OK, HTML content |
| SPA routes work | Navigate to `https://your.domain/herd` | React app renders (not nginx 404) |
| Backend health | `curl https://your.domain/health` | `{"status":"ok"}` |
| Login works | POST login with phone+password | Returns JWT token |
| Swagger UI | `https://your.domain/api-docs` | Swagger UI loads |
| ML service | `curl http://localhost:5000/docs` (on server) | FastAPI docs page |
| ESP32 test | `curl -X POST .../api/v1/iot/measurements` | 201 Created |
| ESP32 real | ESP32 sends weight reading | Appears in `/api/v1/cows` |
| Rate limit | Send 61 requests in <60s | Last request returns 429 |
| HTTPS cert | Browser padlock | Valid Let's Encrypt cert |

---

## Known Bugs to Fix Before Deployment

| Bug | File | Impact |
|---|---|---|
| `.env` not in `.dockerignore` | `backend/.dockerignore` | Secrets baked into Docker image layers |
| No WeightStandard fallback | `backend/src/services/classificationService.js` | ML down = all registered cow weighings fail with 500 |
| Dead `/api/devices` polling | `frontend/src/App.tsx` | 404 every 3 seconds, wasted bandwidth |
| Hardcoded lbs units | `frontend/src/pages/Home.tsx` | Displays wrong units vs backend (kg) |
| ESLint ignores TS files | `frontend/eslint.config.js` | TypeScript errors not caught by lint |
| `adminCreateFarmer.js` references non-existent `email` field | `backend/scripts/adminCreateFarmer.js` | Script crashes if `--email` is passed |
| `FRONTEND_URL` default mismatch | `backend/.env.example` | Defaults to `localhost:3000` but Vite serves on `5173` |

---

## Open Decisions (require your input)

1. **Dashboard API approach** — should `App.tsx` call `/api/v1/dashboard/summary` or remove polling entirely? (Decision affects frontend work scope.)
2. **Units in UI** — display kg everywhere (matching backend), or add a kg/lbs toggle?
3. **Edge server** — Caddy (auto-TLS, zero config) or nginx + certbot (more control, manual cert)?
4. **ML service availability** — is the ML service expected to be always-on, or should the WeightStandard fallback be implemented as the primary path?
5. **Number of ESP32 devices** — affects rate limit configuration (60/min per IP shared across devices behind same router).
6. **Monitoring** — basic healthcheck cron, or a proper uptime monitor (UptimeRobot, HetrixTools)?
