const { query } = require('../config/db');
const { sendVendorApplicationNotification, sendEmailToVendorApplicant, getVendorEmailTemplates } = require('../services/emailService');
const { getGalleryRelativePath } = require('../utils/uploadPath');
const { getBaseUrl, buildPublicUrlWithBase } = require('../utils/urlHelpers');

const VENDOR_NOTIFICATION_EMAIL = process.env.VENDOR_NOTIFICATION_EMAIL || 'team.creamingo@gmail.com';

// Cached: optional columns (contact_preference, city, pincode, gst/docs/checklist)
let hasContactPreferenceColumn = null;
let hasCityPincodeColumns = null;
let hasNextLevelColumns = null;

const BASE_COLS = 'id, name, email, phone, shop_name, category_ids, customer_id, status, admin_notes, created_at, updated_at';
const LIST_COLS_WITH_PREF = BASE_COLS.replace('admin_notes,', 'admin_notes, contact_preference,');
const LIST_COLS_FULL = LIST_COLS_WITH_PREF.replace('updated_at', 'city, pincode, updated_at');
const LIST_COLS_NEXT = LIST_COLS_FULL.replace('updated_at', 'gst_number, shop_document_url, id_document_url, document_checklist, updated_at');

async function selectListColumns() {
  let cols = hasContactPreferenceColumn === false ? BASE_COLS : LIST_COLS_WITH_PREF;
  if (hasContactPreferenceColumn === null) {
    try {
      await query(`SELECT contact_preference FROM vendor_applications LIMIT 1`);
      hasContactPreferenceColumn = true;
      cols = LIST_COLS_WITH_PREF;
    } catch (e) {
      const msg = (e && e.message) ? String(e.message) : '';
      if (e.code === 'ER_BAD_FIELD_ERROR' || (msg.includes('Unknown column') && msg.includes('contact_preference'))) {
        hasContactPreferenceColumn = false;
        cols = BASE_COLS;
      } else throw e;
    }
  }
  if (hasCityPincodeColumns === false) return cols;
  if (hasCityPincodeColumns === true) cols = LIST_COLS_FULL;
  if (hasCityPincodeColumns === null) {
    try {
      await query(`SELECT city, pincode FROM vendor_applications LIMIT 1`);
      hasCityPincodeColumns = true;
      cols = LIST_COLS_FULL;
    } catch (e) {
      const msg = (e && e.message) ? String(e.message) : '';
      if (e.code === 'ER_BAD_FIELD_ERROR' || (msg.includes('Unknown column') && (msg.includes('city') || msg.includes('pincode')))) {
        hasCityPincodeColumns = false;
      } else throw e;
    }
  }
  if (hasNextLevelColumns === true) return LIST_COLS_NEXT;
  // When false or null: try probe so we pick up new columns after migration without restart
  try {
    await query(`SELECT gst_number, shop_document_url, id_document_url, document_checklist FROM vendor_applications LIMIT 1`);
    hasNextLevelColumns = true;
    return LIST_COLS_NEXT;
  } catch (e) {
    const msg = (e && e.message) ? String(e.message) : '';
    if (e.code === 'ER_BAD_FIELD_ERROR' || msg.includes('Unknown column')) {
      hasNextLevelColumns = false;
      return cols;
    }
    throw e;
  }
}

/**
 * Submit a vendor application (public).
 * Body: { name, email, phone, shop_name?, category_ids, contact_preference?, city?, pincode?, gst_number?, shop_document_url?, id_document_url? }
 * Optional: customer_id from auth (if logged in).
 * Sends email to VENDOR_NOTIFICATION_EMAIL.
 * Returns application_id (e.g. for VA-1234 display).
 */
