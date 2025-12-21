const { query } = require('../config/db');

// Get combo selections for a cart item
const getComboSelections = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    
    const result = await query(`
      SELECT cs.*, p.name as product_name, p.price, p.discounted_price, p.discount_percentage, p.image_url, c.name as category_name
      FROM combo_selections cs
      JOIN add_on_products p ON cs.add_on_product_id = p.id
      JOIN add_on_categories c ON p.category_id = c.id
      WHERE cs.cart_item_id = ? AND p.is_active = 1 AND c.is_active = 1
      ORDER BY c.display_order ASC, p.display_order ASC
    `, [cartItemId]);

    res.status(200).json({
      success: true,
      data: {
        selections: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching combo selections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch combo selections'
    });
  }
};

// Add product to combo selection
const addToCombo = async (req, res) => {
  try {
    const { cartItemId, addOnProductId, quantity = 1 } = req.body;

    if (!cartItemId || !addOnProductId) {
      return res.status(400).json({
        success: false,
        message: 'Cart item ID and add-on product ID are required'
      });
    }

    // Check if add-on product exists and is active
    const productExists = await query(`
      SELECT p.*, c.name as category_name
      FROM add_on_products p
      JOIN add_on_categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = 1 AND c.is_active = 1
    `, [addOnProductId]);

    if (productExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Add-on product not found or inactive'
      });
    }

    // Check if product is already in combo for this cart item
    const existingSelection = await query(`
      SELECT * FROM combo_selections 
      WHERE cart_item_id = ? AND add_on_product_id = ?
    `, [cartItemId, addOnProductId]);

    if (existingSelection.rows.length > 0) {
      // Update quantity
      await query(`
        UPDATE combo_selections 
        SET quantity = quantity + ?
        WHERE cart_item_id = ? AND add_on_product_id = ?
      `, [quantity, cartItemId, addOnProductId]);
    } else {
      // Create new selection
      await query(`
        INSERT INTO combo_selections (cart_item_id, add_on_product_id, quantity)
        VALUES (?, ?, ?)
      `, [cartItemId, addOnProductId, quantity]);
    }

    // Return updated combo selections
    const updatedSelections = await query(`
      SELECT cs.*, p.name as product_name, p.price, p.discounted_price, p.discount_percentage, p.image_url, c.name as category_name
      FROM combo_selections cs
      JOIN add_on_products p ON cs.add_on_product_id = p.id
      JOIN add_on_categories c ON p.category_id = c.id
      WHERE cs.cart_item_id = ? AND p.is_active = 1 AND c.is_active = 1
      ORDER BY c.display_order ASC, p.display_order ASC
    `, [cartItemId]);

    res.status(200).json({
      success: true,
      data: {
        selections: updatedSelections.rows
      }
    });
  } catch (error) {
    console.error('Error adding to combo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to combo'
    });
  }
};

// Update combo selection quantity
const updateComboQuantity = async (req, res) => {
  try {
    const { selectionId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    // Check if selection exists
    const existingSelection = await query(`
      SELECT * FROM combo_selections WHERE id = ?
    `, [selectionId]);

    if (existingSelection.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Combo selection not found'
      });
    }

    if (quantity === 0) {
      // Remove selection
      await query(`
        DELETE FROM combo_selections WHERE id = ?
      `, [selectionId]);
    } else {
      // Update quantity
      await query(`
        UPDATE combo_selections 
        SET quantity = ?
        WHERE id = ?
      `, [quantity, selectionId]);
    }

    res.status(200).json({
      success: true,
      message: 'Combo selection updated successfully'
    });
  } catch (error) {
    console.error('Error updating combo quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update combo selection'
    });
  }
};

// Remove product from combo
const removeFromCombo = async (req, res) => {
  try {
    const { selectionId } = req.params;

    // Check if selection exists
    const existingSelection = await query(`
      SELECT * FROM combo_selections WHERE id = ?
    `, [selectionId]);

    if (existingSelection.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Combo selection not found'
      });
    }

    await query(`
      DELETE FROM combo_selections WHERE id = ?
    `, [selectionId]);

    res.status(200).json({
      success: true,
      message: 'Product removed from combo successfully'
    });
  } catch (error) {
    console.error('Error removing from combo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from combo'
    });
  }
};

// Clear all combo selections for a cart item
const clearComboSelections = async (req, res) => {
  try {
    const { cartItemId } = req.params;

    await query(`
      DELETE FROM combo_selections WHERE cart_item_id = ?
    `, [cartItemId]);

    res.status(200).json({
      success: true,
      message: 'All combo selections cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing combo selections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear combo selections'
    });
  }
};

// Get combo summary with total price
const getComboSummary = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    
    const result = await query(`
      SELECT 
        cs.*,
        p.name as product_name,
        p.price,
        p.discounted_price,
        p.discount_percentage,
        p.image_url,
        c.name as category_name,
        (cs.quantity * COALESCE(p.discounted_price, p.price)) as total_price
      FROM combo_selections cs
      JOIN add_on_products p ON cs.add_on_product_id = p.id
      JOIN add_on_categories c ON p.category_id = c.id
      WHERE cs.cart_item_id = ? AND p.is_active = 1 AND c.is_active = 1
      ORDER BY c.display_order ASC, p.display_order ASC
    `, [cartItemId]);

    // Calculate total combo price
    const totalPrice = result.rows.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

    res.status(200).json({
      success: true,
      data: {
        selections: result.rows,
        totalPrice: totalPrice,
        itemCount: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching combo summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch combo summary'
    });
  }
};

