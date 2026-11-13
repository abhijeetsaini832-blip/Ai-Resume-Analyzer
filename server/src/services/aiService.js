/**
 * AI layer — Google Gemini only (free tier available, plain REST, no SDK needed).
 * Two functions are exposed to the rest of the app:
 *   - generateJSON(): structured output that always matches a JSON schema (responseSchema)
 *   - chatText():     plain conversational completion ("Chat with your resume")
 */
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config/env');
const { AppError } = require('../utils/AppError');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Gemini                                                               */
/* ------------------------------------------------------------------ */
const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/** Keep only the JSON-schema keywords Gemini's responseSchema supports; uppercase the types. */
function toGeminiSchema(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  if (node.type) out.type = String(node.type).toUpperCase();
  if (node.description) out.description = node.description;
  if (node.enum) out.enum = node.enum;
  if (node.required) out.required = node.required;
  if (node.items) out.items = toGeminiSchema(node.items);
  if (node.properties) {
    out.properties = Object.fromEntries(Object.entries(node.properties).map(([k, v]) => [k, toGeminiSchema(v)]));
  }
  return out;
}

async function geminiRequest(body) {
  // Free tier is rate limited: retry 429/503 with backoff before giving up.
  for (let attempt = 0; attempt < 3; attempt++) {
    let res;
    try {
      res = await fetch(GEMINI_URL(GEMINI_MODEL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
    } catch (err) {
      throw new AppError(`Could not reach Gemini: ${err.message}`, 502);
    }

    if (res.ok) return res.json();

    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      await sleep(4000 * (attempt + 1));
      continue;
    }
    const detail = await res.json().catch(() => ({}));
    const msg = detail?.error?.message || res.statusText;
    if (res.status === 429) throw new AppError('Gemini free-tier rate limit reached. Wait a minute and retry.', 429);
    if (res.status === 400 && /API key/i.test(msg)) throw new AppError('Gemini API key is invalid.', 500);
    if (res.status === 404) throw new AppError(`Gemini model "${GEMINI_MODEL}" not found. Set GEMINI_MODEL in .env.`, 500);
    throw new AppError(`Gemini request failed: ${msg}`, 502);
  }
}

function geminiText(data) {
  const cand = data.candidates?.[0];
  if (!cand) {
    const reason = data.promptFeedback?.blockReason;
    throw new AppError(reason ? `Request blocked by Gemini (${reason}).` : 'Gemini returned no response.', 502);
  }
  if (cand.finishReason === 'MAX_TOKENS') throw new AppError('AI response was cut off. Try a shorter resume or job description.', 502);
  return (cand.content?.parts || []).map((p) => p.text || '').join('').trim();
}

async function geminiGenerateJSON({ system, user, schema, maxTokens }) {
  const data = await geminiRequest({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: toGeminiSchema(schema),
      maxOutputTokens: maxTokens,
      temperature: 0.2,
    },
  });
  const text = geminiText(data);
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError('AI returned malformed JSON. Please retry.', 502);
  }
}

async function geminiChat({ system, messages, maxTokens }) {
  const systemText = system.map((b) => b.text).join('\n\n');
  const data = await geminiRequest({
    systemInstruction: { parts: [{ text: systemText }] },
    contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  });
  return geminiText(data);
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

/**
 * @param {object} p
 * @param {string} p.system  System prompt
 * @param {string} p.user    User prompt
 * @param {object} p.schema  JSON schema for the output
 * @param {number} [p.maxTokens]
 * @returns {Promise<object>} parsed structured output
 */
function generateJSON({ maxTokens = 6000, ...rest }) {
  return geminiGenerateJSON({ ...rest, maxTokens });
}

/**
 * @param {Array} system   Array of system text blocks
 * @param {Array} messages [{role:'user'|'assistant', content:string}] — must start with 'user'
 */
function chatText({ system, messages, maxTokens = 1000 }) {
  return geminiChat({ system, messages, maxTokens });
}

module.exports = { generateJSON, chatText };
