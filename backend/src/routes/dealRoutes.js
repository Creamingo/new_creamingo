const express = require('express');
const router = express.Router();
const {
  getActiveDeals,
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  toggleDealStatus,
  updateDealPriorities,
  trackDealEvent,
  getDealAnalytics,
  getDealPerformance,
  getAllDealsPerformance,
  getDealAnalyticsTimeSeries,
  backfillHistoricalOrders
} = require('../controllers/dealController');
const { authMiddleware } = require('../middleware/auth');
const { canManageSettings } = require('../middleware/role');

// Public routes (for frontend)
router.get('/active', getActiveDeals);
router.post('/track', trackDealEvent); // Public tracking endpoint

// Protected routes (admin only)
router.get('/', authMiddleware, canManageSettings, getAllDeals);
router.get('/analytics', authMiddleware, canManageSettings, getDealAnalytics);
router.get('/analytics/timeseries', authMiddleware, canManageSettings, getDealAnalyticsTimeSeries);
router.get('/performance', authMiddleware, canManageSettings, getAllDealsPerformance);
router.get('/performance/:deal_id', authMiddleware, canManageSettings, getDealPerformance);
router.post('/backfill', authMiddleware, canManageSettings, backfillHistoricalOrders);
router.get('/:id', authMiddleware, canManageSettings, getDealById);
router.post('/', authMiddleware, canManageSettings, createDeal);
router.put('/:id', authMiddleware, canManageSettings, updateDeal);
router.delete('/:id', authMiddleware, canManageSettings, deleteDeal);
router.patch('/:id/toggle', authMiddleware, canManageSettings, toggleDealStatus);
router.put('/priorities/update', authMiddleware, canManageSettings, updateDealPriorities);

module.exports = router;

