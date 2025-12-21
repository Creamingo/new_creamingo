const express = require('express');
const router = express.Router();
const addOnProductController = require('../controllers/addOnProductController');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Public routes
router.route('/')
  .get(addOnProductController.getAllAddOnProducts);

router.route('/category/:categoryId')
  .get(addOnProductController.getAddOnProductsByCategory);

router.route('/:id')
  .get(addOnProductController.getAddOnProductById);

// Protected admin routes
router.route('/')
  .post(authMiddleware, requireRole(['admin', 'super_admin']), addOnProductController.createAddOnProduct);

router.route('/:id')
  .put(authMiddleware, requireRole(['admin', 'super_admin']), addOnProductController.updateAddOnProduct)
  .delete(authMiddleware, requireRole(['admin', 'super_admin']), addOnProductController.deleteAddOnProduct);

module.exports = router;
