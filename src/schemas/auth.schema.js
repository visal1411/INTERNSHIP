const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required')
});

module.exports = { loginSchema };
