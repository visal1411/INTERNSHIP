# AgroScale Integration Plan: Frontend, Backend API & ESP32 Scale Simulator

This document outlines the end-to-end integration architecture and step-by-step implementation plan for connecting the React frontend with the PostgreSQL/Express backend and providing an automated **ESP32 IoT Load-Cell Scale Simulator**.

---

## 🎯 1. Key Principles & Confirmed Requirements

1. **Authentication & Multi-Tenancy (JWT In-Depth)**:
   - **What is JWT?**: A JSON Web Token (JWT) is a cryptographically signed credential containing user claims (`farmerId`, `email`) and expiration.
   - **How Backend Generates It**: When a farmer logs in (`POST /api/v1/auth/login`), the backend verifies their password hash with `bcrypt`, signs a token containing `{ farmerId: farmer.id }` using `JWT_SECRET`, and returns `{ token: "eyJ..." }`.
   - **How Middleware Validates It (`farmerAuth.js`)**: On every protected request (`/api/v1/cows/*`, `/api/v1/dashboard/*`), the backend middleware extracts the `Authorization: Bearer <token>` header, verifies the cryptographic signature with `JWT_SECRET`, and sets `req.farmerId = decoded.farmerId`.
   - **Multi-Tenant Data Isolation**: Database queries use `where: { farmerId: req.farmerId }`, guaranteeing that Farmer 1 can never access Farmer 2's cows, scales, or weight history.
   - **Frontend Auto-Session**: The frontend initializes a background auth session on startup for `farmer1@agroscale.com` (`password123`) and stores the JWT in `localStorage`.
   - **Account Switcher**: In Settings, a farmer profile toggle lets you switch between Farmer 1 and Farmer 2 to test multi-tenancy live.

> [!WARNING]
> **No Dedicated Frontend Login/Register Page UI**:
> The frontend does **not** currently have a dedicated standalone Login/Register screen or landing page. Authentication is handled automatically behind the scenes (auto-logging into `farmer1@agroscale.com` on app start) and through the **Account Switcher** in the **Settings** tab. If a standalone login/signup screen is desired in the future, it should be built as a separate UI component.

2. **Weight Units**:
   - **Kilograms (`kg`) strictly throughout** the database, API payloads, charts, KPI cards, device readings, and simulator. No lbs.
3. **Single ESP32 Gateway**:
   - Single primary scale device (`esp32-gateway-01` / *"Main Pasture Scale"*).
   - Devices tab displays live readings, status, battery, and measurement history.
4. **Cow Registration (No Manual Weight)**:
   - Farmer only provides **Tag ID**, **Breed**, **Gender**, and **Age / Date of Birth** when adding a cow.
   - Weight is strictly recorded when the cow walks onto the ESP32 physical/simulated scale.
5. **Real-time Updates**:
   - Frontend polls summary and device endpoints periodically so simulator weigh-ins update the dashboard live.

---

## 🔐 2. Detailed JWT Authentication Lifecycle & Flow

