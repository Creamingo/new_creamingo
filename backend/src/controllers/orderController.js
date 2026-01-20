const { query } = require('../config/db');
const { getFreeDeliveryThreshold } = require('../utils/deliverySettingsCache');

// Generate sequential order number in format CRM-2427000001, CRM-2427000002, etc.
const generateNextOrderNumber = async () => {
  try {
    // Find all order numbers with the new format (CRM-XXXXXXXXXX)
    const result = await query(`
      SELECT order_number 
      FROM orders 
      WHERE order_number LIKE 'CRM-%'
    `);
    
    let nextNumber = 2427000001; // Start from the initial number
    
    if (result.rows && result.rows.length > 0) {
      // Extract the number part from each order and find the maximum
      const numbers = result.rows
        .map(row => {
          const orderNum = row.order_number;
          const numPart = orderNum.replace('CRM-', '');
          const num = parseInt(numPart, 10);
          return isNaN(num) ? 0 : num;
        })
        .filter(num => num >= 2427000001); // Only consider numbers from our starting point
      
      if (numbers.length > 0) {
        const maxNumber = Math.max(...numbers);
        nextNumber = maxNumber + 1;
      }
    }
    
    // Format as CRM-{10-digit-number}
    return `CRM-${nextNumber.toString().padStart(10, '0')}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    // Fallback to timestamp-based if there's an error
    return `CRM-${Date.now()}`;
  }
};

// Get all orders with pagination and filters
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customer_id,
      date_from,
      date_to,
      delivery_date,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Convert to integers for MySQL
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    let whereConditions = [];
    let queryParams = [];

    // Build WHERE conditions - use MySQL placeholders (?)
    if (status) {
      whereConditions.push(`o.status = ?`);
      queryParams.push(status);
    }

    if (customer_id) {
      const customerIdInt = parseInt(customer_id, 10);
      if (!isNaN(customerIdInt)) {
        whereConditions.push(`o.customer_id = ?`);
        queryParams.push(customerIdInt);
      }
    }

    if (date_from) {
      whereConditions.push(`o.created_at >= ?`);
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push(`o.created_at <= ?`);
      queryParams.push(date_to);
    }

    if (delivery_date) {
      whereConditions.push(`o.delivery_date = ?`);
      queryParams.push(delivery_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'total_amount', 'status', 'delivery_date'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get orders (SQLite compatible)
    // Ensure limit and offset are integers (inline to avoid MySQL stmt issues)
    const finalLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 10;
    const finalOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_id,
        o.status,
        o.total_amount,
        o.delivery_address,
        o.delivery_date,
        o.delivery_time,
        o.special_instructions,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'variant_id', oi.variant_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'total', oi.total,
              'product_name', COALESCE(oi.display_name, p.name),
              'product_image', p.image_url,
              'variant_name', pv.name,
              'variant_weight', pv.weight,
              'product_base_weight', p.base_weight,
              'flavor_id', oi.flavor_id,
              'flavor_name', sc.name,
              'product_subcategory_name', psc.name,
              'tier', oi.tier,
              'cake_message', oi.cake_message
            )
          ), 
          JSON_ARRAY()
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN subcategories sc ON oi.flavor_id = sc.id
      LEFT JOIN subcategories psc ON p.subcategory_id = psc.id
      ${whereClause}
      GROUP BY o.id, c.name, c.email, c.phone
      ORDER BY o.${sortField} ${sortDirection}
      LIMIT ${finalLimit} OFFSET ${finalOffset}
    `;

    const ordersQueryParams = [...queryParams];
    
    // Debug logging
    const placeholderCount = (ordersQuery.match(/\?/g) || []).length;
    console.error('🔍 [DEBUG] Executing orders query:', {
      placeholderCount,
      paramCount: ordersQueryParams.length,
      params: ordersQueryParams,
      whereClause: whereClause || 'NO WHERE CLAUSE',
      whereConditionsCount: whereConditions.length,
      reqQuery: { page, limit, status, customer_id, date_from, date_to, delivery_date }
    });
    
    if (placeholderCount !== ordersQueryParams.length) {
      console.error('❌ Orders parameter mismatch:', {
        placeholderCount,
        paramCount: ordersQueryParams.length,
        query: ordersQuery.substring(0, 500),
        params: ordersQueryParams
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error: Parameter count mismatch',
        error: `Expected ${placeholderCount} placeholders but got ${ordersQueryParams.length} parameters`
      });
    }
    
    let ordersResult;
    try {
      ordersResult = await query(ordersQuery, ordersQueryParams);
    } catch (error) {
      // If query fails, try with fallback (handles missing display_name column or other issues)
      console.error('❌ Initial orders query failed:', error);
      console.error('❌ Query:', ordersQuery.substring(0, 1000));
      console.error('❌ Params:', ordersQueryParams);
      console.error('❌ Placeholder count:', placeholderCount);
      console.error('❌ Param count:', ordersQueryParams.length);
      console.error('Initial query failed, trying fallback query:', error.message);
      
      // First, try without display_name (for pre-migration databases)
      let fallbackQuery = `
        SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.status,
          o.total_amount,
          o.delivery_address,
          o.delivery_date,
          o.delivery_time,
          o.special_instructions,
          o.payment_method,
          o.payment_status,
          o.created_at,
          o.updated_at,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          COALESCE(
            JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'variant_id', oi.variant_id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'total', oi.total,
                  'product_name', p.name,
                  'product_image', p.image_url,
                  'variant_name', pv.name,
                  'variant_weight', pv.weight,
                  'product_base_weight', p.base_weight,
                  'flavor_id', oi.flavor_id,
                  'flavor_name', sc.name,
                  'product_subcategory_name', psc.name,
                  'tier', oi.tier,
                  'cake_message', oi.cake_message
                )
            ), 
            '[]'
          ) as items
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_variants pv ON oi.variant_id = pv.id
        LEFT JOIN subcategories sc ON oi.flavor_id = sc.id
        LEFT JOIN subcategories psc ON p.subcategory_id = psc.id
        ${whereClause}
        GROUP BY o.id, c.name, c.email, c.phone
        ORDER BY o.${sortField} ${sortDirection}
        LIMIT ${finalLimit} OFFSET ${finalOffset}
      `;
      
      const finalLimit = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 10;
      const finalOffset = Number.isInteger(offset) && offset >= 0 ? offset : 0;
      const fallbackQueryParams = [...queryParams];
      try {
        ordersResult = await query(fallbackQuery, fallbackQueryParams);
      } catch (fallbackError) {
        // If that also fails, try without subcategory joins
        console.error('Fallback query also failed, trying without subcategory joins:', fallbackError.message);
        fallbackQuery = `
          SELECT 
            o.id,
            o.order_number,
            o.customer_id,
            o.status,
            o.total_amount,
            o.delivery_address,
            o.delivery_date,
            o.delivery_time,
            o.special_instructions,
            o.payment_method,
            o.payment_status,
            o.created_at,
            o.updated_at,
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone,
            COALESCE(
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'variant_id', oi.variant_id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'total', oi.total,
                  'product_name', p.name,
                  'product_image', p.image_url,
                  'variant_name', pv.name,
                  'variant_weight', pv.weight,
                  'product_base_weight', p.base_weight,
                  'flavor_id', oi.flavor_id,
                  'tier', oi.tier,
                  'cake_message', oi.cake_message
                )
              ), 
              JSON_ARRAY()
            ) as items
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN product_variants pv ON oi.variant_id = pv.id
          ${whereClause}
          GROUP BY o.id, c.name, c.email, c.phone
          ORDER BY o.${sortField} ${sortDirection}
          LIMIT ${finalLimit} OFFSET ${finalOffset}
        `;
        const fallbackQueryParams2 = [...queryParams];
        ordersResult = await query(fallbackQuery, fallbackQueryParams2);
      }
    }

    // Transform orders to match frontend expectations
    const transformedOrders = (ordersResult.rows || []).map(order => {
      // Parse items if it's a JSON string
      let items = [];
      if (order.items) {
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) {
          items = [];
        }
      }
      
      return {
        id: order.id, // Database ID for API calls
        orderId: order.id, // Also include as orderId for clarity
        order_number: order.order_number,
        displayId: order.order_number || order.id, // Display ID (order_number)
        customerName: order.customer_name || '',
        customerEmail: order.customer_email || '',
        customerPhone: order.customer_phone || '',
        items: items.map(item => {
          // Debug logging to check flavor data
          if (item.flavor_id && !item.flavor_name) {
            console.warn(`Flavor ID ${item.flavor_id} found but no flavor_name for product ${item.product_name}`);
          }
          
          return {
            id: item.id?.toString() || '',
            productId: item.product_id?.toString() || '',
            productName: item.product_name || '',
            product_image: item.product_image || null,
            quantity: item.quantity || 0,
            price: parseFloat(item.price || 0),
            weight: item.variant_weight || item.product_base_weight || null,
            flavor_id: item.flavor_id || null,
            flavor_name: item.flavor_name || null,
            product_subcategory_name: item.product_subcategory_name || null,
            tier: item.tier || null,
            cake_message: item.cake_message || null,
            variant_name: item.variant_name || null
          };
        }),
        total: parseFloat(order.total_amount || 0),
        status: order.status || 'pending',
        paymentStatus: order.payment_status || 'pending',
        deliveryAddress: order.delivery_address || '',
        deliveryDate: order.delivery_date || '',
        deliveryTime: order.delivery_time || '',
        notes: order.special_instructions || '',
        // Convert SQLite datetime to ISO format with UTC timezone indicator for frontend
        // SQLite format: "2025-11-02 14:20:00" -> ISO UTC: "2025-11-02T14:20:00Z"
        createdAt: order.created_at ? (order.created_at.includes('T') || order.created_at.includes('Z') 
          ? order.created_at 
          : order.created_at.replace(' ', 'T') + 'Z') : '',
        updatedAt: order.updated_at ? (order.updated_at.includes('T') || order.updated_at.includes('Z')
          ? order.updated_at
          : order.updated_at.replace(' ', 'T') + 'Z') : ''
      };
    });

    res.json({
      success: true,
      data: {
        orders: transformedOrders,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // SQLite compatible query
    const result = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.customer_id,
        o.status,
        o.total_amount,
        o.delivery_address,
        o.delivery_date,
        o.delivery_time,
        o.special_instructions,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'variant_id', oi.variant_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'total', oi.total,
              'product_name', COALESCE(oi.display_name, p.name),
              'product_image', p.image_url,
              'variant_name', pv.name,
              'variant_weight', pv.weight,
              'product_base_weight', p.base_weight,
              'flavor_id', oi.flavor_id,
              'flavor_name', sc.name,
              'product_subcategory_name', psc.name,
              'tier', oi.tier,
              'cake_message', oi.cake_message
            )
          ), 
          JSON_ARRAY()
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      LEFT JOIN subcategories sc ON oi.flavor_id = sc.id
      LEFT JOIN subcategories psc ON p.subcategory_id = psc.id
      WHERE o.id = $1
      GROUP BY o.id, c.name, c.email, c.phone, c.address
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = result.rows[0];
    
    // Parse items if it's a JSON string
    let items = [];
    if (order.items) {
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        console.error('Failed to parse items JSON:', e);
        items = [];
      }
    }

    // Transform order to match frontend expectations
    const transformedOrder = {
      id: order.id,
      orderId: order.id,
      order_number: order.order_number,
      displayId: order.order_number || order.id,
      customerName: order.customer_name || '',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      items: items.map(item => ({
        id: item.id?.toString() || '',
        productId: item.product_id?.toString() || '',
        productName: item.product_name || '',
        product_image: item.product_image || null,
        quantity: item.quantity || 0,
        price: parseFloat(item.price || 0),
        weight: item.variant_weight || item.product_base_weight || null,
        flavor_id: item.flavor_id || null,
        flavor_name: item.flavor_name || null,
        product_subcategory_name: item.product_subcategory_name || null,
        tier: item.tier || null,
        cake_message: item.cake_message || null,
        variant_name: item.variant_name || null
      })),
      total: parseFloat(order.total_amount || 0),
      status: order.status || 'pending',
      paymentStatus: order.payment_status || 'pending',
      deliveryAddress: order.delivery_address || '',
      deliveryDate: order.delivery_date || '',
      deliveryTime: order.delivery_time || '',
      notes: order.special_instructions || '',
      createdAt: order.created_at ? (order.created_at.includes('T') || order.created_at.includes('Z') 
        ? order.created_at 
        : order.created_at.replace(' ', 'T') + 'Z') : '',
      updatedAt: order.updated_at ? (order.updated_at.includes('T') || order.updated_at.includes('Z')
        ? order.updated_at
        : order.updated_at.replace(' ', 'T') + 'Z') : ''
    };

    res.json({
      success: true,
      data: { order: transformedOrder }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create order
const createOrder = async (req, res) => {
  try {
    const {
      customer_id,
      items,
      delivery_address,
      delivery_date,
      delivery_time,
      special_instructions,
      payment_method,
      wallet_amount_used,
      // Complete order details for logging
      subtotal,
      promo_code,
      promo_discount,
      delivery_charge,
      item_count,
      combo_count
    } = req.body;

    // Verify customer exists
    const customerResult = await query(
      'SELECT id FROM customers WHERE id = ?',
      [customer_id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer'
      });
    }

    // Calculate total amount including combo items
    // Use provided subtotal if available (more accurate), otherwise calculate
    let calculatedSubtotal = 0;
    for (const item of items) {
      // Base item price
      calculatedSubtotal += item.price * item.quantity;
      
      // Add combo items price if they exist
      if (item.combos && item.combos.length > 0) {
        for (const combo of item.combos) {
          calculatedSubtotal += (combo.price || combo.unitPrice || 0) * combo.quantity;
        }
      }
    }
    
    // Use provided subtotal or calculated one
    const orderSubtotal = parseFloat(subtotal) || calculatedSubtotal;
    
    // Use provided promo discount or calculate from promo code
    const orderPromoDiscount = parseFloat(promo_discount) || 0;
    
    // Use provided delivery charge or calculate
    const FREE_DELIVERY_THRESHOLD = await getFreeDeliveryThreshold();
    const orderDeliveryCharge = parseFloat(delivery_charge) !== undefined 
      ? parseFloat(delivery_charge) 
      : (orderSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 50); // Default 50 if not provided
    
    // Calculate total: subtotal - promo_discount - wallet + delivery_charge
    let totalAmount = orderSubtotal - orderPromoDiscount + orderDeliveryCharge;
    
    // Calculate original total before wallet discount (for validation)
    const originalTotalAmount = totalAmount;
    
    // Handle wallet usage
    const walletAmountUsed = parseFloat(wallet_amount_used) || 0;
    let actualWalletUsage = 0;
    
    if (walletAmountUsed > 0) {
      // Verify customer has sufficient wallet balance
      const customerWalletResult = await query(
        'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
        [customer_id]
      );

      if (customerWalletResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found'
        });
      }

      const walletBalance = parseFloat(customerWalletResult.rows[0].wallet_balance) || 0;
      
      // Verify wallet amount doesn't exceed 10% of order total
      const maxWalletUsage = originalTotalAmount * 0.1;
      actualWalletUsage = Math.min(walletAmountUsed, walletBalance, maxWalletUsage);

      if (actualWalletUsage < walletAmountUsed) {
        return res.status(400).json({
          success: false,
          message: `Wallet usage exceeds limit. Maximum allowed: ₹${maxWalletUsage.toFixed(2)} (10% of order total)`
        });
      }

      if (actualWalletUsage > walletBalance) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }

      // Deduct wallet amount from total
      totalAmount = Math.max(0, totalAmount - actualWalletUsage);
    }

    // Generate sequential order number starting from CRM-2427000001
    const orderNumber = await generateNextOrderNumber();

    // Calculate total item count (parent products only) and combo count separately
    let totalItemCount = parseInt(item_count) || 0;
    let totalComboCount = parseInt(combo_count) || 0;
    
    if (totalItemCount === 0) {
      for (const item of items) {
        // Count parent products
        totalItemCount += item.quantity || 0;
        
        // Count combo items separately
        if (item.combos && item.combos.length > 0) {
          for (const combo of item.combos) {
            totalComboCount += combo.quantity || 0;
          }
        }
      }
    } else if (totalComboCount === 0) {
      // If item_count is provided, calculate combo count separately
      for (const item of items) {
        if (item.combos && item.combos.length > 0) {
          for (const combo of item.combos) {
            totalComboCount += combo.quantity || 0;
          }
        }
      }
    }
    
    // Calculate total item count (items + combos)
    const totalItemCountCombined = totalItemCount + totalComboCount;
    
    // Calculate intermediate totals for storage
    const subtotalAfterPromo = orderSubtotal - orderPromoDiscount;
    const subtotalAfterWallet = Math.max(0, subtotalAfterPromo - actualWalletUsage);
    
    // Calculate final delivery charge (0 if free delivery, otherwise the charge)
    const finalDeliveryCharge = orderSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : orderDeliveryCharge;
    
    // Calculate deal items total and regular items total (if deals are used)
    let dealItemsTotal = 0;
    let regularItemsTotal = 0;
    for (const item of items) {
      // Check if item is a deal (use deal_price if it's significantly lower than regular price)
      const isDealItem = item.is_deal_item || (item.deal_price && item.deal_price < item.price * 0.5);
      const itemPrice = isDealItem && item.deal_price ? item.deal_price : item.price;
      const itemTotal = itemPrice * item.quantity;
      
      if (isDealItem) {
        dealItemsTotal += itemTotal;
      } else {
        regularItemsTotal += itemTotal;
      }
      
      // Add combos to regular items total (combos are not deals)
      if (item.combos && item.combos.length > 0) {
        for (const combo of item.combos) {
          regularItemsTotal += (combo.price || combo.unitPrice || 0) * combo.quantity;
        }
      }
    }

    // Create order (SQLite syntax - use ? placeholders and get lastID)
    // Include all order details for complete logging - store all calculated values
    const orderResult = await query(`
      INSERT INTO orders (
        order_number, customer_id, status, total_amount, delivery_address,
        delivery_date, delivery_time, special_instructions, payment_method,
        payment_status, subtotal, promo_code, promo_discount, delivery_charge,
        item_count, combo_count, wallet_amount_used, total_item_count,
        subtotal_after_promo, subtotal_after_wallet, final_delivery_charge,
        deal_items_total, regular_items_total, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      orderNumber, customer_id, 'pending', totalAmount, JSON.stringify(delivery_address),
      delivery_date, delivery_time, special_instructions, payment_method, 'pending',
      orderSubtotal, promo_code || null, orderPromoDiscount, orderDeliveryCharge, 
      totalItemCount, totalComboCount, actualWalletUsage, totalItemCountCombined,
      subtotalAfterPromo, subtotalAfterWallet, finalDeliveryCharge,
      dealItemsTotal, regularItemsTotal
    ]);

    // Get the inserted order using lastID (SQLite doesn't support RETURNING in older versions)
    const orderId = orderResult.lastID;
    
    // Track promo code redemption if applicable
    if (promo_code && orderPromoDiscount > 0) {
      try {
        const { trackPromoCodeEvent, incrementUsage } = require('./promoCodeController');
        
        // Get promo code ID
        const promoResult = await query(
          'SELECT id FROM promo_codes WHERE code = ?',
          [promo_code.toUpperCase()]
        );
        
        if (promoResult.rows?.length > 0 || promoResult.length > 0) {
          const promoCodeId = (promoResult.rows?.[0] || promoResult[0]).id;
          
          // Track redemption event
          await trackPromoCodeEvent(promoCodeId, 'redeem', {
            customer_id,
            order_id: orderId,
            cart_value: orderSubtotal,
            discount_amount: orderPromoDiscount,
            revenue: totalAmount,
            ip_address: req.ip || req.connection?.remoteAddress || null,
            user_agent: req.get('user-agent') || null,
            referrer_url: req.get('referer') || null
          });
          
          // Increment usage count
          await incrementUsage(promo_code);
        }
      } catch (error) {
        console.error('Error tracking promo code redemption:', error);
        // Don't fail order creation if tracking fails
      }
    }
    
    // Handle wallet usage if applicable (record transaction and update balance)
    if (actualWalletUsage > 0) {
      // Record wallet usage
      await query(
        'INSERT INTO wallet_usage (order_id, customer_id, amount_used, created_at) VALUES (?, ?, ?, NOW())',
        [orderId, customer_id, actualWalletUsage]
      );

      // Create wallet transaction (debit)
      await query(
        `INSERT INTO wallet_transactions 
        (customer_id, type, amount, order_id, description, status, transaction_type, created_at, updated_at)
        VALUES (?, 'debit', ?, ?, ?, 'completed', 'order_redemption', NOW(), NOW())`,
        [customer_id, actualWalletUsage, orderId, `Used on Order #${orderNumber}`]
      );

      // Get current balance and update
      const customerWalletResult = await query(
        'SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM customers WHERE id = ?',
        [customer_id]
      );
      const currentBalance = parseFloat(customerWalletResult.rows[0].wallet_balance) || 0;
      const newBalance = currentBalance - actualWalletUsage;
      await query(
        'UPDATE customers SET wallet_balance = ? WHERE id = ?',
        [newBalance, customer_id]
      );
    }

    const orderQuery = await query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    const order = orderQuery.rows[0];

    // Create scratch card immediately after order creation (4-7% cashback)
    let scratchCardInfo = null;
    try {
      const { createScratchCardForOrder } = require('./scratchCardController');
      const scratchCardResult = await createScratchCardForOrder(orderId, customer_id, totalAmount);
      if (scratchCardResult.success) {
        scratchCardInfo = {
          id: scratchCardResult.scratchCardId,
          amount: scratchCardResult.amount
        };
        console.log(`Scratch card created for order ${orderId}: ₹${scratchCardResult.amount}`);
        
        // Update order with scratch card info
        await query(`
          UPDATE orders 
          SET scratch_card_id = ?, cashback_amount = ?
          WHERE id = ?
        `, [scratchCardResult.scratchCardId, scratchCardResult.amount, orderId]);
      } else {
        console.error(`Failed to create scratch card for order ${orderId}:`, scratchCardResult.error);
      }
    } catch (error) {
      console.error('Error creating scratch card for order:', error);
      // Don't fail order creation if scratch card creation fails
    }

    // Create order items and combo selections
    for (const item of items) {
      // Create main order item (SQLite syntax)
      // Try with display_name first (migrated), fallback if column doesn't exist
      let orderItemResult;
      try {
        // All columns (flavor_id, tier, cake_message, display_name) exist after migrations 035 and 041
        orderItemResult = await query(`
          INSERT INTO order_items (
            order_id, product_id, variant_id, quantity, price, total, 
            flavor_id, tier, cake_message, display_name, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          order.id, item.product_id, item.variant_id, item.quantity, item.price, 
          item.price * item.quantity, 
          // Ensure flavor_id is NULL if not provided, 0, or undefined
          (item.flavor_id && item.flavor_id !== 0) ? item.flavor_id : null, 
          item.tier || null, 
          item.cake_message || null,
          // Store the flavor-specific product name if provided, otherwise NULL
          item.product_name || null
        ]);
      } catch (error) {
        // Fallback if display_name column doesn't exist (pre-migration)
        if (error.message && error.message.includes('display_name')) {
          orderItemResult = await query(`
            INSERT INTO order_items (
              order_id, product_id, variant_id, quantity, price, total, 
              flavor_id, tier, cake_message, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `, [
            order.id, item.product_id, item.variant_id, item.quantity, item.price, 
            item.price * item.quantity, 
            (item.flavor_id && item.flavor_id !== 0) ? item.flavor_id : null, 
            item.tier || null, 
            item.cake_message || null
          ]);
        } else {
          throw error; // Re-throw if it's a different error
        }
      }

      // Get the inserted order item ID using lastID
      const orderItemId = orderItemResult.lastID;

      // Handle combo selections
      // Transfer combo selections from cart_item_id to order_item_id
      const cartItemId = item.cart_item_id || `cart_${item.product_id}_${item.variant_id || 'default'}`;
      
      // Get existing combo selections for this cart item with product details
      const existingCombos = await query(`
        SELECT cs.*, 
               aop.price, 
               aop.discounted_price, 
               aop.name as product_name
        FROM combo_selections cs
        LEFT JOIN add_on_products aop ON cs.add_on_product_id = aop.id
        WHERE cs.cart_item_id = ? AND (cs.order_item_id IS NULL OR cs.order_item_id = 0)
      `, [cartItemId]);

      // Transfer them to the order item and store prices
      if (existingCombos.rows.length > 0) {
        for (const combo of existingCombos.rows) {
          const unitPrice = combo.discounted_price || combo.price || 0;
          const total = unitPrice * (combo.quantity || 1);
          
          await query(`
            UPDATE combo_selections 
            SET order_item_id = ?, 
                cart_item_id = NULL,
                price = ?,
                discounted_price = ?,
                total = ?,
                product_name = ?
            WHERE id = ?
          `, [
            orderItemId, 
            combo.price || 0,
            combo.discounted_price || null,
            total,
            combo.product_name || null,
            combo.id
          ]);
        }
      }

      // Also handle combo selections passed directly in request (if any)
      if (item.combos && item.combos.length > 0) {
        for (const combo of item.combos) {
          // Get the actual price from the combo data (should be passed from frontend)
          const comboPrice = combo.price || combo.unitPrice || 0;
          const comboDiscountedPrice = combo.discounted_price || null;
          const unitPrice = comboDiscountedPrice || comboPrice;
          const comboQuantity = combo.quantity || 1;
          const comboTotal = unitPrice * comboQuantity;
          const comboProductName = combo.product_name || null;
          
          // Insert combo selection linked to the order_item_id with prices stored
          await query(`
            INSERT INTO combo_selections (
              order_item_id, add_on_product_id, quantity, 
              price, discounted_price, total, product_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `, [
            orderItemId, 
            combo.add_on_product_id || combo.product_id, 
            comboQuantity,
            comboPrice,
            comboDiscountedPrice,
            comboTotal,
            comboProductName
          ]);
        }
      }

      // Update stock if variant exists
      if (item.variant_id) {
        await query(`
          UPDATE product_variants 
          SET stock_quantity = stock_quantity - ?, updated_at = NOW()
          WHERE id = ?
        `, [item.quantity, item.variant_id]);
      }

      // Track deal purchase if this is a deal item
      if (item.is_deal_item || (item.deal_price && item.deal_price < item.price * 0.5)) {
        try {
          // Find the deal ID for this product
          const dealResult = await query(`
            SELECT id FROM one_rupee_deals 
            WHERE product_id = ? AND ABS(deal_price - ?) < 0.01 AND is_active = 1
            LIMIT 1
          `, [item.product_id, item.deal_price || item.price]);

          if (dealResult.rows && dealResult.rows.length > 0) {
            const dealId = dealResult.rows[0].id;
            const dealRevenue = (item.deal_price || item.price) * item.quantity;
            const { trackDealPurchase } = require('./dealController');
            await trackDealPurchase(dealId, orderId, customer_id, dealRevenue, orderSubtotal);
          }
        } catch (dealError) {
          console.error('Error tracking deal purchase:', dealError);
          // Don't fail order creation if deal tracking fails
        }
      }
    }

    // Track banner conversion if banner_id is provided
    if (req.body.banner_id) {
      try {
        const { trackBannerConversion } = require('./bannerController');
        // Use a helper function to track conversion
        const conversionReq = {
          params: { id: req.body.banner_id },
          body: { 
            customer_id: customer_id, 
            revenue: totalAmount 
          },
          ip: req.ip || req.connection.remoteAddress,
          get: (header) => req.get(header),
          connection: req.connection
        };
        const conversionRes = {
          json: () => {},
          status: () => ({ json: () => {} })
        };
        await trackBannerConversion(conversionReq, conversionRes);
      } catch (error) {
        console.error('Error tracking banner conversion:', error);
        // Don't fail order creation if conversion tracking fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { 
        order,
        scratchCard: scratchCardInfo // Include scratch card info in response
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if order exists (by database ID)
    const existingOrder = await query(
      'SELECT id, status, customer_id FROM orders WHERE id = ?',
      [id]
    );

    if (existingOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build update query dynamically (SQLite compatible)
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const queryText = `
      UPDATE orders 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    const oldStatus = existingOrder.rows[0].status;
    const newStatus = updateData.status;
    const customerId = existingOrder.rows[0].customer_id;

    await query(queryText, values);

    // Auto-credit scratch cards when order status changes to "delivered"
    // This will auto-reveal pending cards and then credit them
    if (oldStatus !== 'delivered' && newStatus === 'delivered') {
      try {
        const { autoCreditScratchCardsForOrder } = require('./scratchCardController');
        const autoCreditResult = await autoCreditScratchCardsForOrder(id);
        if (autoCreditResult.success) {
          if (autoCreditResult.credited > 0) {
            console.log(`Auto-processed ${autoCreditResult.credited} scratch card(s) for order ${id} (${autoCreditResult.revealed || 0} revealed, ${autoCreditResult.credited} credited)`);
          } else {
            console.log(`No scratch cards to process for order ${id}`);
          }
        } else {
          console.error(`Failed to auto-process scratch cards for order ${id}:`, autoCreditResult.error);
        }
      } catch (error) {
        console.error('Error auto-processing scratch cards on order delivery:', error);
        // Don't fail the order update if scratch card processing fails
      }

      // Auto-credit referral bonuses when order is delivered (if this is the customer's first order)
      try {
        // Check if this is the customer's first delivered order
        const firstOrderCheck = await query(
          `SELECT COUNT(*) as order_count 
           FROM orders 
           WHERE customer_id = ? AND status = 'delivered' AND id != ?`,
          [customer_id, id]
        );

        const isFirstOrder = (firstOrderCheck.rows[0].order_count || 0) === 0;

        if (isFirstOrder) {
          const { creditReferralBonuses } = require('./referralController');
          const referralResult = await creditReferralBonuses(id, customer_id);
          if (referralResult.success && referralResult.credited) {
            console.log(`Referral bonuses credited for order ${id}: Referrer=${referralResult.referrerCredited ? 'Yes' : 'No'}, Referee=${referralResult.refereeCredited ? 'Yes' : 'No'}`);
          } else if (referralResult.success && !referralResult.credited) {
            console.log(`No referral bonuses to credit for order ${id}`);
          } else {
            console.error(`Failed to credit referral bonuses for order ${id}:`, referralResult.message);
          }
        }
      } catch (error) {
        console.error('Error auto-processing referral bonuses on order delivery:', error);
        // Don't fail the order update if referral processing fails
      }
    }

    // Note: Scratch cards are now created at order creation time, not on delivery
    // The scratch card can be revealed immediately but will only be credited after delivery

    // Get order with full details for response
    const fullOrderQuery = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', oi.id,
              'product_id', oi.product_id,
              'variant_id', oi.variant_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'total', oi.total,
              'product_name', COALESCE(oi.display_name, p.name),
              'variant_name', pv.name,
              'variant_weight', pv.weight,
              'product_base_weight', p.base_weight
            )
          ), 
          JSON_ARRAY()
        ) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE o.id = ?
      GROUP BY o.id, c.name, c.email, c.phone
    `;
    
    let fullOrderResult;
    try {
      fullOrderResult = await query(fullOrderQuery, [id]);
    } catch (queryError) {
      console.error('Error fetching order details after update:', queryError);
      console.error('Query:', fullOrderQuery);
      // Try a simpler query as fallback
      try {
        fullOrderResult = await query(
          'SELECT * FROM orders WHERE id = ?',
          [id]
        );
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return res.status(500).json({
          success: false,
          message: 'Error fetching updated order details',
          error: process.env.NODE_ENV === 'development' ? fallbackError.message : undefined
        });
      }
    }
    
    if (!fullOrderResult.rows || fullOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found after update'
      });
    }
    
    const order = fullOrderResult.rows[0];
    
    // Parse items
    let items = [];
    if (order.items) {
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        items = [];
      }
    }

    // Transform to match frontend format
    const transformedOrder = {
      id: order.id,
      orderId: order.id,
      order_number: order.order_number,
      displayId: order.order_number || order.id,
      customerName: order.customer_name || '',
      customerEmail: order.customer_email || '',
      customerPhone: order.customer_phone || '',
      items: items.map(item => ({
        id: item.id?.toString() || '',
        productId: item.product_id?.toString() || '',
        productName: item.product_name || '',
        quantity: item.quantity || 0,
        price: parseFloat(item.price || 0),
        weight: item.variant_weight || item.product_base_weight || ''
      })),
      total: parseFloat(order.total_amount || 0),
      status: order.status || 'pending',
      paymentStatus: order.payment_status || 'pending',
      deliveryAddress: order.delivery_address || '',
      deliveryDate: order.delivery_date || '',
      deliveryTime: order.delivery_time || '',
      notes: order.special_instructions || '',
      // Convert SQLite datetime to ISO format with UTC timezone indicator for frontend
      createdAt: order.created_at ? (order.created_at.includes('T') || order.created_at.includes('Z') 
        ? order.created_at 
        : order.created_at.replace(' ', 'T') + 'Z') : '',
      updatedAt: order.updated_at ? (order.updated_at.includes('T') || order.updated_at.includes('Z')
        ? order.updated_at
        : order.updated_at.replace(' ', 'T') + 'Z') : ''
    };

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: transformedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingOrder = await query(
      'SELECT id, status FROM orders WHERE id = $1',
      [id]
    );

    if (existingOrder.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Don't allow deletion of delivered orders
    if (existingOrder.rows[0].status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete delivered orders'
      });
    }

    // Delete order items first
    await query('DELETE FROM order_items WHERE order_id = $1', [id]);

    // Delete order
    await query('DELETE FROM orders WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // MySQL compatible date calculation
    const daysAgo = parseInt(period) || 30;
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
        COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
        COUNT(CASE WHEN status = 'out_for_delivery' THEN 1 END) as out_for_delivery_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const result = await query(statsQuery, [daysAgo]);

    res.json({
      success: true,
      data: { stats: result.rows[0] }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get customer's own orders (requires customer authentication)
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const {
      page = 1,
      limit = 10,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Convert to integers for MySQL
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    let whereConditions = ['o.customer_id = ?'];
    let queryParams = [customerId];
    let paramCount = 2;

    // Build WHERE conditions
    if (status) {
      whereConditions.push(`o.status = ?`);
      queryParams.push(status);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'total_amount', 'status', 'delivery_date'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get orders with items
    // Ensure limit and offset are integers (inline to avoid MySQL stmt issues)
    const finalLimit3 = Number.isInteger(limitNum) && limitNum > 0 ? limitNum : 10;
    const finalOffset3 = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    const ordersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_id,
        o.status,
        o.total_amount,
        o.delivery_address,
        o.delivery_date,
        o.delivery_time,
        o.special_instructions,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at
      FROM orders o
      ${whereClause}
      ORDER BY o.${sortField} ${sortDirection}
      LIMIT ${finalLimit3} OFFSET ${finalOffset3}
    `;

    const ordersQueryParams = [...queryParams];
    const ordersResult = await query(ordersQuery, ordersQueryParams);

    // Helper function to check if an item is a deal product
    const isDealProduct = async (productId, price) => {
      try {
        const dealResult = await query(`
          SELECT id, deal_title, deal_price
          FROM one_rupee_deals
          WHERE product_id = ? AND is_active = 1
        `, [productId]);
        
        if (dealResult.rows && dealResult.rows.length > 0) {
          for (const deal of dealResult.rows) {
            const dealPrice = parseFloat(deal.deal_price);
            const itemPrice = parseFloat(price);
            if (Math.abs(dealPrice - itemPrice) < 0.01) {
              return {
                isDeal: true,
                dealTitle: deal.deal_title,
                dealPrice: dealPrice
              };
            }
          }
        }
        return { isDeal: false };
      } catch (error) {
        return { isDeal: false };
      }
    };

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.rows.map(async (order) => {
        let itemsResult;
        
        // Try query with display_name (for migrated databases), fallback if column doesn't exist
        try {
          itemsResult = await query(`
            SELECT 
              oi.id,
              oi.product_id,
              oi.variant_id,
              oi.quantity,
              oi.price,
              oi.total,
              oi.flavor_id,
              oi.tier,
              oi.cake_message,
              COALESCE(oi.display_name, p.name) as product_name,
              p.image_url as product_image,
              p.base_price as product_base_price,
              p.discounted_price as product_discounted_price,
              p.base_weight as product_base_weight,
              pv.name as variant_name,
              pv.weight as variant_weight
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN product_variants pv ON oi.variant_id = pv.id
            WHERE oi.order_id = ?
            ORDER BY oi.id
          `, [order.id]);
        } catch (error) {
          // Fallback if display_name column doesn't exist (pre-migration)
          if (error.message && error.message.includes('display_name')) {
            itemsResult = await query(`
              SELECT 
                oi.id,
                oi.product_id,
                oi.variant_id,
                oi.quantity,
                oi.price,
                oi.total,
                oi.flavor_id,
                oi.tier,
                oi.cake_message,
                p.name as product_name,
                p.image_url as product_image,
                p.base_price as product_base_price,
                p.discounted_price as product_discounted_price,
                p.base_weight as product_base_weight,
                pv.name as variant_name,
                pv.weight as variant_weight
              FROM order_items oi
              LEFT JOIN products p ON oi.product_id = p.id
              LEFT JOIN product_variants pv ON oi.variant_id = pv.id
              WHERE oi.order_id = ?
              ORDER BY oi.id
            `, [order.id]);
          } else {
            throw error; // Re-throw if it's a different error
          }
        }

        const items = itemsResult.rows || [];

        // Get combo items for all order items
        // Use stored prices from combo_selections (snapshot at order time)
        const comboItemsMap = new Map();
        if (items.length > 0) {
          const orderItemIds = items.map(item => item.id);
          const placeholders = orderItemIds.map(() => '?').join(',');
          
          try {
            const comboResult = await query(`
              SELECT 
                cs.order_item_id,
                cs.quantity,
                cs.add_on_product_id,
                cs.product_name,
                cs.price,
                cs.discounted_price,
                cs.total
              FROM combo_selections cs
              WHERE cs.order_item_id IN (${placeholders})
              ORDER BY cs.order_item_id, cs.id
            `, orderItemIds);

            if (comboResult.rows && comboResult.rows.length > 0) {
              comboResult.rows.forEach(combo => {
                if (!comboItemsMap.has(combo.order_item_id)) {
                  comboItemsMap.set(combo.order_item_id, []);
                }
                // Use stored total if available, otherwise calculate from stored prices
                const comboData = {
                  order_item_id: combo.order_item_id,
                  quantity: combo.quantity,
                  add_on_product_id: combo.add_on_product_id,
                  product_name: combo.product_name,
                  price: combo.price,
                  discounted_price: combo.discounted_price,
                  total: combo.total || (combo.quantity * (combo.discounted_price || combo.price || 0))
                };
                comboItemsMap.get(combo.order_item_id).push(comboData);
              });
            }
          } catch (comboError) {
            // Combo selections might not exist for old orders, continue without them
            console.warn('Error fetching combo items:', comboError.message);
          }
        }

        // Check for deals and enrich items
        const enrichedItems = await Promise.all(items.map(async (item) => {
          const dealInfo = await isDealProduct(item.product_id, item.price);
          // Create weight field with proper fallback: variant_weight > product_base_weight > null
          const weight = item.variant_weight || item.product_base_weight || null;
          return {
            ...item,
            weight: weight, // Add weight field for frontend compatibility
            isDeal: dealInfo.isDeal,
            dealTitle: dealInfo.dealTitle,
            dealPrice: dealInfo.dealPrice,
            combos: comboItemsMap.get(item.id) || []
          };
        }));

        // Get wallet usage for this order
        let walletAmountUsed = 0;
        try {
          const walletUsageResult = await query(`
            SELECT amount_used
            FROM wallet_usage
            WHERE order_id = ?
          `, [order.id]);
          
          if (walletUsageResult.rows && walletUsageResult.rows.length > 0) {
            walletAmountUsed = parseFloat(walletUsageResult.rows[0].amount_used) || 0;
          }
        } catch (walletError) {
          // Wallet usage might not exist for old orders
          console.warn('Error fetching wallet usage:', walletError.message);
        }

        // Calculate subtotal (sum of all item totals including combos)
        let subtotal = 0;
        enrichedItems.forEach(item => {
          subtotal += parseFloat(item.total || 0);
          if (item.combos && item.combos.length > 0) {
            item.combos.forEach(combo => {
              subtotal += parseFloat(combo.total || 0);
            });
          }
        });

        // Calculate delivery charge and promo discount from order total
        // Formula: total = subtotal - promo_discount - wallet_amount_used + delivery_charge
        // We need to estimate delivery charge (typically 50-100, or 0 if subtotal >= threshold)
        const FREE_DELIVERY_THRESHOLD = await getFreeDeliveryThreshold();
        const estimatedDeliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 50; // Default 50 if not free
        const orderTotal = parseFloat(order.total_amount || 0);
        
        // Calculate promo discount: promo = subtotal - wallet + delivery - total
        const calculatedPromoDiscount = Math.max(0, subtotal - walletAmountUsed + estimatedDeliveryCharge - orderTotal);
        
        // If calculated promo is 0, try to get actual delivery charge
        // delivery_charge = total - subtotal + promo + wallet
        const calculatedDeliveryCharge = orderTotal - subtotal + calculatedPromoDiscount + walletAmountUsed;
        const finalDeliveryCharge = calculatedDeliveryCharge >= 0 ? calculatedDeliveryCharge : estimatedDeliveryCharge;

        return {
          ...order,
          delivery_address: order.delivery_address ? JSON.parse(order.delivery_address) : null,
          items: enrichedItems,
          wallet_amount_used: walletAmountUsed,
          subtotal: subtotal,
          delivery_charge: finalDeliveryCharge,
          promo_discount: calculatedPromoDiscount
        };
      })
    );

    res.json({
      success: true,
      data: {
        orders: ordersWithItems,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
  getMyOrders
};
