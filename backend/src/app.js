const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');

const authRoutes = require('./routes/authRoutes');
const iotRoutes = require('./routes/iotRoutes');
const cowRoutes = require('./routes/cowRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const healthRoutes = require('./routes/healthRoutes');

const farmerAuth = require('./middleware/farmerAuth');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const logger = require('./lib/logger');

const requiredParams = ['DATABASE_URL', 'IOT_API_KEY', 'JWT_SECRET', 'FRONTEND_URL'];
for (const param of requiredParams) {
  if (!process.env[param]) {
    logger.fatal(`🔥 CRITICAL FATAL: Missing required environment variable: ${param}`);
    process.exit(1);
  }
}


const app = express();
app.use(requestLogger);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy error: Origin ${origin} not allowed`));
      }
    },
    credentials: true
  })
);
app.use(bodyParser.json({ limit: '10mb' }));

// Swagger UI Documentation & Spec Endpoint
const swaggerUiOptions = {
  customSiteTitle: 'AgroScale API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.use('/docs', (req, res) => res.redirect('/api-docs'));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Application Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/iot', iotRoutes);
app.use('/api/v1/cows', farmerAuth, cowRoutes);
app.use('/api/v1/dashboard', farmerAuth, dashboardRoutes);

app.use(errorHandler);

module.exports = app;
