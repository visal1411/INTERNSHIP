# Environment Configuration Guide (`ENVIRONMENT_GUIDE.md`)

This guide explains how to run, switch, and manage environments in the **AgroScale Cow Dashboard System** for both **Localhost Development** and **Deployed Production**.

---

## 🌐 Environment Summary

| Component | Localhost (Development) | Deployed (Production) |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:5173` (Vite) | Vercel / Render SPA |
| **Backend API** | `http://localhost:3002` (Express) | `https://agroscale-backend.onrender.com` |
| **Database** | PostgreSQL Docker (`localhost:5433`) | Render PostgreSQL |
| **ML Service** | `http://127.0.0.1:5000` (FastAPI) | Railway ML Service (`https://...up.railway.app`) |

---

## ⚡ Quick Start Commands

### 1. Localhost Environment (Full Stack Local)

To run everything locally on your machine:

#### Step 1: Start PostgreSQL with Docker
```bash
docker compose up -d postgres
```
*(Postgres runs on host port `5433` as defined in `docker-compose.yml`)*

#### Step 2: Start Backend (Port 3002)
```bash
cd backend
npm run dev
```

#### Step 3: Start ML Service (Port 5000, Optional)
```bash
cd ML_Train
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python train.py          # Generate model.pkl
uvicorn main:app --reload --port 5000
```

#### Step 4: Start Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
> The frontend header sidebar will display `● Localhost` and proxy all `/api/*` calls to `http://localhost:3002`.

---

### 2. Hybrid Mode: Local Frontend → Deployed Backend

If you want to run the React frontend locally on your laptop but test against the **deployed Render backend & production database**:

```bash
cd frontend
npm run dev:prod
```
> The frontend header sidebar will display `● Deployed` and proxy all `/api/*` calls to `https://agroscale-backend.onrender.com`.

---

## 📂 Environment Files Structure

### Frontend (`frontend/`)
- [`.env.development`](file:///d:/internship/CowDashboardSFE/frontend/.env.development): Targets `http://localhost:3002`
- [`.env.production`](file:///d:/internship/CowDashboardSFE/frontend/.env.production): Targets `https://agroscale-backend.onrender.com`
- [`.env.example`](file:///d:/internship/CowDashboardSFE/frontend/.env.example): Template reference
- [`vite.config.js`](file:///d:/internship/CowDashboardSFE/frontend/vite.config.js): Dynamically reads `VITE_PROXY_TARGET` per build/dev mode.

### Backend (`backend/`)
- [`.env.development`](file:///d:/internship/CowDashboardSFE/backend/.env.development): Targets local Postgres (`localhost:5433`) & local ML (`http://127.0.0.1:5000`).
- [`.env.production`](file:///d:/internship/CowDashboardSFE/backend/.env.production): Targets Render Postgres & Railway ML service.
- [`.env.example`](file:///d:/internship/CowDashboardSFE/backend/.env.example): Template reference.
- [`.env`](file:///d:/internship/CowDashboardSFE/backend/.env): Active local configuration.

---

## 🔄 Switching Environments Cheat Sheet

- **To run fully local:** Run `npm run dev` in `frontend` and `npm run dev` in `backend`.
- **To test local UI against live production backend:** Run `npm run dev:prod` in `frontend`.
- **To build frontend for production deployment:** Run `npm run build:prod` in `frontend`.
