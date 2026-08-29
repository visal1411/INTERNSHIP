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
const { iotRateLimiter } = require('./middleware/rateLimiter');

const requiredParams = ['DATABASE_URL', 'IOT_API_KEY', 'JWT_SECRET', 'FRONTEND_URL', 'PORT'];
for (const param of requiredParams) {
  if (!process.env[param]) {
    console.error(`🔥 CRITICAL FATAL: Missing required environment variable: ${param}`);
    process.exit(1);
  }
}

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
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
app.use('/api/v1/iot', iotRateLimiter, iotRoutes);
app.use('/api/v1/cows', farmerAuth, cowRoutes);
app.use('/api/v1/dashboard', farmerAuth, dashboardRoutes);

app.use(errorHandler);

module.exports = app;