```
+---------------------------------------------------------------------------------------+
| 1. LOGIN / BOOTSTRAP (Frontend -> Backend)                                            |
|                                                                                       |
|   POST /api/v1/auth/login                                                             |
|   Body: { "email": "farmer1@agroscale.com", "password": "password123" }               |
|                                                                                       |
|   Backend Action:                                                                     |
|     1. Finds farmer by email in PostgreSQL.                                           |
|     2. Verifies passwordHash with bcrypt.compare().                                   |
|     3. Signs JWT: jwt.sign({ farmerId: farmer.id }, JWT_SECRET, { expiresIn: '7d' }) |
|     4. Returns: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }                |
|                                                                                       |
|   Frontend Action:                                                                    |
|     1. Saves token to localStorage.setItem('token', token).                           |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 2. PROTECTED API REQUEST (Frontend -> Backend)                                        |
|                                                                                       |
|   GET /api/v1/dashboard/summary                                                       |
|   Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...              |
|                                                                                       |
|   Backend Middleware (`farmerAuth.js`):                                               |
|     1. Extracts token from Authorization header.                                      |
|     2. Verifies signature: const decoded = jwt.verify(token, JWT_SECRET).             |
|     3. Attaches: req.farmerId = decoded.farmerId.                                     |
|                                                                                       |
|   Backend Controller / Prisma:                                                        |
|     prisma.cow.findMany({ where: { farmerId: req.farmerId } })                        |
|     --> Only returns records belonging to that specific farmer.                       |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| 3. MULTI-TENANT SWITCHING (Settings Page)                                             |
|                                                                                       |
|   - Click "Log in as Farmer 2 (Jane Smith)"                                           |
|   - Calls /api/v1/auth/login with farmer2@agroscale.com credentials                   |
|   - Updates localStorage with new token (farmerId = 2)                                |
|   - Dashboard/Herd instantly re-fetches and displays Farmer 2's distinct cows/devices |
+---------------------------------------------------------------------------------------+
```

---

## 🏗️ 2. Architecture & Data Flow

```
+-------------------------------------------------------------+
|             ESP32 Scale Simulator                           |
|       (backend/scripts/simulateEsp32.js)                    |
|                                                             |
|   Simulates: HX711 Load Cell Platform                       |
|   Sends: POST /api/v1/iot/measurements (x-api-key)          |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             Express Backend API (Port 3002)                 |
|   Handles Auth, Ingestion, Herd Mgmt & Analytics            |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             PostgreSQL Database (Port 5433)                 |
|   Tables: Farmer, Device, Cow, WeightMeasurement,          |
|           WeightStandard                                    |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             React + Vite Frontend (Port 5173 / 3000)        |
|   - Home: Live KPI stat cards, weight trend Area chart      |
|   - Herd: Registered cow table, growth charts, Add Cow modal|
|   - Devices: Live reading from esp32-gateway-01, battery    |
|   - Settings: Farmer profile & multi-tenant switcher        |
+-------------------------------------------------------------+
```

### 📡 API Endpoints Overview

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | Register new farmer account (`name`, `email`, `password`), creates default scale device, returns signed JWT |
| `POST` | `/api/v1/auth/login` | None | Farmer login with email & password, returns signed JWT |
| `POST` | `/api/v1/iot/measurements` | `x-api-key` | Ingest scale reading from ESP32 gateway, auto-classify weight |
| `GET` | `/api/v1/cows` | Bearer JWT | List all cows owned by farmer with latest scale weight (kg) & status |
| `POST` | `/api/v1/cows` | Bearer JWT | Register new cow (tag, breed, gender, age/DOB — no weight) |
| `GET` | `/api/v1/cows/{id}` | Bearer JWT | Get single cow profile and latest measurement |
| `GET` | `/api/v1/cows/{id}/growth` | Bearer JWT | Chronological weight history coordinates for charts |
| `GET` | `/api/v1/dashboard/summary` | Bearer JWT | Herd summary stats (total cows, avg kg, alerts, recent weigh-ins) |
| `GET` | `/api/v1/dashboard/trends` | Bearer JWT | 30-day daily herd average weight trend data (kg) |


---

## 📋 3. Step-by-Step Implementation Details

### Step 1: ESP32 IoT Scale Simulator
* **File:** `backend/scripts/simulateEsp32.js`
* **Features:**
  - Simulates cow stepping onto load cell, platform stabilization, and HTTP transmission.
  - Sends to `http://localhost:3002/api/v1/iot/measurements` with `x-api-key: your_iot_key`.
  - Configurable modes:
    - **Single weigh-in**: `npm run simulate:esp32 -- --once`
    - **Continuous stream**: `npm run simulate:esp32 -- --interval 5000`
  - Colorized CLI output showing generated weight (kg), target tag, response classification (`healthy`, `overweight`, `underweight`), and measurement ID.

