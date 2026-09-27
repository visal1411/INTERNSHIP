const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  // 1. Try .env.local if present
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  // 2. Try .env.<NODE_ENV> (.env.development or .env.production)
  dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
  // 3. Fallback to default .env
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

loadEnv();

module.exports = { loadEnv };