const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, shop_name, category_ids, contact_preference, city, pincode, gst_number, shop_document_url, id_document_url } = req.body || {};
    const customer_id = req.customer?.id ?? null;
    const pref = (contact_preference && ['phone', 'whatsapp', 'email'].includes(String(contact_preference).toLowerCase()))
      ? String(contact_preference).toLowerCase()
      : 'phone';
    const cityVal = city != null ? String(city).trim() || null : null;
    const pincodeVal = pincode != null ? String(pincode).trim() || null : null;
    const gstVal = gst_number != null ? String(gst_number).trim() || null : null;
    const shopDocVal = shop_document_url != null ? String(shop_document_url).trim() || null : null;
    const idDocVal = id_document_url != null ? String(id_document_url).trim() || null : null;

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

    let result;
    const insertWithNextLevel = () => query(
      `INSERT INTO vendor_applications (name, email, phone, shop_name, category_ids, customer_id, status, contact_preference, city, pincode, gst_number, shop_document_url, id_document_url)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), String(phone).trim(), shopName, finalCategoryIds, customer_id, pref, cityVal, pincodeVal, gstVal, shopDocVal, idDocVal]
    );
    const insertWithCityPincode = () => query(
      `INSERT INTO vendor_applications (name, email, phone, shop_name, category_ids, customer_id, status, contact_preference, city, pincode)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [name.trim(), email.trim(), String(phone).trim(), shopName, finalCategoryIds, customer_id, pref, cityVal, pincodeVal]
    );
    const insertWithPrefOnly = () => query(
      `INSERT INTO vendor_applications (name, email, phone, shop_name, category_ids, customer_id, status, contact_preference)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [name.trim(), email.trim(), String(phone).trim(), shopName, finalCategoryIds, customer_id, pref]
    );
    const insertBase = () => query(
      `INSERT INTO vendor_applications (name, email, phone, shop_name, category_ids, customer_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [name.trim(), email.trim(), String(phone).trim(), shopName, finalCategoryIds, customer_id]
    );
    try {
      result = await insertWithNextLevel();
    } catch (insertErr) {
      const insertMsg = (insertErr && insertErr.message) ? String(insertErr.message) : '';
      const badField = (insertErr && insertErr.code === 'ER_BAD_FIELD_ERROR') || insertMsg.includes('Unknown column');
      if (!badField) throw insertErr;
      if (insertMsg.includes('gst_number') || insertMsg.includes('shop_document_url') || insertMsg.includes('id_document_url')) {
        try {
          result = await insertWithCityPincode();
        } catch (e2) {
          if ((e2.message || '').includes('contact_preference')) result = await insertBase();
          else if ((e2.message || '').includes('city') || (e2.message || '').includes('pincode')) result = await insertWithPrefOnly();
          else throw e2;
        }
      } else if (insertMsg.includes('contact_preference')) {
        result = await insertBase();
      } else if (insertMsg.includes('city') || insertMsg.includes('pincode')) {
        try {
          result = await insertWithPrefOnly();
        } catch (e2) {
          if ((e2.message || '').includes('contact_preference')) result = await insertBase();
          else throw e2;
        }
      } else {
        throw insertErr;
      }
    }

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
      created_at: createdAt,
      contact_preference: pref,
      city: cityVal,
      pincode: pincodeVal,
      gst_number: gstVal,
      shop_document_url: shopDocVal,
      id_document_url: idDocVal
    }).catch((err) => console.error('Vendor notification email failed:', err));

    return res.status(201).json({
      success: true,
      message: 'Application received. We\'ll review and contact you within 24 hours.',
      application_id: applicationId
    });
  } catch (error) {
    console.error('Vendor application submit error:', error);
    const msg = (error && error.message) ? String(error.message) : '';
    const isMissingColumn = (error && error.code === 'ER_BAD_FIELD_ERROR') ||
      (msg.includes("Unknown column") && msg.includes('contact_preference'));
    if (isMissingColumn) {
      return res.status(503).json({
        success: false,
        message: 'Vendor applications need a DB update. Run: cd backend && node run_migration_067.js'
      });
    }
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' && msg
        ? `Could not submit application: ${msg}`
        : 'Could not submit application. Please try again.'
    });
  }
};

/**
 * List vendor applications (admin). Query: status, page, limit, search (name/email/phone).
 */
const listApplications = async (req, res) => {
  try {
    const status = req.query.status || '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    let where = '1=1';
    const params = [];
    if (status && ['pending', 'contacted', 'approved', 'rejected'].includes(status)) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (search.length > 0) {
      where += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const term = `%${search.replace(/%/g, '\\%')}%`;
      params.push(term, term, term);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM vendor_applications WHERE ${where}`,
      params
    );
    const firstCountRow = countResult.rows && countResult.rows[0];
    const total = firstCountRow ? (Number(firstCountRow.total) || Number(firstCountRow.TOTAL) || 0) : 0;

    const listCols = await selectListColumns();
    const listResult = await query(
      `SELECT ${listCols} FROM vendor_applications WHERE ${where}
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
    const listCols = await selectListColumns();
    const result = await query(
      `SELECT ${listCols} FROM vendor_applications WHERE id = ?`,
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
 * Public: get application status only (no PII). For applicants to check status after submit.
 * GET /vendor-applications/status/:id
 */
const getApplicationStatusPublic = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'Invalid application id' });
    }
    const result = await query(
      'SELECT id, status, updated_at FROM vendor_applications WHERE id = ?',
      [id]
    );
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const row = result.rows[0];
    return res.json({
      success: true,
      application_id: row.id,
      status: row.status || 'pending',
      updated_at: row.updated_at || null
    });
  } catch (error) {
    console.error('Get application status (public) error:', error);
    return res.status(500).json({ success: false, message: 'Unable to check status' });
  }
};

