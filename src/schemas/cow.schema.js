const { z } = require('zod');

const createCowSchema = z.object({
  cowId: z.string().min(1, 'Tag ID is required'),
  breed: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  birthDate: z.string().datetime().optional()
});

const updateCowSchema = z.object({
  breed: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  birthDate: z.string().datetime().optional()
});

module.exports = { createCowSchema, updateCowSchema };
