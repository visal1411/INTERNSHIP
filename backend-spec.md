# IoT Integration + Node.js Backend
### Practical Implementation Specification — Multi-Farmer Cow Weight Monitoring System

**Assumptions flagged up front:**
- ESP32 gateway has real internet access (Wi-Fi) at least intermittently; offline buffering is the device's job, not the backend's.
- One `device_id` can serve multiple cows over its lifetime (it's the scale, not the animal).
- One `device_id` belongs to exactly one farmer (the gateway is permanently installed on one farm).
- You're using Express (not Fastify/Koa).
- **Multi-farmer**: this system supports 2+ farmers, each with isolated data. Every cow, device, and measurement belongs to exactly one farmer.

---

## Table of Contents
- A. IoT Contract
- B. HTTP Flow
- C. Database
- D. API Design
- E. Node.js Project Structure
- F. Security
- G. Dashboard Data
- H. Implementation Order

---

## A. IOT CONTRACT

### Exact JSON payload

```json
{
  "device_id": "esp32-gateway-01",
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "sex": "female",
  "age_months": 24,
  "weight_kg": 350.5,
  "measured_at": "2026-08-22T09:15:30Z"
}
```

### Field spec

| Field | Type | Required | Valid range / notes |
|---|---|---|---|
| `device_id` | string | required | non-empty; identifies the gateway hardware; looked up against `Device` table to resolve owning farmer |
| `cow_id` | string | required | non-empty; identifies the animal, stable for its lifetime, unique **per farmer** (not globally) |
| `breed` | string | required | non-empty; free text is fine for MVP, could become an enum later |
| `sex` | string enum | required | `"male"` \| `"female"` only |
| `age_months` | integer | required | 1–300 (reject 0/negative/absurdly large — sanity bound, not a real biological limit) |
| `weight_kg` | float | required | 1–2000 (sanity bound for cattle; adjust if your demo uses calves) |
| `measured_at` | ISO-8601 datetime string | optional | if omitted, server stamps `received_at = now()` and uses that instead |

### Why `cow_id` and `device_id` are different fields

A device is bolted to a scale/gateway — it's physical infrastructure. A cow is a living animal that walks onto that scale. The same device reports readings for many different cows over time, and the same cow might one day be weighed by a different device (replaced hardware, second scale). Merging these into one field would lose the ability to trace "which physical sensor produced this number" separately from "which animal does this number belong to." Keep them as two independent identifiers.

### Why `device_id` also resolves the farmer (multi-farmer specific)

The device doesn't know or send anything about *who* owns it — it just reports its own `device_id`. The backend looks up `device_id` in the `Device` table to find `farmerId`, and every downstream record (the `Cow` upserted, the `WeightMeasurement` created) gets scoped to that farmer. This keeps ownership resolution server-side and tamper-proof — a device can't claim to belong to a different farmer than it's registered under.

### Timestamp handling

- Prefer letting the device send `measured_at` if it has real time (NTP-synced) — this is the true moment of weighing, important if the device retries after a network outage.
- Always also store `received_at = new Date()` set by the server — this is never wrong, since it's the server's own clock.
- Validation should **not** reject old timestamps — a device with 30 minutes of buffered offline readings needs to POST them late and have them accepted with their original `measured_at`.
- Only reject `measured_at` if it's in the future by more than a small tolerance (e.g., 5 minutes) — that usually signals a device clock bug.

### Example valid payload

```json
{
  "device_id": "esp32-gateway-01",
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "sex": "female",
  "age_months": 24,
  "weight_kg": 350.5,
  "measured_at": "2026-08-22T09:15:30Z"
}
```

### Example invalid payloads (and why)

```json
// Missing required field (no cow_id)
{
  "device_id": "esp32-gateway-01",
  "breed": "Holstein",
  "sex": "female",
  "age_months": 24,
  "weight_kg": 350.5
}
// -> 400: cow_id is required
```

```json
// Wrong type (weight as string) + invalid enum
{
  "device_id": "esp32-gateway-01",
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "sex": "unknown",
  "age_months": 24,
  "weight_kg": "heavy"
}
// -> 400: sex must be "male" or "female"; weight_kg must be a number
```

```json
// Out-of-range weight (sensor glitch)
{
  "device_id": "esp32-gateway-01",
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "sex": "female",
  "age_months": 24,
  "weight_kg": -12
}
// -> 400: weight_kg must be a positive number
```

```json
// Unknown device (not registered to any farmer)
{
  "device_id": "esp32-does-not-exist",
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "sex": "female",
  "age_months": 24,
  "weight_kg": 350.5
}
// -> 401: unknown device
```

### Testing without hardware

```bash
# Valid request
curl -X POST http://localhost:3000/api/v1/iot/measurements \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-iot-key" \
  -d '{
    "device_id": "esp32-gateway-01",
    "cow_id": "COW-1042",
    "breed": "Holstein",
    "sex": "female",
    "age_months": 24,
    "weight_kg": 350.5,
    "measured_at": "2026-08-22T09:15:30Z"
  }'

# Invalid request (to test your error handling)
curl -X POST http://localhost:3000/api/v1/iot/measurements \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-iot-key" \
  -d '{ "device_id": "esp32-gateway-01" }'
```

For Postman: save both as a small collection with a `{{base_url}}` variable — lets you flip between local and deployed backend without editing requests each time.

---

## B. HTTP FLOW

```
ESP32 gateway
   │  HTTP POST /api/v1/iot/measurements
   ▼
Express route (checks x-api-key)
   ▼
Zod schema.parse(req.body)   ── invalid? → 400, stop here, nothing written to DB
   ▼
Service layer:
   1. look up Device by device_id → resolve farmerId (401 if unknown device)
   2. find-or-create Cow, scoped to (farmerId, cow_id)
   3. create WeightMeasurement row
   4. call AI client (Python service)
   5. update measurement with classification (if AI succeeded)
   ▼
Response to device (201 Created + classification if available)
```

### What happens in each failure case

| Situation | Behavior |
|---|---|
| Payload is invalid | Zod throws → caught by error middleware → 400 with field-level messages. Nothing is written to the database. Device should log the error and NOT retry the same bad payload forever (that's a firmware bug, not a network issue). |
| Device is not registered | 401 Unauthorized — the `device_id` doesn't map to any farmer. Distinct from the API key check: the API key proves "this is a legitimate device," the `Device` lookup proves "this device belongs to a known farm." |
| Cow does not exist yet (for that farmer) | Not an error — upsert the `Cow` record scoped to `(farmerId, cow_id)`. First reading for a new cow auto-registers it. No separate "register cow" step needed. |
| Duplicate measurement arrives (device retried a request that actually succeeded) | If the device sends an optional `reading_id` (UUID it generated once), the service can upsert on that field so retries are harmless. If you skip `reading_id` for time reasons, duplicates just create two rows — acceptable for a course project; document it as a known limitation. |
| AI service is down | Store the measurement anyway with `status: null`. Log a warning. Return 201 to the device — the device's job (delivering the reading) succeeded; classification is a backend concern. |
| Database is down | This is the one true failure — nothing can be stored. Return 503 Service Unavailable. Rely on the device's own retry/backoff logic to resend later. |
| Wi-Fi disconnects (on the device side) | Backend does nothing — it never receives the request. Handled entirely by the device buffering locally and retrying once connectivity returns, using its original `measured_at`. |

---

## C. DATABASE

### Recommended relationship model

- **Farmer** — one row per farmer account; root of all data ownership.
- **Device** — one row per physical gateway; **required** (not optional) in the multi-farmer version, since it's how the backend resolves `device_id → farmerId`.
- **Cow** — one row per animal, holds stable attributes (breed, sex), scoped to a farmer.
- **WeightMeasurement** — one row per weighing event, foreign key to Cow.
- **Classification** — not a separate table; stored as columns directly on `WeightMeasurement`.

### Why Classification is not its own table

A classification is produced once, immediately, for exactly one measurement — you don't need multiple historical classifications per measurement (e.g., from re-running different model versions) for this project. A separate table would only pay off if you needed that 1-to-many relationship. Fewer tables = less Prisma code, fewer joins, faster to build and query.

### Why Device is required here (not optional, unlike a single-farm design)

In a single-farm system, `Device` metadata is genuinely optional — a plain string column is enough. In a multi-farmer system, `Device` is load-bearing: it's the only mechanism that tells the backend which farmer a given reading belongs to. Skipping it would mean the ingestion endpoint has no way to resolve ownership.

### ERD

```
erDiagram
    FARMER ||--o{ COW : owns
    FARMER ||--o{ DEVICE : owns
    COW ||--o{ WEIGHT_MEASUREMENT : has

    FARMER {
        int id PK
        string email
        string passwordHash
        string name
        datetime createdAt
    }
    DEVICE {
        int id PK
        string deviceId
        int farmerId FK
        datetime createdAt
    }
    COW {
        int id PK
        string cowId
        int farmerId FK
        string breed
        string sex
        datetime dateOfBirth
        datetime createdAt
    }
    WEIGHT_MEASUREMENT {
        int id PK
        int cowId FK
        string deviceId
        float weightKg
        int ageMonthsAtMeasurement
        string status
        float confidence
        datetime measuredAt
        datetime receivedAt
    }
```

### Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Farmer {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())

  cows         Cow[]
  devices      Device[]
}

model Device {
  id        Int      @id @default(autoincrement())
  deviceId  String   @unique          // e.g. "esp32-gateway-01"
  farmerId  Int
  farmer    Farmer   @relation(fields: [farmerId], references: [id])
  createdAt DateTime @default(now())

  @@index([farmerId])
}

model Cow {
  id           Int      @id @default(autoincrement())
  cowId        String                 // e.g. "COW-1042" — unique per farmer, not globally
  farmerId     Int
  farmer       Farmer   @relation(fields: [farmerId], references: [id])
  breed        String
  sex          String
  dateOfBirth  DateTime?
  createdAt    DateTime @default(now())

  measurements WeightMeasurement[]

  @@unique([farmerId, cowId])
  @@index([breed])
}

model WeightMeasurement {
  id                     Int      @id @default(autoincrement())
  cow                    Cow      @relation(fields: [cowId], references: [id])
  cowId                  Int
  deviceId               String
  weightKg               Float
  ageMonthsAtMeasurement Int
  status                 String?  // "underweight" | "healthy" | "overweight" | null
  confidence             Float?
  measuredAt             DateTime
  receivedAt             DateTime @default(now())

  @@index([cowId, measuredAt])
  @@index([status])
}
```

### Indexes explained

| Index | On | Why |
|---|---|---|
| `@@index([cowId, measuredAt])` | WeightMeasurement | Growth-chart and measurement-history queries filter by cow and order by time. |
| `@@index([status])` | WeightMeasurement | Dashboard summary counts cows by status. |
| `@@index([breed])` | Cow | Useful for filtering/grouping by breed on dashboard trends. |
| `@@index([farmerId])` | Device | Occasionally listing "all devices for farmer X"; `deviceId` lookup itself is already fast since it's `@unique`. |
| `@@unique([farmerId, cowId])` | Cow | Enforces per-farmer uniqueness of cow tags; also usable as an index for "list all of Farmer X's cows." |

---

## D. API DESIGN

| Endpoint | Method | Who calls it | Why it exists | Auth |
|---|---|---|---|---|
| `/api/v1/auth/login` | POST | Frontend (login page) | Verify email/password, issue JWT with `farmerId` | none (this is how you get auth) |
| `/api/v1/iot/measurements` | POST | ESP32 gateway | Ingest a new weight reading, trigger classification | API key (device) |
| `/api/v1/cows` | GET | Frontend dashboard | List all cows with latest status, for the cow list page | JWT (farmer) |
| `/api/v1/cows/:id` | GET | Frontend dashboard | One cow's profile/header info | JWT (farmer) |
| `/api/v1/cows/:id/measurements` | GET | Frontend dashboard | Raw history table for one cow | JWT (farmer) |
| `/api/v1/cows/:id/growth` | GET | Frontend dashboard | Time-series data shaped for a chart | JWT (farmer) |
| `/api/v1/dashboard/summary` | GET | Frontend dashboard | Farm-wide counts for summary cards | JWT (farmer) |
| `/api/v1/dashboard/trends` | GET | Frontend dashboard | Farm-wide average weight over time | JWT (farmer) |
| `/health` | GET | Uptime checks / you, during demo | Confirms API + DB are alive | none |

All JWT-protected routes are automatically scoped to the logged-in farmer — every Prisma query behind them filters `where: { farmerId: req.farmerId }` (or an equivalent join through `Cow.farmerId`).

### Request/response bodies

**`POST /api/v1/auth/login`**

Input:
```json
{ "email": "farmerA@example.com", "password": "password123" }
```
Output:
```json
{
  "token": "eyJhbGciOi...",
  "farmer": { "id": 1, "name": "Farmer A", "email": "farmerA@example.com" }
}
```

**`POST /api/v1/iot/measurements`**

Input: the payload from Section A.
Output:
```json
{
  "measurement_id": 501,
  "cow_id": "COW-1042",
  "classification": { "label": "healthy", "confidence": 0.91 }
}
```
`classification` is `null` if the AI service failed — still a 201.

**`GET /api/v1/cows`**

Output:
```json
{
  "cows": [
    {
      "id": 12,
      "cow_id": "COW-1042",
      "breed": "Holstein",
      "sex": "female",
      "latest_weight_kg": 350.5,
      "latest_status": "healthy",
      "last_measured_at": "2026-08-22T09:15:30Z"
    }
  ]
}
```

**`GET /api/v1/cows/:id`**

Output:
```json
{
  "id": 12,
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "sex": "female",
  "latest_weight_kg": 350.5,
  "latest_status": "healthy",
  "latest_confidence": 0.91
}
```

**`GET /api/v1/cows/:id/measurements`**

Output:
```json
{
  "measurements": [
    { "id": 501, "weight_kg": 350.5, "status": "healthy", "confidence": 0.91, "measured_at": "2026-08-22T09:15:30Z" },
    { "id": 480, "weight_kg": 345.0, "status": "healthy", "confidence": 0.88, "measured_at": "2026-08-15T09:00:00Z" }
  ]
}
```

**`GET /api/v1/cows/:id/growth`**

Output (chart-ready — see Section G for why this shape):
```json
{
  "points": [
    { "date": "2026-08-15", "weight_kg": 345.0 },
    { "date": "2026-08-22", "weight_kg": 350.5 }
  ]
}
```

**`GET /api/v1/dashboard/summary`**

Output:
```json
{
  "total_cows": 24,
  "healthy": 18,
  "underweight": 4,
  "overweight": 2
}
```

**`GET /api/v1/dashboard/trends`**

Output:
```json
{
  "points": [
    { "date": "2026-08-15", "average_weight_kg": 322.4 },
    { "date": "2026-08-22", "average_weight_kg": 328.1 }
  ]
}
```

**`GET /health`**

Output:
```json
{ "status": "ok", "db": "ok" }
```

---

## E. NODE.JS PROJECT STRUCTURE

```
src/
  routes/        - defines URL paths + HTTP methods, wires them to controllers. No logic here.
  controllers/   - parses req/res, calls Zod validation, calls services, shapes the HTTP response.
  services/      - actual business logic: talking to Prisma, calling the AI service, computing derived fields.
  schemas/       - Zod schemas, one per endpoint's input (and output if you validate that too).
  middleware/    - auth checks (API key / JWT), error handler, request-id, rate limiter.
  lib/           - thin wrappers around external things: prisma client instance, AI service HTTP client.
  utils/         - small stateless helpers (date formatting, growth % calculation).
  app.js         - creates the Express app, mounts middleware + routes. No app.listen() here.
  server.js      - imports app.js, calls app.listen(). Entry point you actually run.
```

Why this split matters: keeping controllers thin and services logic-heavy means your Zod validation, AI-calling code, and Prisma queries are all independently testable without spinning up an HTTP server. It's also the natural place to add unit tests for `services/` without mocking Express at all.

---

## F. SECURITY

### Auth comparison

| Option | Verdict for this project |
|---|---|
| No authentication | Not viable — with 2+ farmers sharing one backend, this is the only thing preventing Farmer A from seeing Farmer B's data. |
| API key / device token | Use this for IoT. One shared secret per device (or one shared secret for the whole demo, stored in env var), checked via a header. Trivial to implement, appropriate threat model. |
| JWT | Use this for the farmer dashboard. Stateless, easy to attach to every dashboard fetch, standard pattern, payload carries `farmerId` to scope every query. |
| HTTP-only cookie session | More XSS-resistant than JWT in localStorage, but needs session storage/signing setup — the security gain isn't worth the extra build time here. |

**Recommendation:** API key middleware in front of `/api/v1/iot/*`, JWT middleware in front of everything else under `/api/v1/*` except `/health` and `/api/v1/auth/login`. Two separate, small middlewares — don't merge them into one "auth system."

```js
// middleware/deviceAuth.js
export function deviceAuth(req, res, next) {
  const key = req.header("x-api-key");
  if (key !== process.env.IOT_API_KEY) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid device API key" } });
  }
  next();
}
```

```js
// middleware/farmerAuth.js
import jwt from "jsonwebtoken";

export function farmerAuth(req, res, next) {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.farmerId = payload.farmerId;
    next();
  } catch {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
  }
}
```

```js
// services/iotIngestion.js (excerpt) — resolving device -> farmer
export async function ingestMeasurement(payload) {
  const device = await prisma.device.findUnique({ where: { deviceId: payload.device_id } });
  if (!device) {
    const err = new Error("Unknown device");
    err.status = 401;
    throw err;
  }

  const cow = await prisma.cow.upsert({
    where: { farmerId_cowId: { farmerId: device.farmerId, cowId: payload.cow_id } },
    update: { breed: payload.breed, sex: payload.sex },
    create: {
      cowId: payload.cow_id,
      farmerId: device.farmerId,
      breed: payload.breed,
      sex: payload.sex,
    },
  });

  // ...create WeightMeasurement, call AI client, etc.
}
```

### Other items, kept realistic for 1–2 weeks

- **CORS:** allow only your frontend's origin (`cors({ origin: process.env.FRONTEND_URL })`) — two lines, not a project.
- **Rate limiting:** `express-rate-limit` on `/api/v1/iot/measurements` only (e.g., 60 requests/min per IP) — protects against a misbehaving device flooding you; skip elsewhere.
- **Environment variables:** `DATABASE_URL`, `IOT_API_KEY`, `JWT_SECRET`, `ML_SERVICE_URL`, `FRONTEND_URL`, `PORT`. Validate them at startup with a small Zod schema so a missing env var fails fast with a clear message.
- **Zod validation:** on every input-accepting endpoint, not just IoT — the login endpoint's body, too.
- **Centralized error handling:** one Express error-handling middleware (4-arg signature) that catches everything, logs it, and returns a consistent `{ error: { code, message } }` shape. All routes wrapped in a try/catch or an async-handler wrapper.
- **Logging:** pino (or `console.log` with structured JSON) — log method, path, status, duration, and request id per request.
- **Secrets management:** `.env` file, gitignored, documented in `.env.example` with placeholder values.
- **HTTPS:** terminate TLS at your deployment platform (Render/Railway/Fly.io/etc. all do this for free).
- **Password hashing:** bcrypt for `Farmer.passwordHash` — never store plaintext passwords.

---

## G. DASHBOARD DATA

The trick to easy frontend charts: do the math on the backend, so the frontend just renders numbers, it doesn't compute them.

### Cow list row — includes weight change, not just latest weight

```json
{
  "id": 12,
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "latest_weight_kg": 350.5,
  "previous_weight_kg": 345.0,
  "weight_change_kg": 5.5,
  "growth_percent": 1.59,
  "status": "healthy",
  "confidence": 0.91,
  "last_measured_at": "2026-08-22T09:15:30Z"
}
```

Computed in the service layer like this:

```js
const weightChangeKg = latest.weightKg - previous.weightKg;
const growthPercent = (weightChangeKg / previous.weightKg) * 100;
```

Return `previous_weight_kg: null` and `weight_change_kg: null` for a cow's first-ever measurement — the frontend just shows "—" for those fields, no special-casing needed beyond a null check.

### Growth chart data — already chart-shaped

Return `{ date, weight_kg }` pairs, sorted ascending by date, so the frontend can hand the array straight to a charting library's data prop with zero transformation:

```json
{ "points": [
  { "date": "2026-08-01", "weight_kg": 330.0 },
  { "date": "2026-08-15", "weight_kg": 345.0 },
  { "date": "2026-08-22", "weight_kg": 350.5 }
] }
```

### "Cows needing attention" — reuse the cow list query, just filter

```sql
-- conceptually, scoped to the logged-in farmer
SELECT * FROM cows_with_latest_status
WHERE farmer_id = :farmerId AND latest_status != 'healthy'
ORDER BY last_measured_at DESC;
```

In Prisma, this is the same query already written for `GET /cows`, with a `where: { status: { not: "healthy" } } }` added on the latest-measurement join — expose it as `GET /api/v1/cows?status=underweight,overweight` (a query param on the existing endpoint) rather than a whole new endpoint.

---

## H. IMPLEMENTATION ORDER

Build in this exact order — each step only depends on the ones before it, so you're never blocked waiting on a later piece:

1. **Database + Prisma** — schema (including `Farmer`/`Device`), migration, seed script with 2 fake farmers, devices, cows, and measurements. Gives you data to build against immediately.
2. **Validation (Zod schemas)** — write the IoT payload schema first since it's the most complex; reuse the pattern for other endpoints, including login.
3. **IoT endpoint** — `POST /api/v1/iot/measurements`, including the device → farmer lookup, without the AI call yet (stub `status: null`). Test with curl from Section A.
4. **AI client** — small `lib/mlClient.js` wrapping the HTTP call to the Python service, with a timeout and try/catch; wire it into the IoT endpoint's service layer.
5. **Auth** — device API key middleware, JWT + login endpoint. Needed before dashboard endpoints, since every dashboard query depends on `req.farmerId`.
6. **Dashboard endpoints** — `GET /cows`, `/cows/:id`, `/cows/:id/measurements`, `/cows/:id/growth`, `/dashboard/summary`, `/dashboard/trends`, in that order (each builds on the previous query patterns, each scoped by `farmerId`).
7. **Remaining security** — CORS, rate limiting on IoT endpoint, centralized error handler, request IDs.
8. **Testing** — Zod schema unit tests, service-layer unit tests (mock Prisma/AI client), a couple of supertest integration tests for the IoT endpoint and one dashboard endpoint (including a test that Farmer A cannot see Farmer B's cow), then a manual end-to-end curl-to-dashboard run for both farmer accounts.

This order front-loads the pieces your frontend and AI teammates need first, moves auth earlier than a single-farm version would (since dashboard endpoints now depend on it structurally, not just as a security nicety), and pushes remaining security/testing to the end without skipping them.
