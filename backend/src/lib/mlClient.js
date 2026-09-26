const logger = require('./logger');

const predictWeightStatus = async (breed, gender, age_months, weight_kg) => {
  const rawUrl = process.env.ML_SERVICE_URL;
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error('ML_SERVICE_URL is not set in environment');
  }

  const url = rawUrl.trim().replace(/\/$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const targetEndpoint = `${url}/predict`;
    logger.info({ targetEndpoint, breed, gender, age_months, weight_kg }, '🚀 Sending POST request to ML Server...');

    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, age_months, gender, weight_kg }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ML API responded with ${response.status}`);
    }

    const data = await response.json();
    return {
      label: data.label,
      confidence: data.confidence,
      isAnomaly: data.is_anomaly,
      anomalyScore: data.anomaly_score,
      flag: data.flag,
      topAnomalyDriver: data.top_anomaly_driver
    };
  } finally {
    clearTimeout(timeoutId);
  }
};


module.exports = { predictWeightStatus };
