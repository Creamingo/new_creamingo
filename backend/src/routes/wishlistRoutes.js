const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  getWishlistCount,
  clearWishlist
} = require('../controllers/wishlistController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

// All wishlist routes require customer authentication
router.use(customerAuthMiddleware);

// Validation schemas
const addToWishlistSchema = Joi.object({
  productId: Joi.number().integer().required()
});

// Routes
router.get('/', getWishlist);
router.get('/count', getWishlistCount);
router.get('/check/:productId', checkWishlist);
router.post('/', validate(addToWishlistSchema), addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.delete('/', clearWishlist);

module.exports = router;

