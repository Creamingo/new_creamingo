const express = require('express');
const router = express.Router();
const {
  getSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  updateSubcategoryOrder
} = require('../controllers/subcategoryController');
const { authMiddleware } = require('../middleware/auth');
const { canManageCategories } = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', getSubcategories);
router.get('/:id', getSubcategory);

// Protected routes (super admin only)
router.post('/', authMiddleware, canManageCategories, validate(schemas.createSubcategory), createSubcategory);
router.put('/:id', authMiddleware, canManageCategories, validate(schemas.updateSubcategory), updateSubcategory);
router.put('/order/update', authMiddleware, canManageCategories, updateSubcategoryOrder);
router.delete('/:id', authMiddleware, canManageCategories, deleteSubcategory);

module.exports = router;
