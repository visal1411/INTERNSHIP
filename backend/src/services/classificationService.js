const mlClient = require('../lib/mlClient');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const classify = async (breed, sex, ageMonths, weightKg) => {
  // Use ML Client for classification
  try {
    const mlResult = await mlClient.predictWeightStatus(breed, sex, ageMonths, weightKg);
    return mlResult; // { label, confidence }
  } catch (err) {
    logger.error({ err }, '🔥 ML classification failed');
    throw new Error('Classification failed because the ML service is unavailable.');
  }
};

module.exports = { classify };
