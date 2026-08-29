const errorHandler = (err, req, res, next) => {
  console.error('🔥 Request Error:', err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors } });
  }
  const statusCode = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';
  res.status(statusCode).json({ error: { code, message } });
};
module.exports = errorHandler;
