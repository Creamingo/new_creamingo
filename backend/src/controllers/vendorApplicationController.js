const { query } = require('../config/db');
const { sendVendorApplicationNotification } = require('../services/emailService');

const VENDOR_NOTIFICATION_EMAIL = process.env.VENDOR_NOTIFICATION_EMAIL || 'team.creamingo@gmail.com';

/**
 * Submit a vendor application (public).
 * Body: { name, email, phone, shop_name?, category_ids (comma-separated or array) }
 * Optional: customer_id from auth (if logged in).
 * Sends email to VENDOR_NOTIFICATION_EMAIL (default team.creamingo@gmail.com).
 */
const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, shop_name, category_ids } = req.body || {};
    const customer_id = req.customer?.id ?? null;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters'
      });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number'
      });
    }

    // Accept category slugs (e.g. cake_bakery, flowers) or numeric IDs
    let categoryIdsStr = category_ids;
    if (Array.isArray(category_ids)) {
      categoryIdsStr = category_ids.map((id) => String(id).trim()).filter(Boolean).join(',');
    }
    if (typeof categoryIdsStr !== 'string') {
      categoryIdsStr = String(categoryIdsStr || '');
    }
    const ids = categoryIdsStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one category you want to sell in'
      });
    }

    const finalCategoryIds = ids.join(',');
    const shopName = shop_name != null ? String(shop_name).trim() || null : null;

    const result = await query(
      `INSERT INTO vendor_applications (name, email, phone, shop_name, category_ids, customer_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [name.trim(), email.trim(), String(phone).trim(), shopName, finalCategoryIds, customer_id]
    );

    const applicationId = result.lastID;
    const createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Send notification email (fire-and-forget; don't block response)
    sendVendorApplicationNotification(VENDOR_NOTIFICATION_EMAIL, {
      id: applicationId,
      name: name.trim(),
      email: email.trim(),
      phone: String(phone).trim(),
      shop_name: shopName,
      category_ids: finalCategoryIds,
      created_at: createdAt
    }).catch((err) => console.error('Vendor notification email failed:', err));

    return res.status(201).json({
      success: true,
      message: 'Application received. We\'ll review and contact you within 24 hours.'
    });
  } catch (error) {
    console.error('Vendor application submit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not submit application. Please try again.'
    });
  }
};

/**
 * List vendor applications (admin). Query: status, page, limit.
 */
const listApplications = async (req, res) => {
  try {
    const status = req.query.status || '';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    let where = '1=1';
    const params = [];
    if (status && ['pending', 'contacted', 'approved', 'rejected'].includes(status)) {
      where += ' AND status = ?';
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM vendor_applications WHERE ${where}`,
      params
    );
    const firstCountRow = countResult.rows && countResult.rows[0];
    const total = firstCountRow ? (Number(firstCountRow.total) || Number(firstCountRow.TOTAL) || 0) : 0;

    // Use literal LIMIT/OFFSET (already validated as integers) - MySQL prepared statements often reject ? for LIMIT/OFFSET
    const listResult = await query(
      `SELECT id, name, email, phone, shop_name, category_ids, customer_id, status, admin_notes, created_at, updated_at
       FROM vendor_applications WHERE ${where}
       ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const applications = Array.isArray(listResult.rows) ? listResult.rows : [];

    return res.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit) || 1
      }
    });
  } catch (error) {
    console.error('List vendor applications error:', error);
    const msg = (error && error.message) ? String(error.message) : '';
    const isNoTable = (error && error.code === 'ER_NO_SUCH_TABLE') ||
      (msg.includes('vendor_applications') && (msg.includes("doesn't exist") || msg.includes('does not exist')));
    if (isNoTable) {
      return res.status(503).json({
        success: false,
        message: 'Vendor applications not set up. Run migration: cd backend && node run_migration_066.js'
      });
    }
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' && msg ? `Failed to list applications: ${msg}` : 'Failed to list applications'
    });
  }
};

/**
 * Get one vendor application by id (admin).
 */
const getApplicationById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const result = await query(
      `SELECT id, name, email, phone, shop_name, category_ids, customer_id, status, admin_notes, created_at, updated_at
       FROM vendor_applications WHERE id = ?`,
      [id]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get vendor application error:', error);
    if (error.code === 'ER_NO_SUCH_TABLE' && error.message && error.message.includes('vendor_applications')) {
      return res.status(503).json({
        success: false,
        message: 'Vendor applications not set up. Run migration: cd backend && node run_migration_066.js'
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to get application' });
  }
};

/**
 * Update vendor application status and/or admin_notes (admin).
 */
const updateApplication = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const { status, admin_notes } = req.body || {};
    const updates = [];
    const values = [];
    if (status && ['pending', 'contacted', 'approved', 'rejected'].includes(status)) {
      updates.push('status = ?');
      values.push(status);
    }
    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      values.push(typeof admin_notes === 'string' ? admin_notes : '');
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }
    values.push(id);
    await query(
      `UPDATE vendor_applications SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );
    const result = await query(
      'SELECT id, name, email, phone, shop_name, category_ids, customer_id, status, admin_notes, created_at, updated_at FROM vendor_applications WHERE id = ?',
      [id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update vendor application error:', error);
    if (error.code === 'ER_NO_SUCH_TABLE' && error.message && error.message.includes('vendor_applications')) {
      return res.status(503).json({
        success: false,
        message: 'Vendor applications not set up. Run migration: cd backend && node run_migration_066.js'
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to update application' });
  }
};

module.exports = {
  submitApplication,
  listApplications,
  getApplicationById,
  updateApplication
};
