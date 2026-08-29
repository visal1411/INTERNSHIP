const deviceAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.IOT_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'IOT_API_KEY is not configured' } });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing x-api-key' } });
  }

  next();
};

module.exports = deviceAuth;
