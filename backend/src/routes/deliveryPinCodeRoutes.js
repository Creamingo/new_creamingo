const express = require('express');
const router = express.Router();
const deliveryPinCodeController = require('../controllers/deliveryPinCodeController');
const { authMiddleware } = require('../middleware/auth');
const { canManageSettings } = require('../middleware/role');

// Public routes (for frontend pin code validation)
router.get('/check/:pinCode', deliveryPinCodeController.checkPinCodeAvailability);

// Apply authentication middleware to protected routes
router.use(authMiddleware);

// Get all delivery PIN codes with filtering and pagination
router.get('/', deliveryPinCodeController.getDeliveryPinCodes);

// Get delivery PIN code statistics
router.get('/stats', deliveryPinCodeController.getDeliveryPinCodeStats);

// Create a new delivery PIN code (admin only)
router.post('/', canManageSettings, deliveryPinCodeController.createDeliveryPinCode);

// Update a delivery PIN code (admin only)
router.put('/:id', canManageSettings, deliveryPinCodeController.updateDeliveryPinCode);

// Delete a delivery PIN code (admin only)
router.delete('/:id', canManageSettings, deliveryPinCodeController.deleteDeliveryPinCode);

// Toggle PIN code status (admin only)
router.patch('/:id/toggle-status', canManageSettings, deliveryPinCodeController.togglePinCodeStatus);

// Bulk upload PIN codes from CSV (admin only)
router.post('/bulk-upload', canManageSettings, deliveryPinCodeController.bulkUploadPinCodes);

// Update PIN code order (admin only)
router.patch('/update-order', canManageSettings, deliveryPinCodeController.updateDeliveryPinCodeOrder);

module.exports = router;
