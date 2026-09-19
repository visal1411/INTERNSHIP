# AgroScale Backend Documentation

## 1. Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js (Express 4.18) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (7-day expiry) + bcrypt |
| Validation | Zod |
| Rate Limiting | express-rate-limit (60 req/min) |
| ML Integration | FastAPI service (3s timeout) |
| Documentation | Swagger/OpenAPI 3.0 |
| Docker | Multi-stage (PostgreSQL + App) |

---

## 2. Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   ESP32     │────▶│   Backend    │────▶│  PostgreSQL │
│  (Scale)    │     │  (Express)   │     │  (Prisma)   │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  ML Service │
                    │  (Python)   │
                    └─────────────┘

┌─────────────┐     ┌──────────────┐
│  Browser    │────▶│   Backend    │
│  (Farmer)   │     │  (JWT Auth)  │
└─────────────┘     └──────────────┘
```

**Two separate auth systems:**
- **Farmer (Browser)** → JWT Bearer token (`/api/v1/auth/login`)
- **ESP32 (IoT)** → `x-api-key` header + `device_id` in body

---

## 3. Database Schema (Prisma)

| Model | Purpose |
|-------|---------|
| `Farmer` | User accounts (phone, passwordHash, name) |
| `Device` | ESP32 gateways linked to farmer (`deviceId`, `farmerId`) |
| `Cow` | Livestock records (`cowId`, breed, sex, dateOfBirth, farmerId) |
| `WeightMeasurement` | Weight readings (weightKg, status, confidence, measuredAt) |
| `WeightStandard` | Fallback reference table for ML classification (breed/sex/age ranges) |

---

## 4. All Routes & Controllers

### Base Path: `/api/v1`

| Method | Endpoint | Auth | Controller | Description |
|--------|----------|------|------------|-------------|
| **Auth** |
| POST | `/auth/login` | None | `authController.login` | Login with phone+password → returns JWT |
| **IoT (ESP32)** |
| POST | `/iot/measurements` | `x-api-key` + rate limit | `iotController.ingest` | Ingest weight from ESP32 |
| **Cows (Farmer)** |
| GET | `/cows` | JWT Bearer | `cowController.listCows` | List all farmer's cows |
| GET | `/cows/:id` | JWT Bearer | `cowController.getCow` | Get single cow details |
| GET | `/cows/:id/measurements` | JWT Bearer | `cowController.listMeasurements` | Weight history for cow |
| GET | `/cows/:id/growth` | JWT Bearer | `cowController.getGrowth` | Chart data (date + weight_kg) |
| POST | `/cows` | JWT Bearer | `cowController.createCow` | Register new cow |
| PUT | `/cows/:id` | JWT Bearer | `cowController.updateCow` | Update breed/sex/birthDate |
| **Dashboard (Farmer)** |
| GET | `/dashboard/summary` | JWT Bearer | `dashboardController.getSummary` | Total cows + 10 recent weights |
| GET | `/dashboard/trends` | JWT Bearer | `dashboardController.getTrends` | 30-day daily avg weight |
| **Health** |
| GET | `/health` | None | inline | DB connectivity check |

---

## 5. Middleware Chain

```
Request
   │
   ├─▶ CORS (FRONTEND_URL only)
   ├─▶ bodyParser.json (10mb limit)
   ├─▶ Routes
   │     ├─ /health → no auth
   │     ├─ /auth/login → no auth
   │     ├─ /iot/* → iotRateLimiter → deviceAuth (x-api-key)
   │     ├─ /cows/* → farmerAuth (JWT)
   │     └─ /dashboard/* → farmerAuth (JWT)
   │
   └─▶ errorHandler (catches all errors)
```

| Middleware | File | Purpose |
|------------|------|---------|
| `farmerAuth` | `middleware/farmerAuth.js` | Verifies JWT, sets `req.farmerId` |
| `deviceAuth` | `middleware/deviceAuth.js` | Verifies `x-api-key` header matches `IOT_API_KEY` |
| `iotRateLimiter` | `middleware/rateLimiter.js` | 60 requests/minute per IP |
| `errorHandler` | `middleware/errorHandler.js` | Formats all errors as `{error: {code, message}}` |

---

## 6. Service Logic (Business Rules)

### `authService.login(phone, password)`
1. Find farmer by phone
2. bcrypt compare password
3. Sign JWT with `farmerId` payload (7 days)
4. Return `{token, farmer: {id, name, phone}}`

### `iotIngestionService.ingestMeasurement(payload)`
1. **Validate device**: Lookup `device_id` in Device table → get `farmerId`
2. **Upsert cow**: `cowId` + `farmerId` unique → create if missing
3. **Calculate age**: If `cow.dateOfBirth` exists → months since birth
4. **Classify weight**:
   - If cow has breed+sex+age → call ML service (`mlClient.predictWeightStatus`)
   - ML returns `{label, confidence}` (healthy/underweight/overweight)
   - If ML fails → throw error (no fallback in current code!)
5. **Save measurement**: WeightMeasurement record with classification
6. Return `{measurement_id, cow_id, classification}`

### `cowService`
- `getCows(farmerId)` → cows with latest weight + status
- `getCowById(farmerId, id)` → scoped to farmer
- `getMeasurements(farmerId, cowId)` → all weights desc
- `getGrowth(farmerId, cowId)` → `{points: [{date, weight_kg}]}` sorted asc
- `createCow(farmerId, data)` → unique cowId per farmer
- `updateCow(farmerId, id, data)` → updates breed/sex/birthDate → **auto-triggers ML re-classification on latest measurement**

### `dashboardService`
- `getSummary(farmerId)` → `{totalCows, recentActivity: [{...measurement, cow: {cowId}}]}`
- `getTrends(farmerId)` → 30 days daily average weight across herd

### `classificationService` → `mlClient`
- Calls `POST ${ML_SERVICE_URL}/predict` with `{breed, age_months, gender, weight_kg}`
- 3-second timeout
- Returns `{label, confidence}` or throws

---

## 7. Environment Variables (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default 3002) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `IOT_API_KEY` | Yes | Secret key for ESP32 auth (shared) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `ML_SERVICE_URL` | No | Python ML service URL (e.g., `http://localhost:5000`) |
| `FRONTEND_URL` | Yes | CORS origin (e.g., `https://your-app.vercel.app`) |

---

## 8. Postman Collection (Import Ready)

Save as `AgroScale_API.postman_collection.json` and import into Postman:

```json
{
  "info": {
    "name": "AgroScale Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3002", "type": "string" },
    { "key": "iotApiKey", "value": "your_iot_key", "type": "secret" },
    { "key": "jwtToken", "value": "", "type": "secret" },
    { "key": "farmerId", "value": "", "type": "string" },
    { "key": "deviceId", "value": "esp32-gateway-01", "type": "string" },
    { "key": "cowId", "value": "COW-001", "type": "string" }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Auth - Login (Farmer 1)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/v1/auth/login",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"phone\": \"012345678\",\n  \"password\": \"password123\"\n}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "if (pm.response.code === 200) {",
              "  const res = pm.response.json();",
              "  pm.collectionVariables.set('jwtToken', res.token);",
              "  pm.collectionVariables.set('farmerId', res.farmer.id);",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "IoT - Ingest Measurement (ESP32)",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/v1/iot/measurements",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-api-key", "value": "{{iotApiKey}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"device_id\": \"{{deviceId}}\",\n  \"cow_id\": \"{{cowId}}\",\n  \"weight_kg\": 425.5,\n  \"measured_at\": \"2026-09-15T10:00:00Z\"\n}"
        }
      }
    },
    {
      "name": "Cows - List All",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/cows",
        "header": [
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ]
      }
    },
    {
      "name": "Cows - Get Single",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/cows/1",
        "header": [
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ]
      }
    },
    {
      "name": "Cows - Get Measurements",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/cows/1/measurements",
        "header": [
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ]
      }
    },
    {
      "name": "Cows - Get Growth Chart Data",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/cows/1/growth",
        "header": [
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ]
      }
    },
    {
      "name": "Cows - Create New Cow",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/v1/cows",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"cowId\": \"COW-002\",\n  \"breed\": \"Holstein\",\n  \"gender\": \"Female\",\n  \"birthDate\": \"2024-01-15T00:00:00Z\"\n}"
        }
      }
    },
    {
      "name": "Cows - Update Cow",
      "request": {
        "method": "PUT",
        "url": "{{baseUrl}}/api/v1/cows/1",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"breed\": \"Holstein\",\n  \"gender\": \"Female\",\n  \"birthDate\": \"2024-01-15T00:00:00Z\"\n}"
        }
      }
    },
    {
      "name": "Dashboard - Summary",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/dashboard/summary",
        "header": [
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ]
      }
    },
    {
      "name": "Dashboard - Trends (30 days)",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v1/dashboard/trends",
        "header": [
          {"key": "Authorization", "value": "Bearer {{jwtToken}}"}
        ]
      }
    }
  ]
}
```

---

## 9. Testing Flow (Step by Step)

### 1. Start Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your values
docker compose up -d postgres
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
```

### 2. Test Health
```
GET http://localhost:3002/health
→ { "status": "ok", "db": "ok" }
```

### 3. Login as Farmer (Get JWT)
```
POST http://localhost:3002/api/v1/auth/login
Content-Type: application/json
{
  "phone": "012345678",
  "password": "password123"
}
→ { "token": "eyJ...", "farmer": { "id": 1, "name": "John Doe", "phone": "012345678" } }
```

### 4. Test Farmer Endpoints (use JWT)
```
GET http://localhost:3002/api/v1/cows
Authorization: Bearer <token>

GET http://localhost:3002/api/v1/dashboard/summary
Authorization: Bearer <token>
```

### 5. Test ESP32 Endpoint (use x-api-key)
```
POST http://localhost:3002/api/v1/iot/measurements
Content-Type: application/json
x-api-key: your_iot_key
{
  "device_id": "esp32-gateway-01",
  "cow_id": "COW-001",
  "weight_kg": 425.5
}
→ { "measurement_id": 1, "cow_id": "COW-001", "classification": { "label": "healthy", "confidence": 0.92 } }
```

---

## 10. Key Gotchas to Know

| Issue | Details |
|-------|---------|
| **Units** | Backend stores `weight_kg` (kg). Frontend shows lbs — no conversion layer exists. |
| **ML Fallback** | Current code throws if ML fails — no fallback to `WeightStandard` table (despite comments saying it does). |
| **Swagger vs Code Mismatch** | Swagger `IoTMeasurementRequest` requires `breed`, `sex`, `age_months` but actual Zod schema only requires `device_id`, `cow_id`, `weight_kg`. ESP32 sends minimal payload. |
| **Rate Limit** | 60 req/min per IP on `/iot/*` endpoints. |
| **CORS** | Only allows `FRONTEND_URL` origin. |
| **Seed Credentials** | Farmer 1: `012345678` / `password123` (device: `esp32-gateway-01`) |
| **No Tests** | No test suite exists. |

---

## 11. Deployment Guide

### Option A: Railway (Recommended for Backend)

#### 1. Create Railway Project
1. Go to [railway.app](https://railway.app) → New Project → "Provision PostgreSQL"
2. Add "Node.js" service → Connect your GitHub repo
3. Set root directory to `backend/`

#### 2. Configure Environment Variables in Railway Dashboard
```
PORT=3002
DATABASE_URL=postgresql://... (auto-provided by Railway Postgres)
IOT_API_KEY=your-long-random-string-here
JWT_SECRET=another-long-random-string-here
ML_SERVICE_URL=https://your-ml-service.up.railway.app  (optional)
FRONTEND_URL=https://your-frontend.vercel.app
```

#### 3. Deploy Settings
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `npm run start`
- **Health Check**: `/health`

#### 4. Run Database Migration
After first deploy, open Railway shell and run:
```bash
npx prisma db push
node prisma/seed.js
```

#### 5. Get Your Backend URL
Railway gives you: `https://your-app-name.up.railway.app`

---

### Option B: Docker (Any VPS/Cloud)

#### 1. Build Image
```bash
cd backend
docker build -t agroscale-backend .
```

#### 2. Run with Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: agro_user
      POSTGRES_PASSWORD: agro_password
      POSTGRES_DB: agro_scale_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    image: agroscale-backend
    environment:
      PORT: 3002
      DATABASE_URL: "postgresql://agro_user:agro_password@postgres:5432/agro_scale_db?schema=public"
      IOT_API_KEY: "your_iot_key"
      JWT_SECRET: "your_jwt_secret"
      ML_SERVICE_URL: ""
      FRONTEND_URL: "https://your-frontend.vercel.app"
    ports:
      - "3002:3002"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec backend npx prisma db push
docker compose -f docker-compose.prod.yml exec backend node prisma/seed.js
```

---

### Option C: Manual VPS (Ubuntu)

```bash
# 1. Install Node.js 20+, PostgreSQL 15+
# 2. Clone repo
git clone <your-repo>
cd CowDashboardSFE/backend

# 3. Setup .env
cp .env.example .env
# Edit .env with production values

# 4. Setup PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE agro_scale_db;"
sudo -u postgres psql -c "CREATE USER agro_user WITH PASSWORD 'agro_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE agro_scale_db TO agro_user;"

# 5. Install deps & setup DB
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js

# 6. Run with PM2
npm install -g pm2
pm2 start src/server.js --name agroscale-backend
pm2 startup
pm2 save

# 7. Nginx reverse proxy (optional)
# Configure nginx to proxy :3002 with SSL
```

---

### Deploy Checklist

- [ ] Set `DATABASE_URL` (Railway Postgres, port 5433 for local Docker)
- [ ] Set `IOT_API_KEY` (long random string, same in ESP32 firmware)
- [ ] Set `JWT_SECRET` (long random string)
- [ ] Set `FRONTEND_URL` (your Vercel URL)
- [ ] Set `ML_SERVICE_URL` (optional, Railway/Fly.io Python service)
- [ ] Run `npx prisma db push` on deploy
- [ ] Verify `/health` returns `db: ok`
- [ ] Test ESP32 endpoint with real `x-api-key`
- [ ] Update ESP32 firmware with Railway backend URL
- [ ] Verify Swagger UI at `https://your-app.up.railway.app/api-docs`

---

## 12. Authentication Strategy: Password vs OTP

### Current Implementation (Password + JWT)
- **Endpoint**: `POST /api/v1/auth/login`
- **Body**: `{ "phone": "012345678", "password": "password123" }`
- **Flow**: bcrypt verify → sign JWT (7 days)
- **Pros**: Simple, free, works offline, no external dependencies
- **Cons**: Password reuse, phishing risk, weak passwords, reset flow needed

### OTP Alternative (SMS/WhatsApp)
| Aspect | Password | OTP (SMS/WhatsApp) |
|--------|----------|-------------------|
| **Security** | Reused, phishable, weak passwords | One-time, expires, can't be reused |
| **UX** | Remember password, reset flow | No password to remember, just enter code |
| **Implementation** | bcrypt + JWT (current) | Twilio/Vonage + store code + expiry |
| **Cost** | Free | ~$0.0075/SMS (Twilio) |
| **Offline** | Works offline | Needs network for SMS |

### Recommended: Hybrid Approach (Phased)

#### Phase 1: Current MVP (Password Only) ✅
- Keep `POST /auth/login` with phone + password
- Simple, works for farmers with unreliable SMS

#### Phase 2: Add OTP Password Reset (Next)
```
POST /auth/forgot-password    → sends OTP to phone
POST /auth/reset-password     → verifies OTP, sets new password
```
- New `OTP` table: `phone`, `code`, `expiresAt`, `attempts`, `purpose` (reset/login)
- Rate limit: 3 requests/5min, 5 attempts/code
- SMS provider: Twilio, Vonage, or Termii (Africa)

#### Phase 3: Passwordless Login (Future)
```
POST /auth/request-otp        → sends OTP for login
POST /auth/verify-otp         → verifies OTP, returns JWT
```
- Remove password field from Farmer model
- Full OTP-only authentication

### For Your Use Case (Farmers, Rural Areas)
- **SMS delivery unreliable** in rural areas → password works offline
- **Farmers share phones** / change numbers → password more stable
- **Cost sensitivity** → free password vs paid SMS
- **Recommendation**: Keep password for MVP, add OTP reset in Phase 2

### Implementation Notes for Phase 2
```prisma
// Add to schema.prisma
model OTP {
  id        Int      @id @default(autoincrement())
  phone     String
  code      String
  purpose   String   // "login" | "reset"
  expiresAt DateTime
  attempts  Int      @default(0)
  createdAt DateTime @default(now())

  @@index([phone, purpose])
}
```

```env
# New env vars
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
```

---

## 13. API Documentation (Swagger UI)

Once deployed, access interactive docs at:
```
https://your-backend-url.up.railway.app/api-docs
```

Or download raw spec:
```
https://your-backend-url.up.railway.app/api-docs.json
```