const express = require('express');
const router = express.Router();
const { list, getOne, getMessages, update } = require('../controllers/ticketsController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', list);
router.get('/:id', getOne);
router.get('/:id/messages', getMessages);
router.patch('/:id', update);

module.exports = router;
