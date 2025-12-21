const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');

// All wallet routes require customer authentication
router.use(customerAuthMiddleware);

// Get wallet balance
router.get('/balance', walletController.getWalletBalance);

// Get wallet transactions
router.get('/transactions', walletController.getWalletTransactions);

// Credit welcome bonus
router.post('/welcome-bonus', walletController.creditWelcomeBonus);

// Get wallet statistics
router.get('/stats', walletController.getWalletStats);

module.exports = router;

