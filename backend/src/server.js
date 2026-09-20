require('dotenv').config();
const app = require('./app');
const logger = require('./lib/logger');

const PORT = process.env.PORT || 3002;

process.on('uncaughtException', (err) => {
  logger.fatal(err, '🔥 CRITICAL FATAL (Uncaught Exception)');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, '🔥 CRITICAL ERROR (Unhandled Rejection)');
});

const server = app.listen(PORT, () => {
  logger.info(`🚀 API Server is UP on port ${PORT}`);
  logger.info(`📑 Swagger Documentation available at http://localhost:${PORT}/api-docs`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal(`❌ Port ${PORT} is currently in use. Please free port ${PORT} or change PORT in .env`);
  } else {
    logger.error(err, '🔥 Server error');
  }
});

