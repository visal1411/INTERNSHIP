const { iotMeasurementSchema } = require('../schemas/iot.schema');
const iotIngestionService = require('../services/iotIngestionService');
const logger = require('../lib/logger');

const ingest = async (req, res) => {
  try {
    const validatedData = iotMeasurementSchema.parse(req.body);
    const result = await iotIngestionService.ingestMeasurement(validatedData);
    return res.status(201).json(result);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors } });
    }
    if (err.code === 'UNAUTHORIZED') {
      return res.status(401).json({ error: { code: err.code, message: err.message } });
    }
    if (err.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: { code: err.code, message: err.message } });
    }
    if (req && req.log) {
      req.log.error(err, '🔥 IoT Ingestion Error');
    } else {
      logger.error(err, '🔥 IoT Ingestion Error');
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' } });
  }
};

const heartbeat = async (req, res) => {
  try {
    const { device_id, battery } = req.body || {};
    if (!device_id) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'device_id is required' } });
    }
    const result = await iotIngestionService.recordHeartbeat({ device_id, battery });
    return res.status(200).json(result);
  } catch (err) {
    if (err.code === 'UNAUTHORIZED') {
      return res.status(401).json({ error: { code: err.code, message: err.message } });
    }
    if (req && req.log) {
      req.log.error(err, '🔥 IoT Heartbeat Error');
    } else {
      logger.error(err, '🔥 IoT Heartbeat Error');
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' } });
  }
};

module.exports = { ingest, heartbeat };
