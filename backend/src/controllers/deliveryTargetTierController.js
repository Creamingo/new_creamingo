const { query } = require('../config/db');

// Ensure only admin/staff can access these routes
const ensureAdminRole = (req, res) => {
  if (!req.user || (req.user.role !== 'super_admin' && req.user.role !== 'admin' && req.user.role !== 'staff')) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.'
    });
    return false;
  }
  return true;
};

// Get all target tiers
const getTargetTiers = async (req, res) => {
  try {
    if (!ensureAdminRole(req, res)) return;

    const result = await query(
      `SELECT id, min_orders, max_orders, bonus_amount, tier_name, is_active, display_order, created_at, updated_at
       FROM delivery_target_tiers
       ORDER BY display_order ASC, min_orders ASC`
    );

    const tiers = (result.rows || []).map((tier) => ({
      id: tier.id,
      minOrders: tier.min_orders,
      maxOrders: tier.max_orders,
      bonusAmount: parseFloat(tier.bonus_amount),
      tierName: tier.tier_name,
      isActive: Boolean(tier.is_active),
      displayOrder: tier.display_order,
      createdAt: tier.created_at,
      updatedAt: tier.updated_at
    }));

    res.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    console.error('Get target tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get active target tiers (for delivery boys)
const getActiveTargetTiers = async (req, res) => {
  try {
    // Check if table exists
    let tableExists = false;
    try {
      const tableCheck = await query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_target_tiers'`
      );
      tableExists = (tableCheck.rows && tableCheck.rows.length > 0) || (Array.isArray(tableCheck) && tableCheck.length > 0);
    } catch (tableError) {
      console.log('Error checking delivery_target_tiers table:', tableError);
      tableExists = false;
    }

    if (!tableExists) {
      return res.json({
        success: true,
        data: []
      });
    }

    const result = await query(
      `SELECT id, min_orders, max_orders, bonus_amount, tier_name, display_order
       FROM delivery_target_tiers
       WHERE is_active = 1
       ORDER BY display_order ASC, min_orders ASC`
    );

    const tiers = (result.rows || []).map((tier) => ({
      id: tier.id,
      minOrders: tier.min_orders,
      maxOrders: tier.max_orders,
      bonusAmount: parseFloat(tier.bonus_amount),
      tierName: tier.tier_name,
      displayOrder: tier.display_order
    }));

    res.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    console.error('Get active target tiers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create or update target tier
const upsertTargetTier = async (req, res) => {
  try {
    if (!ensureAdminRole(req, res)) return;

    const { id, minOrders, maxOrders, bonusAmount, tierName, isActive, displayOrder } = req.body;

    if (!minOrders || minOrders < 0) {
      return res.status(400).json({
        success: false,
        message: 'minOrders is required and must be >= 0'
      });
    }

    if (maxOrders !== null && maxOrders !== undefined && maxOrders < minOrders) {
      return res.status(400).json({
        success: false,
        message: 'maxOrders must be >= minOrders'
      });
    }

    if (!bonusAmount || bonusAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'bonusAmount is required and must be >= 0'
      });
    }

    if (id) {
      // Update existing tier
      await query(
        `UPDATE delivery_target_tiers
         SET min_orders = ?, max_orders = ?, bonus_amount = ?, tier_name = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [minOrders, maxOrders || null, bonusAmount, tierName || null, isActive !== false ? 1 : 0, displayOrder || 0, id]
      );

      res.json({
        success: true,
        message: 'Target tier updated successfully'
      });
    } else {
      // Create new tier
      const result = await query(
        `INSERT INTO delivery_target_tiers (min_orders, max_orders, bonus_amount, tier_name, is_active, display_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [minOrders, maxOrders || null, bonusAmount, tierName || null, isActive !== false ? 1 : 0, displayOrder || 0]
      );

      res.json({
        success: true,
        message: 'Target tier created successfully',
        data: { id: result.lastID }
      });
    }
  } catch (error) {
    console.error('Upsert target tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete target tier
const deleteTargetTier = async (req, res) => {
  try {
    if (!ensureAdminRole(req, res)) return;

    const { id } = req.params;

    await query('DELETE FROM delivery_target_tiers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Target tier deleted successfully'
    });
  } catch (error) {
    console.error('Delete target tier error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get daily progress for a delivery boy
const getDailyProgress = async (req, res) => {
  try {
    const deliveryBoyId = req.user?.id;
    if (!deliveryBoyId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if delivery_target_tiers table exists
    let tableExists = false;
    try {
      const tableCheck = await query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_target_tiers'`
      );
      tableExists = (tableCheck.rows && tableCheck.rows.length > 0) || (Array.isArray(tableCheck) && tableCheck.length > 0);
    } catch (tableError) {
      console.log('Error checking delivery_target_tiers table:', tableError);
      tableExists = false;
    }

    if (!tableExists) {
      // Return empty progress if table doesn't exist
      return res.json({
        success: true,
        data: {
          completedCount: 0,
          tiers: [],
          currentTier: null,
          nextTier: null,
          bonusAlreadyCredited: false
        }
      });
    }

    // Get today's completed deliveries count
    let completedCount = 0;
    try {
      const todayResult = await query(
        `SELECT COUNT(DISTINCT order_id) as completed_count
         FROM delivery_wallet_transactions
         WHERE delivery_boy_id = ? 
           AND type = 'earning'
           AND date(created_at) = date('now', 'localtime')`,
        [deliveryBoyId]
      );
      completedCount = todayResult.rows?.[0]?.completed_count || (Array.isArray(todayResult) && todayResult[0]?.completed_count) || 0;
    } catch (error) {
      console.error('Error fetching completed count:', error);
      // Continue with 0 if there's an error
    }

    // Get active tiers
    let tiers = [];
    try {
      const tiersResult = await query(
        `SELECT id, min_orders, max_orders, bonus_amount, tier_name, display_order
         FROM delivery_target_tiers
         WHERE is_active = 1
         ORDER BY display_order ASC, min_orders ASC`
      );

      tiers = (tiersResult.rows || []).map((tier) => ({
        id: tier.id,
        minOrders: tier.min_orders,
        maxOrders: tier.max_orders,
        bonusAmount: parseFloat(tier.bonus_amount),
        tierName: tier.tier_name,
        displayOrder: tier.display_order
      }));
    } catch (error) {
      console.error('Error fetching tiers:', error);
      // Continue with empty tiers array
    }

    // Find current tier and next tier
    let currentTier = null;
    let nextTier = null;

    for (let i = tiers.length - 1; i >= 0; i--) {
      const tier = tiers[i];
      if (completedCount >= tier.minOrders && (tier.maxOrders === null || completedCount <= tier.maxOrders)) {
        currentTier = tier;
        break;
      }
    }

    // Find next tier
    for (const tier of tiers) {
      if (completedCount < tier.minOrders) {
        nextTier = tier;
        break;
      }
    }

    // Check if bonus already credited today
    let bonusAlreadyCredited = false;
    try {
      // Try to check for bonus, but handle cases where meta might be NULL or invalid JSON
      const bonusCheckResult = await query(
        `SELECT COUNT(*) as count
         FROM delivery_wallet_transactions
         WHERE delivery_boy_id = ?
           AND type = 'bonus'
           AND date(created_at) = date('now', 'localtime')
           AND meta IS NOT NULL
           AND meta != ''
           AND json_extract(meta, '$.bonusType') = 'target'`,
        [deliveryBoyId]
      );
      bonusAlreadyCredited = ((bonusCheckResult.rows?.[0]?.count || 0) > 0) || 
                             (Array.isArray(bonusCheckResult) && (bonusCheckResult[0]?.count || 0) > 0);
    } catch (error) {
      console.error('Error checking bonus status:', error);
      // If JSON extraction fails, try a simpler check
      try {
        const simpleBonusCheck = await query(
          `SELECT COUNT(*) as count
           FROM delivery_wallet_transactions
           WHERE delivery_boy_id = ?
             AND type = 'bonus'
             AND date(created_at) = date('now', 'localtime')`,
          [deliveryBoyId]
        );
        bonusAlreadyCredited = ((simpleBonusCheck.rows?.[0]?.count || 0) > 0) || 
                               (Array.isArray(simpleBonusCheck) && (simpleBonusCheck[0]?.count || 0) > 0);
      } catch (simpleError) {
        console.error('Error in simple bonus check:', simpleError);
      }
    }

    res.json({
      success: true,
      data: {
        completedCount,
        tiers,
        currentTier,
        nextTier,
        bonusAlreadyCredited
      }
    });
  } catch (error) {
    console.error('Get daily progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getTargetTiers,
  getActiveTargetTiers,
  upsertTargetTier,
  deleteTargetTier,
  getDailyProgress
};
