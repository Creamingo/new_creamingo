const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/vendorApplicationController');
const { optionalCustomerAuth } = require('../middleware/customerAuth');
const { authMiddleware } = require('../middleware/auth');
const { uploadSingleDocument, handleUploadError } = require('../middleware/upload');

// Public: submit vendor application (optional auth to link customer_id)
router.post('/', optionalCustomerAuth, submitApplication);

// Public: upload document for vendor application (shop/ID doc - images or PDF)
router.post('/upload-document', optionalCustomerAuth, uploadSingleDocument('document'), handleUploadError, uploadVendorDocument);

// Public: check application status (no auth; returns only status, no PII)
router.get('/status/:id', getApplicationStatusPublic);

// Admin: counts, email templates, list, export, funnel, bulk, get one, update, send email
router.get('/counts', authMiddleware, getCounts);
router.get('/email-templates', authMiddleware, getEmailTemplates);
router.get('/analytics/funnel', authMiddleware, getFunnelAnalytics);
router.get('/export', authMiddleware, exportApplications);
router.post('/bulk-status', authMiddleware, bulkUpdateStatus);
router.get('/', authMiddleware, listApplications);
router.get('/:id', authMiddleware, getApplicationById);
router.patch('/:id', authMiddleware, updateApplication);
router.post('/:id/send-email', authMiddleware, sendEmailToApplication);

module.exports = router;
