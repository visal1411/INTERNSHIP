const express = require('express');
const router = express.Router();
const cowController = require('../controllers/cowController');

/**
 * @openapi
 * /api/v1/cows:
 *   get:
 *     summary: List all cows owned by the authenticated farmer
 *     description: Retrieves an array of all registered cows belonging to the logged-in farmer, ordered by registration date descending.
 *     tags:
 *       - Cows
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of cows retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cow'
 *       401:
 *         description: Unauthorized - missing, invalid, or expired JWT Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', cowController.listCows);

/**
 * @openapi
 * /api/v1/cows/{id}:
 *   get:
 *     summary: Get single cow details by ID
 *     description: Retrieves the profile and metadata for a specific cow owned by the authenticated farmer. If the cow belongs to another farmer or does not exist, a 404 is returned.
 *     tags:
 *       - Cows
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal database primary key ID of the cow
 *         example: 1
 *     responses:
 *       200:
 *         description: Cow profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CowDetail'
 *       401:
 *         description: Unauthorized - missing, invalid, or expired JWT Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cow not found or not owned by this farmer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', cowController.getCow);

/**
 * @openapi
 * /api/v1/cows/{id}/measurements:
 *   get:
 *     summary: List weight measurement history for a cow
 *     description: Retrieves all historical weight readings recorded for a specific cow owned by the authenticated farmer, ordered by measurement timestamp descending.
 *     tags:
 *       - Cows
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal database primary key ID of the cow
 *         example: 1
 *     responses:
 *       200:
 *         description: Array of historical weight measurements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WeightMeasurement'
 *       401:
 *         description: Unauthorized - missing, invalid, or expired JWT Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cow not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/measurements', cowController.listMeasurements);

/**
 * @openapi
 * /api/v1/cows/{id}/growth:
 *   get:
 *     summary: Get chronological growth tracking points for charting
 *     description: Retrieves chronologically sorted (ascending by date) `{ date, weight_kg }` coordinate points for rendering growth trajectory line charts on the frontend.
 *     tags:
 *       - Cows
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal database primary key ID of the cow
 *         example: 1
 *     responses:
 *       200:
 *         description: Growth data points for chart rendering
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CowGrowthResponse'
 *       401:
 *         description: Unauthorized - missing, invalid, or expired JWT Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cow not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/growth', cowController.getGrowth);

module.exports = router;
