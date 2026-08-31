const { z } = require('zod');

const iotMeasurementSchema = z.object({
  device_id: z.string(),
  cow_id: z.string(),
  weight_kg: z.number().positive(),
  measured_at: z.string().datetime().optional()
});

module.exports = { iotMeasurementSchema };
