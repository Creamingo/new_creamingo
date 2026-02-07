const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const ACCESS_TOKEN_EXPIRES_IN = process.env.ADMIN_ACCESS_TOKEN_EXPIRES_IN
  || process.env.ACCESS_TOKEN_EXPIRES_IN
  || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN
  || process.env.REFRESH_TOKEN_EXPIRES_IN
  || '7d';
const REFRESH_TOKEN_REMEMBER_EXPIRES_IN = process.env.ADMIN_REFRESH_TOKEN_REMEMBER_EXPIRES_IN
  || process.env.REFRESH_TOKEN_REMEMBER_EXPIRES_IN
  || '30d';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const parseDurationToMs = (value, fallbackMs) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return fallbackMs;
  }
  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    return fallbackMs;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  return amount * (multipliers[unit] || 0);
};

const computeExpiryDate = (duration, fallbackMs) => {
  const ms = parseDurationToMs(duration, fallbackMs);
  return new Date(Date.now() + ms);
};

const generateAccessToken = (userId) => {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN, jwtid: tokenId }
  );
  return { token, tokenId };
};

const generateRefreshToken = (userId, rememberMe = false) => {
  const tokenId = crypto.randomUUID();
  const expiresIn = rememberMe ? REFRESH_TOKEN_REMEMBER_EXPIRES_IN : REFRESH_TOKEN_EXPIRES_IN;
  const token = jwt.sign(
    { userId, type: 'refresh' },
    REFRESH_TOKEN_SECRET,
    { expiresIn, jwtid: tokenId }
  );
  const expiresAt = computeExpiryDate(expiresIn, 7 * 24 * 60 * 60 * 1000);
  return { token, tokenId, expiresAt, expiresIn, isPersistent: rememberMe };
};

const storeRefreshToken = async (userId, tokenId, expiresAt, isPersistent) => {
  await query(
    `INSERT INTO auth_refresh_tokens (user_id, token_id, expires_at, is_persistent, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [userId, tokenId, expiresAt, isPersistent ? 1 : 0]
  );
};

const revokeRefreshToken = async (tokenId) => {
  await query(
    `UPDATE auth_refresh_tokens
     SET revoked_at = NOW(), last_used_at = NOW()
     WHERE token_id = ? AND revoked_at IS NULL`,
    [tokenId]
  );
};

const getRefreshTokenRecord = async (tokenId) => {
  const result = await query(
    `SELECT user_id, expires_at, revoked_at, is_persistent
     FROM auth_refresh_tokens
     WHERE token_id = ?`,
    [tokenId]
  );
  return result.rows[0] || null;
};

const blacklistToken = async (tokenId, expiresAt) => {
  if (!tokenId || !expiresAt) {
    return;
  }
  await query(
    `INSERT IGNORE INTO token_blacklist (token_id, expires_at, created_at)
     VALUES (?, ?, NOW())`,
    [tokenId, expiresAt]
  );
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'staff' } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await query(
      `INSERT INTO users (name, email, password, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, email, hashedPassword, role]
    );

    // Get the inserted user
    const insertedUser = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE email = ?',
      [email]
    );

    const user = insertedUser.rows[0];

    // Generate tokens
    const { token: accessToken } = generateAccessToken(user.id);
    const refreshData = generateRefreshToken(user.id, false);
    await storeRefreshToken(user.id, refreshData.tokenId, refreshData.expiresAt, refreshData.isPersistent);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        token: accessToken,
        refresh_token: refreshData.token,
        access_expires_in: ACCESS_TOKEN_EXPIRES_IN,
        refresh_expires_in: refreshData.expiresIn
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find user by email
    const result = await query(
      'SELECT id, name, email, password, role, avatar, is_active, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate tokens
    const { token: accessToken } = generateAccessToken(user.id);
    const refreshData = generateRefreshToken(user.id, rememberMe);
    await storeRefreshToken(user.id, refreshData.tokenId, refreshData.expiresAt, refreshData.isPersistent);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          is_active: user.is_active,
          last_login: new Date().toISOString(),
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token: accessToken,
        refresh_token: refreshData.token,
        access_expires_in: ACCESS_TOKEN_EXPIRES_IN,
        refresh_expires_in: refreshData.expiresIn
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT id, name, email, role, avatar, last_login, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, avatar } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingUser.rows.length > 0) {
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
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    await query(queryStr, values);

    // Get updated user
    const result = await query(
      'SELECT id, name, email, role, avatar, last_login, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get current user
    const result = await query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
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

// Refresh access token
const refresh = async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    if (decoded.type && decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokenId = decoded.jti;
    if (!tokenId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const record = await getRefreshTokenRecord(tokenId);
    if (!record || record.revoked_at) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked'
      });
    }

    if (decoded.userId && Number(decoded.userId) !== Number(record.user_id)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const now = new Date();
    if (new Date(record.expires_at) <= now) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    // Ensure user still exists and is active
    const userResult = await query(
      'SELECT id, name, email, role, avatar, is_active, created_at, updated_at FROM users WHERE id = ?',
      [record.user_id]
    );
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Rotate refresh token
    await revokeRefreshToken(tokenId);
    const refreshData = generateRefreshToken(record.user_id, record.is_persistent === 1 || record.is_persistent === true);
    await storeRefreshToken(record.user_id, refreshData.tokenId, refreshData.expiresAt, refreshData.isPersistent);

    const { token: accessToken } = generateAccessToken(record.user_id);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        token: accessToken,
        refresh_token: refreshData.token,
        access_expires_in: ACCESS_TOKEN_EXPIRES_IN,
        refresh_expires_in: refreshData.expiresIn
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.body.refreshToken;

    if (req.auth && req.auth.decoded) {
      const decoded = req.auth.decoded;
      const tokenId = decoded.jti;
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
      await blacklistToken(tokenId, expiresAt);
    }

    if (refreshToken) {
      try {
        const decodedRefresh = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        if (decodedRefresh?.jti) {
          await revokeRefreshToken(decodedRefresh.jti);
        }
      } catch (error) {
        // Ignore invalid refresh tokens on logout
      }
    }

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
  refresh,
  getMe,
  updateProfile,
  changePassword,
  logout
};