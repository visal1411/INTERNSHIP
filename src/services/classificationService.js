const mlClient = require('../lib/mlClient');
const prisma = require('../lib/prisma');

const classify = async (breed, sex, ageMonths, weightKg) => {
  // 1. Try ML Client first
  try {
    const mlResult = await mlClient.predictWeightStatus(breed, ageMonths, weightKg);
    return mlResult; // { label, confidence }
  } catch (err) {
    console.warn('⚠️ ML classification skipped/failed, falling back to WeightStandard lookup:', err.message);
  }

  // 2. Fallback to WeightStandard table
  try {
    const standard = await prisma.weightStandard.findFirst({
      where: {
        breed: breed,
        sex: sex,
        ageMinMonths: { lte: ageMonths },
        ageMaxMonths: { gte: ageMonths }
      }
    });

    if (!standard) {
      return null;
    }

    let calculatedStatus = 'healthy';
    if (weightKg < standard.minHealthyWeight) {
      calculatedStatus = 'underweight';
    } else if (weightKg > standard.maxHealthyWeight) {
      calculatedStatus = 'overweight';
    }

    return { label: calculatedStatus, confidence: null };
  } catch (fallbackErr) {
    console.error('🔥 WeightStandard fallback query failed:', fallbackErr);
    return null;
  }
};

module.exports = { classify };
