const prisma = require('../lib/prisma');
const classificationService = require('./classificationService');

const ingestMeasurement = async (payload) => {
  const { device_id, cow_id, breed, sex, age_months, weight_kg, measured_at } = payload;

  const device = await prisma.device.findUnique({
    where: { deviceId: device_id }
  });

  if (!device) {
    const error = new Error('Device not found or not registered');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  const farmerId = device.farmerId;
  const dateOfBirth = new Date();
  dateOfBirth.setMonth(dateOfBirth.getMonth() - age_months);

  const cow = await prisma.cow.upsert({
    where: {
      farmerId_cowId: {
        farmerId: farmerId,
        cowId: cow_id
      }
    },
    update: {}, 
    create: {
      cowId: cow_id,
      farmerId: farmerId,
      breed: breed,
      sex: sex,
      dateOfBirth: dateOfBirth
    }
  });

  const classification = await classificationService.classify(breed, sex, age_months, weight_kg);

  let measureTime = new Date();
  if (measured_at) {
    const parsedTime = new Date(measured_at);
    const fiveMinsFromNow = new Date(Date.now() + 5 * 60000);
    if (parsedTime > fiveMinsFromNow) {
       const error = new Error('measured_at cannot be safely in the future');
       error.code = 'VALIDATION_ERROR';
       throw error;
    }
    measureTime = parsedTime;
  }

  const measurement = await prisma.weightMeasurement.create({
    data: {
      cowId: cow.id,
      deviceId: device_id,
      weightKg: weight_kg,
      ageMonthsAtMeasurement: age_months,
      status: classification ? classification.label : null,
      confidence: classification ? classification.confidence : null,
      measuredAt: measureTime,
      receivedAt: new Date()
    }
  });

  return {
    measurement_id: measurement.id,
    cow_id: cow.cowId,
    classification: classification
  };
};

module.exports = { ingestMeasurement };
