const express = require('express');
const router = express.Router();
const { Cow, WeightRecord } = require('../database');

/**
 * @openapi
 * /api/cows:
 *   get:
 *     summary: List all registered cattle
 */
router.get('/', async (req, res) => {
  try {
    const cows = await Cow.findAll({ order: [['createdAt', 'DESC']] });
    res.json(cows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/**
 * @openapi
 * /api/cows:
 *   post:
 *     summary: Register a new cow
 */
router.post('/', async (req, res) => {
  try {
    console.log('📬 POST /api/cows - Payload:', req.body);
    const cow = await Cow.create(req.body);
    req.app.get('io').emit('db_changed', { type: 'cow_created' });
    res.json(cow);
  } catch (error) {
    console.error('❌ POST /api/cows - Error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/cows/{id}/weights:
 *   post:
 *     summary: Log a weight for a specific cow (Lock & Save)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: TAG-001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weight:
 *                 type: number
 *                 example: 250.5
 *               deviceId:
 *                 type: string
 *                 example: SCALE-01
 */
router.post('/:id/weights', async (req, res) => {
  try {
    const cowId = req.params.id; // This is the Tag ID
    const { weight, deviceId } = req.body;
    
    // Find the cow first to make sure it exists
    const cow = await Cow.findOne({ where: { cowId } });
    if (!cow) return res.status(404).json({ error: 'Cow not found in registry' });

    const record = await WeightRecord.create({ 
      cowId: cow.cowId, 
      weight: parseFloat(weight) || 0, 
      deviceId: deviceId || 'MANUAL', 
      stable: true 
    });

    req.app.get('io').emit('db_changed', { type: 'weight_recorded' });
    res.json({ status: 'ok', record });
  } catch (error) {
    console.error('🔥 Save Weight Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/cows/{id}:
 *   patch:
 *     summary: Update cow records
 */
router.patch('/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    console.log(`📬 PATCH /api/cows/${targetId} - Payload:`, req.body);
    
    // We explicitly exclude cowId from update to prevent primary key issues
    const { cowId, ...updateData } = req.body;
    
    const [updatedRows] = await Cow.update(updateData, { where: { cowId: targetId } });
    
    if (updatedRows === 0) {
      console.warn(`⚠️ No cow found with cowId: ${targetId}`);
      return res.status(404).json({ error: 'No cow found with that ID' });
    }

    console.log('✅ Cow updated successfully.');
    req.app.get('io').emit('db_changed', { type: 'cow_updated' });
    res.json({ status: 'ok' });
  } catch (e) { 
    console.error(`❌ PATCH /api/cows/${req.params.id} - Error:`, e.message);
    res.status(500).json({ error: e.message }); 
  }
});

/**
 * @openapi
 * /api/cows/{id}:
 *   delete:
 *     summary: Delete a cow record
 */
router.delete('/:id', async (req, res) => {
  try {
    await Cow.destroy({ where: { cowId: req.params.id } });
    req.app.get('io').emit('db_changed', { type: 'cow_deleted' });
    res.json({ status: 'ok' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
