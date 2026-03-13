const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';
const WHISPER = 'whisper-large-v3';

async function groqJSON(systemPrompt, userContent, retries = 0) {
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.1,
    max_tokens: 4096,
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
}

async function groqChat(messages, system = '', temp = 0.7, maxTokens = 2048) {
  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  const res = await groq.chat.completions.create({
    model: MODEL, temperature: temp, max_tokens: maxTokens,
    messages: allMessages
  });
  return res.choices[0].message.content.trim();
}

async function transcribeAudio(audioBuffer, language = 'en') {
  const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
  const res = await groq.audio.transcriptions.create({
    file,
    model: WHISPER,
    language,
    response_format: 'json'
  });
  return res.text;
}

module.exports = { groqJSON, groqChat, transcribeAudio };
