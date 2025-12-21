const express = require('express');
const router = express.Router();
const {
  getMyReviews,
  getPendingReviews,
  submitReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');

// All review routes require customer authentication
router.use(customerAuthMiddleware);

// Routes
router.get('/my-reviews', getMyReviews);
router.get('/pending', getPendingReviews);
router.post('/', submitReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;

