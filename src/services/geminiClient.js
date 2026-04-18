const { GoogleGenerativeAI, GoogleAICacheManager } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL   = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const CACHE_TTL = parseInt(process.env.GEMINI_CACHE_TTL_SECONDS, 10) || 3600;

if (!API_KEY) {
  console.warn('[SmartPay] GEMINI_API_KEY not set — AI features will fail until configured.');
}

const genAI = new GoogleGenerativeAI(API_KEY || 'missing');

// Cache manager is optional: some SDK bundles omit it. Fail soft.
let cacheManager = null;
try {
  if (GoogleAICacheManager && API_KEY) {
    cacheManager = new GoogleAICacheManager(API_KEY);
  }
} catch {
  cacheManager = null;
}

module.exports = { genAI, cacheManager, MODEL, CACHE_TTL };
