const { query } = require('../config/db');
const { convertToIST } = require('../utils/timezone');

// Ensure only delivery boys can access these routes
const ensureDeliveryBoyRole = (req, res) => {
  if (!req.user || req.user.role !== 'delivery_boy') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Delivery boy account required.'
    });
    return false;
  }
  return true;
};

// Get wallet summary for a delivery boy
const getWalletSummary = async (req, res) => {
  try {
    if (!ensureDeliveryBoyRole(req, res)) return;

    const deliveryBoyId = req.user.id;

    // Check table existence
    try {
      await query('SELECT 1 FROM delivery_wallet_transactions LIMIT 1');
    } catch (error) {
      console.error('Delivery wallet table does not exist. Please run the migration.');
      return res.status(500).json({
        success: false,
        message: 'Delivery wallet system not initialized. Please run the database migration.'
      });
    }

    // Overall balance and totals
    const balanceResult = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN type IN ('earning','bonus') THEN amount ELSE 0 END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN type IN ('penalty','payout') THEN amount ELSE 0 END), 0) as total_debits
      FROM delivery_wallet_transactions
      WHERE delivery_boy_id = ?`,
      [deliveryBoyId]
    );

    const { total_credits, total_debits } = balanceResult.rows[0];
    const balance = parseFloat(total_credits) - parseFloat(total_debits);

    // Today / week / month earnings (only "earning" type)
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const earningsResult = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN date(created_at) = date('now', 'localtime') AND type = 'earning' THEN amount ELSE 0 END), 0) as today_earnings,
        COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND type = 'earning' THEN amount ELSE 0 END), 0) as week_earnings,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime') AND type = 'earning' THEN amount ELSE 0 END), 0) as month_earnings
      FROM delivery_wallet_transactions
      WHERE delivery_boy_id = ?`,
      [deliveryBoyId]
    );

    const { today_earnings, week_earnings, month_earnings } = earningsResult.rows[0];

    // Completed deliveries count (distinct orders with an earning record)
    const completedResult = await query(
      `SELECT COUNT(DISTINCT order_id) as completed_deliveries
       FROM delivery_wallet_transactions
       WHERE delivery_boy_id = ? AND type = 'earning'`,
      [deliveryBoyId]
    );

    const completed_deliveries = completedResult.rows[0].completed_deliveries || 0;

    res.json({
      success: true,
      data: {
        balance,
        todayEarnings: parseFloat(today_earnings),
        weekEarnings: parseFloat(week_earnings),
        monthEarnings: parseFloat(month_earnings),
        completedDeliveries: completed_deliveries
      }
    });
  } catch (error) {
    console.error('Get delivery wallet summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get wallet transactions for delivery boy
const getWalletTransactions = async (req, res) => {
  try {
    if (!ensureDeliveryBoyRole(req, res)) return;

    const deliveryBoyId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE delivery_boy_id = ?';
    const params = [deliveryBoyId];

    if (type && ['earning', 'bonus', 'penalty', 'payout'].includes(type)) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const txResult = await query(
      `SELECT id, delivery_boy_id, order_id, type, amount, meta, created_at
       FROM delivery_wallet_transactions
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM delivery_wallet_transactions
       ${whereClause}`,
      params
    );

    const transactions = (txResult.rows || []).map((tx) => ({
      id: tx.id,
      orderId: tx.order_id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      meta: tx.meta ? (() => {
        try {
          return JSON.parse(tx.meta);
        } catch {
          return null;
        }
      })() : null,
      createdAt: convertToIST(tx.created_at) || tx.created_at
    }));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult.rows[0].total,
          totalPages: Math.ceil(countResult.rows[0].total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get delivery wallet transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getWalletSummary,
  getWalletTransactions
};

