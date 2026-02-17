/**
 * In-memory cache for chatbot intents and FAQs so we don't hit DB on every message.
 * Invalidated when admin updates config.
 */
let intentsCache = null;
let faqsCache = null;
let cacheTime = 0;
const TTL_MS = 60 * 1000; // 1 minute

function isStale() {
  return !intentsCache || Date.now() - cacheTime > TTL_MS;
}

function setIntents(data) {
  intentsCache = data;
  cacheTime = Date.now();
}

function setFaqs(data) {
  faqsCache = data;
  cacheTime = Date.now();
}

function getIntents() {
  return intentsCache;
}

function getFaqs() {
  return faqsCache;
}

function invalidate() {
  intentsCache = null;
  faqsCache = null;
  cacheTime = 0;
}

module.exports = {
  isStale,
  setIntents,
  setFaqs,
  getIntents,
  getFaqs,
  invalidate
};