/**
 * Update vendor application status, admin_notes, document_checklist (admin).
 */
const updateApplication = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const { status, admin_notes, document_checklist } = req.body || {};
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
    if (document_checklist !== undefined && typeof document_checklist === 'object') {
      try {
        const checklistStr = JSON.stringify(document_checklist);
        updates.push('document_checklist = ?');
        values.push(checklistStr);
      } catch (_) {}
    }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }
    values.push(id);
    try {
      await query(
        `UPDATE vendor_applications SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        values
      );
    } catch (updateErr) {
      const msg = (updateErr && updateErr.message) ? String(updateErr.message) : '';
      if ((updateErr.code === 'ER_BAD_FIELD_ERROR' || msg.includes('Unknown column')) && updates.some((u) => u.startsWith('document_checklist'))) {
        const withoutChecklist = updates.filter((u) => !u.startsWith('document_checklist'));
        if (withoutChecklist.length > 0) {
          const newValues = values.filter((_, i) => i < updates.length && !updates[i].startsWith('document_checklist'));
          newValues.push(id);
          await query(`UPDATE vendor_applications SET ${withoutChecklist.join(', ')}, updated_at = NOW() WHERE id = ?`, newValues);
        }
      } else {
        throw updateErr;
      }
    }
    const listCols = await selectListColumns();
    const result = await query(
      `SELECT ${listCols} FROM vendor_applications WHERE id = ?`,
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

/**
 * Public upload for vendor application documents (shop/ID). Returns { url }.
 */
const uploadVendorDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const type = 'vendor-docs';
    const relativePath = getGalleryRelativePath(type, req.file.filename);
    const baseUrl = getBaseUrl(req);
    const fileUrl = process.env.UPLOAD_RETURN_ABSOLUTE_URL === 'true'
      ? buildPublicUrlWithBase(baseUrl, relativePath)
      : relativePath;
    return res.json({
      success: true,
      message: 'File uploaded',
      data: { url: fileUrl, filename: req.file.filename }
    });
  } catch (error) {
    console.error('Vendor document upload error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

/**
 * Get counts by status (admin) for dashboard widget.
 */
const getCounts = async (req, res) => {
  try {
    const [pending, contacted, approved, rejected] = await Promise.all([
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['pending']),
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['contacted']),
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['approved']),
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['rejected'])
    ]);
    const getC = (r) => (r.rows && r.rows[0] && (Number(r.rows[0].c) || Number(r.rows[0].C))) || 0;
    return res.json({
      success: true,
      data: {
        pending: getC(pending),
        contacted: getC(contacted),
        approved: getC(approved),
        rejected: getC(rejected),
        total: getC(pending) + getC(contacted) + getC(approved) + getC(rejected)
      }
    });
  } catch (error) {
    console.error('Vendor application counts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get counts' });
  }
};

/**
 * Get email templates for sending to applicants (admin).
 */
const getEmailTemplates = async (req, res) => {
  try {
    const templates = getVendorEmailTemplates();
    return res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Vendor email templates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get templates' });
  }
};

/**
 * Send email to applicant from application detail (admin).
 * Body: { template_id?: string, subject: string, body: string } (body can be HTML or plain; subject required)
 */
const sendEmailToApplication = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const listCols = await selectListColumns();
    const appResult = await query(
      `SELECT ${listCols} FROM vendor_applications WHERE id = ?`,
      [id]
    );
    if (!appResult.rows || appResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const app = appResult.rows[0];
    const { template_id, subject, body } = req.body || {};
    let finalSubject = typeof subject === 'string' ? subject.trim() : '';
    let finalBody = typeof body === 'string' ? body : '';
    if (template_id && getVendorEmailTemplates) {
      const templates = getVendorEmailTemplates();
      const t = templates.find((x) => x.id === template_id);
      if (t) {
        if (!finalSubject) finalSubject = (t.subject || '').replace(/\{\{name\}\}/g, app.name || '');
        if (!finalBody) finalBody = (t.body || '').replace(/\{\{name\}\}/g, app.name || '').replace(/\{\{email\}\}/g, app.email || '');
      }
    }
    if (!finalSubject) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!finalBody) {
      return res.status(400).json({ success: false, message: 'Body is required' });
    }
    const result = await sendEmailToVendorApplicant(app.email, finalSubject, finalBody, finalBody.replace(/<[^>]+>/g, ''));
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.message || 'Failed to send email' });
    }
    return res.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Send email to applicant error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email' });
  }
};

/**
 * Bulk update status (admin). Body: { ids: number[], status: 'pending'|'contacted'|'approved'|'rejected' }
 */
const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    if (!status || !['pending', 'contacted', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status is required' });
    }
    const validIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid ids' });
    }
    const placeholders = validIds.map(() => '?').join(',');
    const result = await query(
      `UPDATE vendor_applications SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [status, ...validIds]
    );
    return res.json({
      success: true,
      message: `Updated ${result.rowCount || validIds.length} application(s)`,
      updated: result.rowCount || validIds.length
    });
  } catch (error) {
    console.error('Bulk update status error:', error);
    return res.status(500).json({ success: false, message: 'Bulk update failed' });
  }
};

