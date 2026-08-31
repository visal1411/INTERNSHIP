const { z } = require('zod');

const loginSchema = z.object({
  phone: z.string().min(6, 'Phone number must be at least 6 digits'),
  password: z.string().min(1, 'Password is required')
});

module.exports = { loginSchema };
