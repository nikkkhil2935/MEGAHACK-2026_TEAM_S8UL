const Groq = require('groq-sdk');
const MODEL = 'llama-3.3-70b-versatile';
const WHISPER = 'whisper-large-v3';

// ── Multi-key rotation ──
const keys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

if (!keys.length) {
  console.error('[Groq] No API keys found. Set GROQ_API_KEYS or GROQ_API_KEY in .env');
}

const clients = keys.map(k => new Groq({ apiKey: k }));
const cooldowns = new Array(keys.length).fill(0); // timestamp when key becomes available
let nextIndex = 0;

function getClient() {
  const now = Date.now();
  const total = clients.length;

  // Try to find an available (non-cooled-down) key starting from nextIndex
  for (let i = 0; i < total; i++) {
    const idx = (nextIndex + i) % total;
    if (cooldowns[idx] <= now) {
      nextIndex = (idx + 1) % total;
      return { client: clients[idx], keyIndex: idx };
    }
  }

  // All keys on cooldown — pick the one that recovers soonest
  let bestIdx = 0;
  for (let i = 1; i < total; i++) {
    if (cooldowns[i] < cooldowns[bestIdx]) bestIdx = i;
  }
  nextIndex = (bestIdx + 1) % total;
  return { client: clients[bestIdx], keyIndex: bestIdx };
}

function markRateLimited(keyIndex, delaySec) {
  cooldowns[keyIndex] = Date.now() + delaySec * 1000;
  console.warn(`[Groq] Key #${keyIndex + 1}/${keys.length} rate limited for ${delaySec}s`);
}

// Groq initialized with key rotation

// ── Core functions ──

async function groqJSON(systemPrompt, userContent, retries = 0) {
  const { client, keyIndex } = getClient();
  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt + '\n\nReturn ONLY valid JSON. No markdown. No explanation. Start with { or [.'
        },
        { role: 'user', content: userContent }
      ]
    });

    const text = res.choices[0].message.content
      .replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    try {
      return JSON.parse(text);
    } catch {
      if (retries < 1) {
        return groqJSON(
          systemPrompt,
          userContent + '\n\n[IMPORTANT: Your previous response was invalid JSON. Return ONLY the JSON object, nothing else.]',
          1
        );
      }
      throw new Error('Groq JSON parse failed: ' + text.slice(0, 200));
    }
  } catch (err) {
    if (isInvalidKeyError(err)) {
      console.error(`[Groq] Invalid API key (key #${keyIndex + 1})`);
      const error = new Error('AI service unavailable — invalid API key. Please contact support.');
      error.code = 'GROQ_INVALID_KEY';
      throw error;
    }
    if (err?.status === 429) {
      const delaySec = parseRetryDelay(err) || 60;
      markRateLimited(keyIndex, delaySec);

      // If there are other keys available, retry immediately with a different key
      if (clients.length > 1 && retries < clients.length) {
        // Switching to next key
        return groqJSON(systemPrompt, userContent, retries + 1);
      }

      const error = new Error(`Rate limit reached. Try again in ${delaySec} seconds.`);
      error.code = 'RATE_LIMITED';
      error.retryAfterSec = delaySec;
      throw error;
    }
    throw err;
  }
}

async function groqChat(messages, system = '', temp = 0.7, maxTokens = 2048) {
  const { client, keyIndex } = getClient();
  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  try {
    const res = await client.chat.completions.create({
      model: MODEL, temperature: temp, max_tokens: maxTokens,
      messages: allMessages
    });
    return res.choices[0].message.content.trim();
  } catch (err) {
    if (isInvalidKeyError(err)) {
      console.error(`[Groq] Invalid API key (key #${keyIndex + 1})`);
      const error = new Error('AI service unavailable — invalid API key. Please contact support.');
      error.code = 'GROQ_INVALID_KEY';
      throw error;
    }
    if (err?.status === 429) {
      const delaySec = parseRetryDelay(err) || 60;
      markRateLimited(keyIndex, delaySec);

      if (clients.length > 1) {
        const { client: next } = getClient();
        const res = await next.chat.completions.create({
          model: MODEL, temperature: temp, max_tokens: maxTokens,
          messages: allMessages
        });
        return res.choices[0].message.content.trim();
      }
    }
    throw err;
  }
}

async function transcribeAudio(audioBuffer, language = 'en') {
  const { client, keyIndex } = getClient();
  try {
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    const res = await client.audio.transcriptions.create({
      file,
      model: WHISPER,
      language,
      response_format: 'json'
    });
    return res.text;
  } catch (err) {
    if (isInvalidKeyError(err)) {
      console.error(`[Groq] Invalid API key for transcription (key #${keyIndex + 1})`);
      const error = new Error('AI service unavailable — invalid API key. Please contact support.');
      error.code = 'GROQ_INVALID_KEY';
      throw error;
    }
    throw err;
  }
}

// ── Helpers ──

function isInvalidKeyError(err) {
  // Don't match our own re-thrown GROQ_INVALID_KEY errors
  if (err?.code === 'GROQ_INVALID_KEY') return false;
  const status = err?.status || err?.response?.status;
  const code = err?.error?.error?.code || err?.error?.code || '';
  const msg = err?.error?.error?.message || err?.error?.message || err?.message || '';
  return (
    (status === 401 && code === 'invalid_api_key') ||
    code === 'invalid_api_key' ||
    msg.toLowerCase().includes('invalid api key')
  );
}

function parseRetryDelay(err) {
  const msg = err?.error?.message || err?.message || '';
  const match = msg.match(/try again in (\d+)m?([\d.]+)?s/i);
  if (match) {
    const mins = match[1] && msg.includes('m') ? parseInt(match[1]) : 0;
    const secs = parseFloat(match[2] || match[1]) || 0;
    return Math.ceil(mins * 60 + secs);
  }
  return null;
}

module.exports = { groqJSON, groqChat, transcribeAudio };
