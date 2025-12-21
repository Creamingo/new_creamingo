const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/customerAuthController');
const { customerAuthMiddleware } = require('../middleware/customerAuth');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.post('/register', validate(schemas.customerRegister), register);
router.post('/login', validate(schemas.customerLogin), login);

// Protected routes (require customer authentication)
router.get('/me', customerAuthMiddleware, getMe);
router.put('/profile', customerAuthMiddleware, validate(schemas.updateCustomerProfile), updateProfile);
router.put('/change-password', customerAuthMiddleware, validate(schemas.changeCustomerPassword), changePassword);
router.post('/logout', customerAuthMiddleware, logout);

module.exports = router;

