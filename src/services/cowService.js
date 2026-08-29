const prisma = require('../lib/prisma');

const getCows = async (farmerId) => {
  return prisma.cow.findMany({
    where: { farmerId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, cowId: true, breed: true, sex: true, dateOfBirth: true, createdAt: true }
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

module.exports = { getCows, getCowById, getMeasurements, getGrowth };
