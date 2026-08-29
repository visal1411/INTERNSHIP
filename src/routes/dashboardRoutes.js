const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * @openapi
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Get high-level farm overview & recent activity
 *     description: Returns aggregated metrics for the authenticated farmer's dashboard, including the total count of registered cows and the 10 most recent weight measurement logs with cow tag metadata.
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Summary metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardSummaryResponse'
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
router.get('/summary', dashboardController.getSummary);

/**
 * @openapi
 * /api/v1/dashboard/trends:
 *   get:
 *     summary: Get 30-day farm-wide average weight trends
 *     description: Calculates and aggregates daily average cow weights across the entire herd for the past 30 days, sorted chronologically ascending. Ready for chart rendering.
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 30-day average weight trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardTrendsResponse'
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
router.get('/trends', dashboardController.getTrends);

module.exports = router;