// Get combo analytics/reporting
const getComboAnalytics = async (req, res) => {
  try {
    const { date_from, date_to, category_id } = req.query;

    let whereConditions = ['cs.order_item_id IS NOT NULL'];
    let queryParams = [];

    if (date_from) {
      whereConditions.push(`o.created_at >= ?`);
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push(`o.created_at <= ?`);
      queryParams.push(date_to);
    }

    if (category_id) {
      whereConditions.push(`p.category_id = ?`);
      queryParams.push(category_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total combo selections count
    const totalQuery = `
      SELECT COUNT(*) as total_selections, SUM(cs.quantity) as total_quantity
      FROM combo_selections cs
      JOIN order_items oi ON cs.order_item_id = oi.id
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
    `;

    const totalResult = await query(totalQuery, queryParams);

    // Get top selling combo products
    const topProductsQuery = `
      SELECT 
        p.id,
        p.name,
        p.category_id,
        c.name as category_name,
        SUM(cs.quantity) as total_quantity_sold,
        COUNT(cs.id) as times_selected,
        SUM(cs.quantity * COALESCE(p.discounted_price, p.price)) as total_revenue
      FROM combo_selections cs
      JOIN add_on_products p ON cs.add_on_product_id = p.id
      JOIN add_on_categories c ON p.category_id = c.id
      JOIN order_items oi ON cs.order_item_id = oi.id
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY p.id, p.name, p.category_id, c.name
      ORDER BY total_quantity_sold DESC
      LIMIT 10
    `;

    const topProductsResult = await query(topProductsQuery, queryParams);

    // Get combo selections by category
    const categoryStatsQuery = `
      SELECT 
        c.id,
        c.name as category_name,
        COUNT(DISTINCT cs.id) as total_selections,
        SUM(cs.quantity) as total_quantity,
        SUM(cs.quantity * COALESCE(p.discounted_price, p.price)) as total_revenue
      FROM combo_selections cs
      JOIN add_on_products p ON cs.add_on_product_id = p.id
      JOIN add_on_categories c ON p.category_id = c.id
      JOIN order_items oi ON cs.order_item_id = oi.id
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;

    const categoryStatsResult = await query(categoryStatsQuery, queryParams);

    // Get combo selections over time (daily) - SQLite uses date() function
    const timeSeriesQuery = `
      SELECT 
        date(o.created_at) as date,
        COUNT(cs.id) as selections_count,
        SUM(cs.quantity) as total_quantity,
        SUM(cs.quantity * COALESCE(p.discounted_price, p.price)) as daily_revenue
      FROM combo_selections cs
      JOIN add_on_products p ON cs.add_on_product_id = p.id
      JOIN order_items oi ON cs.order_item_id = oi.id
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY date(o.created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const timeSeriesResult = await query(timeSeriesQuery, queryParams);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_selections: parseInt(totalResult.rows[0]?.total_selections || 0),
          total_quantity_sold: parseInt(totalResult.rows[0]?.total_quantity || 0)
        },
        top_products: topProductsResult.rows,
        category_stats: categoryStatsResult.rows,
        time_series: timeSeriesResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching combo analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch combo analytics'
    });
  }
};

// Get combo selections for a specific order
const getOrderComboSelections = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await query(`
      SELECT 
        cs.*,
        cs.product_name,
        cs.price,
        cs.discounted_price,
        cs.total as total_price,
        oi.id as order_item_id,
        -- Fallback to current product data if stored prices are NULL (for old orders)
        COALESCE(cs.product_name, p.name) as product_name_final,
        COALESCE(cs.price, p.price) as price_final,
        COALESCE(cs.discounted_price, p.discounted_price) as discounted_price_final,
        COALESCE(cs.total, (cs.quantity * COALESCE(p.discounted_price, p.price))) as total_price_final,
        p.discount_percentage,
        p.image_url,
        c.name as category_name
      FROM combo_selections cs
      LEFT JOIN add_on_products p ON cs.add_on_product_id = p.id
      LEFT JOIN add_on_categories c ON p.category_id = c.id
      JOIN order_items oi ON cs.order_item_id = oi.id
      WHERE oi.order_id = ?
      ORDER BY COALESCE(c.display_order, 0) ASC, COALESCE(p.display_order, 0) ASC
    `, [orderId]);

    res.status(200).json({
      success: true,
      data: {
        selections: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching order combo selections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order combo selections'
    });
  }
};

module.exports = {
  getComboSelections,
  addToCombo,
  updateComboQuantity,
  removeFromCombo,
  clearComboSelections,
  getComboSummary,
  getComboAnalytics,
  getOrderComboSelections
};
