# AgroScale Deployment Plan — Vercel + Railway

Deploy the full stack (frontend SPA + Express/Prisma backend + ML FastAPI service) so that:
- Farmers access the dashboard over HTTPS from anywhere.
- ESP32 scales send live weight readings over the public internet.

**Chosen stack:** Vercel (frontend) + Railway (backend, ML, Postgres). No WebSocket, no MQTT, no VPS.

This is a **plan only** — no code changes here. Follow the phases in order.

---

## 1. Protocol decisions — WebSocket? MQTT? — **No to both.**

| Connection | Current design | Recommendation | Why |
|---|---|---|---|
| ESP32 → Backend | HTTP `POST /api/v1/iot/measurements` (with `x-api-key`) | **Keep HTTP** | One-way push (device → server). HTTP is simple, robust across NAT/mobile networks/firewalls, and the whole Zod → auth → classification pipeline already exists. WebSocket would add reconnect/connection-management complexity with zero benefit here. |
| Browser → Backend | Polling (currently dead `GET /api/devices` every 3 s) | **Keep polling** (3–10 s) **or use SSE** | A dashboard showing readings that arrive every few seconds does not need WebSocket. If you want instant push updates without polling, use **SSE** (Server-Sent Events) — one-way server→browser over plain HTTP, trivially proxied by Vercel's rewrite, no sticky-session/scaling pain. |
| MQTT broker | Not used | **Do not add MQTT** | MQTT solves problems this project doesn't have: hundreds of devices, two-way device control, or battery/bandwidth-constrained networks. It would require running a broker + a bridge into the REST pipeline for zero benefit at MVP scale. **Re-visit MQTT only if you later need:** remote ESP32 commands (tare/reboot/OTA), 50+ scales publishing simultaneously, or battery-powered sensors. |

**Bottom line:** Keep HTTP for ESP32 → backend. Optionally add SSE for the dashboard. Do not introduce WebSocket or MQTT.

---

## 2. Target topology (chosen stack: Vercel + Railway)

```
[ESP32 Scale(s)] ──HTTPS POST /api/v1/iot/measurements (x-api-key)──► your-app.vercel.app
                                                                         │
[Farmer browser] ──HTTPS your-app.vercel.app (SPA)────────────────────►│
                                                                         ▼
                                          ┌─────────────────────────────────────────┐
                                          │           Vercel (edge/CDN)             │
                                          │  • serves built React SPA               │
                                          │  • vercel.json rewrite: /api → Railway  │
                                          │  • free HTTPS/TLS                       │
                                          └─────────────────┬───────────────────────┘
                                                            │ external rewrite
                                                            ▼
                                          ┌─────────────────────────────────────────┐
                                          │         Railway (one project)           │
                                          │  ┌───────────────────────────────────┐  │
                                          │  │ backend (Express) :3002           │  │
                                          │  │  /api/v1/auth /api/v1/iot         │  │
                                          │  │  /api/v1/cows /api/v1/dashboard   │  │
                                          │  └───────┬───────────────┬───────────┘  │
                                          │          │               │ ML call      │
                                          │          ▼               ▼              │
                                          │  postgres :5432     ml_service :5000    │
                                          │  (Railway managed)  (private network)  │
                                          └─────────────────────────────────────────┘
```

**How traffic flows:**
1. Browser and ESP32 both talk to **one public origin** — your Vercel app URL.
2. Vercel serves the static React SPA, and a `vercel.json` **external rewrite** forwards every `/api/*` request to the Railway backend under the same origin. The browser never sees the Railway URL → **CORS is bypassed entirely**.
3. Railway runs three services in one project: `backend` (Express, port 3002), `ml_service` (FastAPI, port 5000), and managed **Railway Postgres**. They talk over Railway's private network; only `backend` is reachable from the public internet (via the Vercel rewrite). No DB or ML port is exposed publicly.
4. The backend calls ML via `https://<ml-service>.railway.internal` (private), not through public DNS.

**Related to** `docker-compose.yml`: it is **local development only** (postgres + backend on Docker). It is *not* used for production. Production runs on Vercel + Railway; the Dockerfile is reused by Railway to build the backend and ML services.

---

## 3. Prerequisites

- **Vercel account** (Hobby/free tier) — for the frontend.
- **Railway account** (Hobby ≈ $5/mo) — for backend + ML + Postgres in one project.
- A git repo connected to both platforms (Vercel + Railway deploy from GitHub).
- A **domain name** (optional for MVP — Vercel gives `*.vercel.app`, Railway gives `*.up.railway.app`; own domain recommended for production so the ESP32 + browser share one stable origin).
- ESP32 devices connected to WiFi/Internet and able to reach `https://<your-app>.vercel.app`.

> No Ubuntu VPS, no Docker Compose in production, no SSH, no firewall management. Railway and Vercel handle the infrastructure.

