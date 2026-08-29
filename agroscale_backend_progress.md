# AgroScale Backend Refactor: Full Progress Report

This document explains everything that has been rebuilt in the AgroScale backend project. The goal was to transform a simple, prototype application into a highly secure, professional, and scalable cloud application.

## 1. The Core Architecture Changes

**What we removed:**
- We completely removed **Socket.io / WebSockets**. The old system relied on live, always-open connections to send data. This was replaced with standard "HTTP APIs" (where the dashboard asks for data when it needs it). This makes the system far more stable and reduces server memory usage.
- We removed **Sequelize** (the old database manager) and **SQLite** (a small file-based database).

**What we added:**
- We upgraded to **Prisma** (a modern, strict, and very powerful database manager).
- We moved the database entirely to **PostgreSQL**, running securely inside Docker.

## 2. Multi-Tenancy (Privacy & Security)

**What it means:** "Multi-tenancy" means the system can now safely host hundreds of different farmers without their data ever mixing up. 

- **The Farmer:** Everything in the system now revolves around a `Farmer`. 
- **Data Isolation:** A `Cow` or a `Device` is strictly owned by a specific farmer. If "Farmer A" logs in, the system makes it physically impossible for them to see or modify "Farmer B's" cows.

## 3. The New Folder Structure

We reorganized the code into a professional `src/` folder structure so that each file has a single, clear responsibility:

- `src/schemas/`: Double-checks incoming data to make sure it is exactly what we expect. 
- `src/middleware/`: The "security guards" that check passwords and API keys before letting anyone inside.
- `src/controllers/`: The "managers" that receive a request from a user, ask the right service to do the work, and then send the response back.
- `src/services/`: The "workers" that actually perform the complex business logic (calculating data, talking to the database).
- `src/routes/`: The "map" that connects URLs (like `/api/v1/auth/login`) to the correct controllers.

## 4. Authentication (Logging In Securely)

We established two distinct ways to log into the system, depending on who (or what) is knocking at the door:

- **For Farmers (`farmerAuth.js`):** When a farmer logs into the dashboard, they receive a special, encrypted digital passport called a **JWT (JSON Web Token)**. They must attach this passport to all future requests. If it's missing or expired, they are rejected.
- **For Hardware Devices (`deviceAuth.js`):** Your physical scales (ESP32 gadgets out in the field) don't have human users to type passwords. Instead, they must include a secret `x-api-key` header in their messages. If they don't have the key, the server hangs up on them immediately.

## 5. The IoT Ingestion Pipeline (Receiving Cow Data)

This is the brain of the operation, where the scale sends a cow's weight to the server. Here is what happens when a device sends a weight:

1. **Validation (`zod`):** The system strictly checks the incoming data. Does it have the cow's ID? Is the weight a positive number? Is the age a number? If the data is messy, it rejects it before it causes a crash.
2. **Device Authentication:** It checks the `x-api-key` to ensure this is an authorized AgroScale scale.
3. **Machine Learning AI (`mlClient.js`):** The system attempts to contact an external Artificial Intelligence server to ask if the cow is under/overweight based on its breed and age. It gives the AI exactly 3 seconds to respond.
4. **The Fallback Plan (`classificationService.js`):** If the AI is offline, broken, or takes too long, the system doesn't crash. It seamlessly falls back to a database table (`WeightStandard`) and checks hard-coded rules to guess the cow's health status. 
5. **Saving:** Once the cow's health is calculated, it safely saves the measurement to PostgreSQL.

## 6. The Dashboard System

We created clean endpoints so the React frontend can quickly paint graphs and lists.

- **Cow History (`cowService.js`):** Endpoints that fetch a specific cow's entire weight history, calculating their growth percentages seamlessly.
- **Dashboard Trends (`dashboardService.js`):** Endpoints that bundle up the overall totals (how many cows are on the farm, what was the weight trend over the last 30 days) into one fast package to display on the home screen.

## 7. Global Safety Nets

We added two crucial safety nets to `src/app.js`:

- **Rate Limiting:** IoT devices (scales) are restricted to sending a maximum of 60 requests per minute. This prevents broken hardware from accidentally flooding and crashing your server.
- **Global Error Handler:** If a weird bug happens anywhere in the code, the server will no longer completely crash and shut down. Instead, the Central Error Handler catches the bug, prints a warning for the developer, and politely tells the user "An unexpected error occurred".
