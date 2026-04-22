const rateLimit = require('express-rate-limit');

const authRateLimitWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX) || 20;

/**
 * Rate limiter for sensitive auth actions (login, register, refresh).
 * Applied only to those routes so GET /me and other protected routes are not limited.
 */
const authLimiter = rateLimit({
  windowMs: authRateLimitWindowMs,
  max: authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  }
});

module.exports = { authLimiter };
