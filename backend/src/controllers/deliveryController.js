const { query, get } = require('../config/db');

// Helper function to check if a column exists in a table
const columnExists = async (tableName, columnName) => {
  try {
    // MySQL: Use INFORMATION_SCHEMA to check column existence
    const result = await query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `, [tableName, columnName]);
    return result.rows && result.rows.length > 0 && parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error(`Error checking column existence for ${tableName}.${columnName}:`, error);
    return false;
  }
};

// Helper function to ensure columns exist (auto-migrate if needed)
const ensureColumnsExist = async () => {
  try {
    const hasTotalAmount = await columnExists('delivery_orders', 'total_amount');
    const hasItemsCount = await columnExists('delivery_orders', 'items_count');

    console.log(`Column check: hasTotalAmount=${hasTotalAmount}, hasItemsCount=${hasItemsCount}`);

    if (!hasTotalAmount) {
      try {
        await query(`ALTER TABLE delivery_orders ADD COLUMN total_amount DECIMAL(10, 2) DEFAULT 0`);
        console.log('✅ Successfully added total_amount column to delivery_orders table');
      } catch (addError) {
        // Column might already exist or table doesn't exist - ignore
        console.warn('⚠️ Could not add total_amount column (might already exist):', addError.message);
      }
    } else {
      console.log('✅ total_amount column already exists');
    }

    if (!hasItemsCount) {
      try {
        await query(`ALTER TABLE delivery_orders ADD COLUMN items_count INTEGER DEFAULT 0`);
        console.log('✅ Successfully added items_count column to delivery_orders table');
      } catch (addError) {
        // Column might already exist or table doesn't exist - ignore
        console.warn('⚠️ Could not add items_count column (might already exist):', addError.message);
      }
    } else {
      console.log('✅ items_count column already exists');
    }
  } catch (error) {
    console.warn('Error ensuring columns exist:', error);
    // Continue anyway - code will handle missing columns gracefully
  }
};

// Get delivery orders for a specific delivery boy
const getDeliveryOrders = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { status, date } = req.query;

    console.log('getDeliveryOrders called with:', { deliveryBoyId, status, date, userId: req.user?.id, role: req.user?.role });

    // First, get delivery orders for this delivery boy
    // Check if user is requesting their own orders or if they have permission
    const userId = req.user?.id;
    if (userId && parseInt(deliveryBoyId) !== userId && req.user?.role !== 'super_admin' && req.user?.role !== 'admin' && req.user?.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own orders.'
      });
    }

    // Check if delivery_orders table exists
    let tableExists = true;
    try {
      const tableCheck = await query(`SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_orders'`);
      if (tableCheck.rows.length === 0) {
        console.log('delivery_orders table does not exist - returning empty array');
        tableExists = false;
        // Return empty array if table doesn't exist
        return res.json({
          success: true,
          data: []
        });
      }
    } catch (tableError) {
      console.error('Error checking table existence:', tableError);
      // Continue anyway - might be a different error
    }

    // First, try a simple query to check table structure
    let tableStructure;
    try {
      const structureQuery = `PRAGMA table_info(delivery_orders)`;
      const structureResult = await query(structureQuery);
      tableStructure = structureResult.rows;
      console.log('delivery_orders table structure:', tableStructure.map(r => r.name));
    } catch (structureError) {
      console.error('Error checking table structure:', structureError);
    }

    // Check if new columns exist (for backward compatibility)
    // Wrap in try-catch to handle any errors gracefully
    let hasTotalAmount = false;
    let hasItemsCount = false;
    try {
      hasTotalAmount = await columnExists('delivery_orders', 'total_amount');
      hasItemsCount = await columnExists('delivery_orders', 'items_count');
    } catch (colCheckError) {
      console.warn('Error checking column existence, assuming columns do not exist:', colCheckError);
      hasTotalAmount = false;
      hasItemsCount = false;
    }

    // Build query - try simpler version first if complex one fails
    // Use stored total_amount and items_count from delivery_orders as primary source
    // Fallback to orders table if not available
    // IMPORTANT: Use CASE to check if stored value is 0 (treat as unset), then use orders table value
    let totalAmountExpr = hasTotalAmount 
      ? `CASE WHEN do.total_amount IS NOT NULL AND do.total_amount > 0 THEN do.total_amount ELSE COALESCE(o.total_amount, 0) END` 
      : `COALESCE(o.total_amount, 0)`;
    let itemsCountExpr = hasItemsCount 
      ? `CASE WHEN do.items_count IS NOT NULL AND do.items_count > 0 THEN do.items_count ELSE (SELECT COALESCE(SUM(quantity), COUNT(*), 0) FROM order_items WHERE order_id = do.order_id) END` 
      : `(SELECT COALESCE(SUM(quantity), COUNT(*), 0) FROM order_items WHERE order_id = do.order_id)`;

    // Explicitly select columns to avoid conflicts with computed total_amount and items_count
    // The computed values will override any stored 0 values
    let sqlQuery = `
      SELECT 
        do.id,
        do.order_id,
        do.delivery_boy_id,
        do.customer_name,
        do.customer_phone,
        do.customer_address,
        do.delivery_date,
        do.delivery_time,
        do.status,
        do.priority,
        do.special_instructions,
        do.delivery_photo_url,
        do.delivered_at,
        do.delivery_latitude,
        do.delivery_longitude,
        o.order_number,
        ${totalAmountExpr} as total_amount,
        COALESCE(o.payment_status, 'pending') as payment_status,
        ${itemsCountExpr} as items_count
      FROM delivery_orders do
      LEFT JOIN orders o ON do.order_id = o.id
      WHERE do.delivery_boy_id = ?
    `;
    
    const params = [deliveryBoyId];

    if (status) {
      sqlQuery += ' AND do.status = ?';
      params.push(status);
    }

    if (date) {
      sqlQuery += ' AND do.delivery_date = ?';
      params.push(date);
    }

    sqlQuery += ' ORDER BY do.priority DESC, do.delivery_time ASC';

    console.log('Executing query:', sqlQuery, 'with params:', params);
    let result;
    try {
      result = await query(sqlQuery, params);
    } catch (queryError) {
      console.error('SQL Query Error:', queryError);
      console.error('Error message:', queryError.message);
      console.error('Error stack:', queryError.stack);
      console.error('Query:', sqlQuery);
      console.error('Params:', params);
      
      // Try a simpler query without JOIN as fallback
      console.log('Trying simpler query without JOIN...');
      try {
        let simpleQuery = `SELECT * FROM delivery_orders WHERE delivery_boy_id = ?`;
        const simpleParams = [deliveryBoyId];
        if (status) {
          simpleQuery += ' AND status = ?';
          simpleParams.push(status);
        }
        if (date) {
          simpleQuery += ' AND delivery_date = ?';
          simpleParams.push(date);
        }
        simpleQuery += ' ORDER BY priority DESC, delivery_time ASC';
        result = await query(simpleQuery, simpleParams);
        console.log('Simple query succeeded, found', result.rows?.length || 0, 'rows');
      } catch (simpleError) {
        console.error('Simple query also failed:', simpleError);
        console.error('Simple error message:', simpleError.message);
        // If both queries fail, return empty array
        return res.json({
          success: true,
          data: [],
          message: 'No delivery orders found or table structure issue'
        });
      }
    }
    
    // Handle both { rows } and direct array responses
    const rows = (result && result.rows) ? result.rows : (Array.isArray(result) ? result : []);
    console.log('Found', rows.length, 'delivery orders');
    
    // If no orders found, return empty array
    if (!rows || rows.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get order items for each order
    const orders = await Promise.all(rows.map(async (row) => {
      try {
        // Fetch order items separately to avoid GROUP_CONCAT issues
        let items = [];
        if (row.order_id) {
          try {
            const itemsQuery = `
              SELECT 
                oi.id,
                oi.product_id,
                oi.variant_id,
                oi.quantity,
                oi.price,
                oi.total,
                oi.flavor_id,
                COALESCE(oi.display_name, p.name) as product_name,
                p.image_url as product_image,
                p.base_weight as product_base_weight,
                pv.name as variant_name,
                pv.weight as variant_weight,
                p.name as product_name_raw
              FROM order_items oi
              LEFT JOIN products p ON oi.product_id = p.id
              LEFT JOIN product_variants pv ON oi.variant_id = pv.id
              WHERE oi.order_id = ?
              ORDER BY oi.id
            `;
            const itemsResult = await query(itemsQuery, [row.order_id]);
            // Debug: Log first item to see what data we're getting
            if (itemsResult.rows && itemsResult.rows.length > 0) {
              const firstItem = itemsResult.rows[0];
              console.log(`[DeliveryController] Order ${row.order_id} - First item data:`, {
                product_id: firstItem.product_id,
                variant_id: firstItem.variant_id,
                variant_weight: firstItem.variant_weight,
                product_base_weight: firstItem.product_base_weight,
                product_name: firstItem.product_name,
                product_name_raw: firstItem.product_name_raw,
                hasProduct: !!firstItem.product_name_raw,
                hasVariant: !!firstItem.variant_name
              });
              
              // Log all items for debugging
              itemsResult.rows.forEach((item, idx) => {
                console.log(`[DeliveryController] Order ${row.order_id} - Item ${idx}:`, {
                  product_id: item.product_id,
                  variant_id: item.variant_id,
                  variant_weight: item.variant_weight,
                  product_base_weight: item.product_base_weight,
                  product_name: item.product_name
                });
              });
            } else {
              console.log(`[DeliveryController] Order ${row.order_id} - No items found`);
            }
            // Return items as objects with all necessary fields for proper weight display
            items = itemsResult.rows.map(item => {
              // Normalize weight values - handle NULL, undefined, and empty strings
              const variantWeight = item.variant_weight != null ? item.variant_weight : null;
              const productBaseWeight = item.product_base_weight != null && item.product_base_weight !== '' 
                ? item.product_base_weight 
                : null;
              
              return {
                id: item.id,
                productId: item.product_id,
                product_id: item.product_id,
                variantId: item.variant_id,
                variant_id: item.variant_id,
                productName: item.product_name,
                product_name: item.product_name,
                product_image: item.product_image,
                variant_weight: variantWeight,
                product_base_weight: productBaseWeight,
                base_weight: productBaseWeight, // Also map to base_weight for compatibility
                quantity: item.quantity,
                price: item.price,
                total: item.total,
                flavor_id: item.flavor_id
              };
            });
          } catch (itemError) {
            console.error('Error fetching items for order', row.order_id, ':', itemError);
            items = [];
          }
        }

        // Always fetch order details to ensure we have complete data
        // Priority: stored values in delivery_orders > values from orders table > default
        let orderNumber = row.order_number;
        // Get total_amount from the computed SQL value (which uses CASE to fallback to orders table)
        let totalAmount = 0;
        if (row.total_amount !== undefined && row.total_amount !== null) {
          totalAmount = parseFloat(row.total_amount) || 0;
        }
        
        // If totalAmount is still 0, it means either:
        // 1. The SQL CASE didn't work (shouldn't happen)
        // 2. The order actually has total 0 (unlikely but possible)
        // 3. The orders table join failed
        // So we ALWAYS fetch from orders table as a safety check
        let paymentStatus = row.payment_status || 'pending';
        let itemsCount = 0;
        if (row.items_count !== undefined && row.items_count !== null) {
          itemsCount = parseInt(row.items_count) || 0;
        }
        
        console.log(`Order ${row.order_id}: SQL computed total_amount=${totalAmount}, items_count=${itemsCount}`);
        
        // ALWAYS fetch from orders table to ensure we have the correct values
        // This is a safety net in case the SQL CASE didn't work or the join failed
        if (row.order_id) {
          try {
            // Fetch complete order details including total
            // Orders table uses 'total_amount' column
            const orderQuery = `SELECT order_number, total_amount, payment_status FROM orders WHERE id = ?`;
            const orderResult = await query(orderQuery, [row.order_id]);
            if (orderResult.rows && orderResult.rows.length > 0) {
              const orderRow = orderResult.rows[0];
              orderNumber = orderRow.order_number || orderNumber || `ORD-${row.order_id}`;
              
              // ALWAYS use the value from orders table if it's > 0
              // This overrides any stored 0 values
              // Note: orders table uses 'total_amount' column
              const ordersTableTotal = parseFloat(orderRow.total_amount || 0);
              if (ordersTableTotal > 0) {
                totalAmount = ordersTableTotal;
                console.log(`Order ${row.order_id}: Overriding with orders table total: ${totalAmount}`);
              } else if (totalAmount === 0) {
                // If both are 0, keep 0 (order might actually be 0)
                console.log(`Order ${row.order_id}: Both stored and orders table have 0, keeping 0`);
              }
              
              // Fetch items count from order_items table
              try {
                const itemsQuery = `SELECT SUM(quantity) as total_quantity FROM order_items WHERE order_id = ?`;
                const itemsResult = await query(itemsQuery, [row.order_id]);
                if (itemsResult.rows && itemsResult.rows.length > 0 && itemsResult.rows[0].total_quantity !== null) {
                  const computedItemsCount = parseInt(itemsResult.rows[0].total_quantity || 0);
                  if (computedItemsCount > 0) {
                    itemsCount = computedItemsCount;
                    console.log(`Order ${row.order_id}: Overriding with computed items_count: ${itemsCount}`);
                  }
                } else {
                  // Fallback to COUNT if SUM returns null
                  const countQuery = `SELECT COUNT(*) as count FROM order_items WHERE order_id = ?`;
                  const countResult = await query(countQuery, [row.order_id]);
                  if (countResult.rows && countResult.rows.length > 0) {
                    const countItems = parseInt(countResult.rows[0].count || 0);
                    if (countItems > 0) {
                      itemsCount = countItems;
                      console.log(`Order ${row.order_id}: Using COUNT for items_count: ${itemsCount}`);
                    }
                  }
                }
              } catch (itemsError) {
                console.error('Error fetching items count for order', row.order_id, ':', itemsError);
              }
              
              paymentStatus = orderRow.payment_status || paymentStatus || 'pending';
              console.log(`Order ${row.order_id}: FINAL total=${totalAmount}, itemsCount=${itemsCount}, orderNumber=${orderNumber}`);
            } else {
              console.warn(`Order ${row.order_id} not found in orders table, using SQL computed values`);
            }
          } catch (orderError) {
            console.error('Error fetching order details for', row.order_id, ':', orderError);
            // If we can't fetch, use the SQL computed values (which should have fallback logic)
          }
        } else {
          console.warn('No order_id found in delivery order row:', row.id);
        }

        // Final fallback: if itemsCount is still 0, use items array length
        const finalItemsCount = itemsCount > 0 ? itemsCount : (items.length || 0);

        return {
          id: row.id,
          orderNumber: orderNumber || `ORD-${row.order_id || row.id}`,
          customerName: row.customer_name || 'Unknown',
          customerPhone: row.customer_phone || '',
          customerAddress: row.customer_address || '',
          deliveryDate: row.delivery_date || '',
          deliveryTime: row.delivery_time || '',
          status: row.status || 'assigned',
          priority: row.priority || 'medium',
          specialInstructions: row.special_instructions || null,
          deliveryPhotoUrl: row.delivery_photo_url || null,
          deliveredAt: row.delivered_at || null,
          total: totalAmount,
          paymentStatus: paymentStatus,
          items: items,
          itemsCount: finalItemsCount, // Use stored count or calculate from items array
          coordinates: row.delivery_latitude && row.delivery_longitude ? {
            lat: parseFloat(row.delivery_latitude),
            lng: parseFloat(row.delivery_longitude)
          } : null
        };
      } catch (rowError) {
        console.error('Error processing row:', rowError);
        // Return minimal order data if processing fails
        return {
          id: row.id,
          orderNumber: `ORD-${row.order_id || 'UNKNOWN'}`,
          customerName: row.customer_name || 'Unknown',
          customerPhone: row.customer_phone || '',
          customerAddress: row.customer_address || '',
          deliveryDate: row.delivery_date || '',
          deliveryTime: row.delivery_time || '',
          status: row.status || 'assigned',
          priority: row.priority || 'medium',
          specialInstructions: row.special_instructions || null,
          deliveryPhotoUrl: row.delivery_photo_url || null,
          deliveredAt: row.delivered_at || null,
          total: 0,
          paymentStatus: 'pending',
          items: [],
          itemsCount: 0,
          coordinates: null
        };
      }
    }));

    console.log('Successfully returning', orders.length, 'orders');
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error in getDeliveryOrders:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request params:', req.params);
    console.error('Request user:', req.user);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper: Create wallet earning transaction for delivered order (id from delivery_orders)
const createDeliveryWalletEarning = async (deliveryOrderId) => {
  try {
    // Fetch delivery order details
    const result = await query(
      `SELECT 
        do.id,
        do.delivery_boy_id,
        do.total_amount,
        do.delivered_at
      FROM delivery_orders do
      WHERE do.id = ?`,
      [deliveryOrderId]
    );

    const rows = result.rows || (Array.isArray(result) ? result : []);
    if (!rows.length) {
      console.warn('createDeliveryWalletEarning: delivery order not found', deliveryOrderId);
      return;
    }

    const row = rows[0];
    const deliveryBoyId = row.delivery_boy_id;
    if (!deliveryBoyId) {
      console.warn('createDeliveryWalletEarning: missing delivery_boy_id for order', deliveryOrderId);
      return;
    }

    // Prevent double-crediting the same order
    const existing = await query(
      `SELECT COUNT(*) as count 
       FROM delivery_wallet_transactions 
       WHERE order_id = ? AND type = 'earning'`,
      [deliveryOrderId]
    );
    if ((existing.rows && existing.rows[0].count > 0) || (Array.isArray(existing) && existing[0].count > 0)) {
      console.log('createDeliveryWalletEarning: earning already recorded for order', deliveryOrderId);
      return;
    }

    const totalAmount = parseFloat(row.total_amount || 0) || 0;

    // Base earning components
    const baseFee = 30; // ₹30 fixed per order
    const percentFee = totalAmount * 0.02; // 2% of order value

    // TODO: Distance-based incentive - requires store/customer distance.
    // For now, keep it 0 and store meta so we can backfill later.
    const distanceIncentive = 0;

    const totalEarning = baseFee + percentFee + distanceIncentive;

    const meta = JSON.stringify({
      baseFee,
      percentFee,
      distanceIncentive,
      orderTotal: totalAmount,
      deliveredAt: row.delivered_at || null
    });

    await query(
      `INSERT INTO delivery_wallet_transactions 
        (delivery_boy_id, order_id, type, amount, meta, created_at)
       VALUES (?, ?, 'earning', ?, ?, NOW())`,
      [deliveryBoyId, deliveryOrderId, totalEarning, meta]
    );

    console.log('createDeliveryWalletEarning: created earning transaction for order', deliveryOrderId);
    
    // Check and credit target bonus after earning is created
    await checkAndCreditTargetBonus(deliveryBoyId);
  } catch (error) {
    console.error('Error in createDeliveryWalletEarning:', error);
  }
};

// Helper: Check and credit target bonus based on daily delivery count
const checkAndCreditTargetBonus = async (deliveryBoyId) => {
  try {
    // Check if target_tiers table exists
    try {
      await query('SELECT 1 FROM delivery_target_tiers LIMIT 1');
    } catch (error) {
      console.log('Target tiers table does not exist yet. Skipping target bonus calculation.');
      return;
    }

    // Get today's completed deliveries count
    const todayResult = await query(
      `SELECT COUNT(DISTINCT order_id) as completed_count
       FROM delivery_wallet_transactions
       WHERE delivery_boy_id = ? 
         AND type = 'earning'
         AND date(created_at) = date('now', 'localtime')`,
      [deliveryBoyId]
    );

    const completedCount = todayResult.rows[0]?.completed_count || 0;

    // Check if bonus already credited today
    const bonusCheckResult = await query(
      `SELECT COUNT(*) as count
       FROM delivery_wallet_transactions
       WHERE delivery_boy_id = ?
         AND type = 'bonus'
         AND date(created_at) = date('now', 'localtime')
         AND json_extract(meta, '$.bonusType') = 'target'`,
      [deliveryBoyId]
    );

    const bonusAlreadyCredited = (bonusCheckResult.rows[0]?.count || 0) > 0;
    if (bonusAlreadyCredited) {
      console.log('Target bonus already credited today for delivery boy', deliveryBoyId);
      return;
    }

    // Get active tiers sorted by min_orders descending (highest first)
    const tiersResult = await query(
      `SELECT id, min_orders, max_orders, bonus_amount, tier_name
       FROM delivery_target_tiers
       WHERE is_active = 1
       ORDER BY min_orders DESC`
    );

    const tiers = tiersResult.rows || [];
    if (tiers.length === 0) {
      console.log('No active target tiers configured');
      return;
    }

    // Find the highest tier that the delivery boy qualifies for
    let applicableTier = null;
    for (const tier of tiers) {
      if (completedCount >= tier.min_orders) {
        if (tier.max_orders === null || completedCount <= tier.max_orders) {
          applicableTier = tier;
          break;
        }
      }
    }

    if (!applicableTier) {
      console.log(`Delivery boy ${deliveryBoyId} has ${completedCount} deliveries, no tier bonus applicable`);
      return;
    }

    const bonusAmount = parseFloat(applicableTier.bonus_amount);
    if (bonusAmount <= 0) {
      return;
    }

    // Credit the bonus
    const meta = JSON.stringify({
      bonusType: 'target',
      tierId: applicableTier.id,
      tierName: applicableTier.tier_name,
      minOrders: applicableTier.min_orders,
      maxOrders: applicableTier.max_orders,
      completedCount: completedCount,
      date: new Date().toISOString().split('T')[0]
    });

    await query(
      `INSERT INTO delivery_wallet_transactions 
        (delivery_boy_id, order_id, type, amount, meta, created_at)
       VALUES (?, NULL, 'bonus', ?, ?, NOW())`,
      [deliveryBoyId, bonusAmount, meta]
    );

    console.log(`Target bonus credited: ₹${bonusAmount} for ${completedCount} deliveries (Tier: ${applicableTier.tier_name || applicableTier.min_orders})`);
  } catch (error) {
    console.error('Error in checkAndCreditTargetBonus:', error);
    // Don't throw - this is a bonus feature, shouldn't break delivery flow
  }
};

// Update delivery order status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPhotoUrl, coordinates } = req.body;

    const validStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    let updateQuery = 'UPDATE delivery_orders SET status = ?, updated_at = CURRENT_TIMESTAMP';
    const params = [status];

    if (status === 'delivered') {
      updateQuery += ', delivered_at = CURRENT_TIMESTAMP';
    }

    if (deliveryPhotoUrl) {
      updateQuery += ', delivery_photo_url = ?';
      params.push(deliveryPhotoUrl);
    }

    if (coordinates && coordinates.lat && coordinates.lng) {
      updateQuery += ', delivery_latitude = ?, delivery_longitude = ?';
      params.push(coordinates.lat, coordinates.lng);
    }

    updateQuery += ' WHERE id = ?';
    params.push(orderId);

    const result = await query(updateQuery, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery order not found'
      });
    }

    // When order is marked as delivered, create wallet earning transaction
    if (status === 'delivered') {
      await createDeliveryWalletEarning(orderId);
    }

    res.json({
      success: true,
      message: 'Delivery status updated successfully'
    });
  } catch (error) {
    console.error('Error in updateDeliveryStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Track delivery location
const trackDeliveryLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { latitude, longitude, accuracy } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const sqlQuery = `
      INSERT INTO delivery_tracking (delivery_order_id, latitude, longitude, accuracy)
      VALUES (?, ?, ?, ?)
    `;

    const result = await query(sqlQuery, [orderId, latitude, longitude, accuracy || null]);

    res.json({
      success: true,
      message: 'Location tracked successfully',
      trackingId: result.lastID
    });
  } catch (error) {
    console.error('Error in trackDeliveryLocation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get delivery statistics for a delivery boy
const getDeliveryStats = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { date } = req.query;

    let dateFilter = '';
    const params = [deliveryBoyId];

    if (date) {
      dateFilter = ' AND delivery_date = ?';
      params.push(date);
    }

    const sqlQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status IN ('assigned', 'picked_up', 'in_transit') THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) * 5.0 as estimated_earnings
      FROM delivery_orders 
      WHERE delivery_boy_id = ?${dateFilter}
    `;

    const row = await get(sqlQuery, params);

    res.json({
      success: true,
      data: {
        totalOrders: row.total_orders || 0,
        completedOrders: row.completed_orders || 0,
        pendingOrders: row.pending_orders || 0,
        totalEarnings: row.estimated_earnings || 0
      }
    });
  } catch (error) {
    console.error('Error in getDeliveryStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create a new delivery order (admin function)
// If order is already assigned, update the assignment instead of creating duplicate
const createDeliveryOrder = async (req, res) => {
  try {
    // Ensure columns exist (auto-migrate if needed)
    await ensureColumnsExist();
    
    console.log('=== Creating/Updating Delivery Order ===');
    console.log('Request body:', JSON.stringify({
      orderId: req.body.orderId,
      deliveryBoyId: req.body.deliveryBoyId,
      totalAmount: req.body.totalAmount,
      itemsCount: req.body.itemsCount,
      customerName: req.body.customerName
    }, null, 2));

    const {
      orderId,
      deliveryBoyId,
      customerName,
      customerPhone,
      customerAddress,
      deliveryDate,
      deliveryTime,
      priority = 'medium',
      specialInstructions,
      coordinates,
      totalAmount,
      itemsCount
    } = req.body;

    if (!orderId || !deliveryBoyId || !customerName || !customerPhone || !customerAddress || !deliveryDate || !deliveryTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if order is already assigned
    const checkQuery = 'SELECT id FROM delivery_orders WHERE order_id = ? LIMIT 1';
    const existing = await query(checkQuery, [orderId]);

    // Fetch order total and items count if not provided
    // Use null/undefined check instead of falsy check (0 is a valid value)
    let finalTotalAmount = (totalAmount !== undefined && totalAmount !== null) ? totalAmount : null;
    let finalItemsCount = (itemsCount !== undefined && itemsCount !== null) ? itemsCount : null;
    
    // Only fetch if values were not provided (null/undefined), not if they are 0
    if (finalTotalAmount === null || finalItemsCount === null) {
      try {
        // Fetch from orders table
        // Note: orders table uses 'total_amount' column (not 'total')
        const orderQuery = `SELECT total_amount FROM orders WHERE id = ?`;
        const orderResult = await query(orderQuery, [orderId]);
        if (orderResult.rows && orderResult.rows.length > 0) {
          if (finalTotalAmount === null) {
            finalTotalAmount = parseFloat(orderResult.rows[0].total_amount || 0);
            console.log(`Fetched total_amount for order ${orderId}: ${finalTotalAmount}`);
          }
        }
        
        // Fetch items count - sum of quantities to match frontend calculation
        if (finalItemsCount === null) {
          const itemsQuery = `SELECT SUM(quantity) as total_quantity FROM order_items WHERE order_id = ?`;
          const itemsResult = await query(itemsQuery, [orderId]);
          if (itemsResult.rows && itemsResult.rows.length > 0 && itemsResult.rows[0].total_quantity !== null) {
            finalItemsCount = parseInt(itemsResult.rows[0].total_quantity || 0);
            console.log(`Fetched items_count (sum of quantities) for order ${orderId}: ${finalItemsCount}`);
          } else {
            // Fallback to COUNT if SUM returns null (no items)
            const countQuery = `SELECT COUNT(*) as count FROM order_items WHERE order_id = ?`;
            const countResult = await query(countQuery, [orderId]);
            if (countResult.rows && countResult.rows.length > 0) {
              finalItemsCount = parseInt(countResult.rows[0].count || 0);
              console.log(`Fetched items_count (count) for order ${orderId}: ${finalItemsCount}`);
            }
          }
        }
      } catch (fetchError) {
        console.error('Error fetching order details for assignment:', fetchError);
        // If fetch fails, we'll use 0 as fallback, but the read query will fetch from orders table
        finalTotalAmount = finalTotalAmount === null ? 0 : finalTotalAmount;
        finalItemsCount = finalItemsCount === null ? 0 : finalItemsCount;
        console.warn(`Using fallback values for order ${orderId}: total=${finalTotalAmount}, itemsCount=${finalItemsCount} (will be corrected on read)`);
      }
    } else {
      console.log(`Using provided values for order ${orderId}: total=${finalTotalAmount}, itemsCount=${finalItemsCount}`);
    }
    
    // Ensure we have valid numbers (not null) - 0 is a valid value
    finalTotalAmount = finalTotalAmount === null ? 0 : finalTotalAmount;
    finalItemsCount = finalItemsCount === null ? 0 : finalItemsCount;

    // Check if new columns exist (for backward compatibility)
    let hasTotalAmount = false;
    let hasItemsCount = false;
    try {
      hasTotalAmount = await columnExists('delivery_orders', 'total_amount');
      hasItemsCount = await columnExists('delivery_orders', 'items_count');
    } catch (colCheckError) {
      console.warn('Error checking column existence, assuming columns do not exist:', colCheckError);
      hasTotalAmount = false;
      hasItemsCount = false;
    }

    if (existing.rows.length > 0) {
      // Update existing assignment
      let updateQuery = `
        UPDATE delivery_orders SET
          delivery_boy_id = ?,
          customer_name = ?,
          customer_phone = ?,
          customer_address = ?,
          delivery_date = ?,
          delivery_time = ?,
          priority = ?,
          special_instructions = ?,
          delivery_latitude = ?,
          delivery_longitude = ?`;

      const updateParams = [
        deliveryBoyId,
        customerName,
        customerPhone,
        customerAddress,
        deliveryDate,
        deliveryTime,
        priority,
        specialInstructions || null,
        coordinates?.lat || null,
        coordinates?.lng || null
      ];

      // Add new columns if they exist
      if (hasTotalAmount) {
        updateQuery += `, total_amount = ?`;
        updateParams.push(finalTotalAmount);
        console.log(`Updating delivery order ${orderId} with total_amount=${finalTotalAmount}`);
      }
      if (hasItemsCount) {
        updateQuery += `, items_count = ?`;
        updateParams.push(finalItemsCount);
        console.log(`Updating delivery order ${orderId} with items_count=${finalItemsCount}`);
      }

      updateQuery += `, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`;
      updateParams.push(orderId);

      await query(updateQuery, updateParams);
      
      console.log(`✅ Successfully updated delivery order ${orderId} with total_amount=${finalTotalAmount}, items_count=${finalItemsCount}`);

      return res.json({
        success: true,
        message: 'Delivery assignment updated successfully',
        deliveryOrderId: existing.rows[0].id,
        updated: true
      });
    } else {
      // Create new assignment
      let insertColumns = `
        order_id, delivery_boy_id, customer_name, customer_phone, customer_address,
        delivery_date, delivery_time, priority, special_instructions,
        delivery_latitude, delivery_longitude`;

      let insertPlaceholders = `?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?`;

      const insertParams = [
        orderId,
        deliveryBoyId,
        customerName,
        customerPhone,
        customerAddress,
        deliveryDate,
        deliveryTime,
        priority,
        specialInstructions || null,
        coordinates?.lat || null,
        coordinates?.lng || null
      ];

      // Add new columns if they exist
      if (hasTotalAmount) {
        insertColumns += `, total_amount`;
        insertPlaceholders += `, ?`;
        insertParams.push(finalTotalAmount);
        console.log(`Inserting delivery order ${orderId} with total_amount=${finalTotalAmount}`);
      }
      if (hasItemsCount) {
        insertColumns += `, items_count`;
        insertPlaceholders += `, ?`;
        insertParams.push(finalItemsCount);
        console.log(`Inserting delivery order ${orderId} with items_count=${finalItemsCount}`);
      }

      const insertQuery = `
        INSERT INTO delivery_orders (${insertColumns})
        VALUES (${insertPlaceholders})
      `;

      const result = await query(insertQuery, insertParams);
      
      console.log(`✅ Successfully created delivery order ${orderId} with total_amount=${finalTotalAmount}, items_count=${finalItemsCount}`);

      return res.status(201).json({
        success: true,
        message: 'Delivery order created successfully',
        deliveryOrderId: result.lastID,
        updated: false
      });
    }
  } catch (error) {
    console.error('Error in createDeliveryOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get available delivery boys (active delivery_boy role users)
const getAvailableDeliveryBoys = async (req, res) => {
  try {
    const sqlQuery = `
      SELECT 
        id, name, email, role, is_active, created_at
      FROM users 
      WHERE role = 'delivery_boy' AND is_active = 1
      ORDER BY name ASC
    `;

    const result = await query(sqlQuery);
    const deliveryBoys = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.is_active === 1,
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: deliveryBoys
    });
  } catch (error) {
    console.error('Error in getAvailableDeliveryBoys:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get order assignment information (check if order is assigned and to whom)
const getOrderAssignment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const sqlQuery = `
      SELECT 
        do.id as delivery_order_id,
        do.delivery_boy_id,
        do.status as delivery_status,
        do.priority,
        do.created_at as assigned_at,
        u.id as delivery_boy_user_id,
        u.name as delivery_boy_name,
        u.email as delivery_boy_email
      FROM delivery_orders do
      LEFT JOIN users u ON do.delivery_boy_id = u.id
      WHERE do.order_id = ?
      ORDER BY do.created_at DESC
      LIMIT 1
    `;

    const result = await query(sqlQuery, [orderId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Order is not assigned to any delivery boy'
      });
    }

    const row = result.rows[0];
    const assignment = {
      deliveryOrderId: row.delivery_order_id,
      deliveryBoyId: row.delivery_boy_id,
      deliveryBoyName: row.delivery_boy_name,
      deliveryBoyEmail: row.delivery_boy_email,
      deliveryStatus: row.delivery_status,
      priority: row.priority,
      assignedAt: row.assigned_at
    };

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error in getOrderAssignment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Bulk assign multiple orders to a delivery boy
const bulkAssignOrders = async (req, res) => {
  try {
    const { orderIds, deliveryBoyId, priority = 'medium' } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs array is required'
      });
    }

    if (!deliveryBoyId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery boy ID is required'
      });
    }

    // Verify delivery boy exists and is active
    const deliveryBoyCheck = await query(
      'SELECT id, name FROM users WHERE id = ? AND role = ? AND is_active = 1',
      [deliveryBoyId, 'delivery_boy']
    );

    if (deliveryBoyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found or inactive'
      });
    }

    const results = {
      assigned: [],
      updated: [],
      failed: []
    };

    // Process each order
    for (const orderId of orderIds) {
      try {
        // Get order details
        // Note: orders table uses 'delivery_time' not 'delivery_time_slot'
        const orderQuery = `
          SELECT 
            o.id, o.order_number, o.total_amount, o.payment_status,
            c.name as customer_name, c.phone as customer_phone,
            o.delivery_address, o.delivery_date, o.delivery_time
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.id = ?
        `;
        const orderResult = await query(orderQuery, [orderId]);

        if (orderResult.rows.length === 0) {
          results.failed.push({ orderId, reason: 'Order not found' });
          continue;
        }

        const order = orderResult.rows[0];
        
        // Format delivery address properly
        let address = '';
        if (order.delivery_address) {
          if (typeof order.delivery_address === 'string') {
            try {
              // Try to parse as JSON first
              const parsed = JSON.parse(order.delivery_address);
              address = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
            } catch {
              // If not JSON, use as-is
              address = order.delivery_address;
            }
          } else {
            address = JSON.stringify(order.delivery_address);
          }
        }

        // Check if order is already assigned
        const existingCheck = await query(
          'SELECT id FROM delivery_orders WHERE order_id = ? LIMIT 1',
          [orderId]
        );

        // Fetch items count for this order - use SUM(quantity) to match frontend calculation
        let itemsCount = 0;
        try {
          const itemsCountQuery = `SELECT SUM(quantity) as total_quantity FROM order_items WHERE order_id = ?`;
          const itemsCountResult = await query(itemsCountQuery, [orderId]);
          if (itemsCountResult.rows && itemsCountResult.rows.length > 0 && itemsCountResult.rows[0].total_quantity !== null) {
            itemsCount = parseInt(itemsCountResult.rows[0].total_quantity || 0);
          } else {
            // Fallback to COUNT if SUM returns null
            const countQuery = `SELECT COUNT(*) as count FROM order_items WHERE order_id = ?`;
            const countResult = await query(countQuery, [orderId]);
            if (countResult.rows && countResult.rows.length > 0) {
              itemsCount = parseInt(countResult.rows[0].count || 0);
            }
          }
        } catch (itemsError) {
          console.warn(`Error fetching items count for order ${orderId}:`, itemsError);
          // Try fallback to COUNT
          try {
            const countQuery = `SELECT COUNT(*) as count FROM order_items WHERE order_id = ?`;
            const countResult = await query(countQuery, [orderId]);
            if (countResult.rows && countResult.rows.length > 0) {
              itemsCount = parseInt(countResult.rows[0].count || 0);
            }
          } catch (countError) {
            console.error(`Error fetching items count (fallback) for order ${orderId}:`, countError);
          }
        }

        const totalAmount = parseFloat(order.total_amount || 0);

        // Check if new columns exist (for backward compatibility)
        let hasTotalAmount = false;
        let hasItemsCount = false;
        try {
          hasTotalAmount = await columnExists('delivery_orders', 'total_amount');
          hasItemsCount = await columnExists('delivery_orders', 'items_count');
        } catch (colCheckError) {
          console.warn('Error checking column existence, assuming columns do not exist:', colCheckError);
          hasTotalAmount = false;
          hasItemsCount = false;
        }

        if (existingCheck.rows.length > 0) {
          // Update existing assignment
          let updateQuery = `
            UPDATE delivery_orders SET
              delivery_boy_id = ?,
              customer_name = ?,
              customer_phone = ?,
              customer_address = ?,
              priority = ?`;

          const updateParams = [
            deliveryBoyId,
            order.customer_name || 'N/A',
            order.customer_phone || 'N/A',
            address,
            priority
          ];

          // Add new columns if they exist
          if (hasTotalAmount) {
            updateQuery += `, total_amount = ?`;
            updateParams.push(totalAmount);
          }
          if (hasItemsCount) {
            updateQuery += `, items_count = ?`;
            updateParams.push(itemsCount);
          }

          updateQuery += `, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`;
          updateParams.push(orderId);

          await query(updateQuery, updateParams);
          results.updated.push(orderId);
        } else {
          // Create new assignment
          let insertColumns = `
            order_id, delivery_boy_id, customer_name, customer_phone,
            customer_address, delivery_date, delivery_time, priority`;

          let insertPlaceholders = `?, ?, ?, ?, ?, ?, ?, ?`;

          const insertParams = [
            orderId,
            deliveryBoyId,
            order.customer_name || 'N/A',
            order.customer_phone || 'N/A',
            address,
            order.delivery_date || new Date().toISOString().split('T')[0],
            order.delivery_time || '12:00', // Use delivery_time, not delivery_time_slot
            priority
          ];

          // Add new columns if they exist
          if (hasTotalAmount) {
            insertColumns += `, total_amount`;
            insertPlaceholders += `, ?`;
            insertParams.push(totalAmount);
          }
          if (hasItemsCount) {
            insertColumns += `, items_count`;
            insertPlaceholders += `, ?`;
            insertParams.push(itemsCount);
          }

          await query(`
            INSERT INTO delivery_orders (${insertColumns})
            VALUES (${insertPlaceholders})
          `, insertParams);
          results.assigned.push(orderId);
        }
      } catch (error) {
        console.error(`Error processing order ${orderId}:`, error);
        const errorMessage = error.message || error.toString() || 'Unknown error';
        results.failed.push({ orderId, reason: errorMessage });
        console.error(`Full error details for order ${orderId}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Bulk assignment completed: ${results.assigned.length} assigned, ${results.updated.length} updated, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulkAssignOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reassign order to a different delivery boy
const reassignOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId, reason } = req.body;

    if (!deliveryBoyId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery boy ID is required'
      });
    }

    // Verify delivery boy exists
    const deliveryBoyCheck = await query(
      'SELECT id, name FROM users WHERE id = ? AND role = ? AND is_active = 1',
      [deliveryBoyId, 'delivery_boy']
    );

    if (deliveryBoyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found or inactive'
      });
    }

    // Get current assignment
    const currentAssignment = await query(
      'SELECT delivery_boy_id, status FROM delivery_orders WHERE order_id = ? LIMIT 1',
      [orderId]
    );

    if (currentAssignment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order is not assigned to any delivery boy'
      });
    }

    const oldDeliveryBoyId = currentAssignment.rows[0].delivery_boy_id;
    const currentStatus = currentAssignment.rows[0].status;

    // Check if new columns exist (for backward compatibility)
    let hasTotalAmount = false;
    let hasItemsCount = false;
    try {
      hasTotalAmount = await columnExists('delivery_orders', 'total_amount');
      hasItemsCount = await columnExists('delivery_orders', 'items_count');
    } catch (colCheckError) {
      console.warn('Error checking column existence, assuming columns do not exist:', colCheckError);
      hasTotalAmount = false;
      hasItemsCount = false;
    }

    // Fetch order total and items count for reassignment
    let totalAmount = 0;
    let itemsCount = 0;
    if (hasTotalAmount || hasItemsCount) {
      try {
        if (hasTotalAmount) {
          const orderQuery = `SELECT total, total_amount FROM orders WHERE id = ?`;
          const orderResult = await query(orderQuery, [orderId]);
          if (orderResult.rows && orderResult.rows.length > 0) {
            totalAmount = parseFloat(orderResult.rows[0].total || orderResult.rows[0].total_amount || 0);
          }
        }
        
        if (hasItemsCount) {
          const itemsQuery = `SELECT COUNT(*) as count FROM order_items WHERE order_id = ?`;
          const itemsResult = await query(itemsQuery, [orderId]);
          if (itemsResult.rows && itemsResult.rows.length > 0) {
            itemsCount = parseInt(itemsResult.rows[0].count || 0);
          }
        }
      } catch (fetchError) {
        console.warn('Error fetching order details for reassignment:', fetchError);
      }
    }

    // Update assignment
    let updateQuery = `
      UPDATE delivery_orders SET
        delivery_boy_id = ?`;

    const updateParams = [deliveryBoyId];

    // Add new columns if they exist
    if (hasTotalAmount) {
      updateQuery += `, total_amount = ?`;
      updateParams.push(totalAmount);
    }
    if (hasItemsCount) {
      updateQuery += `, items_count = ?`;
      updateParams.push(itemsCount);
    }

    updateQuery += `, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`;
    updateParams.push(orderId);

    await query(updateQuery, updateParams);

    // Log reassignment history (if history table exists, otherwise skip)
    try {
      await query(`
        INSERT INTO delivery_assignment_history (
          order_id, old_delivery_boy_id, new_delivery_boy_id, reason, created_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [orderId, oldDeliveryBoyId, deliveryBoyId, reason || 'Reassigned by admin']);
    } catch (historyError) {
      // History table might not exist, that's okay
      console.log('Assignment history not logged (table may not exist):', historyError.message);
    }

    res.json({
      success: true,
      message: 'Order reassigned successfully',
      data: {
        orderId,
        oldDeliveryBoyId,
        newDeliveryBoyId: deliveryBoyId
      }
    });
  } catch (error) {
    console.error('Error in reassignOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get delivery boy workload (orders count per delivery boy)
const getDeliveryBoyWorkload = async (req, res) => {
  try {
    const sqlQuery = `
      SELECT 
        u.id as delivery_boy_id,
        u.name as delivery_boy_name,
        u.email as delivery_boy_email,
        u.contact_number,
        COUNT(do.id) as total_orders,
        COUNT(CASE WHEN do.status = 'assigned' THEN 1 END) as assigned_count,
        COUNT(CASE WHEN do.status = 'picked_up' THEN 1 END) as picked_up_count,
        COUNT(CASE WHEN do.status = 'in_transit' THEN 1 END) as in_transit_count,
        COUNT(CASE WHEN do.status = 'delivered' THEN 1 END) as delivered_count
      FROM users u
      LEFT JOIN delivery_orders do ON u.id = do.delivery_boy_id
      WHERE u.role = 'delivery_boy' AND u.is_active = 1
      GROUP BY u.id, u.name, u.email, u.contact_number
      ORDER BY total_orders DESC, u.name ASC
    `;

    const result = await query(sqlQuery);
    const workload = result.rows.map(row => ({
      deliveryBoyId: row.delivery_boy_id,
      deliveryBoyName: row.delivery_boy_name,
      deliveryBoyEmail: row.delivery_boy_email,
      contactNumber: row.contact_number,
      totalOrders: parseInt(row.total_orders) || 0,
      assignedCount: parseInt(row.assigned_count) || 0,
      pickedUpCount: parseInt(row.picked_up_count) || 0,
      inTransitCount: parseInt(row.in_transit_count) || 0,
      deliveredCount: parseInt(row.delivered_count) || 0
    }));

    res.json({
      success: true,
      data: workload
    });
  } catch (error) {
    console.error('Error in getDeliveryBoyWorkload:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get assignment history for an order
const getAssignmentHistory = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Try to get from history table first
    let historyQuery = `
      SELECT 
        dah.id,
        dah.order_id,
        dah.old_delivery_boy_id,
        dah.new_delivery_boy_id,
        dah.reason,
        dah.created_at,
        old_user.name as old_delivery_boy_name,
        new_user.name as new_delivery_boy_name
      FROM delivery_assignment_history dah
      LEFT JOIN users old_user ON dah.old_delivery_boy_id = old_user.id
      LEFT JOIN users new_user ON dah.new_delivery_boy_id = new_user.id
      WHERE dah.order_id = ?
      ORDER BY dah.created_at DESC
    `;

    let historyResult;
    try {
      historyResult = await query(historyQuery, [orderId]);
    } catch (error) {
      // History table doesn't exist, create fallback from delivery_orders
      const fallbackQuery = `
        SELECT 
          do.id,
          do.order_id,
          NULL as old_delivery_boy_id,
          do.delivery_boy_id as new_delivery_boy_id,
          'Initial assignment' as reason,
          do.created_at,
          NULL as old_delivery_boy_name,
          u.name as new_delivery_boy_name
        FROM delivery_orders do
        LEFT JOIN users u ON do.delivery_boy_id = u.id
        WHERE do.order_id = ?
        ORDER BY do.created_at DESC
        LIMIT 1
      `;
      historyResult = await query(fallbackQuery, [orderId]);
    }

    const history = historyResult.rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      oldDeliveryBoyId: row.old_delivery_boy_id,
      oldDeliveryBoyName: row.old_delivery_boy_name || 'N/A',
      newDeliveryBoyId: row.new_delivery_boy_id,
      newDeliveryBoyName: row.new_delivery_boy_name || 'N/A',
      reason: row.reason || 'Assignment',
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error in getAssignmentHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getDeliveryOrders,
  updateDeliveryStatus,
  trackDeliveryLocation,
  getDeliveryStats,
  createDeliveryOrder,
  getAvailableDeliveryBoys,
  getOrderAssignment,
  bulkAssignOrders,
  reassignOrder,
  getDeliveryBoyWorkload,
  getAssignmentHistory
};
