# AgroScale API Documentation (Swagger / OpenAPI 3.0)

Welcome to the **AgroScale Cow Weight Monitoring & Analytics API** documentation. This backend provides secure multi-tenant livestock data management, IoT hardware ingestion from ESP32 load-cell scales, automated AI/rule-based weight classification, and aggregated herd analytics.

---

## 🚀 1. Interactive Swagger UI

When the backend server is running, you can access the live, interactive Swagger documentation in your browser:

* **Swagger UI URL:** [`http://localhost:3002/api-docs`](http://localhost:3002/api-docs) (or [`/docs`](http://localhost:3002/docs))
* **Raw OpenAPI 3.0 JSON Spec:** [`http://localhost:3002/api-docs.json`](http://localhost:3002/api-docs.json)
* **Pre-generated Specification Files:**
  * JSON: [`backend/swagger.json`](file:///d:/internship/CowDashboardSFE/backend/swagger.json)
  * YAML: [`backend/swagger.yaml`](file:///d:/internship/CowDashboardSFE/backend/swagger.yaml)

To re-export the OpenAPI specification files at any time, run:
```bash
npm run export:docs
```

---

## 🔐 2. Authentication & Authorization

The API employs two independent security mechanisms:

| Scheme | Header Format | Target Endpoints | Description |
|---|---|---|---|
| **Farmer JWT** (`BearerAuth`) | `Authorization: Bearer <JWT_TOKEN>` | `/api/v1/cows/*`, `/api/v1/dashboard/*` | Issued upon successful farmer login via `/api/v1/auth/login`. Scopes all database queries to the authenticated farmer's account. Valid for 7 days. |
| **IoT Device API Key** (`ApiKeyAuth`) | `x-api-key: <IOT_API_KEY>` | `/api/v1/iot/measurements` | Secret key configured on the backend (`IOT_API_KEY`). Verifies that requests originate from authentic ESP32 scale gateways. |

### Testing in Swagger UI
1. Click the green **Authorize 🔓** button at the top right of the Swagger UI.
2. For **Farmer endpoints:** Enter your JWT token (or `Bearer <token>`) in the **BearerAuth** section.
3. For **IoT endpoints:** Enter your configured API key in the **ApiKeyAuth** section.
4. Click **Authorize** and then **Close**.

---

## 📡 3. Endpoints Overview

| Method | Path | Auth Required | Rate Limit | Description |
|---|---|---|---|---|
| `GET` | `/health` | None | None | Health check verifying API and PostgreSQL connectivity |
| `POST` | `/api/v1/auth/login` | None | None | Farmer login with email & password, returns JWT token |
| `POST` | `/api/v1/iot/measurements` | `x-api-key` | 60 req/min | Ingest scale reading from ESP32, auto-classify weight |
| `GET` | `/api/v1/cows` | Bearer JWT | None | List all cows owned by the authenticated farmer |
| `GET` | `/api/v1/cows/{id}` | Bearer JWT | None | Get single cow profile and metadata by ID |
| `GET` | `/api/v1/cows/{id}/measurements` | Bearer JWT | None | Get complete weight history log for a specific cow |
| `GET` | `/api/v1/cows/{id}/growth` | Bearer JWT | None | Get chronological growth coordinates for charts |
| `GET` | `/api/v1/dashboard/summary` | Bearer JWT | None | Get herd summary stats & 10 most recent measurements |
| `GET` | `/api/v1/dashboard/trends` | Bearer JWT | None | Get 30-day daily herd average weight trend data |

---

## 📖 4. Detailed API Specifications

### 4.1 System Health

#### `GET /health`
Verifies server operation and performs a live query (`SELECT 1`) to check PostgreSQL database health.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "db": "ok"
}
```

**Response `503 Service Unavailable`:**
```json
{
  "status": "ok",
  "db": "error"
}
```

---

### 4.2 Authentication

#### `POST /api/v1/auth/login`
Validates farmer email and password, returning a signed JWT token containing the `farmerId`.

**Request Body (`application/json`):**
```json
{
  "email": "farmer1@agroscale.com",
  "password": "password123"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmYXJtZXJJZCI6MSwiaWF0IjoxNzg4MDA..."
}
```

**Response `400 Bad Request`:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": [
      {
        "code": "invalid_string",
        "validation": "email",
        "message": "Invalid email address",
        "path": ["email"]
      }
    ]
  }
}
```

**Response `401 Unauthorized`:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

---

### 4.3 IoT Measurement Ingestion

#### `POST /api/v1/iot/measurements`
Captures raw weight reading from an ESP32 hardware scale gateway.
- Looks up `device_id` in the `Device` table to resolve the owning `farmerId`.
- Auto-upserts the `Cow` record under `(farmerId, cow_id)`.
- Invokes Python ML microservice (or standard weight table fallback) to categorize as `healthy`, `underweight`, or `overweight`.
- Stores the `WeightMeasurement`.

**Headers:**
```http
Content-Type: application/json
x-api-key: your_iot_key
```

**Request Body:**
```json
{
  "device_id": "esp32-gateway-01",
  "cow_id": "COW-1042",
  "breed": "Holstein",
  "sex": "female",
  "age_months": 24,
  "weight_kg": 350.5,
  "measured_at": "2026-08-22T09:15:30.000Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `device_id` | string | **Yes** | Registered hardware scale gateway ID |
| `cow_id` | string | **Yes** | Cow tag identifier unique per farm |
| `breed` | string | **Yes** | Breed name (e.g. `Holstein`, `Angus`, `Brahman`) |
| `sex` | string | No (default: `"any"`) | `"male"`, `"female"`, or `"any"` |
| `age_months` | integer | **Yes** | Age in months (>= 0) |
| `weight_kg` | number | **Yes** | Scale weight reading in kg (> 0) |
| `measured_at` | string (ISO-8601) | No (default: server `now()`) | Measurement timestamp (max 5 mins in future) |

**Response `201 Created`:**
```json
{
  "measurement_id": 501,
  "cow_id": "COW-1042",
  "classification": {
    "label": "healthy",
    "confidence": 0.95
  }
}
```

**Response `401 Unauthorized` (Unknown Device or Bad API Key):**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Device not found or not registered"
  }
}
```

**Response `429 Too Many Requests`:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later."
  }
}
```

---

### 4.4 Cow Management

#### `GET /api/v1/cows`
Lists all cows belonging to the logged-in farmer.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "cowId": "COW-1042",
    "breed": "Holstein",
    "sex": "female",
    "dateOfBirth": "2024-08-22T00:00:00.000Z",
    "createdAt": "2026-08-22T09:15:30.000Z"
  }
]
```

---

#### `GET /api/v1/cows/{id}`
Retrieves individual cow details.

**Path Parameters:**
* `id` (integer, required): Internal cow database ID (e.g. `1`).

**Response `200 OK`:**
```json
{
  "id": 1,
  "cowId": "COW-1042",
  "farmerId": 1,
  "breed": "Holstein",
  "sex": "female",
  "dateOfBirth": "2024-08-22T00:00:00.000Z",
  "createdAt": "2026-08-22T09:15:30.000Z"
}
```

**Response `404 Not Found`:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Cow not found"
  }
}
```

---

#### `GET /api/v1/cows/{id}/measurements`
Retrieves all historical weight readings for a cow, ordered by `measuredAt` descending.

**Response `200 OK`:**
```json
[
  {
    "id": 501,
    "cowId": 1,
    "deviceId": "esp32-gateway-01",
    "weightKg": 350.5,
    "ageMonthsAtMeasurement": 24,
    "status": "healthy",
    "confidence": 0.95,
    "measuredAt": "2026-08-22T09:15:30.000Z",
    "receivedAt": "2026-08-22T09:15:31.000Z"
  },
  {
    "id": 480,
    "cowId": 1,
    "deviceId": "esp32-gateway-01",
    "weightKg": 345.0,
    "ageMonthsAtMeasurement": 23,
    "status": "healthy",
    "confidence": 0.91,
    "measuredAt": "2026-08-15T09:00:00.000Z",
    "receivedAt": "2026-08-15T09:00:02.000Z"
  }
]
```

---

#### `GET /api/v1/cows/{id}/growth`
Retrieves chronological (ascending by date) coordinate pairs formatted directly for rendering growth line charts.

**Response `200 OK`:**
```json
{
  "points": [
    {
      "date": "2026-08-15T09:00:00.000Z",
      "weight_kg": 345.0
    },
    {
      "date": "2026-08-22T09:15:30.000Z",
      "weight_kg": 350.5
    }
  ]
}
```

---

### 4.5 Dashboard Analytics

#### `GET /api/v1/dashboard/summary`
Returns high-level metric cards for the dashboard header and up to 10 latest measurement records across all cows.

**Response `200 OK`:**
```json
{
  "totalCows": 24,
  "recentActivity": [
    {
      "id": 501,
      "cowId": 1,
      "deviceId": "esp32-gateway-01",
      "weightKg": 350.5,
      "ageMonthsAtMeasurement": 24,
      "status": "healthy",
      "confidence": 0.95,
      "measuredAt": "2026-08-22T09:15:30.000Z",
      "receivedAt": "2026-08-22T09:15:31.000Z",
      "cow": {
        "cowId": "COW-1042"
      }
    }
  ]
}
```

---

#### `GET /api/v1/dashboard/trends`
Aggregates and averages daily herd weights for the preceding 30 days, sorted chronologically ascending.

**Response `200 OK`:**
```json
{
  "points": [
    {
      "date": "2026-08-15",
      "average_weight_kg": 322.4
    },
    {
      "date": "2026-08-22",
      "average_weight_kg": 328.1
    }
  ]
}
```

---

## 🛠 5. Error Code Reference

All error responses return a standardized JSON structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description"
  }
}
```

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body failed Zod schema validation or future timestamp exceeded 5-minute tolerance. |
| `401` | `UNAUTHORIZED` | Missing, invalid, or expired JWT Bearer token, invalid `x-api-key`, or device not registered to any farmer. |
| `404` | `NOT_FOUND` | Resource (e.g. Cow) does not exist or does not belong to the authenticated farmer. |
| `429` | `RATE_LIMIT_EXCEEDED` | Exceeded 60 requests/minute on IoT ingestion endpoint. |
| `500` | `INTERNAL_ERROR` | Internal server exception or missing environment variable. |
| `503` | `SERVICE_UNAVAILABLE` | Database connection failure during `/health` probe. |

---

## 📥 6. Postman & Insomnia Import

You can directly import the entire API collection into Postman or Insomnia:
1. Open Postman or Insomnia.
2. Click **Import**.
3. Select the file [`backend/swagger.json`](file:///d:/internship/CowDashboardSFE/backend/swagger.json) (or enter URL `http://localhost:3002/api-docs.json`).
4. Set up an environment variable `baseUrl = http://localhost:3002`.
