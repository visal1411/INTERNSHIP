const predictWeightStatus = async (breed, age_months, weight_kg) => {
  const url = process.env.ML_SERVICE_URL;
  if (!url) {
    throw new Error('ML_SERVICE_URL is not set');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${url}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breed, age_months, weight_kg }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ML API responded with ${response.status}`);
    }

    const data = await response.json();
    return {
      label: data.label,
      confidence: data.confidence
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = { predictWeightStatus };
