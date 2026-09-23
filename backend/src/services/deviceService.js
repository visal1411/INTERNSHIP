const prisma = require('../lib/prisma');

const getDevices = async (farmerId) => {
  const devices = await prisma.device.findMany({
    where: { farmerId },
    orderBy: { createdAt: 'desc' }
  });

  const ONLINE_THRESHOLD_MS = 90 * 1000; // 90 seconds threshold
  const now = Date.now();

  return devices.map(device => {
    const lastSeenMs = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0;
    const isOnline = (now - lastSeenMs) < ONLINE_THRESHOLD_MS;

    return {
      id: device.deviceId,
      dbId: device.id,
      name: device.name || 'Smart Scale',
      status: isOnline ? 'online' : 'offline',
      battery: device.battery !== null && device.battery !== undefined ? device.battery : 100,
      lastSync: device.lastSeenAt,
      createdAt: device.createdAt
    };
  });
};

const registerDevice = async (farmerId, { deviceId, name }) => {
  const existing = await prisma.device.findUnique({
    where: { deviceId }
  });

  if (existing) {
    // Re-assign/bind device to current logged-in farmer
    const updated = await prisma.device.update({
      where: { id: existing.id },
      data: {
        farmerId,
        name: name || existing.name
      }
    });
    return updated;
  }

  const device = await prisma.device.create({
    data: {
      deviceId,
      name: name || 'Smart Scale',
      farmerId,
      status: 'online',
      lastSeenAt: new Date()
    }
  });

  return device;
};

const deleteDevice = async (farmerId, deviceId) => {
  const device = await prisma.device.findFirst({
    where: {
      farmerId,
      OR: [
        { deviceId: deviceId },
        { id: isNaN(Number(deviceId)) ? -1 : Number(deviceId) }
      ]
    }
  });

  if (!device) {
    const error = new Error('Device not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  await prisma.device.delete({
    where: { id: device.id }
  });

  return { success: true };
};

module.exports = {
  getDevices,
  registerDevice,
  deleteDevice
};
