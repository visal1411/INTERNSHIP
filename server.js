const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

// SQL Connection & Models
const { initDB } = require('./database');

// API Modules
const cowRoutes = require('./api/cowRoutes');
const weightRoutes = require('./api/weightRoutes');
const dashboardRoutes = require('./api/dashboardRoutes');

const app = express();
const server = http.createServer(app);

// Global Error Handler to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL ERROR (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRITICAL ERROR (Unhandled Rejection):', reason);
});

// Swagger Configuration with Error Handling
let swaggerSpec = {};
try {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'AgroScale Livestock API (SQL)',
        version: '1.0.0',
        description: 'SQL-based API for Livestock Monitoring. Uses SQLite/MySQL.',
      },
      servers: [{ url: 'http://localhost:3002', description: 'Local Dev Server' }],
    },
    apis: ['./api/*.js'], 
  };
  swaggerSpec = swaggerJsdoc(swaggerOptions);
} catch (e) {
  console.error('⚠️ Swagger failed to load, but server will continue:', e.message);
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// CORS & Middleware
const io = new Server(server, { 
  cors: { 
    origin: true, 
    methods: ['GET', 'POST', 'DELETE'], 
    credentials: true 
  } 
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket Connected: ${socket.id}`);
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket Disconnected: ${socket.id} (${reason})`);
  });
});

// Attach io to app for use in routes
app.set('io', io);

app.use(cors({ 
  origin: true, 
  credentials: true 
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Initial Redirect
app.get('/', (req, res) => res.send('<h1>AgroScale SQL API is Online</h1><p>Visit <a href="/api-docs">/api-docs</a> for testing.</p>'));

// Integration of Route Modules
app.use('/api/cows', cowRoutes);
app.use('/api', weightRoutes);
app.use('/api', dashboardRoutes);

// START
const PORT = process.env.PORT || 3002;
initDB().then(() => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 SQL API Server is UP on port ${PORT}`);
      console.log(`🏛️  Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('🔥 Server failed to start on port', PORT, err.message);
  }
}).catch(err => {
  console.error('🔥 Database failed to initialize:', err.message);
});
