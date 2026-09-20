# AgroScale Project Progress, Observability & Deployment Guide

This document tracks all project progress, completed milestones, architecture specifications ("what each service does"), and the complete Grafana Loki logging implementation guide.

---

## 📌 Overall Project Progress Checklist

- [x] **Database Setup & Seeding:** Connected PostgreSQL database with `sslmode=require` and seeded initial farmer accounts (`farmer1@agroscale.com` & `farmer2@agroscale.com` with password `password123`).
- [x] **Frontend Authentication Update:** Updated frontend forms, Zod schema, and one-click demo prefill buttons to use email authentication.
- [x] **Frontend & Backend Connection:** Configured Vite proxy to target live Render backend (`https://agroscale-backend.onrender.com`).
- [x] **ESP32 IoT Weight Ingestion:** Configured device authorization (`x-api-key`) and mapped ESP32 `device_id` (`esp32-gateway-01`) to Farmer ID 1 (John Doe).
- [x] **24/7 Keep-Alive Cronjob:** Configured `cron-job.org` to ping `https://agroscale-backend.onrender.com/health` every 10 minutes to eliminate Render free tier cold starts.
- [x] **Structured Pino Logging:** Integrated `pino`, `pino-http`, and `pino-loki` into Express for real-time JSON log streaming and response time tracking.
- [x] **Grafana & Loki Observability Stack:** Configured Loki log aggregator, pre-provisioned Grafana datasource, and built API performance dashboard.

---

## ⚙️ What Each Service & Component Serves

| Service / Component | Location / Port | What It Serves / Purpose |
| :--- | :--- | :--- |
| **Node.js / Express Backend** | Port `3002` / Render Cloud | Serves REST API endpoints (`/auth`, `/cows`, `/iot`, `/dashboard`), executes Prisma queries, and handles authentication. |
| **PostgreSQL Database** | Port `5433` / Render Postgres | Stores all persistent system data (Farmers, Cows, Weight Measurements, Devices, and Weight Standards). |
| **Pino & Pino-HTTP** | Backend Middleware | Intercepts every Express request/response and generates structured JSON logs containing HTTP method, status code, URL, response time in ms (`responseTimeMs`), and IP address. |
| **Grafana Loki** | Port `3100` / Grafana Cloud | High-performance log aggregation system that receives, indexes, and stores log streams sent by Pino. |
| **Grafana UI** | Port `3001` / Grafana Cloud | Visual monitoring dashboard that converts Loki logs into real-time graphs (API Request Rate, Response Latency ms, Error Rates, and Live Log Stream). |
| **ESP32 Scale Hardware** | Physical IoT Devices | Reads load cell weight values and sends HTTP POST requests to `/api/v1/iot/measurements` with `x-api-key`. |
| **Cron-Job.org KeepAlive** | External Service | Pings `/health` every 10 minutes to prevent Render free-tier instance from sleeping (ensuring 24/7 uptime within 750 free hours). |

---

## 🏗️ Observability Architecture

```text
       +-------------------------------------------------------------+
       |                  Express Backend (Node.js)                  |
       |  (Pino Logger + Pino-HTTP Request Tracking Middleware)      |
       +------------------------------+------------------------------+
                                      |
                   +------------------+------------------+
                   |                                     |
          [Console Stdout]                    [Pino-Loki Transport]
       (Local Terminal / Render Logs)    (Local Loki :3100 / Grafana Cloud)
                                                         |
                                              +----------v----------+
                                              |  Grafana Dashboard  |
                                              |    (:3001 / Cloud)  |
                                              +---------------------+
```

---

## 🛠️ Step-by-Step Implementation Guide

### 1. Backend Package Installation
```bash
cd backend
npm install pino pino-http pino-loki
```

### 2. Logger Configuration ([`backend/src/lib/logger.js`](file:///d:/internship/CowDashboardSFE/backend/src/lib/logger.js))
Initializes Pino with stdout console logging and optional Loki transport streaming if `LOKI_HOST` is present.

### 3. Request Middleware ([`backend/src/middleware/requestLogger.js`](file:///d:/internship/CowDashboardSFE/backend/src/middleware/requestLogger.js))
Uses `pino-http` to track response times (`responseTimeMs`), HTTP methods, endpoints, status codes, and IP addresses.

### 4. Express App Mounting ([`backend/src/app.js`](file:///d:/internship/CowDashboardSFE/backend/src/app.js#L25))
Mounted early in Express middleware stack:
```js
const requestLogger = require('./middleware/requestLogger');
app.use(requestLogger);
```

### 5. Docker Compose Services ([`docker-compose.yml`](file:///d:/internship/CowDashboardSFE/docker-compose.yml#L37-L64))
Defines `loki` on port `3100` and `grafana` on port `3001`.

---

## 🌐 Deploying Loki & Grafana Logging to Render

To connect your deployed backend on Render (`https://agroscale-backend.onrender.com`) to Grafana Cloud:

### Step 1: Get Grafana Cloud Credentials
1. Sign up for a free account at **[Grafana Cloud](https://grafana.com)**.
2. Under **Loki**, click **Details / Send Logs** and copy:
   * **URL:** `https://logs-prod-xxx.grafana.net/loki/api/v1/push`
   * **User ID:** `<YOUR_GRAFANA_USER_ID>`
   * **API Token:** `<YOUR_GRAFANA_API_KEY>`

### Step 2: Push Changes to GitHub
```bash
git add .
git commit -m "Add Pino logging and Grafana Loki integration"
git push
```

### Step 3: Set Render Environment Variables
In **Render Dashboard** -> **`agroscale-backend`** -> **Environment**:
* `LOKI_HOST` = `https://logs-prod-xxx.grafana.net/loki/api/v1/push`
* `LOKI_USER` = `<YOUR_GRAFANA_USER_ID>`
* `LOKI_PASSWORD` = `<YOUR_GRAFANA_API_KEY>`

---

## 🔍 LogQL Query Examples in Grafana

* **Stream All Backend Logs:**
  ```logql
  {app="agroscale-backend"}
  ```
* **Filter HTTP 500 Server Errors:**
  ```logql
  {app="agroscale-backend"} | json | response_statusCode >= 500
  ```
* **Filter IoT Endpoint Requests:**
  ```logql
  {app="agroscale-backend"} |= "/api/v1/iot/measurements"
  ```
