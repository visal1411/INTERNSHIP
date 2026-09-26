const prisma = require('../lib/prisma');
const logger = require('../lib/logger');

const parseStatus = (statusRaw) => {
  let label = null;
  let flag = 'Normal';
  let isAnomaly = false;

  if (statusRaw) {
    try {
      const parsed = JSON.parse(statusRaw);
      label = parsed.label;
      flag = parsed.flag || 'Normal';
      isAnomaly = parsed.isAnomaly || (flag !== 'Normal');
    } catch (e) {
      if (statusRaw.startsWith('Flagged')) {
        flag = statusRaw;
        isAnomaly = true;
        label = statusRaw.includes('Pregnancy') || statusRaw.includes('Overweight') ? 'overweight' : 'underweight';
      } else {
        label = statusRaw;
        flag = 'Normal';
        isAnomaly = false;
      }
    }
  }

  return { label, flag, isAnomaly };
};

const reclassifyUnclassifiedMeasurements = async (farmerId) => {
  try {
    const registeredCows = await prisma.cow.findMany({
      where: {
        farmerId,
        NOT: [{ breed: null }, { sex: null }, { dateOfBirth: null }]
      },
      include: {
        measurements: true
      }
    });

    const classificationService = require('./classificationService');
    const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;

    for (const cow of registeredCows) {
      for (const m of cow.measurements) {
        if (!m.status || !m.status.startsWith('{')) {
          const ageMonths = Math.max(0, Math.floor((new Date(m.measuredAt) - new Date(cow.dateOfBirth)) / msPerMonth));
          const mlResult = await classificationService.classify(cow.breed, cow.sex, ageMonths, m.weightKg);
          if (mlResult) {
            const statusPayload = JSON.stringify({
              label: mlResult.label,
              flag: mlResult.flag || 'Normal',
              isAnomaly: mlResult.isAnomaly || false,
              anomalyScore: mlResult.anomalyScore || 0
            });

            await prisma.weightMeasurement.update({
              where: { id: m.id },
              data: {
                status: statusPayload,
                confidence: mlResult.confidence,
                ageMonthsAtMeasurement: ageMonths
              }
            });
            m.status = statusPayload;
            m.confidence = mlResult.confidence;
          }
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error in reclassifyUnclassifiedMeasurements');
  }
};

const getCows = async (farmerId) => {
  await reclassifyUnclassifiedMeasurements(farmerId);

  const cows = await prisma.cow.findMany({
    where: { farmerId },
    orderBy: { createdAt: 'desc' },
    include: {
      measurements: {
        orderBy: { measuredAt: 'desc' },
        take: 1
      }
    }
  });

  return cows.map(c => {
    const lastM = c.measurements.length > 0 ? c.measurements[0] : null;
    const { label, flag, isAnomaly } = parseStatus(lastM ? lastM.status : null);
    return {
      id: c.id,
      cowId: c.cowId,
      breed: c.breed,
      sex: c.sex,
      dateOfBirth: c.dateOfBirth,
      createdAt: c.createdAt,
      latestWeight: lastM ? lastM.weightKg : 0,
      latestStatus: label,
      anomalyFlag: flag,
      isAnomaly: isAnomaly,
      confidence: lastM ? lastM.confidence : null
    };
  });
};

const getCowById = async (farmerId, id) => {
  const cow = await prisma.cow.findFirst({
    where: { id: parseInt(id), farmerId }
  });
  if (!cow) throw new Error('Cow not found');
  return cow;
};

const getMeasurements = async (farmerId, id) => {
  const cow = await getCowById(farmerId, id);
  const rawMeasurements = await prisma.weightMeasurement.findMany({
    where: { cowId: cow.id },
    orderBy: { measuredAt: 'desc' }
  });

  return rawMeasurements.map(m => {
    const { label, flag, isAnomaly } = parseStatus(m.status);
    return {
      ...m,
      status: label,
      anomalyFlag: flag,
      isAnomaly: isAnomaly
    };
  });
};

const getGrowth = async (farmerId, id) => {
  const measurements = await getMeasurements(farmerId, id);
  const points = measurements.map(m => ({
    date: m.measuredAt.toISOString(),
    weight_kg: m.weightKg
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  return { points };
};

const createCow = async (farmerId, data) => {
  // Ensure the cowId doesn't already exist for this farmer
  const existing = await prisma.cow.findFirst({
    where: { farmerId, cowId: data.cowId }
  });
  if (existing) throw new Error('Cow with this Tag ID already exists');

  return prisma.cow.create({
    data: {
      farmerId,
      cowId: data.cowId,
      breed: data.breed || null,
      sex: data.gender || null,
      dateOfBirth: data.birthDate ? new Date(data.birthDate) : null
    }
  });
};

const updateCow = async (farmerId, id, data) => {
  const cow = await getCowById(farmerId, id);
  const updatedCow = await prisma.cow.update({
    where: { id: cow.id },
    data: {
      breed: data.breed !== undefined ? data.breed : cow.breed,
      sex: data.gender ? data.gender : cow.sex,
      dateOfBirth: data.birthDate ? new Date(data.birthDate) : cow.dateOfBirth
    }
  });

  // Automatically trigger ML classification for any unclassified measurements
  // now that the cow has breed/age/gender!
  if (updatedCow.breed && updatedCow.sex && updatedCow.dateOfBirth) {
    const measurements = await prisma.weightMeasurement.findMany({
      where: { cowId: cow.id }
    });

    const classificationService = require('./classificationService');
    const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;

    for (const m of measurements) {
      const ageMonths = Math.max(0, Math.floor((m.measuredAt - new Date(updatedCow.dateOfBirth)) / msPerMonth));
      try {
        const mlResult = await classificationService.classify(
          updatedCow.breed,
          updatedCow.sex,
          ageMonths,
          m.weightKg
        );

        if (mlResult) {
          const statusPayload = JSON.stringify({
            label: mlResult.label,
            flag: mlResult.flag || 'Normal',
            isAnomaly: mlResult.isAnomaly || false,
            anomalyScore: mlResult.anomalyScore || 0
          });

          await prisma.weightMeasurement.update({
            where: { id: m.id },
            data: {
              status: statusPayload,
              confidence: mlResult.confidence,
              ageMonthsAtMeasurement: ageMonths
            }
          });
        }
      } catch (err) {
        logger.error({ err }, `Failed to re-classify measurement ${m.id} after cow update`);
      }
    }
  }

  return updatedCow;
};

module.exports = { getCows, getCowById, getMeasurements, getGrowth, createCow, updateCow };
