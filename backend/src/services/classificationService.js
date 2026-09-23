const mlClient = require('../lib/mlClient');
const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const classify = async (breed, sex, ageMonths, weightKg) => {
  // 1. Try Python ML service first
  try {
    const mlResult = await mlClient.predictWeightStatus(breed, sex, ageMonths, weightKg);
    if (mlResult) return mlResult;
  } catch (err) {
    logger.warn({ err: err.message }, '⚠️ ML service unavailable, falling back to WeightStandard DB table');
  }

  // 2. Fallback to PostgreSQL WeightStandard table if ML service is down or unconfigured
  try {
    const standard = await prisma.weightStandard.findFirst({
      where: {
        breed: { equals: breed, mode: 'insensitive' },
        sex: { equals: sex, mode: 'insensitive' },
        ageMinMonths: { lte: ageMonths },
        ageMaxMonths: { gte: ageMonths }
      }
    });

    if (standard) {
      let label = 'healthy';
      if (weightKg < standard.minHealthyWeight) label = 'underweight';
      else if (weightKg > standard.maxHealthyWeight) label = 'overweight';
      return { label, confidence: 1.0 };
    }
  } catch (dbErr) {
    logger.error({ err: dbErr.message }, 'Failed to query WeightStandard table');
  }

  return null;
};

module.exports = { classify };
