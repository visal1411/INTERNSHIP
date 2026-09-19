# AGENTS.md

## Repo layout

Three independent packages at root, wired together by `docker-compose.yml`:
- `frontend/` — React 19 + Vite 8 + Tailwind v4 + TypeScript (SPA)
- `backend/` — Express + Prisma + PostgreSQL (API server on port 3002)
- `ML_Train/` — Python FastAPI service for cow health classification (port 5000)
- `.specify/` + `specs/` — Spec-driven development artifacts (speckit skills in `.agents/skills/`)
- Active branch: `dev1`

## Running the stack

**Backend (requires Docker + Node.js):**
```
cp backend/.env.example backend/.env   # fill in JWT_SECRET, IOT_API_KEY (values you choose)
docker compose up -d postgres          # Postgres on host port 5433, NOT 5432
cd backend && npm install
npx prisma generate                    # generate Prisma Client (required after install)
npx prisma db push                     # apply schema (NO migrations — uses db push intentionally)
node prisma/seed.js                    # seeds farmers: 012345678/password123, 098765432/password123
npm run dev                            # start API on port 3002
```

**Frontend:**
```
cd frontend && npm install
npm run dev                            # Vite dev server, proxies /api → localhost:3002
npm run build                          # production build
npm run lint                           # eslint (⚠ only covers .js/.jsx, NOT .ts/.tsx)
```

**ML service (optional, backend falls back to WeightStandard table without it):**
```
cd ML_Train
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python train.py                        # MUST run first — generates model.pkl
uvicorn main:app --reload --port 5000
```

## Critical gotchas

1. **Units mismatch**: Backend stores weights in **kg** (`weight_kg` field, Prisma schema). Frontend pages currently display **lbs** with no conversion layer. This is an unresolved inconsistency.

2. **API route mismatch**: `frontend/src/App.tsx` polls `GET /api/devices` for live device status, but the backend exposes `/api/v1/iot/*` routes — there is no `/api/devices` endpoint. This polling silently 404s. Device polling is wired to a dead json-server shape.

3. **Legacy `npm run server`**: Frontend `server` script runs json-server on `db.json:4000`, but `db.json` is gitignored and absent. This script is dead. Vite's proxy already routes `/api` to the real backend at 3002.

4. **ESLint blind spot**: `frontend/eslint.config.js` targets `**/*.{js,jsx}` only. TypeScript files (`.ts`, `.tsx`) are not linted. You must typecheck manually if desired (no `tsc --noEmit` script exists either).

5. **No test framework**: Neither frontend nor backend has tests, test scripts, or test infrastructure. There is no `npm test` command in either package.

6. **Prisma uses `db push`, not migrations**: Schema changes go straight to the database via `npx prisma db push`. Do not create Prisma migration files — this is intentional per the Dockerfile.

7. **Seed creds are phone-based**: Login is `POST /api/v1/auth/login` with `{ "phone": "012345678", "password": "password123" }`. The backend `testing_guide.md` incorrectly shows email in the example body — ignore it.

8. **i18n strings must be dual-authored**: Every translation key must be added in both `en` and `km` in `frontend/src/i18n.ts`. There is no namespace separation — all strings are in one flat file.

9. **`.env` is required and gitignored**: Backend exits immediately on startup if `DATABASE_URL`, `IOT_API_KEY`, `JWT_SECRET`, `FRONTEND_URL`, or `PORT` are missing. Copy from `.env.example`.

10. **Postgres host port is 5433**: Docker-compose maps `5433:5432`. Your `.env` DATABASE_URL should use port `5433` for local Docker connections.

## Backend architecture (reference)

Routes mount at:
- `/api/v1/auth/login` — JWT login (phone + password)
- `/api/v1/iot/measurements` — IoT ingestion (protected by `x-api-key` header, rate limited 60/min)
- `/api/v1/cows` — CRUD for cow registry (protected by JWT Bearer, farmer-scoped)
- `/api/v1/dashboard` — summary + trends (protected by JWT Bearer)
- `/health` — health check
- `/api-docs` — Swagger UI

IoT ingestion pipeline: validates with Zod → device auth → ML classification (3s timeout) → fallback to `WeightStandard` DB table → save measurement.
