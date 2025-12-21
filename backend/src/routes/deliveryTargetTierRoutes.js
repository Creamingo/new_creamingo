const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const deliveryTargetTierController = require('../controllers/deliveryTargetTierController');

// All routes require authentication
router.use(authMiddleware);

// Public routes (for delivery boys to see tiers and their progress) - any authenticated user
router.get('/active', deliveryTargetTierController.getActiveTargetTiers);
router.get('/progress', deliveryTargetTierController.getDailyProgress);

// Admin routes (require admin/staff role - checked in controller)
router.get('/admin', deliveryTargetTierController.getTargetTiers);
router.post('/admin', deliveryTargetTierController.upsertTargetTier);
router.put('/admin/:id', deliveryTargetTierController.upsertTargetTier);
router.delete('/admin/:id', deliveryTargetTierController.deleteTargetTier);

module.exports = router;
