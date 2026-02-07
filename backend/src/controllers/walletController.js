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
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_debits
      FROM wallet_transactions 
      WHERE customer_id = ?`,
      [customerId]
    );

    const totalCount = parseInt(transactionsResult.rows[0].total_count, 10) || 0;
    const totalCredits = parseFloat(transactionsResult.rows[0].total_credits) || 0;
    const totalDebits = parseFloat(transactionsResult.rows[0].total_debits) || 0;
    const currentBalance = parseFloat(customerResult.rows[0].wallet_balance) || 0;

    let calculatedBalance = totalCredits - totalDebits;
    let totalEarned = totalCredits;
    let totalSpent = totalDebits;

    // Legacy fallback: if there are no transactions but wallet_balance exists, preserve it
    if (totalCount === 0 && currentBalance > 0) {
      calculatedBalance = currentBalance;
      totalEarned = currentBalance;
      totalSpent = 0;
    } else if (Math.abs(calculatedBalance - currentBalance) > 0.01) {
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
        totalEarned: totalEarned,
        totalSpent: totalSpent
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
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

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
      LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`,
      params
    );

    // Convert dates to IST ISO format using the utility function
    let transactions = transactionsResult.rows.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      orderId: tx.order_id,
      description: tx.description,
      status: tx.status,
      transactionType: tx.transaction_type,
      createdAt: convertToIST(tx.created_at) || tx.created_at
    }));

    // Legacy fallback: surface opening balance if no transactions exist
    if (transactions.length === 0) {
      const customerBalanceResult = await query(
        'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
        [customerId]
      );
      const legacyBalance = parseFloat(customerBalanceResult.rows[0]?.wallet_balance) || 0;
      if (legacyBalance > 0) {
        transactions = [
          {
            id: `opening-${customerId}`,
            type: 'credit',
            amount: legacyBalance,
            orderId: null,
            description: 'Opening Balance',
            status: 'completed',
            transactionType: 'opening_balance',
            createdAt: new Date().toISOString()
          }
        ];
      }
    }

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: transactions.length > 0 && transactionsResult.rows.length === 0 ? 1 : countResult.rows[0].total,
          totalPages: Math.ceil((transactions.length > 0 && transactionsResult.rows.length === 0 ? 1 : countResult.rows[0].total) / limitNum)
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

const creditWelcomeBonusForCustomer = async (customerId) => {
  const customerResult = await query(
    'SELECT welcome_bonus_credited, COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
    [customerId]
  );

  if (customerResult.rows.length === 0) {
    const error = new Error('Customer not found');
    error.code = 'CUSTOMER_NOT_FOUND';
    throw error;
  }

  if (customerResult.rows[0].welcome_bonus_credited) {
    return {
      credited: false,
      amount: 0,
      newBalance: parseFloat(customerResult.rows[0].wallet_balance) || 0
    };
  }

  const bonusAmount = 50.0;
  const currentBalance = parseFloat(customerResult.rows[0].wallet_balance) || 0;
  const newBalance = currentBalance + bonusAmount;

  await query(
    `INSERT INTO wallet_transactions 
    (customer_id, type, amount, description, status, transaction_type, created_at, updated_at)
    VALUES (?, 'credit', ?, ?, 'completed', 'welcome_bonus', NOW(), NOW())`,
    [customerId, bonusAmount, 'Welcome Bonus']
  );

  try {
    const { createWalletNotification } = require('../utils/notificationHelper');
    await createWalletNotification(customerId, 'welcome_bonus', bonusAmount, 'Welcome Bonus');
  } catch (notifError) {
    console.error('Notification creation error:', notifError);
  }

  await query(
    'UPDATE customers SET wallet_balance = ?, welcome_bonus_credited = 1 WHERE id = ?',
    [newBalance, customerId]
  );

  return { credited: true, amount: bonusAmount, newBalance };
};

// Credit welcome bonus
const creditWelcomeBonus = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const result = await creditWelcomeBonusForCustomer(customerId);

    if (!result.credited) {
      return res.status(400).json({
        success: false,
        message: 'Welcome bonus already credited'
      });
    }

    res.json({
      success: true,
      message: 'Welcome bonus credited successfully',
      data: {
        amount: result.amount,
        newBalance: result.newBalance
      }
    });
  } catch (error) {
    if (error.code === 'CUSTOMER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
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
        COUNT(*) as total_count,
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
        AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')`,
      [customerId]
    );

    const stats = statsResult.rows[0];
    const earnedThisMonth = thisMonthResult.rows[0].earned_this_month;
    const totalCount = parseInt(stats.total_count, 10) || 0;

    let totalEarned = parseFloat(stats.total_earned);
    let totalSpent = parseFloat(stats.total_spent);
    let totalCredits = stats.total_credits;
    let totalDebits = stats.total_debits;

    // Legacy fallback: if no transactions but wallet balance exists, show opening balance
    if (totalCount === 0) {
      const customerBalanceResult = await query(
        'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
        [customerId]
      );
      const legacyBalance = parseFloat(customerBalanceResult.rows[0]?.wallet_balance) || 0;
      if (legacyBalance > 0) {
        totalEarned = legacyBalance;
        totalSpent = 0;
        totalCredits = 1;
        totalDebits = 0;
      }
    }

    res.json({
      success: true,
      data: {
        totalEarned: totalEarned,
        totalSpent: totalSpent,
        earnedThisMonth: parseFloat(earnedThisMonth),
        totalCredits: totalCredits,
        totalDebits: totalDebits
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
  getWalletStats,
  creditWelcomeBonusForCustomer
};

