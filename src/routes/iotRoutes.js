const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');
const deviceAuth = require('../middleware/deviceAuth');

/**
 * @openapi
 * /api/v1/iot/measurements:
 *   post:
 *     summary: Ingest scale weight measurement from ESP32 gateway
 *     description: |
 *       Endpoint called by physical ESP32 gateway devices to ingest cow weight readings.
 *       
 *       **Workflow:**
 *       1. Validates the `x-api-key` header against the system secret.
 *       2. Resolves the owning `Farmer` by looking up the `device_id` in the `Device` table.
 *       3. Upserts the `Cow` record scoped to the owning farmer.
 *       4. Evaluates weight status via the external Python ML service (or falls back to the PostgreSQL `WeightStandard` reference table if ML is unavailable).
 *       5. Saves the measurement and returns the generated measurement ID and classification label.
 *     tags:
 *       - IoT Ingestion
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IoTMeasurementRequest'
 *     responses:
 *       201:
 *         description: Measurement recorded and classified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IoTMeasurementResponse'
 *       400:
 *         description: Validation error in request body or future timestamp exceeding tolerance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized - missing/invalid `x-api-key` header, or `device_id` is not registered to any farmer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded (more than 60 requests/minute per IP)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitErrorResponse'
 *       500:
 *         description: Internal server error or misconfiguration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/measurements', deviceAuth, iotController.ingest);

module.exports = router;
