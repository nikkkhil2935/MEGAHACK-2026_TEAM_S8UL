const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const TIMEOUT_MS = 5000;

async function callMLService(endpoint, body) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(`${ML_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`ML service ${endpoint} returned ${res.status}:`, err.detail || '');
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(`ML service ${endpoint} unavailable:`, err.message);
    return null;
  }
}

module.exports = { callMLService };
