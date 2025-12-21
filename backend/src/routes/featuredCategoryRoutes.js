const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validateFeaturedCategory } = require('../middleware/validation');

const {
  getFeaturedCategories,
  getFeaturedCategory,
  createFeaturedCategory,
  updateFeaturedCategory,
  deleteFeaturedCategory,
  getAvailableCategories,
  reorderFeaturedCategories
} = require('../controllers/featuredCategoryController');

// Public routes (for frontend display)
router.get('/', getFeaturedCategories);
router.get('/available', getAvailableCategories);
router.get('/:id', getFeaturedCategory);

// Protected routes (require authentication)
router.use(authMiddleware);

// Super admin only routes (require super_admin role)
router.post('/', requireRole(['super_admin']), validateFeaturedCategory, createFeaturedCategory);
router.put('/:id', requireRole(['super_admin']), updateFeaturedCategory);
router.delete('/:id', requireRole(['super_admin']), deleteFeaturedCategory);
router.put('/order/update', requireRole(['super_admin']), reorderFeaturedCategories);

module.exports = router;
