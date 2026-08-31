const { loginSchema } = require('../schemas/auth.schema');
const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);
    return res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors } });
    }
    if (err.message.includes('Invalid phone number') || err.message.includes('Invalid email') || err.message.includes('Invalid password')) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
};

module.exports = { login };