/**
 * Export vendor applications as CSV (admin). Query: status, search, limit (max 2000).
 */
const exportApplications = async (req, res) => {
  try {
    const status = req.query.status || '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit, 10) || 500));
    let where = '1=1';
    const params = [];
    if (status && ['pending', 'contacted', 'approved', 'rejected'].includes(status)) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (search.length > 0) {
      where += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const term = `%${search.replace(/%/g, '\\%')}%`;
      params.push(term, term, term);
    }
    const listCols = await selectListColumns();
    const listResult = await query(
      `SELECT ${listCols} FROM vendor_applications WHERE ${where} ORDER BY created_at DESC LIMIT ${limit}`,
      params
    );
    const rows = Array.isArray(listResult.rows) ? listResult.rows : [];
    const headers = ['id', 'name', 'email', 'phone', 'shop_name', 'category_ids', 'city', 'pincode', 'gst_number', 'status', 'contact_preference', 'shop_document_url', 'id_document_url', 'created_at'];
    const escapeCsv = (v) => {
      const s = v == null ? '' : String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csvLines = [headers.join(',')];
    rows.forEach((r) => {
      csvLines.push(headers.map((h) => escapeCsv(r[h])).join(','));
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="vendor-applications-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send('\uFEFF' + csvLines.join('\n'));
  } catch (error) {
    console.error('Export vendor applications error:', error);
    return res.status(500).json({ success: false, message: 'Export failed' });
  }
};

/**
 * Funnel analytics (admin): counts by status + optional time breakdown (last 7 days).
 */
const getFunnelAnalytics = async (req, res) => {
  try {
    const [pending, contacted, approved, rejected] = await Promise.all([
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['pending']),
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['contacted']),
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['approved']),
      query('SELECT COUNT(*) as c FROM vendor_applications WHERE status = ?', ['rejected'])
    ]);
    const getC = (r) => (r.rows && r.rows[0] && (Number(r.rows[0].c) || Number(r.rows[0].C))) || 0;
    const byStatus = {
      pending: getC(pending),
      contacted: getC(contacted),
      approved: getC(approved),
      rejected: getC(rejected),
      total: getC(pending) + getC(contacted) + getC(approved) + getC(rejected)
    };
    let byDay = [];
    try {
      const dayResult = await query(
        `SELECT DATE(created_at) as d, status, COUNT(*) as c FROM vendor_applications WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at), status ORDER BY d ASC, status`
      );
      const rows = Array.isArray(dayResult.rows) ? dayResult.rows : [];
      const dayMap = {};
      rows.forEach((row) => {
        const d = String(row.d || row.D || '');
        if (!d) return;
        if (!dayMap[d]) dayMap[d] = { date: d, pending: 0, contacted: 0, approved: 0, rejected: 0 };
        const s = String(row.status || row.STATUS || '').toLowerCase();
        if (['pending', 'contacted', 'approved', 'rejected'].includes(s)) dayMap[d][s] = Number(row.c || row.C) || 0;
      });
      byDay = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
    } catch (_) {}
    return res.json({
      success: true,
      data: {
        byStatus,
        byDay
      }
    });
  } catch (error) {
    console.error('Funnel analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get funnel analytics' });
  }
};

module.exports = {
  submitApplication,
  listApplications,
  getApplicationById,
  getApplicationStatusPublic,
  updateApplication,
  uploadVendorDocument,
  getCounts,
  getEmailTemplates,
  sendEmailToApplication,
  bulkUpdateStatus,
  exportApplications,
  getFunnelAnalytics
};
