/**
 * Support tickets (Help > Raise Ticket).
 * Tickets are created when a user starts a chat session; linked to chatbot_sessions for conversation view.
 */

const { query, get } = require('../config/db');

/** Get or create a ticket for this chat session. Returns { ticket_number } or null. */
async function getOrCreateTicketForSession(sessionId, customerId, subject) {
  if (!sessionId) return null;
  try {
    const existing = await get(
      'SELECT id, ticket_number FROM support_tickets WHERE session_id = ?',
      [sessionId]
    );
    if (existing) return { ticket_number: existing.ticket_number };

    const subj = (subject || 'Support request').slice(0, 500);
    await query(
      `INSERT INTO support_tickets (ticket_number, session_id, customer_id, subject)
       SELECT CONCAT('TKT-', LPAD(COALESCE((SELECT MAX(id) FROM support_tickets),0)+1, 5, '0')), ?, ?, ?
       FROM (SELECT 1) t`,
      [sessionId, customerId || null, subj]
    );
    const row = await get('SELECT ticket_number FROM support_tickets WHERE session_id = ? ORDER BY id DESC LIMIT 1', [sessionId]);
    return row ? { ticket_number: row.ticket_number } : null;
  } catch (err) {
    console.error('getOrCreateTicketForSession error:', err);
    return null;
  }
}

/** GET /api/tickets?status=&page=1&limit=20 */
async function list(req, res) {
  try {
    const status = (req.query.status || '').trim() || null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const offset = Math.max(0, (page - 1) * limit);

    let countSql = 'SELECT COUNT(*) AS total FROM support_tickets';
    const countParams = [];
    if (status) {
      countSql += ' WHERE status = ?';
      countParams.push(status);
    }
    const countResult = await get(countSql, countParams);
    const total = Number(countResult?.total ?? 0);

    let listSql = `SELECT id, ticket_number, session_id, customer_id, subject, status, admin_notes, created_at, updated_at
                   FROM support_tickets`;
    const listParams = [];
    if (status) {
      listSql += ' WHERE status = ?';
      listParams.push(status);
    }
    listSql += ' ORDER BY created_at DESC LIMIT ' + parseInt(limit, 10) + ' OFFSET ' + parseInt(offset, 10);

    const result = await query(listSql, listParams);
    const rows = (result.rows || []).map((r) => ({
      id: r.id,
      ticket_number: r.ticket_number,
      session_id: r.session_id,
      customer_id: r.customer_id,
      subject: r.subject,
      status: r.status,
      admin_notes: r.admin_notes,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Tickets list error:', err);
    res.status(500).json({ success: false, message: 'Failed to list tickets' });
  }
}

/** GET /api/tickets/:id */
async function getOne(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid ticket id' });
    const ticket = await get(
      'SELECT id, ticket_number, session_id, customer_id, subject, status, admin_notes, created_at, updated_at FROM support_tickets WHERE id = ?',
      [id]
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    console.error('Ticket get error:', err);
    res.status(500).json({ success: false, message: 'Failed to get ticket' });
  }
}

/** GET /api/tickets/:id/messages - conversation for this ticket (from chatbot_messages by session_id) */
async function getMessages(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid ticket id' });
    const ticket = await get('SELECT session_id FROM support_tickets WHERE id = ?', [id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const result = await query(
      'SELECT id, role, content, intent_id, is_fallback, created_at FROM chatbot_messages WHERE session_id = ? ORDER BY created_at ASC',
      [ticket.session_id]
    );
    const messages = (result.rows || []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
      is_fallback: !!m.is_fallback
    }));
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Ticket messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
}

/** PATCH /api/tickets/:id - update status and/or admin_notes */
async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid ticket id' });
    const { status, admin_notes } = req.body || {};
    const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const updates = [];
    const params = [];
    if (allowedStatuses.includes(status)) {
      updates.push('status = ?');
      params.push(status);
    }
    if (typeof admin_notes === 'string') {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }
    if (updates.length === 0) return res.status(400).json({ success: false, message: 'Nothing to update' });
    params.push(id);
    await query(
      'UPDATE support_tickets SET ' + updates.join(', ') + ' WHERE id = ?',
      params
    );
    const ticket = await get('SELECT id, ticket_number, session_id, customer_id, subject, status, admin_notes, created_at, updated_at FROM support_tickets WHERE id = ?', [id]);
    res.json({ success: true, data: ticket });
  } catch (err) {
    console.error('Ticket update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
}

module.exports = {
  getOrCreateTicketForSession,
  list,
  getOne,
  getMessages,
  update
};
