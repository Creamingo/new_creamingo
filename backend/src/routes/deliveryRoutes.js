const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authMiddleware } = require('../middleware/auth');
const { canManageOrders } = require('../middleware/role');

// Get delivery orders for a specific delivery boy
router.get('/orders/:deliveryBoyId', authMiddleware, deliveryController.getDeliveryOrders);

// Update delivery order status
router.put('/orders/:orderId/status', authMiddleware, deliveryController.updateDeliveryStatus);

// Track delivery location
router.post('/orders/:orderId/track', authMiddleware, deliveryController.trackDeliveryLocation);

// Get delivery statistics
router.get('/stats/:deliveryBoyId', authMiddleware, deliveryController.getDeliveryStats);

// Create delivery order (admin only)
router.post('/orders', authMiddleware, canManageOrders, deliveryController.createDeliveryOrder);

// Get available delivery boys
router.get('/available-delivery-boys', authMiddleware, deliveryController.getAvailableDeliveryBoys);

// Get order assignment information
router.get('/order-assignment/:orderId', authMiddleware, deliveryController.getOrderAssignment);

// Bulk assign orders
router.post('/bulk-assign', authMiddleware, canManageOrders, deliveryController.bulkAssignOrders);

// Reassign order
router.put('/reassign/:orderId', authMiddleware, canManageOrders, deliveryController.reassignOrder);

// Get delivery boy workload
router.get('/workload', authMiddleware, deliveryController.getDeliveryBoyWorkload);

// Get assignment history
router.get('/assignment-history/:orderId', authMiddleware, deliveryController.getAssignmentHistory);

module.exports = router;
