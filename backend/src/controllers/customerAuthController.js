const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Generate JWT token for customer
const generateToken = (customerId) => {
  return jwt.sign(
    { customerId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new customer
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, referralCode } = req.body;

    // Check if customer already exists
    const existingCustomer = await query(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create customer
    const result = await query(
      `INSERT INTO customers (name, email, password, phone, address, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        name,
        email,
        hashedPassword,
        phone || null,
        address ? JSON.stringify(address) : null
      ]
    );

    const newCustomerId = result.lastID;

    // Generate referral code for the new customer
    const { getOrCreateReferralCode } = require('./referralController');
    const referralCodeResult = await getOrCreateReferralCode(newCustomerId);
    const customerReferralCode = referralCodeResult.referralCode;

    // Handle referral code if provided (user was referred by someone)
    let referralCreated = false;
    if (referralCode && referralCode.trim()) {
      try {
        const { createReferral } = require('./referralController');
        const referralResult = await createReferral(newCustomerId, referralCode);
        if (referralResult.success) {
          referralCreated = true;
          console.log(`Referral created for new customer ${newCustomerId} using code ${referralCode}`);
        } else {
          console.log(`Failed to create referral: ${referralResult.message}`);
        }
      } catch (referralError) {
        // Don't fail registration if referral creation fails
        console.error('Referral creation error during registration:', referralError);
      }
    }

    // Get the inserted customer
    const insertedCustomer = await query(
      'SELECT id, name, email, phone, address, created_at, is_active, referral_code FROM customers WHERE id = ?',
      [newCustomerId]
    );

    const customer = insertedCustomer.rows[0];

    // Generate token
    const token = generateToken(customer.id);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address ? JSON.parse(customer.address) : null,
          is_active: customer.is_active,
          referral_code: customer.referral_code,
          created_at: customer.created_at
        },
        token,
        referralCreated
      }
    });
  } catch (error) {
    console.error('Customer register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login customer
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find customer by email
    const result = await query(
      'SELECT id, name, email, password, phone, address, is_active, COALESCE(wallet_balance, 0) as wallet_balance, COALESCE(welcome_bonus_credited, 0) as welcome_bonus_credited, created_at, updated_at FROM customers WHERE email = ?',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const customer = result.rows[0];

    // Check if customer has a password (account might be from before auth was added)
    if (!customer.password) {
      return res.status(401).json({
        success: false,
        message: 'Please set a password for your account. Use forgot password or contact support.'
      });
    }

    // Check if account is active
    if (!customer.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await query(
      'UPDATE customers SET last_login = NOW() WHERE id = ?',
      [customer.id]
    );

    // Generate token
    const token = generateToken(customer.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address ? JSON.parse(customer.address) : null,
          is_active: customer.is_active,
          last_login: new Date().toISOString(),
          wallet_balance: parseFloat(customer.wallet_balance) || 0,
          welcome_bonus_credited: customer.welcome_bonus_credited === 1 || customer.welcome_bonus_credited === true,
          created_at: customer.created_at,
          updated_at: customer.updated_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current customer
const getMe = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const result = await query(
      'SELECT id, name, email, phone, address, is_active, last_login, COALESCE(wallet_balance, 0) as wallet_balance, COALESCE(welcome_bonus_credited, 0) as welcome_bonus_credited, created_at, updated_at FROM customers WHERE id = ?',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customer = result.rows[0];

    res.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address ? JSON.parse(customer.address) : null,
        is_active: customer.is_active,
        last_login: customer.last_login,
        wallet_balance: parseFloat(customer.wallet_balance) || 0,
        welcome_bonus_credited: customer.welcome_bonus_credited === 1 || customer.welcome_bonus_credited === true,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update customer profile
const updateProfile = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { name, email, phone, address } = req.body;

    // Check if email is already taken by another customer
    if (email) {
      const existingCustomer = await query(
        'SELECT id FROM customers WHERE email = ? AND id != ?',
        [email, customerId]
      );

      if (existingCustomer.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(JSON.stringify(address));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(customerId);

    const queryStr = `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`;
    
    await query(queryStr, values);

    // Get updated customer
    const result = await query(
      'SELECT id, name, email, phone, address, is_active, last_login, COALESCE(wallet_balance, 0) as wallet_balance, COALESCE(welcome_bonus_credited, 0) as welcome_bonus_credited, created_at, updated_at FROM customers WHERE id = ?',
      [customerId]
    );

    const customer = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address ? JSON.parse(customer.address) : null,
        is_active: customer.is_active,
        last_login: customer.last_login,
        wallet_balance: parseFloat(customer.wallet_balance) || 0,
        welcome_bonus_credited: customer.welcome_bonus_credited === 1 || customer.welcome_bonus_credited === true,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      }
    });
  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { currentPassword, newPassword } = req.body;

    // Get current customer
    const result = await query(
      'SELECT password FROM customers WHERE id = ?',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customer = result.rows[0];

    // Verify current password
    if (customer.password) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, customer.password);

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE customers SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, customerId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout customer
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};

