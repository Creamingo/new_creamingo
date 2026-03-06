const { query } = require('../config/db');
const { invalidate } = require('../utils/chatbotConfigCache');

// ---------- Intents ----------
const listIntents = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, keywords, reply, link_text, link_href, quick_replies, sort_order, is_active, created_at, updated_at FROM chatbot_intents ORDER BY sort_order ASC, id ASC'
    );
    const rows = (result.rows || []).map((r) => ({
      ...r,
      keywords: typeof r.keywords === 'string' ? (r.keywords ? JSON.parse(r.keywords) : []) : r.keywords,
      quick_replies: typeof r.quick_replies === 'string' ? (r.quick_replies ? JSON.parse(r.quick_replies) : null) : r.quick_replies
    }));
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List intents error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list intents' });
  }
};

const createIntent = async (req, res) => {
  try {
    const { name, keywords, reply, link_text, link_href, quick_replies, sort_order, is_active } = req.body;
    const keywordsJson = Array.isArray(keywords) ? JSON.stringify(keywords) : (keywords || '[]');
    const quickRepliesJson = Array.isArray(quick_replies) ? JSON.stringify(quick_replies) : (quick_replies ? JSON.stringify(quick_replies) : null);
    const result = await query(
      `INSERT INTO chatbot_intents (name, keywords, reply, link_text, link_href, quick_replies, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name || 'Intent', keywordsJson, reply || '', link_text || null, link_href || null, quickRepliesJson, sort_order != null ? sort_order : 0, is_active !== false ? 1 : 0]
    );
    invalidate();
    return res.status(201).json({ success: true, data: { id: result.lastID, name, reply: (reply || '').substring(0, 100) } });
  } catch (err) {
    console.error('Create intent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create intent' });
  }
};

const updateIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, keywords, reply, link_text, link_href, quick_replies, sort_order, is_active } = req.body;
    const keywordsJson = keywords != null ? (Array.isArray(keywords) ? JSON.stringify(keywords) : keywords) : undefined;
    const quickRepliesJson = quick_replies != null ? (Array.isArray(quick_replies) ? JSON.stringify(quick_replies) : quick_replies) : undefined;
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (keywordsJson !== undefined) { updates.push('keywords = ?'); values.push(keywordsJson); }
    if (reply !== undefined) { updates.push('reply = ?'); values.push(reply); }
    if (link_text !== undefined) { updates.push('link_text = ?'); values.push(link_text); }
    if (link_href !== undefined) { updates.push('link_href = ?'); values.push(link_href); }
    if (quickRepliesJson !== undefined) { updates.push('quick_replies = ?'); values.push(quickRepliesJson); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(id);
    await query(`UPDATE chatbot_intents SET ${updates.join(', ')} WHERE id = ?`, values);
    invalidate();
    return res.json({ success: true, message: 'Intent updated' });
  } catch (err) {
    console.error('Update intent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update intent' });
  }
};

const deleteIntent = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM chatbot_intents WHERE id = ?', [id]);
    invalidate();
    return res.json({ success: true, message: 'Intent deleted' });
  } catch (err) {
    console.error('Delete intent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete intent' });
  }
};

// ---------- FAQs ----------
const listFaqs = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, keywords, response, link_text, link_href, sort_order, is_active, created_at, updated_at FROM chatbot_faqs ORDER BY sort_order ASC, id ASC'
    );
    return res.json({ success: true, data: result.rows || [] });
  } catch (err) {
    console.error('List FAQs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list FAQs' });
  }
};

const createFaq = async (req, res) => {
  try {
    const { keywords, response, link_text, link_href, sort_order, is_active } = req.body;
    const result = await query(
      `INSERT INTO chatbot_faqs (keywords, response, link_text, link_href, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [keywords || '', response || '', link_text || null, link_href || null, sort_order != null ? sort_order : 0, is_active !== false ? 1 : 0]
    );
    invalidate();
    return res.status(201).json({ success: true, data: { id: result.lastID, keywords: (keywords || '').substring(0, 50) } });
  } catch (err) {
    console.error('Create FAQ error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create FAQ' });
  }
};

const updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { keywords, response, link_text, link_href, sort_order, is_active } = req.body;
    const updates = [];
    const values = [];
    if (keywords !== undefined) { updates.push('keywords = ?'); values.push(keywords); }
    if (response !== undefined) { updates.push('response = ?'); values.push(response); }
    if (link_text !== undefined) { updates.push('link_text = ?'); values.push(link_text); }
    if (link_href !== undefined) { updates.push('link_href = ?'); values.push(link_href); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });
    values.push(id);
    await query(`UPDATE chatbot_faqs SET ${updates.join(', ')} WHERE id = ?`, values);
    invalidate();
    return res.json({ success: true, message: 'FAQ updated' });
  } catch (err) {
    console.error('Update FAQ error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update FAQ' });
  }
};

const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM chatbot_faqs WHERE id = ?', [id]);
    invalidate();
    return res.json({ success: true, message: 'FAQ deleted' });
  } catch (err) {
    console.error('Delete FAQ error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete FAQ' });
  }
};

module.exports = {
  listIntents,
  createIntent,
  updateIntent,
  deleteIntent,
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq
};
