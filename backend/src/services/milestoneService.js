const { query } = require('../config/db');

// Define milestone levels
const MILESTONE_LEVELS = [
  { level: 1, referrals: 1, bonus: 25, name: 'First Referral', description: 'You got your first referral!' },
  { level: 2, referrals: 5, bonus: 100, name: 'Referral Starter', description: '5 successful referrals!' },
  { level: 3, referrals: 10, bonus: 250, name: 'Referral Expert', description: '10 successful referrals!' },
  { level: 4, referrals: 25, bonus: 750, name: 'Referral Champion', description: '25 successful referrals!' },
  { level: 5, referrals: 50, bonus: 2000, name: 'Referral Master', description: '50 successful referrals!' },
  { level: 6, referrals: 100, bonus: 5000, name: 'Referral Legend', description: '100 successful referrals!' }
];

// Get milestone progress for a customer
const getMilestoneProgress = async (customerId) => {
  try {
    // Get completed referrals count
    const completedResult = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ? AND status = ?',
      [customerId, 'completed']
    );
    const completedReferrals = completedResult.rows[0].count || 0;

    // Get all milestones
    const milestones = MILESTONE_LEVELS.map(milestone => {
      const isAchieved = completedReferrals >= milestone.referrals;
      const progress = Math.min((completedReferrals / milestone.referrals) * 100, 100);
      
      return {
        ...milestone,
        isAchieved,
        progress: Math.round(progress),
        currentReferrals: completedReferrals
      };
    });

    // Get next milestone
    const nextMilestone = milestones.find(m => !m.isAchieved) || null;
    
    // Get achieved milestones
    const achievedMilestones = milestones.filter(m => m.isAchieved);
    
    // Get milestone bonuses credited (using referral_bonus type with milestone description)
    const milestoneBonusesResult = await query(
      `SELECT SUM(amount) as total 
       FROM wallet_transactions 
       WHERE customer_id = ? AND transaction_type = 'referral_bonus' AND description LIKE 'Milestone:%' AND status = 'completed'`,
      [customerId]
    );
    const totalMilestoneBonuses = parseFloat(milestoneBonusesResult.rows[0].total) || 0;

    return {
      success: true,
      data: {
        completedReferrals,
        milestones,
        nextMilestone,
        achievedMilestones,
        totalMilestoneBonuses,
        totalPossibleBonuses: milestones.reduce((sum, m) => sum + (m.isAchieved ? m.bonus : 0), 0)
      }
    };
  } catch (error) {
    console.error('Get milestone progress error:', error);
    return { success: false, message: error.message };
  }
};

// Check and award milestone bonuses
const checkAndAwardMilestones = async (customerId) => {
  try {
    // Get completed referrals count
    const completedResult = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ? AND status = ?',
      [customerId, 'completed']
    );
    const completedReferrals = completedResult.rows[0].count || 0;

    // Get already credited milestones (using referral_bonus type with milestone description)
    const creditedMilestonesResult = await query(
      `SELECT description 
       FROM wallet_transactions 
       WHERE customer_id = ? AND transaction_type = 'referral_bonus' AND description LIKE 'Milestone:%' AND status = 'completed'`,
      [customerId]
    );
    const creditedMilestoneNames = creditedMilestonesResult.rows.map(row => row.description);

    const newMilestones = [];
    let totalBonus = 0;

    // Get current total milestone bonuses for email
    const currentMilestoneBonusesResult = await query(
      `SELECT SUM(amount) as total 
       FROM wallet_transactions 
       WHERE customer_id = ? AND transaction_type = 'referral_bonus' AND description LIKE 'Milestone:%' AND status = 'completed'`,
      [customerId]
    );
    let currentTotalMilestoneBonuses = parseFloat(currentMilestoneBonusesResult.rows[0].total) || 0;

    // Check each milestone
    for (const milestone of MILESTONE_LEVELS) {
      // Check if milestone is achieved and not yet credited
      if (completedReferrals >= milestone.referrals && 
          !creditedMilestoneNames.includes(`Milestone: ${milestone.name}`)) {
        
        // Get current wallet balance
        const balanceResult = await query(
          'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
          [customerId]
        );
        const currentBalance = parseFloat(balanceResult.rows[0].wallet_balance) || 0;
        const newBalance = currentBalance + milestone.bonus;

        // Create wallet transaction (using referral_bonus type with milestone description)
        await query(
          `INSERT INTO wallet_transactions 
           (customer_id, type, amount, description, status, transaction_type, created_at, updated_at)
           VALUES (?, 'credit', ?, ?, 'completed', 'referral_bonus', datetime('now'), datetime('now'))`,
          [customerId, milestone.bonus, `Milestone: ${milestone.name}`]
        );

        // Update wallet balance
        await query(
          'UPDATE customers SET wallet_balance = ? WHERE id = ?',
          [newBalance, customerId]
        );

        newMilestones.push(milestone);
        totalBonus += milestone.bonus;
        currentTotalMilestoneBonuses += milestone.bonus;

        console.log(`Milestone awarded: ${milestone.name} - ₹${milestone.bonus} to customer ${customerId}`);

        // Create notification
        try {
          const { createMilestoneNotification } = require('../utils/notificationHelper');
          await createMilestoneNotification(customerId, milestone.name, milestone.bonus);
        } catch (notifError) {
          console.error('Notification creation error:', notifError);
        }

        // Send milestone achievement email
        try {
          const { sendMilestoneEmail } = require('./emailService');
          const customerResult = await query(
            'SELECT name, email FROM customers WHERE id = ?',
            [customerId]
          );
          if (customerResult.rows.length > 0) {
            const customer = customerResult.rows[0];
            await sendMilestoneEmail(
              customer.email,
              customer.name,
              milestone,
              currentTotalMilestoneBonuses
            );
          }
        } catch (emailError) {
          console.error('Error sending milestone email:', emailError);
          // Don't fail milestone award if email fails
        }
      }
    }

    return {
      success: true,
      newMilestones,
      totalBonus,
      awarded: newMilestones.length > 0
    };
  } catch (error) {
    console.error('Check and award milestones error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  getMilestoneProgress,
  checkAndAwardMilestones,
  MILESTONE_LEVELS
};

