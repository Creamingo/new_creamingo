const { query } = require('../config/db');

// Get referral analytics for a user
const getReferralAnalytics = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { period = '30' } = req.query; // days

    // Get overall stats
    const overallStats = await query(
      `SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals,
        COALESCE(SUM(CASE WHEN referrer_bonus_credited = 1 THEN referrer_bonus_amount ELSE 0 END), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN status = 'completed' AND referrer_bonus_credited = 0 THEN referrer_bonus_amount ELSE 0 END), 0) as pending_earnings
      FROM referrals
      WHERE referrer_id = ?`,
      [customerId]
    );

    // Get referrals by date (for chart)
    const referralsByDate = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM referrals
      WHERE referrer_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC`,
      [customerId, period]
    );

    // Get conversion rate over time
    const conversionStats = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as conversion_rate
      FROM referrals
      WHERE referrer_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [customerId, period]
    );

    // Get earnings by month
    const earningsByMonth = await query(
      `SELECT 
        DATE_FORMAT(referrer_bonus_credited_at, '%Y-%m') as month,
        SUM(referrer_bonus_amount) as earnings
      FROM referrals
      WHERE referrer_id = ? AND referrer_bonus_credited = 1 AND referrer_bonus_credited_at IS NOT NULL
      GROUP BY DATE_FORMAT(referrer_bonus_credited_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12`,
      [customerId]
    );

    // Get top performing referral sources (if we track source)
    const topReferrals = await query(
      `SELECT 
        r.id,
        c.name as referee_name,
        c.email as referee_email,
        r.status,
        r.referrer_bonus_amount,
        r.referrer_bonus_credited,
        r.created_at
      FROM referrals r
      LEFT JOIN customers c ON r.referee_id = c.id
      WHERE r.referrer_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10`,
      [customerId]
    );

    // Get average time to conversion
    const avgConversionTime = await query(
      `SELECT 
        AVG(TIMESTAMPDIFF(DAY, created_at, updated_at)) as avg_days
      FROM referrals
      WHERE referrer_id = ? AND status = 'completed' AND first_order_id IS NOT NULL`,
      [customerId]
    );

    const stats = overallStats.rows[0];
    const conversion = conversionStats.rows[0];

    res.json({
      success: true,
      data: {
        overall: {
          totalReferrals: stats.total_referrals || 0,
          completedReferrals: stats.completed_referrals || 0,
          pendingReferrals: stats.pending_referrals || 0,
          totalEarnings: parseFloat(stats.total_earnings) || 0,
          pendingEarnings: parseFloat(stats.pending_earnings) || 0,
          conversionRate: parseFloat(conversion?.conversion_rate) || 0,
          avgConversionDays: parseFloat(avgConversionTime.rows[0]?.avg_days) || 0
        },
        referralsByDate: referralsByDate.rows.map(row => ({
          date: row.date,
          total: row.count || 0,
          completed: row.completed_count || 0
        })),
        earningsByMonth: earningsByMonth.rows.map(row => ({
          month: row.month,
          earnings: parseFloat(row.earnings) || 0
        })),
        topReferrals: topReferrals.rows.map(row => ({
          id: row.id,
          refereeName: row.referee_name,
          refereeEmail: row.referee_email,
          status: row.status,
          bonusAmount: parseFloat(row.referrer_bonus_amount) || 0,
          credited: row.referrer_bonus_credited === 1,
          createdAt: row.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get referral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getReferralAnalytics
};

