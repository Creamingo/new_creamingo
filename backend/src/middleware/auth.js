const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const isTokenBlacklisted = async (tokenId) => {
  if (!tokenId) {
    return false;
  }
  const result = await query(
    'SELECT id FROM token_blacklist WHERE token_id = ? AND expires_at > NOW()',
    [tokenId]
  );
  return result.rows.length > 0;
};

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.'
      });
    }

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (await isTokenBlacklisted(decoded.jti)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked.'
      });
    }
    
    // Get user from database
    const result = await query(
      'SELECT id, name, email, role, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Add user to request object
    req.user = user;
    req.auth = { token, decoded };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Middleware to check if user is authenticated (optional)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type && decoded.type !== 'access') {
        return next();
      }
      if (!decoded.userId) {
        return next();
      }
      if (await isTokenBlacklisted(decoded.jti)) {
        return next();
      }
      const result = await query(
        'SELECT id, name, email, role, avatar, created_at, updated_at FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuth
};
