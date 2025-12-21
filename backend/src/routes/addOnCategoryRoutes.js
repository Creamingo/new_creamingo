const express = require('express');
const router = express.Router();
const addOnCategoryController = require('../controllers/addOnCategoryController');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Public routes
router.route('/')
  .get(addOnCategoryController.getAllAddOnCategories);

router.route('/:id')
  .get(addOnCategoryController.getAddOnCategoryById);

// Protected admin routes
router.route('/')
  .post(authMiddleware, requireRole(['admin', 'super_admin']), addOnCategoryController.createAddOnCategory);

router.route('/:id')
  .put(authMiddleware, requireRole(['admin', 'super_admin']), addOnCategoryController.updateAddOnCategory)
  .delete(authMiddleware, requireRole(['admin', 'super_admin']), addOnCategoryController.deleteAddOnCategory);

module.exports = router;
