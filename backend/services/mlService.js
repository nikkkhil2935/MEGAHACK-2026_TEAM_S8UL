const { spawn } = require('child_process');
const path = require('path');

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const TIMEOUT_MS = 15000;
const ML_SERVICE_DIR = path.join(__dirname, '..', '..', 'ml-service');
const IS_PRODUCTION = !!process.env.ML_SERVICE_URL;

let mlProcess = null;
let mlStarting = false;
let mlReady = IS_PRODUCTION; // assume remote service is ready in production

function startMLService() {
  if (IS_PRODUCTION || mlProcess || mlStarting) return;
  mlStarting = true;

  // Starting Python ML service

  const py = process.platform === 'win32' ? 'python' : 'python3';
  mlProcess = spawn(py, ['app.py'], {
    cwd: ML_SERVICE_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  mlProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg.includes('Application startup complete') || msg.includes('Uvicorn running')) {
      mlReady = true;
      mlStarting = false;
    }
  });

  mlProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes('UserWarning')) {
      console.warn(`[ML] ${msg}`);
    }
  });

  mlProcess.on('error', (err) => {
    console.warn('[ML] Failed to start Python ML service:', err.message);
    mlProcess = null;
    mlStarting = false;
    mlReady = false;
  });

  mlProcess.on('exit', (code) => {
    console.warn(`[ML] Python ML service exited with code ${code}`);
    mlProcess = null;
    mlStarting = false;
    mlReady = false;
  });
}

async function waitForMLService(maxWaitMs = 10000) {
  if (mlReady) return true;
  startMLService();

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (mlReady) return true;
    try {
      const res = await fetch(`${ML_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        mlReady = true;
        return true;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function callMLService(endpoint, body) {
  // Ensure ML service is running
  const ready = await waitForMLService();
  if (!ready) {
    console.warn(`[ML] Service not ready, using JS fallback for ${endpoint}`);
    return jsFallback(endpoint, body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ML_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`[ML] ${endpoint} returned ${res.status}:`, err.detail || '');
      return jsFallback(endpoint, body);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[ML] ${endpoint} unavailable, using fallback:`, err.message);
    return jsFallback(endpoint, body);
  }
}

// Simple JS-based fallback scorers when Python ML service is unavailable
function jsFallback(endpoint, body) {
  if (endpoint === '/predict/resume') {
    const { skills_count = 0, projects_count = 0, education_level = 0, keywords_count = 0 } = body;
    const score = Math.min(100, Math.round(
      skills_count * 3.5 + projects_count * 8 + education_level * 12 + keywords_count * 2.5 + 10
    ));
    return {
      resumeQualityScore: Math.max(5, Math.min(100, score)),
      features_used: body,
    };
  }
  if (endpoint === '/predict/github') {
    const { stars = 0, forks = 0, commits = 0, issues = 0, readme_length = 0 } = body;
    const score = Math.min(100, Math.round(
      Math.log2(stars + 1) * 8 + Math.log2(forks + 1) * 6 + Math.min(commits, 200) * 0.15 +
      Math.log2(issues + 1) * 3 + Math.min(readme_length, 5000) * 0.005 + 15
    ));
    return {
      projectQualityScore: Math.max(5, Math.min(100, score)),
      features_used: body,
    };
  }
  if (endpoint === '/predict/salary') {
    const baseSalaries = { EN: 45000, MI: 75000, SE: 110000, EX: 160000 };
    const sizeMultiplier = { S: 0.85, M: 1.0, L: 1.15 };
    const base = baseSalaries[body.experience_level] || 70000;
    const multiplier = sizeMultiplier[body.company_size] || 1.0;
    return {
      predictedSalaryUSD: Math.round(base * multiplier),
      features_used: body,
    };
  }
  return null;
}

// Auto-start on import (local dev only)
if (!IS_PRODUCTION) {
  startMLService();
}

// Cleanup on process exit
process.on('exit', () => {
  if (mlProcess) {
    mlProcess.kill();
  }
});

module.exports = { callMLService };
