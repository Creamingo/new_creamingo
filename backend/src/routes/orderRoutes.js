const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
  getMyOrders
} = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');
const { customerAuthMiddleware } = require('../middleware/customerAuth');
const { canViewOrders, canManageOrders } = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');
const { downloadInvoice, downloadInvoiceAdmin } = require('../controllers/invoiceController');

// Customer order creation (public route - no auth required, but can use auth if available)
router.post('/', validate(schemas.createOrder), createOrder);

// Customer routes (require customer authentication)
router.get('/my-orders', customerAuthMiddleware, getMyOrders);
router.get('/invoice/:orderNumber', customerAuthMiddleware, downloadInvoice);

// Protected routes (staff and super admin)
router.get('/', authMiddleware, canViewOrders, getOrders);
router.get('/stats', authMiddleware, canViewOrders, getOrderStats);
router.get('/invoice/admin/:orderNumber', authMiddleware, canViewOrders, downloadInvoiceAdmin);
router.get('/:id', authMiddleware, canViewOrders, getOrder);
router.put('/:id', authMiddleware, canManageOrders, validate(schemas.updateOrder), updateOrder);
router.delete('/:id', authMiddleware, canManageOrders, deleteOrder);

module.exports = router;
