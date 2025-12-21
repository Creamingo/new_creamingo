const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const leaderboardController = require('../controllers/leaderboardController');
const analyticsController = require('../controllers/analyticsController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');

// Get referral info and stats (requires authentication)
router.get('/info', customerAuthMiddleware, referralController.getReferralInfo);

// Get milestone progress (requires authentication)
router.get('/milestones', customerAuthMiddleware, referralController.getMilestoneProgress);

// Get tier progress (requires authentication)
router.get('/tier', customerAuthMiddleware, referralController.getTierProgress);

// Send referral email (requires authentication)
router.post('/send-email', customerAuthMiddleware, referralController.sendReferralEmail);

// Leaderboard endpoints
router.get('/leaderboard', leaderboardController.getLeaderboard);
router.get('/leaderboard/position', customerAuthMiddleware, leaderboardController.getUserLeaderboardPosition);

// Analytics endpoints
router.get('/analytics', customerAuthMiddleware, analyticsController.getReferralAnalytics);

// Validate referral code (public endpoint, used during signup)
router.post('/validate', referralController.validateReferralCodePublic);

module.exports = router;

