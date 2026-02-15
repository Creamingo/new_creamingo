const express = require('express');
const router = express.Router();
const { createWish, getMyWishes, getWishByPublicId, deleteWish } = require('../controllers/midnightWishController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');

const createWishSchema = Joi.object({
  message: Joi.string().max(500).allow('', null),
  occasion: Joi.string().max(100).allow('', null),
  delivery_pincode: Joi.string().max(10).allow('', null),
  delivery_address: Joi.object().allow(null),
  items: Joi.array()
    .min(1)
    .items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        variant_id: Joi.number().integer().allow(null),
        quantity: Joi.number().integer().min(1)
      })
    )
    .required()
});

// Authenticated: create wish, list my wishes, delete wish
router.post('/', customerAuthMiddleware, validate(createWishSchema), createWish);
router.get('/', customerAuthMiddleware, getMyWishes);
router.delete('/:wishId', customerAuthMiddleware, deleteWish);

// Public: get wish by shareable id (no auth)
router.get('/:publicId', getWishByPublicId);

module.exports = router;
