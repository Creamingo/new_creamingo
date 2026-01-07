const { query } = require('../config/db');

// Get all customers with pagination and filters
const getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Convert to integers for MySQL
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (search) {
      whereConditions.push(`(name LIKE ? OR email LIKE ? OR phone LIKE ?)`);
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramCount += 3;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort parameters
    const allowedSortFields = ['name', 'email', 'phone', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get customers with order statistics
    const customersQuery = `
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.created_at,
        c.updated_at,
        COALESCE(COUNT(o.id), 0) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      ${whereClause}
      GROUP BY c.id, c.name, c.email, c.phone, c.address, c.created_at, c.updated_at
      ORDER BY c.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const customersQueryParams = [...queryParams, limitNum, offset];
    const customersResult = await query(customersQuery, customersQueryParams);

    res.json({
      success: true,
      data: customersResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single customer
const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.created_at,
        c.updated_at,
        COALESCE(COUNT(o.id), 0) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.email, c.phone, c.address, c.created_at, c.updated_at
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Check if customer with email already exists
    const existingCustomer = await query(
      'SELECT id FROM customers WHERE email = ?',
      [email]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    const result = await query(`
      INSERT INTO customers (name, email, phone, address)
      VALUES (?, ?, ?, ?)
    `, [name, email, phone, JSON.stringify(address || {})]);

    const newCustomer = await query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.created_at,
        c.updated_at,
        0 as total_orders,
        0 as total_spent,
        NULL as last_order_date
      FROM customers c
      WHERE c.id = ?
    `, [result.lastID]);

    res.status(201).json({
      success: true,
      data: newCustomer.rows[0],
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    // Check if customer exists
    const existingCustomer = await query(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if email is being changed and if new email already exists
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM customers WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists'
        });
      }
    }

    await query(`
      UPDATE customers 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, email, phone, address ? JSON.stringify(address) : null, id]);

    const updatedCustomer = await query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.created_at,
        c.updated_at,
        COALESCE(COUNT(o.id), 0) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = ?
      GROUP BY c.id, c.name, c.email, c.phone, c.address, c.created_at, c.updated_at
    `, [id]);

    res.json({
      success: true,
      data: updatedCustomer.rows[0],
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const existingCustomer = await query(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has orders
    const ordersCheck = await query(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders'
      });
    }

    await query('DELETE FROM customers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get customer statistics
const getCustomerStats = async (req, res) => {
  try {
    // Get total customers
    const totalCustomersResult = await query('SELECT COUNT(*) as total FROM customers');
    const total_customers = parseInt(totalCustomersResult.rows[0].total);

    // Get active customers (customers with at least one order)
    const activeCustomersResult = await query(`
      SELECT COUNT(DISTINCT c.id) as active_count
      FROM customers c
      INNER JOIN orders o ON c.id = o.customer_id
    `);
    const active_customers = parseInt(activeCustomersResult.rows[0].active_count);

    // Get new customers this month
    const newThisMonthResult = await query(`
      SELECT COUNT(*) as new_count
      FROM customers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    const new_this_month = parseInt(newThisMonthResult.rows[0].new_count);

    // Get VIP customers (customers who spent more than $200)
    const vipCustomersResult = await query(`
      SELECT COUNT(DISTINCT c.id) as vip_count
      FROM customers c
      INNER JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id
      HAVING SUM(o.total_amount) > 200
    `);
    const vip_customers = vipCustomersResult.rows.length;

    const stats = {
      total_customers,
      active_customers,
      new_this_month,
      vip_customers
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get customer orders
const getCustomerOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // Check if customer exists
    const customerCheck = await query(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM orders WHERE customer_id = ?',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get orders
    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.delivery_date,
        o.delivery_time,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const ordersResult = await query(ordersQuery, [id, limit, offset]);

    res.json({
      success: true,
      data: ordersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get customer wallet transactions
const getCustomerWalletTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if customer exists
    const customerCheck = await query(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get wallet balance
    const balanceResult = await query(
      'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
      [id]
    );
    const walletBalance = parseFloat(balanceResult.rows[0].wallet_balance) || 0;

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM wallet_transactions WHERE customer_id = ?',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get transactions
    const transactionsResult = await query(
      `SELECT 
        id,
        type,
        amount,
        order_id,
        description,
        status,
        transaction_type,
        created_at
      FROM wallet_transactions
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    res.json({
      success: true,
      data: {
        walletBalance,
        transactions: transactionsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customer wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get customer referrals
const getCustomerReferrals = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customerCheck = await query(
      'SELECT id, referral_code, referred_by FROM customers WHERE id = ?',
      [id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customer = customerCheck.rows[0];

    // Get referral code info
    const referralCode = customer.referral_code;

    // Get referrer info (if this customer was referred)
    let referrerInfo = null;
    if (customer.referred_by) {
      const referrerResult = await query(
        'SELECT id, name, email, phone FROM customers WHERE id = ?',
        [customer.referred_by]
      );
      if (referrerResult.rows.length > 0) {
        referrerInfo = referrerResult.rows[0];
      }
    }

    // Get referrals made by this customer (people they referred)
    const referralsResult = await query(
      `SELECT 
        r.id,
        r.referee_id,
        r.order_id,
        r.referrer_bonus_amount,
        r.referee_bonus_amount,
        r.referrer_bonus_credited,
        r.referee_bonus_credited,
        r.created_at,
        c.name as referee_name,
        c.email as referee_email,
        o.order_number,
        o.total_amount as order_amount
      FROM referrals r
      LEFT JOIN customers c ON r.referee_id = c.id
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC`,
      [id]
    );

    // Get referral stats
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN r.referrer_bonus_credited = 1 THEN r.referrer_bonus_amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN r.referee_bonus_credited = 1 THEN 1 ELSE 0 END) as successful_referrals
      FROM referrals r
      WHERE r.referrer_id = ?`,
      [id]
    );

    const stats = statsResult.rows[0] || {
      total_referrals: 0,
      total_earned: 0,
      successful_referrals: 0
    };

    res.json({
      success: true,
      data: {
        referralCode,
        referrerInfo,
        referrals: referralsResult.rows,
        stats: {
          totalReferrals: parseInt(stats.total_referrals) || 0,
          totalEarned: parseFloat(stats.total_earned) || 0,
          successfulReferrals: parseInt(stats.successful_referrals) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get customer referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get customer scratch cards
const getCustomerScratchCards = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check if customer exists
    const customerCheck = await query(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM scratch_cards WHERE customer_id = ?',
      [id]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get scratch cards
    const cardsResult = await query(
      `SELECT 
        sc.id,
        sc.order_id,
        sc.amount,
        sc.status,
        sc.revealed_at,
        sc.credited_at,
        sc.created_at,
        o.order_number
      FROM scratch_cards sc
      LEFT JOIN orders o ON sc.order_id = o.id
      WHERE sc.customer_id = ?
      ORDER BY sc.created_at DESC
      LIMIT ? OFFSET ?`,
      [id, limit, offset]
    );

    res.json({
      success: true,
      data: {
        scratchCards: cardsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customer scratch cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get customer tier and milestone info
const getCustomerTierInfo = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customerCheck = await query(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get referral count for tier calculation
    const referralCountResult = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ? AND referrer_bonus_credited = 1',
      [id]
    );
    const referralCount = parseInt(referralCountResult.rows[0].count) || 0;

    // Get tier info using tierService
    try {
      const { getUserTier, getTierProgress } = require('../services/tierService');
      const currentTier = getUserTier(referralCount);
      const tierProgress = getTierProgress(referralCount);

      // Get milestone progress
      const { getMilestoneProgress } = require('../services/milestoneService');
      const milestoneProgress = getMilestoneProgress(id);

      res.json({
        success: true,
        data: {
          currentTier,
          tierProgress,
          milestoneProgress,
          referralCount
        }
      });
    } catch (tierError) {
      console.error('Tier service error:', tierError);
      res.json({
        success: true,
        data: {
          currentTier: null,
          tierProgress: null,
          milestoneProgress: null,
          referralCount
        }
      });
    }
  } catch (error) {
    console.error('Get customer tier info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getCustomerOrders,
  getCustomerWalletTransactions,
  getCustomerReferrals,
  getCustomerScratchCards,
  getCustomerTierInfo
};
