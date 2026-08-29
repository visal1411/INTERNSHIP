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
module.exports = { listCows, getCow, listMeasurements, getGrowth };
