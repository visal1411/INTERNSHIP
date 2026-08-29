const prisma = require('../lib/prisma');
const { getPastDate } = require('../utils/dateHelpers');

const getSummary = async (farmerId) => {
  const totalCows = await prisma.cow.count({ where: { farmerId } });
  
  const latestMeasurements = await prisma.weightMeasurement.findMany({
    where: { cow: { farmerId } },
    orderBy: { measuredAt: 'desc' },
    take: 10,
    include: { cow: { select: { cowId: true } } }
  });
  
  return { totalCows, recentActivity: latestMeasurements };
};

const getTrends = async (farmerId) => {
  const startDate = getPastDate(30);
  const data = await prisma.weightMeasurement.findMany({
    where: { cow: { farmerId }, measuredAt: { gte: startDate } },
    orderBy: { measuredAt: 'asc' },
    select: { weightKg: true, measuredAt: true }
  });
  
  const grouped = {};
  data.forEach(m => {
    const dateStr = m.measuredAt.toISOString().split('T')[0];
    if (!grouped[dateStr]) grouped[dateStr] = { sum: 0, count: 0 };
    grouped[dateStr].sum += m.weightKg;
    grouped[dateStr].count += 1;
  });

  const points = Object.keys(grouped).map(dateStr => ({
    date: dateStr,
    average_weight_kg: Number((grouped[dateStr].sum / grouped[dateStr].count).toFixed(2))
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  return { points };
};

module.exports = { getSummary, getTrends };
