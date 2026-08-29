const { z } = require('zod');

const iotMeasurementSchema = z.object({
  device_id: z.string(),
  cow_id: z.string(),
  breed: z.string(),
  sex: z.enum(['male', 'female', 'any']).optional().default('any'),
  age_months: z.number().int().nonnegative(),
  weight_kg: z.number().positive(),
  measured_at: z.string().datetime().optional()
});

module.exports = { iotMeasurementSchema };
