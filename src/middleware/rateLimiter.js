const rateLimit = require('express-rate-limit');
const iotRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 60, 
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = { iotRateLimiter };
