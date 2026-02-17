const express = require('express');
const router = express.Router();
const { getSummary, getSessions, getSessionMessages } = require('../controllers/chatAnalyticsController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId/messages', getSessionMessages);

module.exports = router;
