const { query } = require('../config/db');
const crypto = require('crypto');

// Generate unique referral code for a customer
const generateReferralCode = async (customerId) => {
  // Generate a unique 8-character code (alphanumeric, uppercase)
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate random code: 4 random chars + last 4 digits of customer ID
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase().substring(0, 4);
    const idPart = String(customerId).padStart(4, '0').slice(-4);
    code = randomPart + idPart;

    // Check if code already exists
    const existing = await query(
      'SELECT id FROM customers WHERE referral_code = ?',
      [code]
    );

    if (existing.rows.length === 0) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    // Fallback: use customer ID with prefix
    code = 'REF' + String(customerId).padStart(6, '0');
  }

  return code;
};

// Get or create referral code for a customer
const getOrCreateReferralCode = async (customerId) => {
  try {
    // Check if customer already has a referral code
    const customerResult = await query(
      'SELECT referral_code FROM customers WHERE id = ?',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return { success: false, message: 'Customer not found' };
    }

    let referralCode = customerResult.rows[0].referral_code;

    // If no code exists, generate one
    if (!referralCode) {
      referralCode = await generateReferralCode(customerId);
      await query(
        'UPDATE customers SET referral_code = ? WHERE id = ?',
        [referralCode, customerId]
      );
    }

    return { success: true, referralCode };
  } catch (error) {
    console.error('Get referral code error:', error);
    return { success: false, message: error.message };
  }
};

// Get referral statistics for a customer
const getReferralStats = async (customerId) => {
  try {
    // Get referral code
    const codeResult = await getOrCreateReferralCode(customerId);
    if (!codeResult.success) {
      return { success: false, message: codeResult.message };
    }

    const referralCode = codeResult.referralCode;

    // Get total referrals
    const totalReferrals = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?',
      [customerId]
    );

    // Get completed referrals (referee completed first order)
    const completedReferrals = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ? AND status = ?',
      [customerId, 'completed']
    );

    // Get total earnings from referrals
    const earningsResult = await query(
      `SELECT COALESCE(SUM(referrer_bonus_amount), 0) as total_earnings 
       FROM referrals 
       WHERE referrer_id = ? AND referrer_bonus_credited = 1`,
      [customerId]
    );

    // Get pending earnings (referrals completed but bonus not credited yet)
    const pendingResult = await query(
      `SELECT COALESCE(SUM(referrer_bonus_amount), 0) as pending_earnings 
       FROM referrals 
       WHERE referrer_id = ? AND status = 'completed' AND referrer_bonus_credited = 0`,
      [customerId]
    );

    // Get recent referrals
    const recentReferrals = await query(
      `SELECT r.id, r.status, r.created_at, r.referrer_bonus_amount, r.referrer_bonus_credited,
              c.name as referee_name, c.email as referee_email
       FROM referrals r
       LEFT JOIN customers c ON r.referee_id = c.id
       WHERE r.referrer_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [customerId]
    );

    return {
      success: true,
      data: {
        referralCode,
        totalReferrals: totalReferrals.rows[0].count || 0,
        completedReferrals: completedReferrals.rows[0].count || 0,
        totalEarnings: parseFloat(earningsResult.rows[0].total_earnings) || 0,
        pendingEarnings: parseFloat(pendingResult.rows[0].pending_earnings) || 0,
        recentReferrals: recentReferrals.rows || []
      }
    };
  } catch (error) {
    console.error('Get referral stats error:', error);
    return { success: false, message: error.message };
  }
};

// Validate referral code
const validateReferralCode = async (referralCode) => {
  try {
    if (!referralCode || referralCode.trim().length === 0) {
      return { success: false, message: 'Referral code is required' };
    }

    const customerResult = await query(
      'SELECT id, name, email FROM customers WHERE referral_code = ?',
      [referralCode.trim().toUpperCase()]
    );

    if (customerResult.rows.length === 0) {
      return { success: false, message: 'Invalid referral code' };
    }

    return {
      success: true,
      data: {
        referrerId: customerResult.rows[0].id,
        referrerName: customerResult.rows[0].name,
        referrerEmail: customerResult.rows[0].email
      }
    };
  } catch (error) {
    console.error('Validate referral code error:', error);
    return { success: false, message: error.message };
  }
};

// Create referral relationship (called during registration)
const createReferral = async (refereeId, referralCode) => {
  try {
    // Validate referral code
    const validation = await validateReferralCode(referralCode);
    if (!validation.success) {
      return validation;
    }

    const referrerId = validation.data.referrerId;

    // Prevent self-referral
    if (referrerId === refereeId) {
      return { success: false, message: 'Cannot refer yourself' };
    }

    // Check if referee was already referred
    const existingReferral = await query(
      'SELECT id FROM referrals WHERE referee_id = ?',
      [refereeId]
    );

    if (existingReferral.rows.length > 0) {
      return { success: false, message: 'User has already been referred' };
    }

    // Bonus amounts (configurable)
    const referrerBonusAmount = 50.00; // ₹50 for referrer when referee completes first order
    const refereeBonusAmount = 25.00;  // ₹25 extra for referee (in addition to welcome bonus)

    // Create referral record
    const result = await query(
      `INSERT INTO referrals 
       (referrer_id, referee_id, referral_code, status, referrer_bonus_amount, referee_bonus_amount, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
      [referrerId, refereeId, referralCode.trim().toUpperCase(), referrerBonusAmount, refereeBonusAmount]
    );

    // Update customer's referred_by field
    await query(
      'UPDATE customers SET referred_by = ? WHERE id = ?',
      [referrerId, refereeId]
    );

    console.log(`Referral created: Referrer ${referrerId} referred Referee ${refereeId} with code ${referralCode}`);

    // Note: Email to referee will be sent from frontend when they share
    // Email to referrer can be sent when referee completes first order

    return {
      success: true,
      message: 'Referral created successfully',
      data: {
        referralId: result.lastID,
        referrerBonusAmount,
        refereeBonusAmount,
        referrerName: validation.data.referrerName
      }
    };
  } catch (error) {
    console.error('Create referral error:', error);
    return { success: false, message: error.message };
  }
};

