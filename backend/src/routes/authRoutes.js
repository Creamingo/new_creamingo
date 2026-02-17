const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/authRateLimit');
const { validate, schemas } = require('../middleware/validation');

// Public routes (rate-limited to prevent brute force)
router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/refresh', authLimiter, validate(schemas.refreshToken), refresh);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, validate(schemas.updateUser), updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
