const prisma = require('../lib/prisma');
const classificationService = require('./classificationService');

const ingestMeasurement = async (payload) => {
  const { device_id, cow_id, weight_kg, measured_at } = payload;

  const device = await prisma.device.findUnique({
    where: { deviceId: device_id }
  });

  if (!device) {
    const error = new Error('Device not found or not registered');
    error.code = 'UNAUTHORIZED';
    throw error;
  }
  // Triggering reload for Prisma client update

  const farmerId = device.farmerId;

  // Upsert cow (if it doesn't exist, create it as a placeholder)
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
      farmerId: farmerId
    }
  });

  // Calculate age if dateOfBirth is known
  let age_months = null;
  if (cow.dateOfBirth) {
    const diffTime = Math.abs(new Date().getTime() - new Date(cow.dateOfBirth).getTime());
    age_months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Approx months
  }

  // Classify health if we have all necessary data
  let classification = null;
  if (cow.breed && cow.sex && age_months !== null) {
    classification = await classificationService.classify(cow.breed, cow.sex, age_months, weight_kg);
  }

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
      ageMonthsAtMeasurement: age_months || 0, // Default to 0 if unknown
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