---

## 4. Pre-deployment blockers (must resolve before going live)

These come from the codebase audit and will bite you in production if ignored:

1. **Secrets leak into Docker image** — `backend/.env` is *not* in `.dockerignore`, so it gets baked into the backend image. Add it to `.dockerignore`. On Railway this matters less (env comes from Railway dashboard), but the image is still public to anyone with image access.
2. **`prisma generate` needs `DATABASE_URL` at build time** — the Docker build runs `npx prisma generate` before runtime env vars exist. On Railway, set `DATABASE_URL` as a **build-time** variable too (Railway supports build args), or the build fails before the container starts.
3. **ML failure = hard 500** — contrary to the docs, there is **no implemented `WeightStandard` fallback** in `backend/src/services/classificationService.js`. If `ML_SERVICE_URL` is unreachable and a cow has breed+sex+DOB filled in, the measurement POST fails with 500. **Decision required:** (a) run ML with high availability, (b) implement the fallback, or (c) accept it. Don't discover this at 3 a.m. from a weighing pad that stops saving data.
4. **Frontend polling dead endpoints** — `App.tsx` polls `GET /api/devices`, which does not exist (only `/api/v1/iot/*` does). It 404s silently every 3 s. Before deploying the UI, repoint this to a real endpoint or remove it.
5. **Units mismatch** — backend stores **kg**; UI shows **lbs** on Home/Devices. Decide one unit for the production UI. IoT payloads must stay **kg**.
6. **Device registration is mandatory** — an ESP32 can only send data if its `device_id` exists in the `Device` table (seeded: `esp32-gateway-01`, `esp32-gateway-02`). Plan how new scales get registered (admin script `node scripts/adminCreateFarmer.js`, seed, or an admin UI).
7. **IoT rate limit is 60/min per IP** (`express-rate-limit`, keyed on source IP). If many ESP32s sit behind the same router/NAT they **share** one 60/min bucket (≈ 1 reading/sec). If you need higher or many-device throughput, key the limiter by `device_id` or raise the limit.
8. **Seed is manual** — `node prisma/seed.js` is not run by any Dockerfile/CI step. Run it once against Railway Postgres after first deploy (only seeds the two default farmers + devices).
9. **🚨 `trust proxy` is missing (Railway-specific)** — `express-rate-limit` keys on `req.ip`. Behind Railway's proxy, every request appears to come from the load balancer's IP, so the 60/min limiter becomes **global** (all farmers + all ESP32s share one bucket). You must add `app.set('trust proxy', 1)` in `backend/src/app.js` or the rate limit breaks in production. Same applies to anything reading the client IP.
10. **Build-time env on Railway** — only variables marked as build-time are visible during the Docker build (needed for blocker #2). Runtime variables (esp. `IOT_API_KEY`, `JWT_SECRET`, `FRONTEND_URL`) are only injected at runtime.

---

## 5. Step-by-step deployment

### Phase 0 — Fix blockers (code)
Resolve items 1–3, 6, 9 from §4. Update frontend to use real endpoints (4) and settle units (5). Keep these as small, isolated commits on `dev1`.

### Phase 1 — Set up Railway (backend + ML + Postgres)
1. Create a Railway project. Add a **Postgres** service (Railway-managed). Note its `DATABASE_URL` — set it as both **build-time and runtime** variable (blockers #2, #10).
2. Add a **backend** service → deploy from the GitHub repo, root/source directory `backend/`. Railway auto-detects the `Dockerfile`.
3. Add an **ML service** → deploy from the same repo, source directory `ML_Train/`, using the new `ML_Train/Dockerfile`.
4. Set backend runtime env vars in the Railway dashboard:
   ```
   IOT_API_KEY=<long-random-string>        # ← shared with ESP32 firmware
   JWT_SECRET=<long-random-string>
   ML_SERVICE_URL=https://<ml-service>.railway.internal   # private network URL
   FRONTEND_URL=https://<frontend>.vercel.app             # or your domain
   # no PORT — Railway injects it
   ```
   Generate secrets with `openssl rand -base64 48`.

### Phase 2 — Set up Vercel (frontend)
1. Import the repo as a **Vite** project. Build command `npm run build`, output `dist/`.
2. Add `vercel.json` with the API rewrite (browser stays same-origin, CORS bypassed):
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://<backend>.up.railway.app/api/:path*" }
     ]
   }
   ```
3. Deploy. Vercel gives you `https://<frontend>.vercel.app` with automatic HTTPS.
4. (Optional) add a custom domain and CNAME it to Vercel.

