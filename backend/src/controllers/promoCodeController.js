const { query } = require('../config/db');

// Get single promo code by ID
const getPromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM promo_codes WHERE id = ?',
      [id]
    );

    const promo = result.rows?.[0] || result[0];

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    // Determine status if not already set (backward compatibility)
    let status = promo.status;
    if (!status) {
      const now = new Date();
      const validUntil = new Date(promo.valid_until);
      if (!promo.is_active) {
        status = 'inactive';
      } else if (now > validUntil) {
        status = 'expired';
      } else {
        status = 'active';
      }
    }

    // Transform to ensure proper types
    const transformedPromo = {
      ...promo,
      status: status || 'active',
      is_active: status === 'active', // Keep for backward compatibility
      discount_value: parseFloat(promo.discount_value) || 0,
      min_order_amount: parseFloat(promo.min_order_amount) || 0,
      max_discount_amount: promo.max_discount_amount ? parseFloat(promo.max_discount_amount) : null,
      usage_limit: promo.usage_limit ? parseInt(promo.usage_limit) : null,
      used_count: parseInt(promo.used_count) || 0
    };

    res.json({
      success: true,
      data: transformedPromo
    });
  } catch (error) {
    console.error('Get promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all active promo codes
const getPromoCodes = async (req, res) => {
  try {
    const { active_only = true, include_deleted = false } = req.query;

    let sql = 'SELECT * FROM promo_codes WHERE 1=1';
    const params = [];

    if (active_only === 'true') {
      sql += ' AND status = ? AND datetime(valid_from) <= datetime("now") AND datetime(valid_until) >= datetime("now")';
      params.push('active');
    }

    // Exclude deleted codes by default, unless explicitly requested
    if (include_deleted !== 'true') {
      sql += ' AND status != ?';
      params.push('deleted');
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    
    // Transform the results to ensure proper types
    const promoCodes = (result.rows || result).map(promo => {
      // Determine status if not already set (backward compatibility)
      let status = promo.status;
      if (!status) {
        const now = new Date();
        const validUntil = new Date(promo.valid_until);
        if (!promo.is_active) {
          status = 'inactive';
        } else if (now > validUntil) {
          status = 'expired';
        } else {
          status = 'active';
        }
      }

      return {
        ...promo,
        status: status || 'active',
        is_active: status === 'active', // Keep for backward compatibility
        discount_value: parseFloat(promo.discount_value) || 0,
        min_order_amount: parseFloat(promo.min_order_amount) || 0,
        max_discount_amount: promo.max_discount_amount ? parseFloat(promo.max_discount_amount) : null,
        usage_limit: promo.usage_limit ? parseInt(promo.usage_limit) : null,
        used_count: parseInt(promo.used_count) || 0
      };
    });

    res.json({
      success: true,
      data: promoCodes
    });
  } catch (error) {
    console.error('Get promo codes error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Validate and apply promo code
const validatePromoCode = async (req, res) => {
  try {
    const { code, order_amount } = req.body;
    const customer_id = req.customer?.id || null;
    const ip_address = req.ip || req.connection?.remoteAddress || null;
    const user_agent = req.get('user-agent') || null;
    const referrer_url = req.get('referer') || null;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required'
      });
    }

    // Find promo code - exclude deleted and inactive statuses
    const promoResult = await query(
      'SELECT * FROM promo_codes WHERE code = ? AND status NOT IN (?, ?)',
      [code.toUpperCase(), 'deleted', 'inactive']
    );

    const promo = promoResult.rows?.[0] || promoResult[0];

    if (!promo) {
      // Track failed validation attempt
      // Note: We can't track by promo_code_id since we don't have it, but we can track by code lookup
      return res.status(404).json({
        success: false,
        message: 'Invalid promo code'
      });
    }

    let validationResult = 'success';
    let failureReason = null;

    // Check status - reject deleted and inactive codes
    if (promo.status === 'deleted' || promo.status === 'inactive') {
      validationResult = 'failed';
      failureReason = 'Code no longer available';
      // Track failed validation
      await trackPromoCodeEvent(promo.id, 'validate', {
        customer_id,
        cart_value: order_amount || null,
        validation_result: validationResult,
        failure_reason: failureReason,
        ip_address,
        user_agent,
        referrer_url
      });
      return res.status(400).json({
        success: false,
        message: 'This promo code is no longer available'
      });
    }

    // Check if expired
    if (promo.status === 'expired') {
      validationResult = 'failed';
      failureReason = 'Code expired';
      await trackPromoCodeEvent(promo.id, 'validate', {
        customer_id,
        cart_value: order_amount || null,
        validation_result: validationResult,
        failure_reason: failureReason,
        ip_address,
        user_agent,
        referrer_url
      });
      return res.status(400).json({
        success: false,
        message: 'Promo code has expired'
      });
    }

    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = new Date(promo.valid_until);

    // Check validity dates
    if (now < validFrom || now > validUntil) {
      // Auto-update status to expired if dates passed
      if (now > validUntil && promo.status !== 'expired') {
        await query(
          'UPDATE promo_codes SET status = ? WHERE id = ?',
          ['expired', promo.id]
        );
      }
      validationResult = 'failed';
      failureReason = now > validUntil ? 'Code expired' : 'Code not yet active';
      await trackPromoCodeEvent(promo.id, 'validate', {
        customer_id,
        cart_value: order_amount || null,
        validation_result: validationResult,
        failure_reason: failureReason,
        ip_address,
        user_agent,
        referrer_url
      });
      return res.status(400).json({
        success: false,
        message: 'Promo code has expired or is not yet active'
      });
    }

    // Check usage limit
    if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
      validationResult = 'failed';
      failureReason = 'Usage limit reached';
      await trackPromoCodeEvent(promo.id, 'validate', {
        customer_id,
        cart_value: order_amount || null,
        validation_result: validationResult,
        failure_reason: failureReason,
        ip_address,
        user_agent,
        referrer_url
      });
      return res.status(400).json({
        success: false,
        message: 'Promo code usage limit reached'
      });
    }

    // Check minimum order amount
    if (order_amount && order_amount < promo.min_order_amount) {
      const shortfall = promo.min_order_amount - order_amount;
      validationResult = 'failed';
      failureReason = `Minimum order amount not met (need ₹${shortfall} more)`;
      await trackPromoCodeEvent(promo.id, 'validate', {
        customer_id,
        cart_value: order_amount || null,
        validation_result: validationResult,
        failure_reason: failureReason,
        ip_address,
        user_agent,
        referrer_url
      });
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${promo.min_order_amount} required for this promo code. This applies to product subtotal only (excluding delivery charges). Add ₹${shortfall} more to your cart to use this code.`
      });
    }

    // Calculate discount
    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = (order_amount || 0) * (promo.discount_value / 100);
      // Apply max discount limit if specified
      if (promo.max_discount_amount && discount > promo.max_discount_amount) {
        discount = promo.max_discount_amount;
      }
    } else {
      // Fixed discount
      discount = promo.discount_value;
    }

    // Don't allow discount more than order amount
    if (order_amount && discount > order_amount) {
      discount = order_amount;
    }

    // Track successful validation
    await trackPromoCodeEvent(promo.id, 'validate', {
      customer_id,
      cart_value: order_amount || null,
      validation_result: 'success',
      ip_address,
      user_agent,
      referrer_url
    });

    res.json({
      success: true,
      data: {
        promo_code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: Math.round(discount * 100) / 100,
        original_amount: order_amount || 0,
        final_amount: Math.max(0, (order_amount || 0) - discount)
      }
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create promo code (admin only)
const createPromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount = 0,
      max_discount_amount = null,
      usage_limit = null,
      valid_from,
      valid_until,
      is_active = true,
      status = 'active'
    } = req.body;

    if (!code || !discount_type || !discount_value || !valid_from || !valid_until) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Determine status from is_active or provided status
    const finalStatus = status || (is_active ? 'active' : 'inactive');

    const result = await query(
      `INSERT INTO promo_codes (
        code, description, discount_type, discount_value, min_order_amount,
        max_discount_amount, usage_limit, valid_from, valid_until, is_active, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        description || null,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        usage_limit,
        valid_from,
        valid_until,
        is_active ? 1 : 0,
        finalStatus
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      data: { id: result.lastID || result.insertId }
    });
  } catch (error) {
    console.error('Create promo code error:', error);
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update promo code (admin only)
const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // Build dynamic update query
    const allowedFields = [
      'description', 'discount_type', 'discount_value', 'min_order_amount',
      'max_discount_amount', 'usage_limit', 'valid_from', 'valid_until', 'is_active', 'status'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Convert boolean to integer for is_active field
        if (field === 'is_active' && typeof updateFields[field] === 'boolean') {
          values.push(updateFields[field] ? 1 : 0);
          // Sync status with is_active for backward compatibility
          if (!updateFields.status) {
            updates.push('status = ?');
            values.push(updateFields[field] ? 'active' : 'inactive');
          }
        } else if (field === 'status') {
          values.push(updateFields[field]);
          // Sync is_active with status
          if (updateFields[field] === 'active') {
            // Don't update is_active here, let it be handled separately if needed
          }
        } else {
          values.push(updateFields[field]);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add id at the end for WHERE clause
    values.push(id);

    await query(
      `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated promo code to return
    const updatedResult = await query(
      'SELECT * FROM promo_codes WHERE id = ?',
      [id]
    );
    
    const updatedPromo = updatedResult.rows?.[0] || updatedResult[0];
    
    // Transform to ensure proper types
    const transformedPromo = updatedPromo ? {
      ...updatedPromo,
      is_active: Boolean(updatedPromo.is_active),
      discount_value: parseFloat(updatedPromo.discount_value) || 0,
      min_order_amount: parseFloat(updatedPromo.min_order_amount) || 0,
      max_discount_amount: updatedPromo.max_discount_amount ? parseFloat(updatedPromo.max_discount_amount) : null,
      usage_limit: updatedPromo.usage_limit ? parseInt(updatedPromo.usage_limit) : null,
      used_count: parseInt(updatedPromo.used_count) || 0
    } : null;

    res.json({
      success: true,
      message: 'Promo code updated successfully',
      data: transformedPromo
    });
  } catch (error) {
    console.error('Update promo code error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Track analytics event for promo code
const trackPromoCodeEvent = async (promoCodeId, eventType, data = {}) => {
  try {
    const {
      customer_id = null,
      order_id = null,
      cart_value = null,
      discount_amount = 0,
      revenue = 0,
      validation_result = null,
      failure_reason = null,
      ip_address = null,
      user_agent = null,
      referrer_url = null
    } = data;

    await query(`
      INSERT INTO promo_code_analytics (
        promo_code_id, event_type, customer_id, order_id, cart_value,
        discount_amount, revenue, validation_result, failure_reason,
        ip_address, user_agent, referrer_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      promoCodeId, eventType, customer_id, order_id, cart_value,
      discount_amount, revenue, validation_result, failure_reason,
      ip_address, user_agent, referrer_url
    ]);

    // Update performance cache
    await updatePromoCodePerformanceCache(promoCodeId);
  } catch (error) {
    console.error('Error tracking promo code event:', error);
    // Don't throw - analytics tracking shouldn't break the main flow
  }
};

// Update promo code performance cache
const updatePromoCodePerformanceCache = async (promoCodeId) => {
  try {
    // Get aggregated analytics for this promo code
    const analyticsQuery = `
      SELECT 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'validate' THEN 1 END) as total_validations,
        COUNT(CASE WHEN event_type = 'validate' AND validation_result = 'success' THEN 1 END) as successful_validations,
        COUNT(CASE WHEN event_type = 'validate' AND validation_result = 'failed' THEN 1 END) as failed_validations,
        COUNT(CASE WHEN event_type = 'apply' THEN 1 END) as total_applications,
        COUNT(CASE WHEN event_type = 'redeem' THEN 1 END) as total_redemptions,
        COUNT(CASE WHEN event_type = 'abandon' THEN 1 END) as total_abandons,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN revenue ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN discount_amount ELSE 0 END), 0) as total_discount_given,
        COALESCE(AVG(CASE WHEN event_type = 'redeem' THEN cart_value END), 0) as avg_order_value,
        COUNT(DISTINCT CASE WHEN event_type = 'redeem' THEN customer_id END) as unique_customers
      FROM promo_code_analytics
      WHERE promo_code_id = ?
    `;

    const result = await query(analyticsQuery, [promoCodeId]);
    const stats = result.rows?.[0] || result[0];

    const totalViews = parseInt(stats.total_views) || 0;
    const totalValidations = parseInt(stats.total_validations) || 0;
    const successfulValidations = parseInt(stats.successful_validations) || 0;
    const failedValidations = parseInt(stats.failed_validations) || 0;
    const totalApplications = parseInt(stats.total_applications) || 0;
    const totalRedemptions = parseInt(stats.total_redemptions) || 0;
    const totalAbandons = parseInt(stats.total_abandons) || 0;
    const totalRevenue = parseFloat(stats.total_revenue) || 0;
    const totalDiscountGiven = parseFloat(stats.total_discount_given) || 0;
    const avgOrderValue = parseFloat(stats.avg_order_value) || 0;
    const uniqueCustomers = parseInt(stats.unique_customers) || 0;

    // Calculate rates
    const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
    const validationSuccessRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
    const redemptionRate = totalApplications > 0 ? (totalRedemptions / totalApplications) * 100 : 0;

    // Insert or update cache (SQLite compatible - check first, then insert or update)
    const cacheCheck = await query(
      'SELECT promo_code_id FROM promo_code_performance_cache WHERE promo_code_id = ?',
      [promoCodeId]
    );

    if (cacheCheck.rows?.length > 0 || cacheCheck.length > 0) {
      // Update existing cache
      await query(`
        UPDATE promo_code_performance_cache SET
          total_views = ?,
          total_validations = ?,
          successful_validations = ?,
          failed_validations = ?,
          total_applications = ?,
          total_redemptions = ?,
          total_abandons = ?,
          total_revenue = ?,
          total_discount_given = ?,
          avg_order_value = ?,
          unique_customers = ?,
          conversion_rate = ?,
          validation_success_rate = ?,
          redemption_rate = ?,
          last_updated = datetime('now')
        WHERE promo_code_id = ?
      `, [
        totalViews, totalValidations, successfulValidations, failedValidations,
        totalApplications, totalRedemptions, totalAbandons,
        totalRevenue, totalDiscountGiven, avgOrderValue, uniqueCustomers,
        conversionRate, validationSuccessRate, redemptionRate, promoCodeId
      ]);
    } else {
      // Insert new cache
      await query(`
        INSERT INTO promo_code_performance_cache (
          promo_code_id, total_views, total_validations, successful_validations,
          failed_validations, total_applications, total_redemptions, total_abandons,
          total_revenue, total_discount_given, avg_order_value, unique_customers,
          conversion_rate, validation_success_rate, redemption_rate, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        promoCodeId, totalViews, totalValidations, successfulValidations, failedValidations,
        totalApplications, totalRedemptions, totalAbandons,
        totalRevenue, totalDiscountGiven, avgOrderValue, uniqueCustomers,
        conversionRate, validationSuccessRate, redemptionRate
      ]);
    }
  } catch (error) {
    console.error('Error updating promo code performance cache:', error);
    // Don't throw - cache update shouldn't break the main flow
  }
};

// Increment usage count (called when promo is used)
const incrementUsage = async (code) => {
  try {
    await query(
      'UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?',
      [code.toUpperCase()]
    );
  } catch (error) {
    console.error('Increment promo usage error:', error);
  }
};

// Update promo code status (admin only)
// This is used for soft delete by setting status to 'deleted'
const updatePromoCodeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'expired', 'deleted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, expired, deleted'
      });
    }

    // Get the promo code
    const promoResult = await query(
      'SELECT * FROM promo_codes WHERE id = ?',
      [id]
    );

    const promo = promoResult.rows?.[0] || promoResult[0];

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    // Safety check: Prevent setting to deleted if code has been used
    if (status === 'deleted' && promo.used_count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete promo code that has been used ${promo.used_count} time(s). Use deactivation (status = inactive) instead.`
      });
    }

    // Update status
    await query(
      'UPDATE promo_codes SET status = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, status === 'active' ? 1 : 0, id]
    );

    const statusMessages = {
      active: 'Promo code activated successfully',
      inactive: 'Promo code deactivated successfully',
      expired: 'Promo code marked as expired',
      deleted: 'Promo code deleted (soft delete)'
    };

    res.json({
      success: true,
      message: statusMessages[status] || 'Status updated successfully',
      data: { id, status }
    });
  } catch (error) {
    console.error('Update promo code status error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get promo code analytics overview (admin only)
const getPromoCodeAnalyticsOverview = async (req, res) => {
  try {
    // Check if analytics table exists
    try {
      await query('SELECT 1 FROM promo_code_analytics LIMIT 1');
    } catch (tableError) {
      return res.json({
        success: true,
        data: {
          total_revenue: 0,
          total_discount_given: 0,
          total_redemptions: 0,
          total_validations: 0,
          total_views: 0,
          avg_discount_per_order: 0,
          conversion_rate: 0,
          top_performers: []
        }
      });
    }

    // Get overall stats
    const overviewQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN revenue ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN discount_amount ELSE 0 END), 0) as total_discount_given,
        COUNT(CASE WHEN event_type = 'redeem' THEN 1 END) as total_redemptions,
        COUNT(CASE WHEN event_type = 'validate' THEN 1 END) as total_validations,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
        COALESCE(AVG(CASE WHEN event_type = 'redeem' THEN discount_amount END), 0) as avg_discount_per_order
      FROM promo_code_analytics
    `;

    const result = await query(overviewQuery);
    const stats = result.rows?.[0] || result[0];

    const totalViews = parseInt(stats.total_views) || 0;
    const totalRedemptions = parseInt(stats.total_redemptions) || 0;
    const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;

    // Get top performers
    const topPerformersQuery = `
      SELECT 
        pc.id,
        pc.code,
        pc.description,
        COUNT(CASE WHEN pca.event_type = 'redeem' THEN 1 END) as redemptions,
        COALESCE(SUM(CASE WHEN pca.event_type = 'redeem' THEN pca.revenue ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN pca.event_type = 'redeem' THEN pca.discount_amount ELSE 0 END), 0) as discount_given
      FROM promo_codes pc
      LEFT JOIN promo_code_analytics pca ON pc.id = pca.promo_code_id
      WHERE pc.status != 'deleted'
      GROUP BY pc.id, pc.code, pc.description
      ORDER BY redemptions DESC, revenue DESC
      LIMIT 10
    `;

    const topResult = await query(topPerformersQuery);
    const topPerformers = (topResult.rows || topResult).map(row => ({
      id: row.id,
      code: row.code,
      description: row.description,
      redemptions: parseInt(row.redemptions) || 0,
      revenue: parseFloat(row.revenue) || 0,
      discount_given: parseFloat(row.discount_given) || 0
    }));

    res.json({
      success: true,
      data: {
        total_revenue: parseFloat(stats.total_revenue) || 0,
        total_discount_given: parseFloat(stats.total_discount_given) || 0,
        total_redemptions: totalRedemptions,
        total_validations: parseInt(stats.total_validations) || 0,
        total_views: totalViews,
        avg_discount_per_order: parseFloat(stats.avg_discount_per_order) || 0,
        conversion_rate: conversionRate,
        top_performers: topPerformers
      }
    });
  } catch (error) {
    console.error('Get promo code analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get analytics for a specific promo code (admin only)
const getPromoCodeAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    // Check if analytics table exists
    try {
      await query('SELECT 1 FROM promo_code_analytics LIMIT 1');
    } catch (tableError) {
      return res.json({
        success: true,
        data: {
          promo_code_id: id,
          total_views: 0,
          total_validations: 0,
          successful_validations: 0,
          failed_validations: 0,
          total_applications: 0,
          total_redemptions: 0,
          total_abandons: 0,
          total_revenue: 0,
          total_discount_given: 0,
          avg_order_value: 0,
          unique_customers: 0,
          conversion_rate: 0,
          validation_success_rate: 0,
          redemption_rate: 0
        }
      });
    }

    let whereConditions = ['promo_code_id = ?'];
    let queryParams = [id];

    if (date_from) {
      whereConditions.push('created_at >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('created_at <= ?');
      queryParams.push(date_to + ' 23:59:59');
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const analyticsQuery = `
      SELECT 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'validate' THEN 1 END) as total_validations,
        COUNT(CASE WHEN event_type = 'validate' AND validation_result = 'success' THEN 1 END) as successful_validations,
        COUNT(CASE WHEN event_type = 'validate' AND validation_result = 'failed' THEN 1 END) as failed_validations,
        COUNT(CASE WHEN event_type = 'apply' THEN 1 END) as total_applications,
        COUNT(CASE WHEN event_type = 'redeem' THEN 1 END) as total_redemptions,
        COUNT(CASE WHEN event_type = 'abandon' THEN 1 END) as total_abandons,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN revenue ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN discount_amount ELSE 0 END), 0) as total_discount_given,
        COALESCE(AVG(CASE WHEN event_type = 'redeem' THEN cart_value END), 0) as avg_order_value,
        COUNT(DISTINCT CASE WHEN event_type = 'redeem' THEN customer_id END) as unique_customers
      FROM promo_code_analytics
      ${whereClause}
    `;

    const result = await query(analyticsQuery, queryParams);
    const stats = result.rows?.[0] || result[0];

    const totalViews = parseInt(stats.total_views) || 0;
    const totalValidations = parseInt(stats.total_validations) || 0;
    const successfulValidations = parseInt(stats.successful_validations) || 0;
    const totalApplications = parseInt(stats.total_applications) || 0;
    const totalRedemptions = parseInt(stats.total_redemptions) || 0;

    const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
    const validationSuccessRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
    const redemptionRate = totalApplications > 0 ? (totalRedemptions / totalApplications) * 100 : 0;

    res.json({
      success: true,
      data: {
        promo_code_id: parseInt(id),
        total_views: totalViews,
        total_validations: totalValidations,
        successful_validations: successfulValidations,
        failed_validations: parseInt(stats.failed_validations) || 0,
        total_applications: totalApplications,
        total_redemptions: totalRedemptions,
        total_abandons: parseInt(stats.total_abandons) || 0,
        total_revenue: parseFloat(stats.total_revenue) || 0,
        total_discount_given: parseFloat(stats.total_discount_given) || 0,
        avg_order_value: parseFloat(stats.avg_order_value) || 0,
        unique_customers: parseInt(stats.unique_customers) || 0,
        conversion_rate: conversionRate,
        validation_success_rate: validationSuccessRate,
        redemption_rate: redemptionRate
      }
    });
  } catch (error) {
    console.error('Get promo code analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Track promo code event from frontend (public endpoint for tracking)
const trackPromoCodeEventFromFrontend = async (req, res) => {
  try {
    const { code, event_type, cart_value } = req.body;
    const customer_id = req.customer?.id || null;
    const ip_address = req.ip || req.connection?.remoteAddress || null;
    const user_agent = req.get('user-agent') || null;
    const referrer_url = req.get('referer') || null;

    if (!code || !event_type) {
      return res.status(400).json({
        success: false,
        message: 'Code and event_type are required'
      });
    }

    // Only allow view, apply, and abandon events from frontend
    if (!['view', 'apply', 'abandon'].includes(event_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event_type. Must be view, apply, or abandon'
      });
    }

    // Find promo code by code
    const promoResult = await query(
      'SELECT id FROM promo_codes WHERE code = ?',
      [code.toUpperCase()]
    );

    const promo = promoResult.rows?.[0] || promoResult[0];
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      });
    }

    // Track the event
    await trackPromoCodeEvent(promo.id, event_type, {
      customer_id,
      cart_value: cart_value || null,
      ip_address,
      user_agent,
      referrer_url
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking promo code event from frontend:', error);
    // Return success even on error - don't break user experience
    res.json({
      success: true,
      message: 'Event tracking attempted'
    });
  }
};

// Get promo code analytics time series (admin only)
const getPromoCodeAnalyticsTimeSeries = async (req, res) => {
  try {
    const { promo_code_id, date_from, date_to } = req.query;

    // Check if analytics table exists
    try {
      await query('SELECT 1 FROM promo_code_analytics LIMIT 1');
    } catch (tableError) {
      return res.json({
        success: true,
        data: []
      });
    }

    let whereConditions = [];
    let queryParams = [];

    if (promo_code_id) {
      whereConditions.push('promo_code_id = ?');
      queryParams.push(promo_code_id);
    }

    if (date_from) {
      whereConditions.push('created_at >= ?');
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push('created_at <= ?');
      queryParams.push(date_to + ' 23:59:59');
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const timeSeriesQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN event_type = 'validate' THEN 1 END) as validations,
        COUNT(CASE WHEN event_type = 'apply' THEN 1 END) as applications,
        COUNT(CASE WHEN event_type = 'redeem' THEN 1 END) as redemptions,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN revenue ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN event_type = 'redeem' THEN discount_amount ELSE 0 END), 0) as discount_given
      FROM promo_code_analytics
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const result = await query(timeSeriesQuery, queryParams);
    const timeSeries = (result.rows || result).map(row => ({
      date: row.date,
      views: parseInt(row.views) || 0,
      validations: parseInt(row.validations) || 0,
      applications: parseInt(row.applications) || 0,
      redemptions: parseInt(row.redemptions) || 0,
      revenue: parseFloat(row.revenue) || 0,
      discount_given: parseFloat(row.discount_given) || 0
    }));

    res.json({
      success: true,
      data: timeSeries
    });
  } catch (error) {
    console.error('Get promo code analytics time series error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getPromoCodes,
  getPromoCode,
  validatePromoCode,
  createPromoCode,
  updatePromoCode,
  incrementUsage,
  updatePromoCodeStatus,
  trackPromoCodeEvent,
  updatePromoCodePerformanceCache,
  getPromoCodeAnalyticsOverview,
  getPromoCodeAnalytics,
  getPromoCodeAnalyticsTimeSeries,
  trackPromoCodeEventFromFrontend
};

// Backfill historical analytics data (admin only)
const backfillPromoCodeAnalytics = async (req, res) => {
  try {
    // Check if analytics table exists
    try {
      await query('SELECT 1 FROM promo_code_analytics LIMIT 1');
    } catch (tableError) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tables do not exist. Please run migration 054_create_promo_code_analytics.sql first.'
      });
    }

    // Get all orders with promo codes that haven't been backfilled
    const ordersResult = await query(`
      SELECT 
        o.id as order_id,
        o.customer_id,
        o.promo_code,
        o.promo_discount,
        o.subtotal,
        o.total_amount as revenue,
        o.created_at as order_date
      FROM orders o
      WHERE o.promo_code IS NOT NULL 
        AND o.promo_code != ''
        AND o.promo_discount > 0
        AND NOT EXISTS (
          SELECT 1 FROM promo_code_analytics 
          WHERE order_id = o.id AND event_type = 'redeem'
        )
      ORDER BY o.created_at ASC
    `);

    const orders = ordersResult.rows || ordersResult;
    let processed = 0;
    let errors = 0;
    const processedPromoCodes = new Set();

    for (const order of orders) {
      try {
        // Find promo code ID
        const promoResult = await query(
          'SELECT id FROM promo_codes WHERE code = ?',
          [order.promo_code.toUpperCase()]
        );

        const promo = promoResult.rows?.[0] || promoResult[0];
        if (!promo) {
          errors++;
          continue;
        }

        const promoCodeId = promo.id;

        // Create redeem event
        await query(`
          INSERT INTO promo_code_analytics (
            promo_code_id, event_type, customer_id, order_id, cart_value,
            discount_amount, revenue, created_at
          ) VALUES (?, 'redeem', ?, ?, ?, ?, ?, ?)
        `, [
          promoCodeId,
          order.customer_id || null,
          order.order_id,
          parseFloat(order.subtotal) || 0,
          parseFloat(order.promo_discount) || 0,
          parseFloat(order.revenue) || 0,
          order.order_date || new Date().toISOString()
        ]);

        processedPromoCodes.add(promoCodeId);
        processed++;
      } catch (error) {
        console.error(`Error processing order #${order.order_id}:`, error);
        errors++;
      }
    }

    // Update performance cache for all affected promo codes
    for (const promoCodeId of processedPromoCodes) {
      try {
        await updatePromoCodePerformanceCache(promoCodeId);
      } catch (error) {
        console.error(`Error updating cache for promo code ${promoCodeId}:`, error);
      }
    }

    // Update used_count in promo_codes table
    await query(`
      UPDATE promo_codes
      SET used_count = (
        SELECT COUNT(*)
        FROM promo_code_analytics
        WHERE promo_code_analytics.promo_code_id = promo_codes.id
          AND promo_code_analytics.event_type = 'redeem'
      )
    `);

    res.json({
      success: true,
      message: `Backfill completed: ${processed} orders processed, ${errors} errors`,
      data: {
        processed,
        errors,
        unique_codes: processedPromoCodes.size
      }
    });
  } catch (error) {
    console.error('Backfill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during backfill',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPromoCodes,
  getPromoCode,
  validatePromoCode,
  createPromoCode,
  updatePromoCode,
  incrementUsage,
  updatePromoCodeStatus,
  trackPromoCodeEvent,
  updatePromoCodePerformanceCache,
  getPromoCodeAnalyticsOverview,
  getPromoCodeAnalytics,
  getPromoCodeAnalyticsTimeSeries,
  trackPromoCodeEventFromFrontend,
  backfillPromoCodeAnalytics
};

// Run promo code analytics migration (admin only)
const runPromoCodeAnalyticsMigration = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    console.log('Running promo code analytics migration via API...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/054_create_promo_code_analytics.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Parse SQL statements
    const lines = migrationSQL.split('\n');
    let currentStatement = '';
    const allStatements = [];

    for (const line of lines) {
      let cleanLine = line;
      const commentIndex = cleanLine.indexOf('--');
      if (commentIndex >= 0) {
        cleanLine = cleanLine.substring(0, commentIndex);
      }
      const trimmedLine = cleanLine.trim();
      
      if (trimmedLine.length === 0) {
        continue;
      }
      
      currentStatement += (currentStatement ? ' ' : '') + trimmedLine;
      
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.replace(/;+$/, '').trim();
        if (stmt.length > 0) {
          allStatements.push(stmt);
        }
        currentStatement = '';
      }
    }

    if (currentStatement.trim().length > 0) {
      allStatements.push(currentStatement.trim());
    }

    // Separate CREATE TABLE from CREATE INDEX statements
    const createTableStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE TABLE')
    );
    const createIndexStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE INDEX')
    );

    const results = {
      tablesCreated: 0,
      tablesSkipped: 0,
      indexesCreated: 0,
      indexesSkipped: 0,
      errors: []
    };

    // Execute CREATE TABLE statements first
    for (const statement of createTableStatements) {
      try {
        const sqlStatement = statement.endsWith(';') ? statement : statement + ';';
        await query(sqlStatement);
        results.tablesCreated++;
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          results.tablesSkipped++;
        } else {
          results.errors.push(`Table creation error: ${error.message}`);
          throw error;
        }
      }
    }

    // Then execute CREATE INDEX statements
    for (const statement of createIndexStatements) {
      try {
        await query(statement);
        results.indexesCreated++;
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          results.indexesSkipped++;
        } else {
          results.errors.push(`Index creation error: ${error.message}`);
          // Don't throw for index errors, just log them
        }
      }
    }

    res.json({
      success: true,
      message: 'Migration completed successfully',
      data: results
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getPromoCodes,
  getPromoCode,
  validatePromoCode,
  createPromoCode,
  updatePromoCode,
  incrementUsage,
  updatePromoCodeStatus,
  trackPromoCodeEvent,
  updatePromoCodePerformanceCache,
  getPromoCodeAnalyticsOverview,
  getPromoCodeAnalytics,
  getPromoCodeAnalyticsTimeSeries,
  trackPromoCodeEventFromFrontend,
  backfillPromoCodeAnalytics,
  runPromoCodeAnalyticsMigration
};

