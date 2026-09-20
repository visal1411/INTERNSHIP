const pino = require('pino');

const lokiHost = process.env.LOKI_HOST;

const targets = [];

// Console target
targets.push({
  target: 'pino/file',
  options: { destination: 1 }, // stdout
  level: process.env.LOG_LEVEL || 'info'
});

// Loki target (if LOKI_HOST environment variable is configured)
if (lokiHost) {
  targets.push({
    target: 'pino-loki',
    options: {
      batching: true,
      interval: 5,
      host: lokiHost,
      labels: { app: 'agroscale-backend', env: process.env.NODE_ENV || 'development' },
      ...(process.env.LOKI_USER && process.env.LOKI_PASSWORD
        ? {
            basicAuth: {
              username: process.env.LOKI_USER,
              password: process.env.LOKI_PASSWORD
            }
          }
        : {})
    },
    level: process.env.LOG_LEVEL || 'info'
  });
}

const transport = pino.transport({ targets });

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: { app: 'agroscale-backend' },
    timestamp: pino.stdTimeFunctions.isoTime
  },
  transport
);

module.exports = logger;