// Credit referral bonuses when referee completes first order
const creditReferralBonuses = async (orderId, customerId) => {
  try {
    // Find referral for this customer (referee)
    const referralResult = await query(
      'SELECT * FROM referrals WHERE referee_id = ? AND status = ?',
      [customerId, 'pending']
    );

    if (referralResult.rows.length === 0) {
      // No referral found, nothing to credit
      return { success: true, message: 'No referral found for this customer', credited: false };
    }

    const referral = referralResult.rows[0];
    const referrerId = referral.referrer_id;
    const refereeId = referral.referee_id;

    // Update referral status to completed
    await query(
      `UPDATE referrals 
       SET status = 'completed', first_order_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [orderId, referral.id]
    );

    // Get order number for transaction description
    const orderResult = await query(
      'SELECT order_number FROM orders WHERE id = ?',
      [orderId]
    );
    const orderNumber = orderResult.rows[0]?.order_number || `#${orderId}`;

    let referrerCredited = false;
    let refereeCredited = false;

    // Credit referrer bonus
    if (referral.referrer_bonus_amount > 0 && !referral.referrer_bonus_credited) {
      const referrerBalanceResult = await query(
        'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
        [referrerId]
      );
      const referrerBalance = parseFloat(referrerBalanceResult.rows[0].wallet_balance) || 0;
      const newReferrerBalance = referrerBalance + parseFloat(referral.referrer_bonus_amount);

      // Create wallet transaction for referrer
      await query(
        `INSERT INTO wallet_transactions 
         (customer_id, type, amount, order_id, description, status, transaction_type, created_at, updated_at)
         VALUES (?, 'credit', ?, ?, ?, 'completed', 'referral_bonus', NOW(), NOW())`,
        [
          referrerId,
          referral.referrer_bonus_amount,
          orderId,
          `Referral Bonus (Order ${orderNumber})`
        ]
      );

      // Update referrer balance
      await query(
        'UPDATE customers SET wallet_balance = ? WHERE id = ?',
        [newReferrerBalance, referrerId]
      );

      // Update referral record
      await query(
        `UPDATE referrals 
         SET referrer_bonus_credited = 1, referrer_bonus_credited_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [referral.id]
      );

      // Create notification for referrer
      try {
        const { createWalletNotification } = require('../utils/notificationHelper');
        await createWalletNotification(referrerId, 'referral_bonus', referral.referrer_bonus_amount, `Referral Bonus (Order ${orderNumber})`, orderId);
      } catch (notifError) {
        console.error('Notification creation error:', notifError);
      }

      referrerCredited = true;
      console.log(`Referrer bonus credited: ₹${referral.referrer_bonus_amount} to customer ${referrerId}`);
    }

    // Credit referee bonus (extra bonus for using referral code)
    if (referral.referee_bonus_amount > 0 && !referral.referee_bonus_credited) {
      const refereeBalanceResult = await query(
        'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
        [refereeId]
      );
      const refereeBalance = parseFloat(refereeBalanceResult.rows[0].wallet_balance) || 0;
      const newRefereeBalance = refereeBalance + parseFloat(referral.referee_bonus_amount);

      // Create wallet transaction for referee
      await query(
        `INSERT INTO wallet_transactions 
         (customer_id, type, amount, order_id, description, status, transaction_type, created_at, updated_at)
         VALUES (?, 'credit', ?, ?, ?, 'completed', 'referral_bonus', NOW(), NOW())`,
        [
          refereeId,
          referral.referee_bonus_amount,
          orderId,
          `Referral Signup Bonus (Order ${orderNumber})`
        ]
      );

      // Update referee balance
      await query(
        'UPDATE customers SET wallet_balance = ? WHERE id = ?',
        [newRefereeBalance, refereeId]
      );

      // Update referral record
      await query(
        `UPDATE referrals 
         SET referee_bonus_credited = 1, referee_bonus_credited_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [referral.id]
      );

      refereeCredited = true;
      console.log(`Referee bonus credited: ₹${referral.referee_bonus_amount} to customer ${refereeId}`);
    }

    // Check and award milestones for referrer after crediting bonus
    if (referrerCredited) {
      try {
        const { checkAndAwardMilestones } = require('../services/milestoneService');
        const milestoneResult = await checkAndAwardMilestones(referrerId);
        if (milestoneResult.success && milestoneResult.awarded) {
          console.log(`Milestones awarded: ${milestoneResult.newMilestones.length} milestone(s), Total: ₹${milestoneResult.totalBonus} to customer ${referrerId}`);
        }
      } catch (milestoneError) {
        console.error('Error checking milestones:', milestoneError);
        // Don't fail the referral bonus if milestone check fails
      }
    }

    return {
      success: true,
      credited: referrerCredited || refereeCredited,
      referrerCredited,
      refereeCredited,
      referrerAmount: referral.referrer_bonus_amount,
      refereeAmount: referral.referee_bonus_amount
    };
  } catch (error) {
    console.error('Credit referral bonuses error:', error);
    return { success: false, message: error.message };
  }
};

// API Endpoints

// Get referral code and stats
const getReferralInfo = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const stats = await getReferralStats(customerId);

    if (!stats.success) {
      return res.status(400).json(stats);
    }

    res.json({
      success: true,
      data: stats.data
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validate referral code (public endpoint, used during signup)
const validateReferralCodePublic = async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const validation = await validateReferralCode(referralCode);

    if (!validation.success) {
      return res.status(400).json(validation);
    }

    res.json({
      success: true,
      message: 'Valid referral code',
      data: {
        referrerName: validation.data.referrerName
      }
    });
  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get milestone progress
const getMilestoneProgress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { getMilestoneProgress } = require('../services/milestoneService');
    const result = await getMilestoneProgress(customerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get milestone progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get tier progress
const getTierProgress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { getTierProgress } = require('../services/tierService');
    const result = await getTierProgress(customerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get tier progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send referral email (called from frontend when user shares)
const sendReferralEmail = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Get customer referral code
    const codeResult = await getOrCreateReferralCode(customerId);
    if (!codeResult.success) {
      return res.status(400).json(codeResult);
    }

    // Get customer name
    const customerResult = await query(
      'SELECT name FROM customers WHERE id = ?',
      [customerId]
    );
    const referrerName = customerResult.rows[0]?.name || 'Friend';

    const referralCode = codeResult.referralCode;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/signup?ref=${referralCode}`;

    // Send email
    const { sendReferralEmail: sendEmail } = require('../services/emailService');
    const emailResult = await sendEmail(email, referrerName, referralCode, referralLink);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Referral email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: emailResult.message || 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Send referral email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getReferralInfo,
  validateReferralCodePublic,
  getOrCreateReferralCode,
  createReferral,
  creditReferralBonuses,
  validateReferralCode,
  getReferralStats,
  getMilestoneProgress,
  getTierProgress,
  sendReferralEmail
};