### Step 2: Backend Database Seeder & Enhancements
* **File:** `backend/prisma/seed.js`
  - Seeds `Farmer` records (`farmer1@agroscale.com`, `farmer2@agroscale.com`).
  - Seeds `Device` record (`esp32-gateway-01`).
  - Seeds `WeightStandard` reference benchmarks across standard breeds (`Angus`, `Brahman`, `Hereford`, `Holstein`) for automated weight classification fallback.
  - Seeds sample cows and 30-day historical weigh-ins in kg.
* **File:** `backend/src/routes/authRoutes.js`, `backend/src/controllers/authController.js`, `backend/src/services/authService.js`
  - Implement **`POST /api/v1/auth/register`**:
    - **Request Body**: `{ "name": "John Doe", "email": "john@agroscale.com", "password": "password123" }`
    - **Validation**: Name required, valid email format, password min 6 chars.
    - **Action**: Hashes password with `bcrypt`, creates `Farmer` in PostgreSQL, binds default `esp32-gateway-01` device if needed, and returns signed JWT token + farmer profile.
    - **Responses**: `201 Created` (returns `{ token, farmer }`), `400 Bad Request` (validation error), `409 Conflict` (email already exists).
* **File:** `backend/src/routes/cowRoutes.js` & `backend/src/services/cowService.js`
  - Implement **`POST /api/v1/cows`**: Accepts `cowId`, `breed`, `sex`, `dateOfBirth` / `ageMonths` (no manual weight).
  - Update **`GET /api/v1/cows`**: Automatically attaches each cow's latest scale measurement in kg, status label, and timestamp.

### Step 3: Frontend API Client Layer
* **`frontend/src/services/apiClient.ts`**: Axios/fetch wrapper with automatic JWT Bearer token injection and error handling.
* **`frontend/src/services/authService.ts`**: Auto-login session initialization, token storage in `localStorage`, and farmer switching.
* **`frontend/src/services/dashboardService.ts`**: Methods for `/api/v1/dashboard/summary` and `/api/v1/dashboard/trends`.
* **`frontend/src/services/cowService.ts`**: Methods for `/api/v1/cows` (list, create, get single, get growth history).
* **`frontend/src/services/deviceService.ts`**: Methods for fetching primary scale status and live readings.

### Step 4: Frontend Page Updates
* **`Home.tsx`**:
  - Connect KPI stat cards (Total Cows, Avg Weight kg, Overweight Alerts) to live API.
  - Connect 30-day trends chart with kg units.
  - Connect Recent Weigh-Ins table with live status and timestamps.
* **`Herd.tsx`**:
  - Connect herd list table to live cows.
  - **Add Cow Modal**: Prompts only for **Tag ID**, **Breed**, **Gender**, and **Age / Date of Birth** (no weight input).
  - Cow profile modal displaying historical growth graph in kg.
* **`Devices.tsx`**:
  - Streamlined dedicated view for the single primary scale device (`esp32-gateway-01`).
  - Shows live weight reading in kg, battery level, online status, and recent weigh-in logs.
* **`Settings.tsx`**:
  - Displays logged-in farmer account details and includes a **"Switch Farmer"** toggle to test multi-tenancy.

---

## 🧪 4. Verification & Testing Workflow

1. **Start Services**:
   ```powershell
   docker compose up --build -d
   ```
2. **Seed Initial Database**:
   ```powershell
   cd backend
   node prisma/seed.js
   ```
3. **Start Frontend**:
   ```powershell
   cd ../frontend
   npm run dev
   ```
4. **Run ESP32 Simulator**:
   ```powershell
   # Run in a separate terminal to send continuous weigh-ins every 4 seconds
   cd backend
   node scripts/simulateEsp32.js --interval 4000
   ```
5. **Verify Real-Time Experience**:
   - Open browser at `http://localhost:5173`.
   - Observe the live reading update on the Dashboard and Devices page in kg as the simulator sends readings.
