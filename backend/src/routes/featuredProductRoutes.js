const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { validateFeaturedProduct } = require('../middleware/validation');

const {
  getFeaturedProducts,
  getFeaturedProduct,
  createFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  getAvailableProducts,
  getSectionStats,
  toggleFeaturedProductStatus,
  reorderFeaturedProducts,
  toggleFeaturedStatus,
  toggleTopProductStatus,
  toggleBestsellerStatus,
  toggleActiveStatus
} = require('../controllers/featuredProductController');

// Public routes (for frontend display)
router.get('/', getFeaturedProducts);
router.get('/available', getAvailableProducts);
router.get('/stats', getSectionStats);
router.get('/:id', getFeaturedProduct);

// Protected routes (require authentication)
router.use(authMiddleware);

// Super admin only routes (require super_admin role)
router.post('/', requireRole(['super_admin']), validateFeaturedProduct, createFeaturedProduct);
router.put('/:id', requireRole(['super_admin']), updateFeaturedProduct);
router.delete('/:id', requireRole(['super_admin']), deleteFeaturedProduct);
router.put('/:id/toggle-status', requireRole(['super_admin']), toggleFeaturedProductStatus);
router.put('/order/update', requireRole(['super_admin']), reorderFeaturedProducts);

// Toggle status routes
router.put('/:id/toggle-featured', requireRole(['super_admin']), toggleFeaturedStatus);
router.put('/:id/toggle-top-product', requireRole(['super_admin']), toggleTopProductStatus);
router.put('/:id/toggle-bestseller', requireRole(['super_admin']), toggleBestsellerStatus);
router.put('/:id/toggle-active', requireRole(['super_admin']), toggleActiveStatus);

module.exports = router;
