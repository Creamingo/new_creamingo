const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const deliveryWalletController = require('../controllers/deliveryWalletController');

// All delivery wallet routes require authenticated user with delivery_boy role
router.use(authMiddleware);

router.get('/summary', deliveryWalletController.getWalletSummary);
router.get('/transactions', deliveryWalletController.getWalletTransactions);

module.exports = router;

