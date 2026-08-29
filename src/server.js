require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3002;

process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL ERROR (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRITICAL ERROR (Unhandled Rejection):', reason);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 API Server is UP on port ${PORT}`);
  console.log(`📑 Swagger Documentation available at http://localhost:${PORT}/api-docs`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is currently in use. Please free port ${PORT} or change PORT in .env`);
  } else {
    console.error('🔥 Server error:', err);
  }
});
