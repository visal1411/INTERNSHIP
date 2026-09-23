const { z } = require('zod');

const iotMeasurementSchema = z.object({
  device_id: z.string(),
  cow_id: z.string(),
  weight_kg: z.number().gte(5.0, "Weight must be at least 5.0 kg"),
  measured_at: z.string().datetime().optional()
});

module.exports = { iotMeasurementSchema };
