const express = require('express');
const router = express.Router();
const {
  listIntents,
  createIntent,
  updateIntent,
  deleteIntent,
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq
} = require('../controllers/chatConfigController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/intents', listIntents);
router.post('/intents', createIntent);
router.put('/intents/:id', updateIntent);
router.delete('/intents/:id', deleteIntent);

router.get('/faqs', listFaqs);
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

module.exports = router;
