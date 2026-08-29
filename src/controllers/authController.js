const { loginSchema } = require('../schemas/auth.schema');
const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const token = await authService.login(validatedData.email, validatedData.password);
    return res.json({ token });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors } });
    }
    if (err.message === 'Invalid email or password') {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
};

module.exports = { login };
