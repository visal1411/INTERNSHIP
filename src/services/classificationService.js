const mlClient = require('../lib/mlClient');
const prisma = require('../lib/prisma');

const classify = async (breed, sex, ageMonths, weightKg) => {
  // Use ML Client for classification
  try {
    const mlResult = await mlClient.predictWeightStatus(breed, sex, ageMonths, weightKg);
    return mlResult; // { label, confidence }
  } catch (err) {
    console.error('🔥 ML classification failed:', err.message);
    throw new Error('Classification failed because the ML service is unavailable.');
  }
};

module.exports = { classify };
