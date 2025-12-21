const { query } = require('../config/db');

/**
 * Get customer's wishlist
 */
const getWishlist = async (req, res) => {
  try {
    const customer_id = req.customer.id;

    const result = await query(`
      SELECT 
        w.id,
        w.product_id,
        w.created_at,
        p.name AS product_name,
        p.description,
        p.base_price,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.slug,
        p.is_active AS product_active,
        c.name AS category_name,
        sc.name AS subcategory_name
      FROM wishlist w
      INNER JOIN products p ON w.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE w.customer_id = ?
      ORDER BY w.created_at DESC
    `, [customer_id]);

    const items = result.rows.map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      description: item.description,
      price: parseFloat(item.base_price || 0),
      discount_percent: parseFloat(item.discount_percent || 0),
      discounted_price: parseFloat(item.discounted_price || item.base_price || 0),
      image_url: item.image_url,
      slug: item.slug,
      is_active: item.product_active,
      category_name: item.category_name,
      subcategory_name: item.subcategory_name,
      added_at: item.created_at
    }));

    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Add product to wishlist
 */
const addToWishlist = async (req, res) => {
  try {
    // Debug: Check if customer is attached to request
    if (!req.customer || !req.customer.id) {
      console.error('Customer not found in request:', {
        hasCustomer: !!req.customer,
        customerId: req.customer?.id,
        headers: req.headers
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const customer_id = req.customer.id;
    // Ensure productId is a number
    const productId = parseInt(req.body.productId, 10);

    console.log('Adding to wishlist:', { customer_id, productId, body: req.body });

    if (!productId || isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists and is active
    const productCheck = await query(
      'SELECT id, name, is_active FROM products WHERE id = ?',
      [productId]
    );

    if (!productCheck.rows || productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!productCheck.rows[0].is_active) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    // Check if already in wishlist
    const existing = await query(
      'SELECT id FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [customer_id, productId]
    );

    if (existing.rows && existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Product already in wishlist',
        item: { id: existing.rows[0].id, product_id: productId }
      });
    }

    // Add to wishlist
    const result = await query(`
      INSERT INTO wishlist (customer_id, product_id, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `, [customer_id, productId]);

    console.log('Wishlist insert result:', { lastID: result.lastID, changes: result.rowCount });

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      item: {
        id: result.lastID,
        product_id: productId
      }
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    console.error('Error stack:', error.stack);
    console.error('Request details:', {
      customer_id: req.customer?.id,
      productId: req.body?.productId,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove product from wishlist
 */
const removeFromWishlist = async (req, res) => {
  try {
    const customer_id = req.customer.id;
    const productId = parseInt(req.params.productId);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if item exists in wishlist
    const existing = await query(
      'SELECT id FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [customer_id, productId]
    );

    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    // Remove from wishlist
    await query(
      'DELETE FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [customer_id, productId]
    );

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Check if product is in wishlist
 */
const checkWishlist = async (req, res) => {
  try {
    const customer_id = req.customer.id;
    const productId = parseInt(req.params.productId);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const result = await query(
      'SELECT id FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [customer_id, productId]
    );

    res.json({
      success: true,
      isInWishlist: result.rows && result.rows.length > 0
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get wishlist count
 */
const getWishlistCount = async (req, res) => {
  try {
    const customer_id = req.customer.id;

    const result = await query(
      'SELECT COUNT(*) as count FROM wishlist WHERE customer_id = ?',
      [customer_id]
    );

    const count = result.rows && result.rows.length > 0 ? result.rows[0].count : 0;

    res.json({
      success: true,
      count: parseInt(count)
    });
  } catch (error) {
    console.error('Error fetching wishlist count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Clear entire wishlist
 */
const clearWishlist = async (req, res) => {
  try {
    const customer_id = req.customer.id;

    await query(
      'DELETE FROM wishlist WHERE customer_id = ?',
      [customer_id]
    );

    res.json({
      success: true,
      message: 'Wishlist cleared'
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  getWishlistCount,
  clearWishlist
};

