const { iotMeasurementSchema } = require('../schemas/iot.schema');
const iotIngestionService = require('../services/iotIngestionService');

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
    console.error('🔥 IoT Ingestion Error:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' } });
  }
};

module.exports = { ingest };
