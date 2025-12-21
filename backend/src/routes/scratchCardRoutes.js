const express = require('express');
const router = express.Router();
const scratchCardController = require('../controllers/scratchCardController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');

// All scratch card routes require customer authentication
router.use(customerAuthMiddleware);

// Get available scratch cards
router.get('/', scratchCardController.getScratchCards);

// Reveal scratch card
router.post('/reveal', scratchCardController.revealScratchCard);

// Credit scratch card (after delivery confirmation)
router.post('/credit', scratchCardController.creditScratchCard);

module.exports = router;

