const express = require('express');
const router = express.Router();
const {
  getPromoCodes,
  getPromoCode,
  validatePromoCode,
  createPromoCode,
  updatePromoCode,
  updatePromoCodeStatus,
  getPromoCodeAnalyticsOverview,
  getPromoCodeAnalytics,
  getPromoCodeAnalyticsTimeSeries,
  trackPromoCodeEventFromFrontend,
  backfillPromoCodeAnalytics,
  runPromoCodeAnalyticsMigration
} = require('../controllers/promoCodeController');
const { authMiddleware } = require('../middleware/auth');
const { canManageSettings } = require('../middleware/role');

// Public routes
router.get('/', getPromoCodes);
router.post('/validate', validatePromoCode);
router.post('/:id/track', trackPromoCodeEventFromFrontend); // Frontend tracking endpoint
router.get('/:id', getPromoCode);

// Protected routes (admin only)
router.post('/', authMiddleware, canManageSettings, createPromoCode);
router.put('/:id', authMiddleware, canManageSettings, updatePromoCode);
router.patch('/:id/status', authMiddleware, canManageSettings, updatePromoCodeStatus);

// Analytics routes (admin only)
router.get('/analytics/overview', authMiddleware, canManageSettings, getPromoCodeAnalyticsOverview);
router.get('/analytics/time-series', authMiddleware, canManageSettings, getPromoCodeAnalyticsTimeSeries);
router.post('/analytics/migrate', authMiddleware, canManageSettings, runPromoCodeAnalyticsMigration);
router.post('/analytics/backfill', authMiddleware, canManageSettings, backfillPromoCodeAnalytics);
router.get('/:id/analytics', authMiddleware, canManageSettings, getPromoCodeAnalytics);

module.exports = router;

