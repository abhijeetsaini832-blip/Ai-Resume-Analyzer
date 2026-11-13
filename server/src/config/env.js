/**
 * Central, validated environment configuration.
 * Fails fast at boot if a required variable is missing.
 */
require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Gemini (get a free key at https://aistudio.google.com/apikey)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  MAX_FILE_MB: Number(process.env.MAX_FILE_MB) || 5,
  MAX_BATCH_FILES: Number(process.env.MAX_BATCH_FILES) || 20,
  // Keep this at 1-2 on Gemini's free tier (per-minute rate limits)
  BATCH_CONCURRENCY: Number(process.env.BATCH_CONCURRENCY) || 2,
  RETENTION_DAYS: Number(process.env.RETENTION_DAYS ?? 30),
};
