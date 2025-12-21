const { query } = require('../config/db');

// Get leaderboard (top referrers)
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 50, period = 'all' } = req.query; // period: 'all', 'month', 'week'
    const limitNum = Math.min(parseInt(limit), 100); // Max 100

    let dateFilter = '';
    if (period === 'month') {
      dateFilter = "AND r.created_at >= datetime('now', '-1 month')";
    } else if (period === 'week') {
      dateFilter = "AND r.created_at >= datetime('now', '-7 days')";
    }

    // Get top referrers by completed referrals
    const leaderboardResult = await query(
      `SELECT 
        c.id,
        c.name,
        c.email,
        COUNT(r.id) as total_referrals,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
        COALESCE(SUM(CASE WHEN r.referrer_bonus_credited = 1 THEN r.referrer_bonus_amount ELSE 0 END), 0) as total_earnings,
        MAX(r.created_at) as last_referral_date
      FROM customers c
      LEFT JOIN referrals r ON c.id = r.referrer_id
      WHERE c.referral_code IS NOT NULL
      ${dateFilter}
      GROUP BY c.id, c.name, c.email
      HAVING total_referrals > 0
      ORDER BY completed_referrals DESC, total_referrals DESC
      LIMIT ?`,
      [limitNum]
    );

    // Get current user's rank if authenticated
    let userRank = null;
    if (req.customer) {
      const customerId = req.customer.id;
      const userStatsResult = await query(
        `SELECT 
          COUNT(r.id) as total_referrals,
          COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals
        FROM customers c
        LEFT JOIN referrals r ON c.id = r.referrer_id
        WHERE c.id = ?
        GROUP BY c.id`,
        [customerId]
      );

      if (userStatsResult.rows.length > 0) {
        const userStats = userStatsResult.rows[0];
        const rankResult = await query(
          `SELECT COUNT(*) + 1 as rank
           FROM (
             SELECT COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed
             FROM customers c
             LEFT JOIN referrals r ON c.id = r.referrer_id
             WHERE c.referral_code IS NOT NULL
             ${dateFilter}
             GROUP BY c.id
             HAVING completed > ?
           )`,
          [userStats.completed_referrals || 0]
        );
        userRank = rankResult.rows[0]?.rank || null;
      }
    }

    const leaderboard = leaderboardResult.rows.map((row, index) => ({
      rank: index + 1,
      customerId: row.id,
      name: row.name || 'Anonymous',
      email: row.email,
      totalReferrals: row.total_referrals || 0,
      completedReferrals: row.completed_referrals || 0,
      totalEarnings: parseFloat(row.total_earnings) || 0,
      lastReferralDate: row.last_referral_date
    }));

    res.json({
      success: true,
      data: {
        leaderboard,
        period,
        userRank,
        totalUsers: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's leaderboard position
const getUserLeaderboardPosition = async (req, res) => {
  try {
    const customerId = req.customer.id;

    const userStatsResult = await query(
      `SELECT 
        COUNT(r.id) as total_referrals,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_referrals,
        COALESCE(SUM(CASE WHEN r.referrer_bonus_credited = 1 THEN r.referrer_bonus_amount ELSE 0 END), 0) as total_earnings
      FROM customers c
      LEFT JOIN referrals r ON c.id = r.referrer_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [customerId]
    );

    if (userStatsResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          rank: null,
          totalReferrals: 0,
          completedReferrals: 0,
          totalEarnings: 0
        }
      });
    }

    const userStats = userStatsResult.rows[0];
    const completedReferrals = userStats.completed_referrals || 0;

    // Get rank
    const rankResult = await query(
      `SELECT COUNT(*) + 1 as rank
       FROM (
         SELECT COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed
         FROM customers c
         LEFT JOIN referrals r ON c.id = r.referrer_id
         WHERE c.referral_code IS NOT NULL
         GROUP BY c.id
         HAVING completed > ?
       )`,
      [completedReferrals]
    );

    const rank = rankResult.rows[0]?.rank || null;

    res.json({
      success: true,
      data: {
        rank,
        totalReferrals: userStats.total_referrals || 0,
        completedReferrals,
        totalEarnings: parseFloat(userStats.total_earnings) || 0
      }
    });
  } catch (error) {
    console.error('Get user leaderboard position error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getLeaderboard,
  getUserLeaderboardPosition
};

