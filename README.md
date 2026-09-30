# 🐄 AgroScale — Smart Cattle Weight & Health Monitoring System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-yellow.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0%2B-2D3748.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

An end-to-end IoT and AI-powered livestock management platform designed for real-time cattle weighing, health monitoring, growth classification, and herd management. **AgroScale** bridges hardware sensors (ESP32 + Load Cells / LoRa), intelligent backend processing, automated Machine Learning classification, and an interactive bilingual frontend dashboard.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Hardware ["📡 IoT Hardware Layer"]
        ESP32["ESP32 Microcontroller\n+ HX711 Load Cell / LoRa"]
    end

    subgraph BackendLayer ["⚙️ Core Backend Services (Node.js/Express)"]
        API["Express API Server (:3002)\n- IoT Ingestion\n- JWT Auth\n- Cow Management"]
        Prisma["Prisma ORM"]
        DB[(PostgreSQL Database\n:5433 / agro_scale_db)]
    end

    subgraph MLService ["🧠 ML Microservice (FastAPI)"]
        ML["FastAPI ML Engine (:5000)\n- Health Classification\n- Growth Benchmark Engine"]
    end

    subgraph FrontendLayer ["💻 Web Dashboard (React + TypeScript)"]
        UI["React 19 + Vite App (:5173)\n- Bilingual (EN / KM)\n- Live Herd Analytics\n- Weight Records & Trends"]
    end

    subgraph Monitoring ["📊 Observability & Monitoring"]
        Loki["Grafana Loki (:3100)"]
        Grafana["Grafana Dashboard (:3001)"]
    end

    ESP32 -->|HTTP REST / API Key| API
    API --> ML
    API --> Prisma --> DB
    API --> Loki --> Grafana
    UI -->|REST API / JWT| API
```

---

## ✨ Key Features

- 📡 **IoT Ingestion Engine**: High-throughput REST telemetry endpoint for ESP32 load cell scales with API key authentication & rate limiting.
- 🤖 **AI-Driven Health Classification**: Machine Learning model (Scikit-Learn & FastAPI) assessing cow weight against age/breed growth standards with automatic fallback to standard reference tables.
- 📊 **Interactive Analytics Dashboard**: Real-time insights into total herd count, weight trends, health status distributions, and active IoT device status.
- 🐮 **Herd Management & Cow Registry**: Complete CRUD interface for registering cattle, tracking RFID tags, breed profiles, age, and individual weight histories.
- 🌐 **Bilingual Support (i18n)**: Seamless language toggling between **English** and **Khmer (ភាសាខ្មែរ)**.
- 📈 **Observability Infrastructure**: Integrated Grafana & Loki logging pipeline for backend performance tracking and system audits.

---

## 🛠️ Tech Stack

| Domain | Stack & Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, TypeScript, Tailwind CSS v4, Lucide Icons, i18next |
| **Backend** | Node.js, Express.js, Prisma ORM, Zod, JWT Authentication, Swagger / OpenAPI |
| **Database** | PostgreSQL 15 |
| **Machine Learning** | Python 3.10+, FastAPI, Scikit-Learn, Uvicorn, Pandas, Joblib |
| **IoT / Hardware** | ESP32, HX711 Load Cell Amplifiers, LoRa Communication Protocols |
| **DevOps & Infra** | Docker, Docker Compose, Grafana, Grafana Loki |

---

## 📁 Repository Structure

```text
CowDashboardSFE/
├── frontend/             # React 19 + Vite + TypeScript web application
│   ├── src/              # App components, pages (Herd, Home, etc.), services, i18n
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Express + Prisma + PostgreSQL API server
│   ├── src/              # Controllers, routes, middleware, IoT ingestion
│   ├── prisma/           # Prisma schema & seed scripts
│   └── package.json
├── ML_Train/             # Python FastAPI machine learning microservice
│   ├── main.py           # FastAPI service entry point
│   ├── train.py          # ML model training script
│   └── requirements.txt
├── Esp32/                # ESP32 firmware & LoRa load cell integration guides
├── docker-compose.yml    # Infrastructure compose (Postgres, Loki, Grafana)
└── README.md             # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker & Docker Compose](https://www.docker.com/)
- [Python](https://www.python.org/) (v3.10 or higher)

---

### 1. Database & Infrastructure Setup

Launch PostgreSQL, Loki, and Grafana using Docker Compose:

```bash
docker compose up -d postgres loki grafana
```

> **Note:** PostgreSQL will be accessible on host port `5433` (container port 5432).

---

### 2. Backend API Setup

1. Navigate to the backend directory and copy the environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Configure environment variables in `backend/.env`:
   ```env
   PORT=3002
   DATABASE_URL="postgresql://agro_user:agro_password@localhost:5433/agro_scale_db?schema=public"
   JWT_SECRET="your_jwt_secret_key"
   IOT_API_KEY="your_iot_api_key"
   FRONTEND_URL="http://localhost:5173"
   ML_SERVICE_URL="http://localhost:5000"
   ```
3. Install dependencies, synchronize the database schema, and seed test data:
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   node prisma/seed.js
   ```
4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   - Express API Server: `http://localhost:3002`
   - Swagger API Documentation: `http://localhost:3002/api-docs`

---

### 3. Machine Learning Microservice Setup

1. Navigate to the `ML_Train` directory:
   ```bash
   cd ML_Train
   ```
2. Create and activate a Python virtual environment:
   - **Windows:**
     ```cmd
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install Python dependencies and train the classification model:
   ```bash
   pip install -r requirements.txt
   python train.py
   ```
4. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 5000
   ```
   - ML API Endpoint: `http://localhost:5000`

---

### 4. Frontend Web Dashboard Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Default Test Credentials

After running `node prisma/seed.js`, you can log in with:

| User Role | Phone Number | Password |
| :--- | :--- | :--- |
| **Farmer / Admin** | `012345678` | `password123` |
| **Farmer / Secondary** | `098765432` | `password123` |

---

## 🛰️ API Reference & Documentation

Interactive API documentation is generated via Swagger UI:
- **Swagger Docs URL**: `http://localhost:3002/api-docs`

### Key Endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate farmer & issue JWT token | None |
| `POST` | `/api/v1/iot/measurements` | Record scale measurement from ESP32 | `x-api-key` |
| `GET` | `/api/v1/cows` | Retrieve farmer's cow registry | Bearer JWT |
| `POST` | `/api/v1/cows` | Register a new cow | Bearer JWT |
| `GET` | `/api/v1/dashboard` | Summary metrics & weight trends | Bearer JWT |
| `GET` | `/health` | Server health check endpoint | None |

---

## 📊 Monitoring & Logging

- **Grafana Dashboard**: `http://localhost:3001` (Default credentials: `admin` / `admin`)
- **Loki Log Aggregator**: `http://localhost:3100`

---

## 📜 License

This project is developed for livestock monitoring and intelligent farming applications. All rights reserved.
