const express = require('express');
const router = express.Router();
const { list, listMy, getOne, getMessages, update } = require('../controllers/ticketsController');
const { authMiddleware } = require('../middleware/auth');
const { customerAuthMiddleware } = require('../middleware/customerAuth');

// Customer route: only their own tickets
router.get('/my', customerAuthMiddleware, listMy);

// Admin/staff routes
router.use(authMiddleware);
router.get('/', list);
router.get('/:id', getOne);
router.get('/:id/messages', getMessages);
router.patch('/:id', update);

module.exports = router;