### Phase 3 — Initialize the database (one-time)
```bash
# Run seed inside the Railway backend container (or via a one-off shell):
#   node prisma/seed.js          → creates farmers + esp32-gateway devices
#   or node scripts/adminCreateFarmer.js --name "..." --phone "..." --password "..." --device "esp32-gateway-03"
```
Prisma `db push` runs on backend startup (in the Dockerfile) so the schema is applied automatically on first boot. Do NOT rely on it for every deploy — run it once after the first deploy.

### Phase 4 — ESP32 firmware configuration

The ESP32 must make TLS-secured HTTP requests to your Vercel URL. Sketch of what the firmware needs (actual code later):

1. **WiFi connection** (station mode).
2. **TLS**: `WiFiClientSecure` + embed the root CA for your domain (Let's Encrypt for a custom domain; Vercel serves a valid cert). Test against `https://<frontend>.vercel.app`.
3. **Payload** — `POST https://<frontend>.vercel.app/api/v1/iot/measurements`
   - Header: `x-api-key: <IOT_API_KEY>` (the exact string from the Railway backend env)
   - Header: `Content-Type: application/json`
   - Body: `{ "device_id": "<registered device id>", "cow_id": "<tag>", "weight_kg": 350.5, "measured_at": "2026-09-14T10:00:00Z" }`
   - Units are **kg** (`weight_kg`, float).
   - This goes through the Vercel rewrite → Railway backend automatically.
4. **Response handling** (important):
   - `201` → success `{ measurement_id, cow_id, classification }`.
   - `401` → wrong `x-api-key` (check config).
   - `400` → payload validation error (check field names/types — Zod schema only accepts `device_id`, `cow_id`, `weight_kg`, optional `measured_at`).
   - `429` → rate limit (60/min/IP) → **back off & retry** (this is the one you'll most likely hit).
   - `500` → ML/classification failure (see blocker #3).
5. **Cadence & time**: keep readings spaced (≥ 1/s per IP, more realistically one every 5–60 s). Sync time via NTP before sending `measured_at` (backend rejects timestamps > 5 min in the future) — or omit `measured_at` entirely to let the server timestamp.

### Phase 5 — Verify end-to-end
1. Browser → `https://<frontend>.vercel.app` → SPA loads, login works (`012345678` / `password123`).
2. `POST https://<frontend>.vercel.app/api/v1/iot/measurements` from Postman/curl with the `x-api-key` → returns 201, then data appears in `/api/v1/cows` and `/api/v1/dashboard/trends` (both also via the rewrite).
3. ESP32 sends a real reading → appears on the dashboard within the polling/SSE interval.
4. `https://<frontend>.vercel.app/api-docs` → Swagger UI reachable through the rewrite.

---

## 6. Operations after launch

- **Logs:** Railway dashboard (per-service logs) and Vercel dashboard (function/log drains). No SSH needed.
- **Backups:** Railway Postgres has built-in backups. Optionally enable hourly/daily backups in Railway.
- **Updates:** push to `dev1` → both platforms auto-redeploy (connect GitHub for continuous deployment).
- **Health:** monitor `https://<frontend>.vercel.app/health` via an uptime service (UptimeRobot has a free tier). The Vercel rewrite makes the backend health check reachable through the public domain.
- **Secret rotation:** change `IOT_API_KEY` / `JWT_SECRET` in Railway env → **every ESP32 firmware must be reflashed** with the new key.
- **Costs:** Vercel Hobby (free) + Railway Hobby (~$5/mo). ML and Postgres run on the same Railway project — no separate AWS/GPU spend.

---

## 7. Open decisions (need your input)

1. **Domain** — use `*.vercel.app`/`*.up.railway.app` for MVP, or buy a domain now and CNAME it? (Affects ESP32 root-CA pinning: with a custom domain the ESP32 trusts Let's Encrypt.)
2. **ML fallback** (blocker #3) — implement the `WeightStandard` fallback, or guarantee the ML service stays up?
3. **Dashboard updates** — keep 3–10 s polling, or add SSE for push?
4. **Scale count & reading frequency** — how many ESP32s and how often? Drives the rate-limit change (60/min per IP).
5. **Dockerfile for ML** — bake `train.py` + `model.pkl` into the image at build time, or mount the dataset/model as a volume? (Build-time is simpler.)

*(Hosting choice is now decided: Vercel → frontend, Railway → backend + Postgres + ML.)*

---

## 8. Estimated timeline

| Phase | Work | Est. effort |
|---|---|---|
| 0 | Fix deployment blockers (code) — incl. `trust proxy`, `.dockerignore` | 1–2 days |
| 1 | Railway setup (Postgres + backend + ML services + env) | 0.5–1 day |
| 2 | Vercel setup + `vercel.json` rewrite | 0.5 day |
| 3 | DB init: seed + device registration | 30 min |
| 4 | ESP32 firmware (TLS + payload + retry) | 1 day |
| 5 | End-to-end verification | 2–3 hours |