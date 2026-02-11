const { query, get } = require('../config/db');

// Get all active deals (public - for frontend)
const getActiveDeals = async (req, res) => {
  try {
    const { cart_amount } = req.query;
    const cartAmount = parseFloat(cart_amount) || 0;

    // Get all active deals with product information
    const dealsQuery = `
      SELECT 
        d.id,
        d.deal_title,
        d.product_id,
        d.variant_id,
        d.threshold_amount,
        d.deal_price,
        d.max_quantity_per_order,
        d.priority,
        d.description,
        p.id as product_id,
        p.name as product_name,
        p.image_url as product_image,
        p.base_price as product_base_price,
        p.base_weight as product_base_weight,
        p.discounted_price as product_discounted_price,
        p.is_active as product_is_active,
        pv.weight as variant_weight,
        pv.price as variant_price,
        pv.discounted_price as variant_discounted_price,
        pv.discount_percent as variant_discount_percent
      FROM one_rupee_deals d
      INNER JOIN products p ON d.product_id = p.id
      LEFT JOIN product_variants pv 
        ON pv.id = d.variant_id
      WHERE d.is_active = 1 AND p.is_active = 1
      ORDER BY d.priority ASC, d.threshold_amount ASC
    `;

    const result = await query(dealsQuery);
    const deals = result.rows || result;

    // Transform deals and determine status
    const eligibleDeals = deals.map(deal => {
      const isUnlocked = cartAmount >= parseFloat(deal.threshold_amount);
      const variantPrice = deal.variant_price !== null ? parseFloat(deal.variant_price) : null;
      const variantDiscounted = deal.variant_discounted_price !== null ? parseFloat(deal.variant_discounted_price) : null;
      const variantDiscountPercent = deal.variant_discount_percent !== null ? parseFloat(deal.variant_discount_percent) : 0;
      const variantCurrentPrice = variantPrice
        ? (variantDiscounted || (variantDiscountPercent > 0 ? variantPrice * (1 - variantDiscountPercent / 100) : variantPrice))
        : null;
      const baseCurrentPrice = deal.product_base_weight
        ? (parseFloat(deal.product_discounted_price) || parseFloat(deal.product_base_price))
        : null;
      const currentPrice = variantCurrentPrice || (deal.variant_id ? null : baseCurrentPrice);
      const originalPrice = currentPrice;

      return {
        deal_id: deal.id,
        deal_title: deal.deal_title,
        product_id: deal.product_id,
        variant_id: deal.variant_id || null,
        product: {
          id: deal.product_id,
          name: deal.product_name,
          image_url: deal.product_image,
          base_price: parseFloat(deal.product_base_price),
          base_weight: deal.product_base_weight,
          discounted_price: parseFloat(deal.product_discounted_price),
          variant_weight: deal.variant_weight || null,
          current_price: currentPrice
        },
        original_price: originalPrice,
        deal_price: parseFloat(deal.deal_price),
        threshold: parseFloat(deal.threshold_amount),
        max_quantity: parseInt(deal.max_quantity_per_order) || 1,
        status: isUnlocked ? 'unlocked' : 'locked',
        message: isUnlocked 
          ? `Unlocked! Get ${deal.product_name} for ₹${deal.deal_price}` 
          : `Add ₹${Math.max(0, Math.ceil(parseFloat(deal.threshold_amount) - cartAmount))} more to unlock ${deal.product_name} for ₹${deal.deal_price}`,
        description: deal.description
      };
    });

    // Find next deal (lowest locked deal)
    const nextDeal = eligibleDeals.find(d => d.status === 'locked');
    const nextDealInfo = nextDeal ? {
      threshold: nextDeal.threshold,
      message: `Add ₹${Math.max(0, Math.ceil(nextDeal.threshold - cartAmount))} more to unlock next deal`
    } : null;

    res.json({
      success: true,
      data: {
        eligible_deals: eligibleDeals,
        next_deal: nextDealInfo,
        cart_amount: cartAmount
      }
    });
  } catch (error) {
    console.error('Get active deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all deals (admin)
const getAllDeals = async (req, res) => {
  try {
    const dealsQuery = `
      SELECT 
        d.*,
        p.name as product_name,
        p.image_url as product_image,
        p.base_price as product_base_price,
        p.base_weight as product_base_weight,
        p.is_active as product_is_active,
        pv.weight as variant_weight
      FROM one_rupee_deals d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN product_variants pv ON pv.id = d.variant_id
      ORDER BY d.priority ASC, d.threshold_amount ASC
    `;

    const result = await query(dealsQuery);
    const deals = (result.rows || result).map(deal => ({
      ...deal,
      threshold_amount: parseFloat(deal.threshold_amount),
      deal_price: parseFloat(deal.deal_price),
      max_quantity_per_order: parseInt(deal.max_quantity_per_order) || 1,
      priority: parseInt(deal.priority) || 0,
      is_active: Boolean(deal.is_active),
      product: deal.product_id ? {
        id: deal.product_id,
        name: deal.product_name,
        image_url: deal.product_image,
        base_price: parseFloat(deal.product_base_price),
        base_weight: deal.product_base_weight,
        variant_weight: deal.variant_weight || null,
        is_active: Boolean(deal.product_is_active)
      } : null
    }));

    res.json({
      success: true,
      data: deals
    });
  } catch (error) {
    console.error('Get all deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single deal by ID (admin)
const getDealById = async (req, res) => {
  try {
    const { id } = req.params;

    const dealQuery = `
      SELECT 
        d.*,
        p.name as product_name,
        p.image_url as product_image,
        p.base_price as product_base_price,
        p.base_weight as product_base_weight,
        p.is_active as product_is_active,
        pv.weight as variant_weight
      FROM one_rupee_deals d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN product_variants pv ON pv.id = d.variant_id
      WHERE d.id = ?
    `;

    const result = await query(dealQuery, [id]);
    const deal = result.rows?.[0] || result[0];

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    const transformedDeal = {
      ...deal,
      threshold_amount: parseFloat(deal.threshold_amount),
      deal_price: parseFloat(deal.deal_price),
      max_quantity_per_order: parseInt(deal.max_quantity_per_order) || 1,
      priority: parseInt(deal.priority) || 0,
      is_active: Boolean(deal.is_active),
      product: deal.product_id ? {
        id: deal.product_id,
        name: deal.product_name,
        image_url: deal.product_image,
        base_price: parseFloat(deal.product_base_price),
        base_weight: deal.product_base_weight,
        variant_weight: deal.variant_weight || null,
        is_active: Boolean(deal.product_is_active)
      } : null
    };

    res.json({
      success: true,
      data: transformedDeal
    });
  } catch (error) {
    console.error('Get deal by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create deal (admin)
const createDeal = async (req, res) => {
  try {
    const {
      deal_title,
      product_id,
      threshold_amount,
      variant_id,
      deal_price = 1.00,
      max_quantity_per_order = 1,
      priority = 0,
      is_active = true,
      description
    } = req.body;

    // Validation
    if (!deal_title || !deal_title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Deal title is required'
      });
    }

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!threshold_amount || threshold_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Threshold amount must be greater than 0'
      });
    }

    // Check if product exists and is active
    const productCheck = await get(
      'SELECT id, name, is_active FROM products WHERE id = ?',
      [product_id]
    );

    if (!productCheck) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate variant if provided
    const normalizedVariantId = variant_id ? Number(variant_id) : null;
    if (normalizedVariantId) {
      const variantCheck = await get(
        'SELECT id, product_id FROM product_variants WHERE id = ?',
        [normalizedVariantId]
      );
      if (!variantCheck || Number(variantCheck.product_id) !== Number(product_id)) {
        return res.status(400).json({
          success: false,
          message: 'Selected variant does not belong to the product'
        });
      }
    }

    // Check for duplicate (same product at same threshold)
    const duplicateCheck = await get(
      'SELECT id FROM one_rupee_deals WHERE product_id = ? AND threshold_amount = ?',
      [product_id, threshold_amount]
    );

    if (duplicateCheck) {
      return res.status(400).json({
        success: false,
        message: 'A deal for this product at this threshold already exists'
      });
    }

    // Insert deal
    const insertQuery = `
      INSERT INTO one_rupee_deals (
        deal_title, product_id, threshold_amount, variant_id, deal_price,
        max_quantity_per_order, priority, is_active, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertQuery, [
      deal_title.trim(),
      product_id,
      threshold_amount,
      normalizedVariantId,
      deal_price,
      max_quantity_per_order,
      priority,
      is_active ? 1 : 0,
      description || null
    ]);

    const dealId = result.lastID;

    // Fetch created deal
    const dealQuery = `
      SELECT 
        d.*,
        p.name as product_name,
        p.image_url as product_image,
        p.base_price as product_base_price,
        p.base_weight as product_base_weight,
        p.is_active as product_is_active,
        pv.weight as variant_weight
      FROM one_rupee_deals d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN product_variants pv ON pv.id = d.variant_id
      WHERE d.id = ?
    `;
    const dealResult = await query(dealQuery, [dealId]);
    const createdDeal = dealResult.rows?.[0] || dealResult[0];

    const transformedDeal = {
      ...createdDeal,
      threshold_amount: parseFloat(createdDeal.threshold_amount),
      deal_price: parseFloat(createdDeal.deal_price),
      max_quantity_per_order: parseInt(createdDeal.max_quantity_per_order) || 1,
      priority: parseInt(createdDeal.priority) || 0,
      is_active: Boolean(createdDeal.is_active),
      product: createdDeal.product_id ? {
        id: createdDeal.product_id,
        name: createdDeal.product_name,
        image_url: createdDeal.product_image,
        base_price: parseFloat(createdDeal.product_base_price),
        base_weight: createdDeal.product_base_weight,
        variant_weight: createdDeal.variant_weight || null,
        is_active: Boolean(createdDeal.product_is_active)
      } : null
    };

    res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: transformedDeal
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update deal (admin)
const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      deal_title,
      product_id,
      threshold_amount,
      variant_id,
      deal_price,
      max_quantity_per_order,
      priority,
      is_active,
      description
    } = req.body;

    // Check if deal exists
    const existingDeal = await get(
      'SELECT * FROM one_rupee_deals WHERE id = ?',
      [id]
    );

    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Validation
    if (deal_title !== undefined && (!deal_title || !deal_title.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Deal title cannot be empty'
      });
    }

    if (product_id !== undefined) {
      const productCheck = await get(
        'SELECT id FROM products WHERE id = ?',
        [product_id]
      );

      if (!productCheck) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check for duplicate (if product or threshold changed)
      if (product_id !== existingDeal.product_id || 
          (threshold_amount !== undefined && threshold_amount !== existingDeal.threshold_amount)) {
        const duplicateCheck = await get(
          'SELECT id FROM one_rupee_deals WHERE product_id = ? AND threshold_amount = ? AND id != ?',
          [product_id, threshold_amount || existingDeal.threshold_amount, id]
        );

        if (duplicateCheck) {
          return res.status(400).json({
            success: false,
            message: 'A deal for this product at this threshold already exists'
          });
        }
      }
    }

    if (threshold_amount !== undefined && threshold_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Threshold amount must be greater than 0'
      });
    }

    if (variant_id !== undefined) {
      const normalizedVariantId = variant_id ? Number(variant_id) : null;
      if (normalizedVariantId) {
        const targetProductId = product_id !== undefined ? product_id : existingDeal.product_id;
        const variantCheck = await get(
          'SELECT id, product_id FROM product_variants WHERE id = ?',
          [normalizedVariantId]
        );
        if (!variantCheck || Number(variantCheck.product_id) !== Number(targetProductId)) {
          return res.status(400).json({
            success: false,
            message: 'Selected variant does not belong to the product'
          });
        }
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (deal_title !== undefined) {
      updates.push('deal_title = ?');
      params.push(deal_title.trim());
    }
    if (product_id !== undefined) {
      updates.push('product_id = ?');
      params.push(product_id);
    }
    if (threshold_amount !== undefined) {
      updates.push('threshold_amount = ?');
      params.push(threshold_amount);
    }
    if (variant_id !== undefined) {
      updates.push('variant_id = ?');
      params.push(variant_id ? Number(variant_id) : null);
    }
    if (deal_price !== undefined) {
      updates.push('deal_price = ?');
      params.push(deal_price);
    }
    if (max_quantity_per_order !== undefined) {
      updates.push('max_quantity_per_order = ?');
      params.push(max_quantity_per_order);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const updateQuery = `
      UPDATE one_rupee_deals 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await query(updateQuery, params);

    // Fetch updated deal
    const dealQuery = `
      SELECT 
        d.*,
        p.name as product_name,
        p.image_url as product_image,
        p.base_price as product_base_price,
        p.base_weight as product_base_weight,
        p.is_active as product_is_active,
        pv.weight as variant_weight
      FROM one_rupee_deals d
      LEFT JOIN products p ON d.product_id = p.id
      LEFT JOIN product_variants pv ON pv.id = d.variant_id
      WHERE d.id = ?
    `;
    const dealResult = await query(dealQuery, [id]);
    const updatedDeal = dealResult.rows?.[0] || dealResult[0];

    const transformedDeal = {
      ...updatedDeal,
      threshold_amount: parseFloat(updatedDeal.threshold_amount),
      deal_price: parseFloat(updatedDeal.deal_price),
      max_quantity_per_order: parseInt(updatedDeal.max_quantity_per_order) || 1,
      priority: parseInt(updatedDeal.priority) || 0,
      is_active: Boolean(updatedDeal.is_active),
      product: updatedDeal.product_id ? {
        id: updatedDeal.product_id,
        name: updatedDeal.product_name,
        image_url: updatedDeal.product_image,
        base_price: parseFloat(updatedDeal.product_base_price),
        base_weight: updatedDeal.product_base_weight,
        variant_weight: updatedDeal.variant_weight || null,
        is_active: Boolean(updatedDeal.product_is_active)
      } : null
    };

    res.json({
      success: true,
      message: 'Deal updated successfully',
      data: transformedDeal
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete deal (admin)
const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if deal exists
    const deal = await get(
      'SELECT id FROM one_rupee_deals WHERE id = ?',
      [id]
    );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    await query('DELETE FROM one_rupee_deals WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle deal active status (admin)
const toggleDealStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await get(
      'SELECT id, is_active FROM one_rupee_deals WHERE id = ?',
      [id]
    );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    const newStatus = !deal.is_active;

    await query(
      'UPDATE one_rupee_deals SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: `Deal ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: parseInt(id),
        is_active: newStatus
      }
    });
  } catch (error) {
    console.error('Toggle deal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update deal priorities (admin)
const updateDealPriorities = async (req, res) => {
  try {
    const { priorities } = req.body; // Array of { id, priority }

    if (!Array.isArray(priorities)) {
      return res.status(400).json({
        success: false,
        message: 'Priorities must be an array'
      });
    }

    // Update each deal's priority
    for (const item of priorities) {
      await query(
        'UPDATE one_rupee_deals SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.priority, item.id]
      );
    }

    res.json({
      success: true,
      message: 'Deal priorities updated successfully'
    });
  } catch (error) {
    console.error('Update deal priorities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Track deal analytics event (public - for frontend tracking)
const trackDealEvent = async (req, res) => {
  try {
    const { deal_id, event_type, customer_id, cart_value } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent');
    const referrer_url = req.get('referer');

    if (!deal_id || !event_type) {
      return res.status(400).json({
        success: false,
        message: 'Deal ID and event type are required'
      });
    }

    if (!['view', 'click', 'add_to_cart', 'purchase'].includes(event_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type. Must be: view, click, add_to_cart, or purchase'
      });
    }

    // Verify deal exists
    const dealCheck = await get(
      'SELECT id FROM one_rupee_deals WHERE id = ?',
      [deal_id]
    );

    if (!dealCheck) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Insert analytics event
    await query(`
      INSERT INTO deal_analytics (
        deal_id, event_type, customer_id, cart_value, ip_address, user_agent, referrer_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      deal_id,
      event_type,
      customer_id || null,
      cart_value || null,
      ip_address,
      user_agent,
      referrer_url
    ]);

    // Update performance cache (async, don't wait)
    updateDealPerformanceCache(deal_id).catch(err => {
      console.error('Error updating deal performance cache:', err);
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Track deal event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Track deal purchase (called from order creation)
const trackDealPurchase = async (dealId, orderId, customerId, revenue, cartValue) => {
  try {
    await query(`
      INSERT INTO deal_analytics (
        deal_id, event_type, customer_id, order_id, cart_value, revenue
      ) VALUES (?, 'purchase', ?, ?, ?, ?)
    `, [dealId, customerId, orderId, cartValue, revenue]);

    // Update performance cache
    await updateDealPerformanceCache(dealId);
  } catch (error) {
    console.error('Error tracking deal purchase:', error);
  }
};

// Update deal performance cache
const updateDealPerformanceCache = async (dealId) => {
  try {
    // Get aggregated analytics for this deal
    const analyticsQuery = `
      SELECT 
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as total_clicks,
        COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as total_adds,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as total_redemptions,
        COALESCE(SUM(CASE WHEN event_type = 'purchase' THEN revenue ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN event_type = 'add_to_cart' THEN cart_value END), 0) as avg_cart_value,
        COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN customer_id END) as unique_customers
      FROM deal_analytics
      WHERE deal_id = ?
    `;

    const result = await query(analyticsQuery, [dealId]);
    const stats = result.rows?.[0] || result[0];

    const totalViews = parseInt(stats.total_views) || 0;
    const totalClicks = parseInt(stats.total_clicks) || 0;
    const totalAdds = parseInt(stats.total_adds) || 0;
    const totalRedemptions = parseInt(stats.total_redemptions) || 0;
    const totalRevenue = parseFloat(stats.total_revenue) || 0;
    const avgCartValue = parseFloat(stats.avg_cart_value) || 0;
    const uniqueCustomers = parseInt(stats.unique_customers) || 0;

    // Calculate rates
    const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const addToCartRate = totalClicks > 0 ? (totalAdds / totalClicks) * 100 : 0;
    const redemptionRate = totalAdds > 0 ? (totalRedemptions / totalAdds) * 100 : 0;

    // Insert or update cache (SQLite compatible - check first, then insert or update)
    try {
      const existing = await get(
        'SELECT deal_id FROM deal_performance_cache WHERE deal_id = ?',
        [dealId]
      );

      if (existing) {
        await query(`
          UPDATE deal_performance_cache SET
            total_views = ?, total_clicks = ?, total_adds = ?, total_redemptions = ?,
            total_revenue = ?, conversion_rate = ?, click_through_rate = ?,
            add_to_cart_rate = ?, redemption_rate = ?, avg_cart_value = ?,
            unique_customers = ?, last_updated = NOW()
          WHERE deal_id = ?
        `, [
          totalViews, totalClicks, totalAdds, totalRedemptions,
          totalRevenue, conversionRate, clickThroughRate, addToCartRate,
          redemptionRate, avgCartValue, uniqueCustomers, dealId
        ]);
      } else {
        await query(`
          INSERT INTO deal_performance_cache (
            deal_id, total_views, total_clicks, total_adds, total_redemptions,
            total_revenue, conversion_rate, click_through_rate, add_to_cart_rate,
            redemption_rate, avg_cart_value, unique_customers, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          dealId, totalViews, totalClicks, totalAdds, totalRedemptions,
          totalRevenue, conversionRate, clickThroughRate, addToCartRate,
          redemptionRate, avgCartValue, uniqueCustomers
        ]);
      }
    } catch (error) {
      console.error('Error updating deal performance cache:', error);
    }
  } catch (error) {
    console.error('Error calculating deal performance:', error);
  }
};

// Get deal analytics (admin)
const getDealAnalytics = async (req, res) => {
  try {
    const { deal_id, date_from, date_to, event_type } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (deal_id) {
      whereConditions.push('deal_id = ?');
      queryParams.push(deal_id);
    }

    if (event_type) {
      whereConditions.push('event_type = ?');
      queryParams.push(event_type);
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

    const analyticsQuery = `
      SELECT 
        deal_id,
        event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT customer_id) as unique_customers,
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(AVG(cart_value), 0) as avg_cart_value,
        DATE(created_at) as event_date
      FROM deal_analytics
      ${whereClause}
      GROUP BY deal_id, event_type, DATE(created_at)
      ORDER BY event_date DESC, deal_id
    `;

    const result = await query(analyticsQuery, queryParams);
    const analytics = result.rows || result;

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get deal analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get deal performance summary (admin)
const getDealPerformance = async (req, res) => {
  try {
    const { deal_id } = req.params;

    // Get from cache if available, otherwise calculate
    const cacheQuery = `
      SELECT 
        dpc.*,
        d.deal_title,
        d.threshold_amount,
        d.deal_price
      FROM deal_performance_cache dpc
      INNER JOIN one_rupee_deals d ON dpc.deal_id = d.id
      WHERE dpc.deal_id = ?
    `;

    const cacheResult = await query(cacheQuery, [deal_id]);
    let performance = cacheResult.rows?.[0] || cacheResult[0];

    // If no cache, calculate from analytics
    if (!performance) {
      await updateDealPerformanceCache(deal_id);
      const recacheResult = await query(cacheQuery, [deal_id]);
      performance = recacheResult.rows?.[0] || recacheResult[0];
    }

    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Deal performance data not found'
      });
    }

    res.json({
      success: true,
      data: {
        deal_id: parseInt(performance.deal_id),
        deal_title: performance.deal_title,
        threshold_amount: parseFloat(performance.threshold_amount),
        deal_price: parseFloat(performance.deal_price),
        total_views: parseInt(performance.total_views) || 0,
        total_clicks: parseInt(performance.total_clicks) || 0,
        total_adds: parseInt(performance.total_adds) || 0,
        total_redemptions: parseInt(performance.total_redemptions) || 0,
        total_revenue: parseFloat(performance.total_revenue) || 0,
        conversion_rate: parseFloat(performance.conversion_rate) || 0,
        click_through_rate: parseFloat(performance.click_through_rate) || 0,
        add_to_cart_rate: parseFloat(performance.add_to_cart_rate) || 0,
        redemption_rate: parseFloat(performance.redemption_rate) || 0,
        avg_cart_value: parseFloat(performance.avg_cart_value) || 0,
        unique_customers: parseInt(performance.unique_customers) || 0,
        last_updated: performance.last_updated
      }
    });
  } catch (error) {
    console.error('Get deal performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all deals performance summary (admin)
const getAllDealsPerformance = async (req, res) => {
  try {
    // Check if tables exist first
    try {
      await query('SELECT 1 FROM deal_analytics LIMIT 1');
      await query('SELECT 1 FROM deal_performance_cache LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist - return empty array
      console.warn('Analytics tables do not exist. Please run migrations.');
      return res.json({
        success: true,
        data: []
      });
    }

    const { date_from, date_to } = req.query;

    // If date filters are provided, calculate from deal_analytics directly
    // Otherwise, use the cache for better performance
    if (date_from || date_to) {
      // Calculate performance metrics from deal_analytics with date filters
      let analyticsWhereConditions = [];
      let analyticsParams = [];

      if (date_from) {
        analyticsWhereConditions.push('da.created_at >= ?');
        analyticsParams.push(date_from);
      }

      if (date_to) {
        analyticsWhereConditions.push('da.created_at <= ?');
        analyticsParams.push(date_to + ' 23:59:59');
      }

      // Combine date filters with active deals filter
      analyticsWhereConditions.push('d.is_active = 1');
      
      const analyticsWhereClause = analyticsWhereConditions.length > 0
        ? `WHERE ${analyticsWhereConditions.join(' AND ')}`
        : 'WHERE d.is_active = 1';

      const performanceQuery = `
        SELECT 
          d.id as deal_id,
          d.deal_title,
          d.threshold_amount,
          d.deal_price,
          d.priority,
          COUNT(CASE WHEN da.event_type = 'view' THEN 1 END) as total_views,
          COUNT(CASE WHEN da.event_type = 'click' THEN 1 END) as total_clicks,
          COUNT(CASE WHEN da.event_type = 'add_to_cart' THEN 1 END) as total_adds,
          COUNT(CASE WHEN da.event_type = 'purchase' THEN 1 END) as total_redemptions,
          COALESCE(SUM(CASE WHEN da.event_type = 'purchase' THEN da.revenue ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN da.event_type = 'add_to_cart' THEN da.cart_value END), 0) as avg_cart_value,
          COUNT(DISTINCT CASE WHEN da.event_type = 'purchase' THEN da.customer_id END) as unique_customers
        FROM one_rupee_deals d
        LEFT JOIN deal_analytics da ON d.id = da.deal_id
        ${analyticsWhereClause}
        GROUP BY d.id, d.deal_title, d.threshold_amount, d.deal_price, d.priority
        ORDER BY total_redemptions DESC, total_revenue DESC
      `;

      let result;
      try {
        result = await query(performanceQuery, analyticsParams);
      } catch (queryError) {
        console.error('Error executing performance query:', queryError);
        console.error('Query:', performanceQuery);
        console.error('Params:', analyticsParams);
        // If it's a table error, return empty array
        if (queryError.message && (queryError.message.includes('no such table') || queryError.message.includes('does not exist'))) {
          return res.json({
            success: true,
            data: []
          });
        }
        throw queryError;
      }
      
      const performances = (result.rows || result).map(perf => {
        const totalViews = parseInt(perf.total_views) || 0;
        const totalClicks = parseInt(perf.total_clicks) || 0;
        const totalAdds = parseInt(perf.total_adds) || 0;
        const totalRedemptions = parseInt(perf.total_redemptions) || 0;
        const totalRevenue = parseFloat(perf.total_revenue) || 0;
        const avgCartValue = parseFloat(perf.avg_cart_value) || 0;
        const uniqueCustomers = parseInt(perf.unique_customers) || 0;

        // Calculate rates
        const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
        const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        const addToCartRate = totalClicks > 0 ? (totalAdds / totalClicks) * 100 : 0;
        const redemptionRate = totalAdds > 0 ? (totalRedemptions / totalAdds) * 100 : 0;

        return {
          deal_id: parseInt(perf.deal_id),
          deal_title: perf.deal_title,
          threshold_amount: parseFloat(perf.threshold_amount),
          deal_price: parseFloat(perf.deal_price),
          priority: parseInt(perf.priority) || 0,
          total_views: totalViews,
          total_clicks: totalClicks,
          total_adds: totalAdds,
          total_redemptions: totalRedemptions,
          total_revenue: totalRevenue,
          conversion_rate: conversionRate,
          click_through_rate: clickThroughRate,
          add_to_cart_rate: addToCartRate,
          redemption_rate: redemptionRate,
          avg_cart_value: avgCartValue,
          unique_customers: uniqueCustomers
        };
      });

      return res.json({
        success: true,
        data: performances
      });
    } else {
      // No date filters - use cache for better performance
      const performanceQuery = `
        SELECT 
          dpc.*,
          d.deal_title,
          d.threshold_amount,
          d.deal_price,
          d.priority
        FROM deal_performance_cache dpc
        INNER JOIN one_rupee_deals d ON dpc.deal_id = d.id
        WHERE d.is_active = 1
        ORDER BY dpc.total_redemptions DESC, dpc.total_revenue DESC
      `;

      const result = await query(performanceQuery);
      const performances = (result.rows || result).map(perf => ({
        deal_id: parseInt(perf.deal_id),
        deal_title: perf.deal_title,
        threshold_amount: parseFloat(perf.threshold_amount),
        deal_price: parseFloat(perf.deal_price),
        priority: parseInt(perf.priority) || 0,
        total_views: parseInt(perf.total_views) || 0,
        total_clicks: parseInt(perf.total_clicks) || 0,
        total_adds: parseInt(perf.total_adds) || 0,
        total_redemptions: parseInt(perf.total_redemptions) || 0,
        total_revenue: parseFloat(perf.total_revenue) || 0,
        conversion_rate: parseFloat(perf.conversion_rate) || 0,
        click_through_rate: parseFloat(perf.click_through_rate) || 0,
        add_to_cart_rate: parseFloat(perf.add_to_cart_rate) || 0,
        redemption_rate: parseFloat(perf.redemption_rate) || 0,
        avg_cart_value: parseFloat(perf.avg_cart_value) || 0,
        unique_customers: parseInt(perf.unique_customers) || 0,
        last_updated: perf.last_updated
      }));

      return res.json({
        success: true,
        data: performances
      });
    }
  } catch (error) {
    console.error('Get all deals performance error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return empty array instead of error if table doesn't exist
    if (error.message && (error.message.includes('no such table') || error.message.includes('does not exist'))) {
      console.warn('Analytics tables do not exist. Please run migrations.');
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message || 'Internal server error'
      : 'Internal server error';
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// Get deal analytics time series (admin)
const getDealAnalyticsTimeSeries = async (req, res) => {
  try {
    // Check if table exists first
    try {
      await query('SELECT 1 FROM deal_analytics LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist - return empty array
      console.warn('deal_analytics table does not exist. Please run migrations.');
      return res.json({
        success: true,
        data: []
      });
    }

    const { deal_id, date_from, date_to } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (deal_id) {
      whereConditions.push('deal_id = ?');
      queryParams.push(deal_id);
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
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
        COUNT(CASE WHEN event_type = 'add_to_cart' THEN 1 END) as adds,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as redemptions,
        COALESCE(SUM(CASE WHEN event_type = 'purchase' THEN revenue ELSE 0 END), 0) as revenue,
        COUNT(DISTINCT deal_id) as deals_count
      FROM deal_analytics
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const result = await query(timeSeriesQuery, queryParams);
    const timeSeries = (result.rows || result).map(row => ({
      date: row.date,
      views: parseInt(row.views) || 0,
      clicks: parseInt(row.clicks) || 0,
      adds: parseInt(row.adds) || 0,
      redemptions: parseInt(row.redemptions) || 0,
      revenue: parseFloat(row.revenue) || 0,
      orders: parseInt(row.redemptions) || 0, // Redemptions = orders with deals
      deals_count: parseInt(row.deals_count) || 0
    }));

    res.json({
      success: true,
      data: timeSeries
    });
  } catch (error) {
    console.error('Get deal analytics time series error:', error);
    // Return empty array instead of error if table doesn't exist
    if (error.message && (error.message.includes('no such table') || error.message.includes('does not exist'))) {
      console.warn('deal_analytics table does not exist. Please run migrations.');
      return res.json({
        success: true,
        data: []
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Backfill historical orders into deal analytics (admin)
const backfillHistoricalOrders = async (req, res) => {
  try {
    const { date_from, date_to, dry_run = false } = req.body;

    // Check if tables exist
    try {
      await query('SELECT 1 FROM deal_analytics LIMIT 1');
      await query('SELECT 1 FROM deal_performance_cache LIMIT 1');
    } catch (tableError) {
      return res.status(400).json({
        success: false,
        message: 'Analytics tables do not exist. Please run migrations first.'
      });
    }

    let ordersQuery = `
      SELECT 
        o.id as order_id,
        o.customer_id,
        o.total_amount,
        o.subtotal,
        o.created_at,
        oi.id as item_id,
        oi.product_id,
        oi.price,
        oi.quantity,
        oi.total as item_total
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const queryParams = [];

    if (date_from) {
      ordersQuery += ' AND o.created_at >= ?';
      queryParams.push(date_from);
    }

    if (date_to) {
      ordersQuery += ' AND o.created_at <= ?';
      queryParams.push(date_to + ' 23:59:59');
    }

    ordersQuery += ' ORDER BY o.created_at ASC';

    const ordersResult = await query(ordersQuery, queryParams);
    const orders = ordersResult.rows || ordersResult;

    if (orders.length === 0) {
      return res.json({
        success: true,
        message: 'No orders found for the specified date range',
        data: {
          processed: 0,
          dealsFound: 0,
          eventsCreated: 0
        }
      });
    }

    // Get all active deals to match against
    const dealsResult = await query(`
      SELECT id, product_id, deal_price, threshold_amount
      FROM one_rupee_deals
      WHERE is_active = 1
    `);
    const deals = dealsResult.rows || dealsResult;

    if (deals.length === 0) {
      return res.json({
        success: true,
        message: 'No active deals found',
        data: {
          processed: 0,
          dealsFound: 0,
          eventsCreated: 0
        }
      });
    }

    // Group orders by order_id
    const ordersMap = new Map();
    orders.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          customer_id: row.customer_id,
          total_amount: parseFloat(row.total_amount),
          subtotal: parseFloat(row.subtotal),
          created_at: row.created_at,
          items: []
        });
      }
      ordersMap.get(row.order_id).items.push({
        item_id: row.item_id,
        product_id: row.product_id,
        price: parseFloat(row.price),
        quantity: row.quantity,
        item_total: parseFloat(row.item_total)
      });
    });

    let processedOrders = 0;
    let dealsFound = 0;
    let eventsCreated = 0;
    const dealStats = new Map(); // Track deals found

    // Process each order
    for (const order of ordersMap.values()) {
      processedOrders++;

      // Check each item in the order
      for (const item of order.items) {
        // Find matching deal by product_id and price
        const matchingDeal = deals.find(deal => {
          if (deal.product_id === item.product_id) {
            const dealPrice = parseFloat(deal.deal_price);
            const itemPrice = item.price;
            // Match if price is within 0.01 tolerance (for floating point)
            return Math.abs(dealPrice - itemPrice) < 0.01;
          }
          return false;
        });

        if (matchingDeal) {
          dealsFound++;
          const dealId = matchingDeal.id;
          
          // Track this deal was found
          if (!dealStats.has(dealId)) {
            dealStats.set(dealId, { count: 0, revenue: 0 });
          }
          const stats = dealStats.get(dealId);
          stats.count += item.quantity;
          stats.revenue += item.item_total;

          if (!dry_run) {
            // Check if this purchase event already exists (avoid duplicates)
            const existingCheck = await query(`
              SELECT id FROM deal_analytics
              WHERE deal_id = ? AND order_id = ? AND event_type = 'purchase'
              LIMIT 1
            `, [dealId, order.order_id]);

            if (!existingCheck.rows || existingCheck.rows.length === 0) {
              // Create purchase event
              await query(`
                INSERT INTO deal_analytics (
                  deal_id, event_type, customer_id, order_id, 
                  cart_value, revenue, created_at
                ) VALUES (?, 'purchase', ?, ?, ?, ?, ?)
              `, [
                dealId,
                order.customer_id,
                order.order_id,
                order.subtotal,
                item.item_total,
                order.created_at
              ]);
              eventsCreated++;

              // Update performance cache for this deal
              await updateDealPerformanceCache(dealId);
            }
          } else {
            eventsCreated++; // Count for dry run
          }
        }
      }
    }

    const result = {
      processed: processedOrders,
      dealsFound,
      eventsCreated,
      dealsProcessed: Array.from(dealStats.entries()).map(([dealId, stats]) => ({
        deal_id: dealId,
        redemptions: stats.count,
        revenue: stats.revenue
      }))
    };

    if (dry_run) {
      return res.json({
        success: true,
        message: `Dry run completed. Would create ${eventsCreated} purchase events from ${processedOrders} orders.`,
        data: result
      });
    }

    res.json({
      success: true,
      message: `Backfill completed. Created ${eventsCreated} purchase events from ${processedOrders} orders.`,
      data: result
    });
  } catch (error) {
    console.error('Backfill historical orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getActiveDeals,
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  toggleDealStatus,
  updateDealPriorities,
  trackDealEvent,
  trackDealPurchase,
  updateDealPerformanceCache,
  getDealAnalytics,
  getDealPerformance,
  getAllDealsPerformance,
  getDealAnalyticsTimeSeries,
  backfillHistoricalOrders
};

