# AgroScale Pre-Hosting Task Plan

Complete pre-hosting checklist, organized by priority and dependencies.

## Phase 0 — Backend Code Fixes (blockers, must do first)

### 1. `backend/.dockerignore` — add `.env`

**File:** `backend/.dockerignore`

- Line 12 says `#.env removed for now` — uncomment and add `.env` + `.env.*`
- Without this, `COPY . .` in the Dockerfile bakes secrets into image layers

### 2. `backend/src/app.js` — add `trust proxy`

**File:** `backend/src/app.js`

- Add `app.set('trust proxy', 1)` after `const app = express();`
- Without it, behind Railway/nginx/proxy all requests appear to come from one IP → rate limiter becomes one global bucket for all farmers + ESP32s

### 3. `backend/src/services/classificationService.js` — add WeightStandard fallback

**File:** `backend/src/services/classificationService.js`

- Currently: ML down → hard throw → 500 error, measurement rejected
- Add: catch ML error → query `prisma.weightStandard.findMany()` for breed/sex/age range → compare `weight_kg` to min/max → return `{ label, confidence: 0.7 }`
- `prisma` is already imported but unused in this file

### 4. `ML_Train/Dockerfile` — create (missing)

**File:** `ML_Train/Dockerfile` (new)

- Base: `python:3.11-slim`
- `pip install -r requirements.txt`, `COPY . .`, `RUN python train.py` (bakes `model.pkl` at build time)
- `CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]`
- `apt-get install -y curl` for healthchecks

### 5. `docker-compose.yml` — add ML service

**File:** `docker-compose.yml` (root)

- Add `ml_service` service building from `./ML_Train`
- Change `backend` env `ML_SERVICE_URL` from `host.docker.internal:5000` to `ml_service:5000`
- Backend needs `depends_on: ml_service`

---

## Phase 0.5 — Frontend Fixes (same priority tier)

### 6. `frontend/src/App.tsx` — remove dead polling

**File:** `frontend/src/App.tsx`

- Line 84: `GET /api/devices` → dead endpoint, 404s every 3s
- Line 134: `DELETE /api/devices/${id}` → also dead
- Options: remove device polling entirely, or create a real `/api/v1/devices` backend endpoint

### 7. Units mismatch — decide and fix

**Files:** `frontend/src/pages/Home.tsx`, `frontend/src/pages/Devices.tsx`

- Backend stores **kg**; everything in the frontend hardcodes **lbs**
- Decision: display kg everywhere, or add a toggle?

### 8. `frontend/src/pages/Home.tsx` — connect to real API

**File:** `frontend/src/pages/Home.tsx`

- Currently 100% hardcoded mock data, no API calls
- Needs: `GET /api/v1/dashboard/summary` + `GET /api/v1/dashboard/trends` with JWT Bearer
- Create `frontend/src/services/dashboardService.ts`

---

## Phase 1 — Infrastructure (after code fixes)

### 9. Create `docker-compose.prod.yml`

**File:** `docker-compose.prod.yml` (new, root)

- Services: `postgres`, `backend`, `ml_service`, `frontend`
- Postgres: no host port exposed, healthcheck, named volume
- Backend: `depends_on: postgres (healthy)`, env_file
- ML: `depends_on: backend` (optional)
- Frontend: nginx serving `dist/`, needs `frontend/Dockerfile` + `frontend/nginx.conf`

### 10. Create `frontend/Dockerfile` + `frontend/nginx.conf`

**Files:** `frontend/Dockerfile` (new), `frontend/nginx.conf` (new)

- Multi-stage: `node:22-alpine` build → `nginx:1.27-alpine` serve
- nginx: `try_files` for SPA fallback, `proxy_pass /api/` → backend:3002

### 11. Railway setup

- Create Railway project
- Add Postgres service (Railway-managed)
- Add backend service → `backend/` source dir, Railway auto-detects Dockerfile
- Add ML service → `ML_Train/` source dir
- Set env vars in Railway dashboard: `IOT_API_KEY`, `JWT_SECRET`, `ML_SERVICE_URL` (private network), `FRONTEND_URL`
- **Critical:** `DATABASE_URL` must be both build-time and runtime variable (for `prisma generate`)

### 12. Vercel setup

- Import repo, Vite project
- Create `frontend/vercel.json` with rewrite: `/api/:path*` → Railway backend URL
- Deploy → gives `*.vercel.app` with auto HTTPS

### 13. Seed database (one-time)

- Run `node prisma/seed.js` against Railway Postgres (after first deploy)
- Seeds 2 farmers + 2 devices

---

## Phase 2 — Decisions Still Needed

| Decision | Options | Impact |
|---|---|---|
| **ML fallback** | Implement WeightStandard table fallback vs guarantee ML stays up | Blocks measurement POSTs if ML dies |
| **Units in UI** | kg everywhere vs kg/lbs toggle | Affects Home, Devices, all displays |
| **Dashboard updates** | 3–10s polling vs SSE push | UX + backend work |
| **Domain** | Vercel subdomain vs custom domain | Affects ESP32 TLS pinning, CORS |
| **Scale count** | How many ESP32s? How often? | Affects rate limit config (60/min per IP) |

---

## Summary: what blocks what

```
Blockers 1-5 (backend code)  ──► can start now, no dependencies
Blockers 6-8 (frontend fixes) ──► can start now, no dependencies
Items 9-10 (prod infra files) ──► after blockers 1-5
Items 11-12 (Vercel + Railway) ──► after all code fixes + infra files
Item 13 (seed)                ──► after Railway deploy
Decisions (Phase 2)           ──► decide before or during Phase 0
```