const express = require('express');
const router = express.Router();
const {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  updateBannerOrder,
  getBannerAnalytics,
  trackBannerView,
  trackBannerClick,
  trackBannerConversion
} = require('../controllers/bannerController');
const { authMiddleware } = require('../middleware/auth');
const { validateBanner, validateUpdateBanner } = require('../middleware/validation');

// Public routes (for frontend display)
router.get('/public', getBanners); // Public endpoint for frontend

// Public tracking routes (for frontend analytics)
// POST /api/banners/:id/track/view - Track banner view (public)
router.post('/:id/track/view', trackBannerView);

// POST /api/banners/:id/track/click - Track banner click (public)
router.post('/:id/track/click', trackBannerClick);

// Apply authentication middleware to protected routes
router.use(authMiddleware);

// GET /api/banners - Get all banners (protected)
router.get('/', getBanners);

// GET /api/banners/:id - Get single banner
router.get('/:id', getBanner);

// POST /api/banners - Create new banner
router.post('/', validateBanner, createBanner);

// PUT /api/banners/order/update - Update banner order (bulk) – must be before /:id so "order" is not captured as id
router.put('/order/update', updateBannerOrder);

// PUT /api/banners/:id - Update banner
router.put('/:id', validateUpdateBanner, updateBanner);

// DELETE /api/banners/:id - Delete banner
router.delete('/:id', deleteBanner);

// PATCH /api/banners/:id/toggle - Toggle banner status
router.patch('/:id/toggle', toggleBannerStatus);

// Analytics routes (protected)
// GET /api/banners/:id/analytics - Get banner analytics
router.get('/:id/analytics', getBannerAnalytics);

// POST /api/banners/:id/track/conversion - Track banner conversion (protected)
router.post('/:id/track/conversion', trackBannerConversion);

module.exports = router;
