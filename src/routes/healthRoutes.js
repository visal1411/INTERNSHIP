const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * @openapi
 * /health:
 *   get:
 *     summary: System & Database Health Check
 *     description: Performs a live database query (`SELECT 1`) to verify that both the Node.js Express server and the PostgreSQL database connection are fully operational.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: System and database are healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service unavailable - database query failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get('/', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'ok', db: 'error' });
  }
});

module.exports = router;
