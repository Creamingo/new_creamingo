/**
 * Creamingo support chatbot – intent + FAQ matching.
 * Reads config from DB (with cache); falls back to in-code defaults if DB is empty.
 * Logs every message to chatbot_sessions and chatbot_messages for analytics.
 */

const { query, get } = require('../config/db');
const { getIntents, getFaqs, setIntents, setFaqs, isStale } = require('../utils/chatbotConfigCache');

const CONTACT_NUMBER = '7570030333';
const CONTACT_LINE = ` You can call or WhatsApp us at **${CONTACT_NUMBER}** anytime.`;
const FALLBACK_REPLY = 'I can help with delivery, orders, payments, refunds, wallet, and account. Try "How do I track my order?" or "What are delivery charges?" You can also use **Track Order**, **Wallet**, or **Contact** from the app. Need to talk? Call or WhatsApp **7570030333** from the Help menu in the footer.';

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(query, target) {
  const q = normalize(query);
  const t = normalize(target);
  if (!q) return 0;
  const words = q.split(' ').filter(Boolean);
  let score = 0;
  for (const w of words) {
    if (w.length < 2) continue;
    if (t.includes(w)) score += 1;
  }
  return score;
}

/** If reply mentions contact support but not the number, append contact line */
function ensureContactNumber(reply) {
  if (!reply || typeof reply !== 'string') return reply;
  const lower = reply.toLowerCase();
  const hasContactMention = lower.includes('contact support') || lower.includes('contact our') || lower.includes('contact us');
  const hasNumber = reply.includes(CONTACT_NUMBER);
  if (hasContactMention && !hasNumber) return reply + CONTACT_LINE;
  return reply;
}

/** Load intents from DB and fill cache; return array in shape { id, keywords[], reply, link_text, link_href, quick_replies[] } */
async function loadIntentsFromDb() {
  try {
    const result = await query(
      'SELECT id, name, keywords, reply, link_text, link_href, quick_replies, sort_order FROM chatbot_intents WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    );
    const rows = (result.rows || []).map((r) => {
      let keywords = [];
      try { keywords = r.keywords ? JSON.parse(r.keywords) : []; } catch (_) {}
      let quick_replies = null;
      try { quick_replies = r.quick_replies ? JSON.parse(r.quick_replies) : null; } catch (_) {}
      const link = (r.link_text || r.link_href) ? { text: r.link_text, href: r.link_href } : null;
      return {
        id: r.id,
        keywords,
        reply: r.reply,
        link,
        quickReplies: Array.isArray(quick_replies) ? quick_replies : null
      };
    });
    setIntents(rows);
    return rows;
  } catch (err) {
    console.error('Load intents error:', err);
    return [];
  }
}

/** Load FAQs from DB and fill cache; return array in shape { id, q, a } */
async function loadFaqsFromDb() {
  try {
    const result = await query(
      'SELECT id, keywords, response, link_text, link_href FROM chatbot_faqs WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    );
    const rows = (result.rows || []).map((r) => ({
      id: r.id,
      q: r.keywords || '',
      a: r.response || '',
      link_text: r.link_text,
      link_href: r.link_href
    }));
    setFaqs(rows);
    return rows;
  } catch (err) {
    console.error('Load FAQs error:', err);
    return [];
  }
}

async function getIntentsForMatch() {
  let intents = getIntents();
  if (isStale() || !intents || intents.length === 0) {
    intents = await loadIntentsFromDb();
  }
  return intents || [];
}

async function getFaqsForMatch() {
  let faqs = getFaqs();
  if (isStale() || !faqs || faqs.length === 0) {
    faqs = await loadFaqsFromDb();
  }
  return faqs || [];
}

function findIntent(query, intents) {
  const q = normalize(query);
  for (const intent of intents) {
    const keywords = intent.keywords || [];
    for (const kw of keywords) {
      if (q.includes(String(kw).toLowerCase())) {
        return intent;
      }
    }
  }
  return null;
}

function findBestFAQ(query, faqs) {
  let best = null;
  let bestScore = 0;
  let bestId = null;
  let bestLink = null;
  for (const faq of faqs) {
    const s = scoreMatch(query, faq.q);
    if (s > bestScore) {
      bestScore = s;
      best = faq.a;
      bestId = faq.id;
      bestLink = (faq.link_text || faq.link_href) ? { text: faq.link_text || 'More in FAQ', href: faq.link_href || '/faq' } : { text: 'More in FAQ', href: '/faq' };
    }
  }
  return bestScore > 0 ? { answer: best, faq_id: bestId, link: bestLink } : null;
}

/** Ensure session exists; return session_id (UUID string) */
async function ensureSession(sessionId, customerId) {
  if (!sessionId) return null;
  try {
    const existing = await get('SELECT id FROM chatbot_sessions WHERE session_id = ?', [sessionId]);
    if (existing) return sessionId;
    await query(
      'INSERT INTO chatbot_sessions (session_id, customer_id, channel) VALUES (?, ?, ?)',
      [sessionId, customerId || null, 'web']
    );
    return sessionId;
  } catch (err) {
    console.error('Ensure session error:', err);
    return null;
  }
}

async function logMessage(sessionId, role, content, intentId, faqId, isFallback) {
  if (!sessionId) return;
  try {
    await query(
      'INSERT INTO chatbot_messages (session_id, role, content, intent_id, faq_id, is_fallback) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionId, role, content, intentId || null, faqId || null, isFallback ? 1 : 0]
    );
  } catch (err) {
    console.error('Log message error:', err);
  }
}

exports.chat = async (req, res) => {
  try {
    const message = (req.body?.message || '').trim();
    const sessionId = (req.body?.session_id || '').trim() || null;
    const customerId = req.customerId || (req.body?.customer_id) || null;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        reply: null
      });
    }

    const intents = await getIntentsForMatch();
    const faqs = await getFaqsForMatch();

    await ensureSession(sessionId, customerId);
    await logMessage(sessionId, 'user', message, null, null, false);

    let intent = findIntent(message, intents);
    if (intent) {
      const reply = ensureContactNumber(intent.reply);
      const link = intent.link || null;
      const quickReplies = intent.quickReplies || null;
      await logMessage(sessionId, 'bot', reply, intent.id, null, false);
      const payload = { success: true, reply, link };
      if (quickReplies && quickReplies.length) payload.quickReplies = quickReplies;
      return res.json(payload);
    }

    const faqResult = findBestFAQ(message, faqs);
    if (faqResult) {
      const reply = ensureContactNumber(faqResult.answer);
      await logMessage(sessionId, 'bot', reply, null, faqResult.faq_id, false);
      return res.json({
        success: true,
        reply,
        link: faqResult.link || { text: 'More in FAQ', href: '/faq' }
      });
    }

    await logMessage(sessionId, 'bot', FALLBACK_REPLY, null, null, true);
    return res.json({
      success: true,
      reply: FALLBACK_REPLY,
      link: { text: 'FAQ', href: '/faq' }
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      reply: 'Please try again in a moment or call us at 7570030333.'
    });
  }
};
