const express = require('express');
const router = express.Router();
const { Cow, WeightRecord, Device, WeightStandard } = require('../database');

/**
 * @openapi
 * /api/dashboard/stats:
 *   get:
 *     summary: Aggregated stats for the main dashboard
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalCows = await Cow.count();
    const onlineDevices = await Device.count({ where: { status: 'online' } });
    
    const allWeights = await WeightRecord.findAll();
    const avg = allWeights.length > 0 
      ? allWeights.reduce((sum, w) => sum + w.weight, 0) / allWeights.length 
      : 0;

    const recentRecords = await WeightRecord.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: Cow, attributes: ['name', 'cowId'] }]
    });

    const heaviestRecord = await WeightRecord.findOne({
      order: [['weight', 'DESC']],
      include: [{ model: Cow, attributes: ['name', 'cowId'] }]
    });

    const recentActivity = recentRecords.map(r => ({
      id: r.id,
      type: 'weigh-in',
      cowId: r.cowId,
      cowName: r.Cow ? r.Cow.name : 'Unknown',
      weight: r.weight,
      timestamp: r.createdAt,
      deviceId: r.deviceId
    }));

    res.json({ 
      totalCows, 
      onlineDevices, 
      averageWeight: parseFloat(avg.toFixed(1)), 
      heaviestCow: heaviestRecord ? {
        name: heaviestRecord.Cow ? heaviestRecord.Cow.name : 'N/A',
        weight: heaviestRecord.weight
      } : null,
      alerts: [], 
      recentActivity 
    });
  } catch (err) { 
    res.json({ totalCows: 0, onlineDevices: 0, averageWeight: 0, alerts: [], recentActivity: [] }); 
  }
});

/**
 * @openapi
 * /api/devices:
 *   get:
 *     summary: List weighing devices hardware
 */
router.get('/devices', async (req, res) => {
  const devices = await Device.findAll();
  res.json(devices);
});

/**
 * @openapi
 * /api/standards:
 *   get:
 *     summary: List weight standards for livestock
 */
router.get('/standards', async (req, res) => {
  const standards = await WeightStandard.findAll();
  res.json(standards);
});

module.exports = router;
