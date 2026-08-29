const dashboardService = require('../services/dashboardService');

const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary(req.farmerId);
    res.json(summary);
  } catch (err) { next(err); }
};

const getTrends = async (req, res, next) => {
  try {
    const trends = await dashboardService.getTrends(req.farmerId);
    res.json(trends);
  } catch (err) { next(err); }
};

module.exports = { getSummary, getTrends };
