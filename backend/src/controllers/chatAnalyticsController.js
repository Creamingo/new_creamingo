const { query, get } = require('../config/db');

/** GET /api/chat/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD */
async function getSummary(req, res) {
  try {
    const from = req.query.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = req.query.to || new Date().toISOString().slice(0, 10);

    const sessionsCount = await get(
      'SELECT COUNT(*) AS total FROM chatbot_sessions WHERE DATE(started_at) BETWEEN ? AND ?',
      [from, to]
    );
    const messagesCount = await get(
      'SELECT COUNT(*) AS total FROM chatbot_messages m JOIN chatbot_sessions s ON s.session_id = m.session_id WHERE DATE(m.created_at) BETWEEN ? AND ?',
      [from, to]
    );
    const fallbackCount = await get(
      'SELECT COUNT(*) AS total FROM chatbot_messages WHERE role = ? AND is_fallback = 1 AND DATE(created_at) BETWEEN ? AND ?',
      ['bot', from, to]
    );
    const botMessagesCount = await get(
      'SELECT COUNT(*) AS total FROM chatbot_messages WHERE role = ? AND DATE(created_at) BETWEEN ? AND ?',
      ['bot', from, to]
    );
    const totalSessions = (sessionsCount && sessionsCount.total) || 0;
    const totalMessages = (messagesCount && messagesCount.total) || 0;
    const fallbackTotal = (fallbackCount && fallbackCount.total) || 0;
    const botTotal = (botMessagesCount && botMessagesCount.total) || 1;
    const fallbackRate = botTotal ? Math.round((fallbackTotal / botTotal) * 100) : 0;

    const messagesByDay = await query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count
       FROM chatbot_messages
       WHERE DATE(created_at) BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [from, to]
    );
    const topIntents = await query(
      `SELECT intent_id, COUNT(*) AS count
       FROM chatbot_messages
       WHERE role = 'bot' AND intent_id IS NOT NULL AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY intent_id
       ORDER BY count DESC
       LIMIT 10`,
      [from, to]
    );
    const topUnmatched = await query(
      `SELECT content, COUNT(*) AS count
       FROM chatbot_messages
       WHERE role = 'user' AND session_id IN (
         SELECT session_id FROM chatbot_messages WHERE role = 'bot' AND is_fallback = 1 AND DATE(created_at) BETWEEN ? AND ?
       )
       AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY content
       ORDER BY count DESC
       LIMIT 15`,
      [from, to, from, to]
    );

    res.json({
      success: true,
      data: {
        from,
        to,
        totalConversations: totalSessions,
        totalMessages: totalMessages,
        fallbackRate,
        messagesByDay: (messagesByDay.rows || []).map((r) => ({ day: r.day, count: r.count })),
        topIntents: (topIntents.rows || []).map((r) => ({ intent_id: r.intent_id, count: r.count })),
        topUnmatched: (topUnmatched.rows || []).map((r) => ({ query: r.content, count: r.count }))
      }
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ success: false, message: 'Failed to get analytics summary' });
  }
}

/** GET /api/chat/analytics/sessions?from=&to=&page=1&limit=20 */
async function getSessions(req, res) {
  try {
    const from = req.query.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = req.query.to || new Date().toISOString().slice(0, 10);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const offset = Math.max(0, (page - 1) * limit);

    const countResult = await get(
      'SELECT COUNT(*) AS total FROM chatbot_sessions WHERE DATE(started_at) BETWEEN ? AND ?',
      [from, to]
    );
    const total = Number(countResult?.total ?? 0);

    // Use integer literals for LIMIT/OFFSET (MySQL prepared statements can reject ? for LIMIT/OFFSET)
    const limitInt = parseInt(limit, 10);
    const offsetInt = parseInt(offset, 10);
    const safeLimit = Math.min(50, Math.max(0, isNaN(limitInt) ? 20 : limitInt));
    const safeOffset = Math.max(0, isNaN(offsetInt) ? 0 : offsetInt);

    const sessions = await query(
      `SELECT s.id, s.session_id, s.customer_id, s.started_at, s.ended_at,
              (SELECT COUNT(*) FROM chatbot_messages m WHERE m.session_id = s.session_id) AS message_count,
              (SELECT COUNT(*) FROM chatbot_messages m WHERE m.session_id = s.session_id AND m.role = 'bot' AND m.is_fallback = 1) AS fallback_count
       FROM chatbot_sessions s
       WHERE DATE(s.started_at) BETWEEN ? AND ?
       ORDER BY s.started_at DESC
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [from, to]
    );

    const rows = (sessions.rows || []).map((r) => ({
      id: r.id,
      session_id: r.session_id,
      customer_id: r.customer_id,
      started_at: r.started_at,
      ended_at: r.ended_at,
      message_count: Number(r.message_count) || 0,
      had_fallback: Number(r.fallback_count || 0) > 0
    }));

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Sessions list error:', err?.message || err);
    if (err?.sql) console.error('SQL:', err.sql);
    res.status(500).json({ success: false, message: 'Failed to list sessions' });
  }
}

/** GET /api/chat/analytics/sessions/:sessionId/messages */
async function getSessionMessages(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await get('SELECT id, session_id, started_at FROM chatbot_sessions WHERE session_id = ?', [sessionId]);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const result = await query(
      'SELECT id, role, content, intent_id, faq_id, is_fallback, created_at FROM chatbot_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
    res.json({
      success: true,
      data: {
        session_id: session.session_id,
        started_at: session.started_at,
        messages: (result.rows || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          intent_id: m.intent_id,
          faq_id: m.faq_id,
          is_fallback: !!m.is_fallback,
          created_at: m.created_at
        }))
      }
    });
  } catch (err) {
    console.error('Session messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to get session messages' });
  }
}

module.exports = {
  getSummary,
  getSessions,
  getSessionMessages
};
