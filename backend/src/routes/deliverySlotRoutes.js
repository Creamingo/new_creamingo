const express = require('express');
const router = express.Router();
const {
  getDeliverySlots,
  getDeliverySlotById,
  createDeliverySlot,
  updateDeliverySlot,
  deleteDeliverySlot,
  toggleSlotStatus,
  getSlotAvailability,
  updateSlotAvailability,
  getDeliverySlotStats,
  decrementAvailableOrders
} = require('../controllers/deliverySlotController');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Public routes (no authentication required)
// Get all delivery slots
router.get('/', getDeliverySlots);

// Get slot availability for date range (public for customers)
router.get('/availability/range', getSlotAvailability);

// Get slots for specific date (public for customers)
router.get('/availability', getSlotAvailability);

// Decrement available orders when online order is received (public for frontend)
router.post('/availability/decrement', decrementAvailableOrders);

// Apply authentication to protected routes
router.use(authMiddleware);

// Get delivery slot statistics (admin only)
router.get('/stats', getDeliverySlotStats);

// Get delivery slot by ID (public for customers and admin)
router.get('/:id', getDeliverySlotById);

// Create new delivery slot (admin and super_admin only)
router.post('/', requireRole(['admin', 'super_admin']), createDeliverySlot);

// Update slot availability (admin and super_admin only) - MUST be before /:id route
router.put('/availability', requireRole(['admin', 'super_admin']), updateSlotAvailability);

// Update delivery slot (admin and super_admin only)
router.put('/:id', requireRole(['admin', 'super_admin']), updateDeliverySlot);

// Delete delivery slot (admin and super_admin only)
router.delete('/:id', requireRole(['admin', 'super_admin']), deleteDeliverySlot);

// Toggle slot status (admin and super_admin only)
router.patch('/:id/toggle-status', requireRole(['admin', 'super_admin']), toggleSlotStatus);

module.exports = router;
