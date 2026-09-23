const deviceService = require('../services/deviceService');

const listDevices = async (req, res, next) => {
  try {
    const devices = await deviceService.getDevices(req.farmerId);
    res.json(devices);
  } catch (err) {
    next(err);
  }
};

const registerDevice = async (req, res, next) => {
  try {
    const { deviceId, name } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'deviceId is required' } });
    }
    const device = await deviceService.registerDevice(req.farmerId, { deviceId, name });
    res.status(201).json(device);
  } catch (err) {
    if (err.code === 'CONFLICT') {
      return res.status(409).json({ error: { code: err.code, message: err.message } });
    }
    next(err);
  }
};

const removeDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deviceService.deleteDevice(req.farmerId, id);
    res.json({ message: 'Device removed successfully' });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: { code: err.code, message: err.message } });
    }
    next(err);
  }
};

module.exports = {
  listDevices,
  registerDevice,
  removeDevice
};
