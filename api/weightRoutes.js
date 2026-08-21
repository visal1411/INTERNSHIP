const express = require('express');
const router = express.Router();
const { WeightRecord, Cow } = require('../database');

/**
 * @openapi
 * /api/weights:
 *   get:
 *     summary: Get all weight history ledger
 */
router.get('/weights', async (req, res) => {
  try {
    const weights = await WeightRecord.findAll({ 
      order: [['createdAt', 'DESC']],
      include: [{ model: Cow, attributes: ['name', 'cowId'] }]
    });
    res.json(weights);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/**
 * @openapi
 * /api/weight:
 *   post:
 *     summary: Simulate live weight sensor stream (POSTMAN/ESP32)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_id:
 *                 type: string
 *                 example: SIM-001
 *               display:
 *                 type: number
 *                 example: 150.2
 *               stable:
 *                 type: boolean
 *                 example: true
 */
router.post('/weight', async (req, res) => {
  const { device_id, display, stable } = req.body;
  const payload = { deviceId: device_id, weight: display, stable, timestamp: new Date() };
  req.app.get('io').emit('weight_update', payload);
  res.json({ status: 'ok', message: 'Reading received', device_id });
});

module.exports = router;
