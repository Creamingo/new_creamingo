const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Middleware to verify customer JWT token
const customerAuthMiddleware = async (req, res, next) => {
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
    
    // Check if token contains customerId (customer token) vs userId (admin token)
    if (!decoded.customerId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Customer token required.'
      });
    }

    // Get customer from database
    const result = await query(
      'SELECT id, name, email, phone, address, is_active, created_at, updated_at FROM customers WHERE id = ?',
      [decoded.customerId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Customer not found.'
      });
    }

    const customer = result.rows[0];

    // Check if customer account is active
    if (!customer.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Add customer to request object
    req.customer = customer;
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

    console.error('Customer auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Middleware to check if customer is authenticated (optional)
const optionalCustomerAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Only process if it's a customer token
        if (decoded.customerId) {
          const result = await query(
            'SELECT id, name, email, phone, address, is_active, created_at, updated_at FROM customers WHERE id = ?',
            [decoded.customerId]
          );
          
          if (result.rows.length > 0 && result.rows[0].is_active) {
            req.customer = result.rows[0];
          }
        }
      } catch (error) {
        // If token is invalid, just continue without customer
        // This allows optional auth to work
      }
    }
    
    next();
  } catch (error) {
    // If there's any error, just continue without customer
    next();
  }
};

module.exports = {
  customerAuthMiddleware,
  optionalCustomerAuth
};

