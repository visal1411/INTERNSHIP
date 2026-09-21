const { loginSchema, changePasswordSchema } = require('../schemas/auth.schema');
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

const logout = async (req, res) => {
  try {
    if (req.log) {
      req.log.info({ farmerId: req.farmerId || null }, 'User logged out successfully');
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
};

const changePassword = async (req, res) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(req.farmerId, validatedData);
    if (req.log) {
      req.log.info({ farmerId: req.farmerId }, 'Farmer password updated successfully');
    }
    return res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors } });
    }
    if (err.message.includes('incorrect') || err.message.includes('Invalid') || err.message.includes('not found')) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: err.message } });
    }
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
};

module.exports = { login, logout, changePassword };
