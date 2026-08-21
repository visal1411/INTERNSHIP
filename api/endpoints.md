# AgroScale SQL API Endpoints

This document lists all available API endpoints for the Livestock Monitoring System.

## 🐂 Cattle Registry (`api/cowRoutes.js`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/cows` | Retrieve all registered cattle profiles. |
| **POST** | `/api/cows` | Register a new cow into the SQL database. |
| **PATCH** | `/api/cows/:id` | Update an existing cow's information (by Tag ID). |
| **DELETE** | `/api/cows/:id` | Permanently remove a cow record. |

## ⚖️ Weights & Weighing (`api/weightRoutes.js`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/weights` | Get the full historical ledger of all weight measurements. |
| **POST** | `/api/cows/:id/weights` | Store a new weight record associated with a specific cow. |
| **POST** | `/api/weight` | **Sensor Stream:** Endpoint for ESP32/Simulators to broadcast live weight. |

## 📊 Dashboard & Stats (`api/dashboardRoutes.js`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/dashboard/stats` | Aggregated data for the dashboard (Herd count, Avg weight, Activity). |
| **GET** | `/api/devices` | List all weighing hardware units and their status. |
| **GET** | `/api/standards` | Retrieve healthy weight growth standards by breed/age. |

## 🛠️ System
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api-docs` | Interactive Swagger UI documentation and testing playground. |
| **WS** | `/socket.io` | WebSocket connection for real-time weighing updates. |
