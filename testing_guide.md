# AgroScale API Testing Guide

Use this guide to test the AgroScale backend endpoints locally using **Postman**, **Thunder Client** (VS Code), or **cURL**.

## 1. Prerequisites (Starting the Server)

Before testing any endpoints, ensure the server and database are running:
1. Ensure Docker is running in the background.
2. Ensure the database container is up: `docker-compose up -d`
3. Boot the Node.js API: `npm run dev`

Your server should now be listening at `http://localhost:3002`.

---

## 2. IoT Data Ingestion (Simulating a Hardware Scale)

Before looking at the dashboard, we must manually populate some cow weights as if the physical scale just took a reading.

* **Method:** `POST`
* **URL:** `http://localhost:3002/api/v1/iot/measurements`
* **Headers:** 
  * `Content-Type`: `application/json`
  * `x-api-key`: `your_iot_key` *(Must match the exact string in your `.env` file)*
* **Body (JSON):**
```json
{
  "device_id": "esp32-gateway-01",
  "cow_id": "TEST-COW-1",
  "breed": "Holstein",
  "sex": "female",
  "age_months": 24,
  "weight_kg": 350.5
}
```
**Test This:** Send this request 3-4 times. Vary the `weight_kg` slightly each time so that a history is built up for this specific cow!

---

## 3. Farmer Authentication (Logging into the Dashboard)

We seeded two mock farmers during the database setup. You need to log in as one of them to get an access token.

* **Method:** `POST`
* **URL:** `http://localhost:3002/api/v1/auth/login`
* **Headers:** `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "email": "farmer1@agroscale.com",
  "password": "password123"
}
```
**Action Required:** You will receive a long `token` string in the response. Copy this string entirely. You will need it in step 4.

---

## 4. Farmer Perspectives (Viewing the Data)

Use the token you copied from Step 3 to trick the system into thinking the dashboard is requesting data on your behalf.

### A. View Your Cattle Roster
See all cows strictly assigned to you.
* **Method:** `GET`
* **URL:** `http://localhost:3002/api/v1/cows`
* **Headers:** 
  * `Authorization`: `Bearer <PASTE_YOUR_TOKEN_HERE>`

### B. View Dashboard Trends (30-Day Aggergate)
View the aggregated daily points for plotting the dashboard summary graph.
* **Method:** `GET`
* **URL:** `http://localhost:3002/api/v1/dashboard/trends`
* **Headers:** 
  * `Authorization`: `Bearer <PASTE_YOUR_TOKEN_HERE>`

### C. View Specific Cow Growth
*Grab a numerical ID from the cattle roster response in Step A (e.g. `1`)*
* **Method:** `GET`
* **URL:** `http://localhost:3002/api/v1/cows/1/growth`
* **Headers:** 
  * `Authorization`: `Bearer <PASTE_YOUR_TOKEN_HERE>`

---

## 5. Defensive Testing (Breaking the API)

To understand how secure the new architecture is, try "breaking" the rules to trigger the global error handlers.

1. **Test Multi-Tenancy Boundary:** Log in as `farmer2@agroscale.com` (to get Farmer 2's token), and attempt to read `GET /api/v1/cows/1` (which belongs to Farmer 1). Wait for the `404 / Cow not found` error.
2. **Test Zod Schema Failures:** Send a `POST /api/v1/iot/measurements` payload, but change `"age_months": 24` to `"age_months": "old"` (send a string instead of a number). You should get a `400 VALIDATION_ERROR` detailing exactly what data type was wrong.
3. **Test IoT Unauthorized Stop:** Remove the `x-api-key` header entirely from the IoT request. You should instantly be hit with a `401 UNAUTHORIZED`.
