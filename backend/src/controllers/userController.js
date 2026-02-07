const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const offset = (pageNumber - 1) * limitNumber;
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (role) {
      whereConditions.push(`role = $${paramCount}`);
      queryParams.push(role);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(LOWER(name) LIKE LOWER($${paramCount}) OR LOWER(email) LIKE LOWER($${paramCount}))`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort parameters
    const allowedSortFields = ['name', 'email', 'role', 'created_at', 'last_login'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get users (exclude password) - Order by role hierarchy first, then by order_index
    const usersQuery = `
      SELECT 
        id, name, email, role, avatar, is_active, last_login, order_index, owned_bike, driving_license_number, contact_number, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY 
        CASE role 
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'staff' THEN 3
          WHEN 'bakery_production' THEN 4
          WHEN 'delivery_boy' THEN 5
          ELSE 6
        END,
        order_index ASC,
        created_at ASC
      LIMIT ${limitNumber} OFFSET ${offset}
    `;

    const usersResult = await query(usersQuery, queryParams);

    res.json({
      success: true,
      data: usersResult.rows,
      count: usersResult.rows.length,
      pagination: {
        current_page: pageNumber,
        per_page: limitNumber,
        total,
        total_pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT id, name, email, role, avatar, is_active, last_login, order_index, owned_bike, driving_license_number, contact_number, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new user (admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, is_active = true, owned_bike, driving_license_number, contact_number } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Validate delivery boy specific fields
    if (role === 'delivery_boy') {
      if (owned_bike === undefined || owned_bike === null) {
        return res.status(400).json({
          success: false,
          message: 'Owned bike status is required for delivery boy'
        });
      }
      if (!driving_license_number || !driving_license_number.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Driving license number is required for delivery boy'
        });
      }
      if (!contact_number || !contact_number.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Contact number is required for delivery boy'
        });
      }
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email is already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Get the next order_index for new user
    const maxOrderResult = await query('SELECT MAX(order_index) as max_order FROM users');
    const nextOrderIndex = (maxOrderResult.rows[0].max_order || 0) + 1;

    // Create user with delivery boy fields if applicable
    const result = await query(`
      INSERT INTO users (name, email, password, role, is_active, order_index, owned_bike, driving_license_number, contact_number, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, 
      email, 
      hashedPassword, 
      role, 
      is_active, 
      nextOrderIndex,
      role === 'delivery_boy' ? (owned_bike ? 1 : 0) : null,
      role === 'delivery_boy' ? driving_license_number : null,
      role === 'delivery_boy' ? contact_number : null
    ]);

    // Get the created user data
    const newUser = await query(
      'SELECT id, name, email, role, avatar, is_active, last_login, order_index, owned_bike, driving_license_number, contact_number, created_at, updated_at FROM users WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser.rows[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (updateData.email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [updateData.email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'password') {
        // Handle owned_bike boolean conversion
        if (key === 'owned_bike') {
          updates.push(`${key} = ?`);
          values.push(updateData[key] ? 1 : 0);
        } else {
          updates.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });

    // Handle password update separately
    if (updateData.password) {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(updateData.password, saltRounds);
      updates.push(`password = ?`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const queryText = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    await query(queryText, values);

    // Get the updated user data
    const updatedUser = await query(
      'SELECT id, name, email, role, avatar, is_active, last_login, order_index, owned_bike, driving_license_number, contact_number, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of the last super admin
    if (existingUser.rows[0].role === 'super_admin') {
      const superAdminCount = await query(
        'SELECT COUNT(*) as count FROM users WHERE role = ?',
        ['super_admin']
      );

      if (parseInt(superAdminCount.rows[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last super admin'
        });
      }
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating the last super admin
    if (existingUser.rows[0].role === 'super_admin' && !is_active) {
      const superAdminCount = await query(
        'SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = ?',
        ['super_admin', 1]
      );

      if (parseInt(superAdminCount.rows[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last super admin'
        });
      }
    }

    // Prevent self-deactivation
    if (parseInt(id) === req.user.id && !is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const result = await query(`
      UPDATE users 
      SET is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [is_active ? 1 : 0, id]);

    // Get the updated user data
    const updatedUser = await query(
      'SELECT id, name, email, role, avatar, is_active, last_login, order_index, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await query(`
      UPDATE users 
      SET password = ?, updated_at = NOW()
      WHERE id = ?
    `, [hashedPassword, id]);

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

// Bulk update order of users (maintains role hierarchy)
const updateUserOrder = async (req, res) => {
  try {
    const { userOrders } = req.body;

    if (!userOrders || !Array.isArray(userOrders)) {
      return res.status(400).json({
        success: false,
        message: 'User orders array is required'
      });
    }

    // Validate the data structure
    for (const item of userOrders) {
      if (!item.id || typeof item.orderIndex !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Each item must have id and orderIndex'
        });
      }
    }

    // Get all users with their roles to validate hierarchy
    const allUsers = await query(`
      SELECT id, role, order_index 
      FROM users 
      ORDER BY 
        CASE role 
          WHEN 'super_admin' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'staff' THEN 3
          WHEN 'bakery_production' THEN 4
          WHEN 'delivery_boy' THEN 5
          ELSE 6
        END,
        order_index ASC
    `);

    // Group users by role
    const roleGroups = {
      super_admin: [],
      admin: [],
      staff: [],
      bakery_production: [],
      delivery_boy: []
    };

    allUsers.rows.forEach(user => {
      if (roleGroups[user.role]) {
        roleGroups[user.role].push(user);
      }
    });

    // Update order_index within each role group
    let globalOrderIndex = 1;
    
    // Super Admin first
    for (const user of roleGroups.super_admin) {
      await query(
        'UPDATE users SET order_index = ?, updated_at = NOW() WHERE id = ?',
        [globalOrderIndex++, user.id]
      );
    }
    
    // Admin second
    for (const user of roleGroups.admin) {
      await query(
        'UPDATE users SET order_index = ?, updated_at = NOW() WHERE id = ?',
        [globalOrderIndex++, user.id]
      );
    }
    
    // Staff third
    for (const user of roleGroups.staff) {
      await query(
        'UPDATE users SET order_index = ?, updated_at = NOW() WHERE id = ?',
        [globalOrderIndex++, user.id]
      );
    }
    
    // Bakery Production fourth
    for (const user of roleGroups.bakery_production) {
      await query(
        'UPDATE users SET order_index = ?, updated_at = NOW() WHERE id = ?',
        [globalOrderIndex++, user.id]
      );
    }
    
    // Delivery Boy fifth
    for (const user of roleGroups.delivery_boy) {
      await query(
        'UPDATE users SET order_index = ?, updated_at = NOW() WHERE id = ?',
        [globalOrderIndex++, user.id]
      );
    }

    res.json({
      success: true,
      message: 'User order updated successfully with role hierarchy maintained',
      data: {
        updatedCount: allUsers.rows.length
      }
    });
  } catch (error) {
    console.error('Error updating user order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user order'
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
        COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff
      FROM users
    `);

    const result = stats.rows[0];

    res.json({
      success: true,
      data: {
        total: parseInt(result.total),
        active: parseInt(result.active),
        inactive: parseInt(result.inactive),
        superAdmins: parseInt(result.super_admins),
        staff: parseInt(result.staff)
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  changePassword,
  updateUserOrder,
  getUserStats
};
