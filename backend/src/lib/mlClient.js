const logger = require('./logger');

const sanitizeMlUrl = (rawUrl) => {
  if (!rawUrl || !rawUrl.trim()) return '';
  let url = rawUrl.trim().replace(/\/$/, '').replace(/\/predict$/i, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  } else if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace('http://', 'https://');
  }
  return url;
};

const predictWeightStatus = async (breed, gender, age_months, weight_kg) => {
  const rawUrl = process.env.ML_SERVICE_URL;
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error('ML_SERVICE_URL is not set in environment');
  }

  const url = sanitizeMlUrl(rawUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      const errorText = await response.text().catch(() => '');
      throw new Error(`ML API responded with ${response.status} ${response.statusText}: ${errorText}`);
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
  } catch (err) {
    logger.error({ err: err.message, targetEndpoint: `${url}/predict` }, '❌ ML prediction request failed');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = { predictWeightStatus, sanitizeMlUrl };

