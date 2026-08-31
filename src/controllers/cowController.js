const cowService = require('../services/cowService');

const listCows = async (req, res, next) => {
  try {
    const cows = await cowService.getCows(req.farmerId);
    res.json(cows);
  } catch (err) { next(err); }
};
const getCow = async (req, res, next) => {
  try {
    const cow = await cowService.getCowById(req.farmerId, req.params.id);
    res.json(cow);
  } catch (err) { 
    if (err.message === 'Cow not found') return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message }});
    next(err); 
  }
};
const listMeasurements = async (req, res, next) => {
  try {
    const data = await cowService.getMeasurements(req.farmerId, req.params.id);
    res.json(data);
  } catch (err) { next(err); }
};
const getGrowth = async (req, res, next) => {
  try {
    const data = await cowService.getGrowth(req.farmerId, req.params.id);
    res.json(data);
  } catch (err) { next(err); }
};
const { createCowSchema, updateCowSchema } = require('../schemas/cow.schema');

const createCow = async (req, res, next) => {
  try {
    const validatedData = createCowSchema.parse(req.body);
    const cow = await cowService.createCow(req.farmerId, validatedData);
    res.status(201).json(cow);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors } });
    }
    if (err.message === 'Cow with this Tag ID already exists') {
      return res.status(409).json({ error: { code: 'CONFLICT', message: err.message } });
    }
    next(err);
  }
};

const updateCow = async (req, res, next) => {
  try {
    const validatedData = updateCowSchema.parse(req.body);
    const cow = await cowService.updateCow(req.farmerId, req.params.id, validatedData);
    res.json(cow);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.errors } });
    }
    if (err.message === 'Cow not found') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
    }
    next(err);
  }
};

module.exports = { listCows, getCow, listMeasurements, getGrowth, createCow, updateCow };
