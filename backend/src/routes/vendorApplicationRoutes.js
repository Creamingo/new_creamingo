const express = require('express');
const router = express.Router();
const { submitApplication, listApplications, getApplicationById, updateApplication } = require('../controllers/vendorApplicationController');
const { optionalCustomerAuth } = require('../middleware/customerAuth');
const { authMiddleware } = require('../middleware/auth');

// Public: submit vendor application (optional auth to link customer_id)
router.post('/', optionalCustomerAuth, submitApplication);

// Admin: list, get one, update (require admin auth)
router.get('/', authMiddleware, listApplications);
router.get('/:id', authMiddleware, getApplicationById);
router.patch('/:id', authMiddleware, updateApplication);

module.exports = router;
