const { query } = require('../config/db');
const { getCurrentIST, convertToIST } = require('../utils/timezone');

// Get wallet balance for a customer
const getWalletBalance = async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Check if wallet_transactions table exists
    try {
      await query('SELECT 1 FROM wallet_transactions LIMIT 1');
    } catch (error) {
      console.error('Wallet tables do not exist. Please run the migration.');
      return res.status(500).json({
        success: false,
        message: 'Wallet system not initialized. Please run the database migration.',
        error: process.env.NODE_ENV === 'development' ? 'Tables do not exist. Run: node scripts/run-wallet-migration.js' : undefined
      });
    }

    // Get customer with wallet balance - handle NULL values
    const customerResult = await query(
      'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate actual balance from transactions for accuracy
    const transactionsResult = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_debits
      FROM wallet_transactions 
      WHERE customer_id = ?`,
      [customerId]
    );

    const { total_credits, total_debits } = transactionsResult.rows[0];
    const calculatedBalance = parseFloat(total_credits) - parseFloat(total_debits);

    // Update cached balance if different (always update to keep in sync)
    const currentBalance = parseFloat(customerResult.rows[0].wallet_balance) || 0;
    if (Math.abs(calculatedBalance - currentBalance) > 0.01) {
      try {
        await query(
          'UPDATE customers SET wallet_balance = ? WHERE id = ?',
          [calculatedBalance, customerId]
        );
        console.log(`Balance synced: ${currentBalance} -> ${calculatedBalance}`);
      } catch (error) {
        console.error('Error updating wallet balance:', error);
      }
    }

    res.json({
      success: true,
      data: {
        balance: calculatedBalance,
        totalEarned: parseFloat(total_credits),
        totalSpent: parseFloat(total_debits)
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get wallet transactions
const getWalletTransactions = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE customer_id = ?';
    let params = [customerId];

    if (type && (type === 'credit' || type === 'debit')) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

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
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`,
      params
    );

    // Convert dates to IST ISO format using the utility function
    const transactions = transactionsResult.rows.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      orderId: tx.order_id,
      description: tx.description,
      status: tx.status,
      transactionType: tx.transaction_type,
      createdAt: convertToIST(tx.created_at) || tx.created_at
    }));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Credit welcome bonus
const creditWelcomeBonus = async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Check if welcome bonus already credited
    const customerResult = await query(
      'SELECT welcome_bonus_credited, COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (customerResult.rows[0].welcome_bonus_credited) {
      return res.status(400).json({
        success: false,
        message: 'Welcome bonus already credited'
      });
    }

    const bonusAmount = 50.00;
    const currentBalance = parseFloat(customerResult.rows[0].wallet_balance) || 0;
    const newBalance = currentBalance + bonusAmount;

      // Create transaction record - SQLite's datetime('now') stores in UTC
      // We'll convert to IST when reading, so store in UTC for consistency
      const insertResult = await query(
        `INSERT INTO wallet_transactions 
        (customer_id, type, amount, description, status, transaction_type, created_at, updated_at)
        VALUES (?, 'credit', ?, ?, 'completed', 'welcome_bonus', datetime('now'), datetime('now'))`,
        [customerId, bonusAmount, 'Welcome Bonus']
      );

    console.log('Transaction created:', insertResult.lastID);

    // Create notification
    try {
      const { createWalletNotification } = require('../utils/notificationHelper');
      await createWalletNotification(customerId, 'welcome_bonus', bonusAmount, 'Welcome Bonus');
    } catch (notifError) {
      console.error('Notification creation error:', notifError);
      // Don't fail if notification fails
    }

    // Update customer balance - handle NULL values
    const updateResult = await query(
      'UPDATE customers SET wallet_balance = ?, welcome_bonus_credited = 1 WHERE id = ?',
      [newBalance, customerId]
    );

    console.log('Balance updated. Rows affected:', updateResult.rowCount);
    console.log('New balance:', newBalance);

    // Verify the transaction was created
    const verifyResult = await query(
      'SELECT COUNT(*) as count FROM wallet_transactions WHERE customer_id = ? AND transaction_type = ?',
      [customerId, 'welcome_bonus']
    );

    console.log('Verification - welcome bonus transactions:', verifyResult.rows[0].count);

    res.json({
      success: true,
      message: 'Welcome bonus credited successfully',
      data: {
        amount: bonusAmount,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Credit welcome bonus error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get wallet statistics
const getWalletStats = async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Get statistics
    const statsResult = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_spent,
        COUNT(CASE WHEN type = 'credit' AND status = 'completed' THEN 1 END) as total_credits,
        COUNT(CASE WHEN type = 'debit' AND status = 'completed' THEN 1 END) as total_debits
      FROM wallet_transactions 
      WHERE customer_id = ?`,
      [customerId]
    );

    // Get this month's earnings
    const thisMonthResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as earned_this_month
      FROM wallet_transactions 
      WHERE customer_id = ? 
        AND type = 'credit' 
        AND status = 'completed'
        AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
      [customerId]
    );

    const stats = statsResult.rows[0];
    const earnedThisMonth = thisMonthResult.rows[0].earned_this_month;

    res.json({
      success: true,
      data: {
        totalEarned: parseFloat(stats.total_earned),
        totalSpent: parseFloat(stats.total_spent),
        earnedThisMonth: parseFloat(earnedThisMonth),
        totalCredits: stats.total_credits,
        totalDebits: stats.total_debits
      }
    });
  } catch (error) {
    console.error('Get wallet stats error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getWalletBalance,
  getWalletTransactions,
  creditWelcomeBonus,
  getWalletStats
};

