const prisma = require('../lib/prisma');

const getCows = async (farmerId) => {
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

  return cows.map(c => ({
    id: c.id,
    cowId: c.cowId,
    breed: c.breed,
    sex: c.sex,
    dateOfBirth: c.dateOfBirth,
    createdAt: c.createdAt,
    latestWeight: c.measurements.length > 0 ? c.measurements[0].weightKg : 0,
    latestStatus: c.measurements.length > 0 ? c.measurements[0].status : null
  }));
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
  return prisma.weightMeasurement.findMany({
    where: { cowId: cow.id },
    orderBy: { measuredAt: 'desc' }
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

  // Automatically trigger ML classification for the latest weight measurement 
  // now that the cow has a breed/age/gender!
  if (updatedCow.breed && updatedCow.sex && updatedCow.dateOfBirth) {
    const latestMeasurement = await prisma.weightMeasurement.findFirst({
      where: { cowId: cow.id },
      orderBy: { measuredAt: 'desc' }
    });

    if (latestMeasurement) {
      const classificationService = require('./classificationService');
      const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
      const ageMonths = Math.max(0, Math.floor((latestMeasurement.measuredAt - updatedCow.dateOfBirth) / msPerMonth));
      
      try {
        const mlResult = await classificationService.classify(
          updatedCow.breed,
          updatedCow.sex,
          ageMonths,
          latestMeasurement.weightKg
        );
        
        if (mlResult) {
          await prisma.weightMeasurement.update({
            where: { id: latestMeasurement.id },
            data: {
              status: mlResult.label,
              confidence: mlResult.confidence
            }
          });
        }
      } catch (err) {
        console.error('Failed to trigger ML classification after cow update:', err.message);
      }
    }
  }

  return updatedCow;
};

module.exports = { getCows, getCowById, getMeasurements, getGrowth, createCow, updateCow };
