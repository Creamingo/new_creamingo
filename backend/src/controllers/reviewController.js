const { query } = require('../config/db');

/**
 * Get customer's published reviews
 */
const getMyReviews = async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Get customer email
    const customerResult = await query(
      'SELECT email FROM customers WHERE id = ?',
      [customerId]
    );

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerEmail = customerResult.rows[0].email;

    // Get all reviews including rating-only reviews (where review_text is null or empty)
    const result = await query(`
      SELECT 
        pr.id,
        pr.product_id,
        pr.rating,
        pr.review_text,
        pr.review_title,
        pr.is_approved,
        pr.created_at,
        pr.updated_at,
        p.name as product_name,
        p.image_url as product_image,
        CASE WHEN pr.review_text IS NULL OR pr.review_text = '' THEN 1 ELSE 0 END as has_only_rating
      FROM product_reviews pr
      INNER JOIN products p ON pr.product_id = p.id
      WHERE pr.customer_email = ?
      ORDER BY pr.created_at DESC
    `, [customerEmail]);

    const reviews = result.rows || result;

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => ({
          id: review.id,
          product_id: review.product_id,
          product_name: review.product_name,
          product_image: review.product_image,
          rating: review.rating,
          comment: review.review_text,
          title: review.review_title,
          is_approved: review.is_approved,
          created_at: review.created_at,
          updated_at: review.updated_at,
          has_only_rating: review.has_only_rating === 1
        }))
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get pending reviews (orders without reviews)
 */
const getPendingReviews = async (req, res) => {
  try {
    const customerId = req.customer.id;

    // Get customer email
    const customerResult = await query(
      'SELECT email FROM customers WHERE id = ?',
      [customerId]
    );

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerEmail = customerResult.rows[0].email;

    // Get all order items for this customer that don't have any reviews yet
    // Only include orders with delivered or completed status
    // Exclude items that have been rated (even rating-only reviews should not appear here)
    const result = await query(`
      SELECT DISTINCT
        oi.id,
        oi.product_id,
        p.name as product_name,
        oi.quantity,
        o.order_number,
        o.created_at as order_date,
        p.image_url as product_image
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      INNER JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_reviews pr ON pr.product_id = oi.product_id 
        AND pr.customer_email = ?
      WHERE o.customer_id = ?
        AND pr.id IS NULL
        AND LOWER(o.status) IN ('delivered', 'completed')
      ORDER BY o.created_at DESC
    `, [customerEmail, customerId]);

    const pendingReviews = (result.rows || result).map(item => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      order_number: item.order_number,
      order_date: item.order_date,
      quantity: item.quantity
    }));

    res.json({
      success: true,
      data: {
        pendingReviews
      }
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Submit a review
 */
const submitReview = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { product_id, rating, comment, title, order_item_id } = req.body;

    // Validate required fields
    if (!product_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and rating are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get customer email
    const customerResult = await query(
      'SELECT name, email FROM customers WHERE id = ?',
      [customerId]
    );

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const { name: customer_name, email: customer_email } = customerResult.rows[0];

    // Check if product exists
    const productCheck = await query(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (!productCheck.rows || productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Insert review
    const insertResult = await query(`
      INSERT INTO product_reviews (
        product_id, customer_name, customer_email, rating,
        review_title, review_text, is_verified_purchase, is_approved,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      product_id,
      customer_name,
      customer_email,
      rating,
      title || null,
      comment || null,
      1, // Verified purchase if from order
      0  // Pending approval by default
    ]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will be published after approval.',
      data: {
        review_id: insertResult.lastID
      }
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a review
 */
const updateReview = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;
    const { rating, comment, title } = req.body;

    // Get customer email
    const customerResult = await query(
      'SELECT email FROM customers WHERE id = ?',
      [customerId]
    );

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerEmail = customerResult.rows[0].email;

    // Check if review exists and belongs to customer
    const reviewCheck = await query(
      'SELECT id FROM product_reviews WHERE id = ? AND customer_email = ?',
      [id, customerEmail]
    );

    if (!reviewCheck.rows || reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to update it'
      });
    }

    // Update review
    const updateFields = [];
    const updateValues = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }

    if (comment !== undefined) {
      updateFields.push('review_text = ?');
      updateValues.push(comment);
    }

    if (title !== undefined) {
      updateFields.push('review_title = ?');
      updateValues.push(title);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await query(`
      UPDATE product_reviews 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({
      success: true,
      message: 'Review updated successfully'
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a review
 */
const deleteReview = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { id } = req.params;

    // Get customer email
    const customerResult = await query(
      'SELECT email FROM customers WHERE id = ?',
      [customerId]
    );

    if (!customerResult.rows || customerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customerEmail = customerResult.rows[0].email;

    // Check if review exists and belongs to customer
    const reviewCheck = await query(
      'SELECT id FROM product_reviews WHERE id = ? AND customer_email = ?',
      [id, customerEmail]
    );

    if (!reviewCheck.rows || reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    // Delete review
    await query('DELETE FROM product_reviews WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getMyReviews,
  getPendingReviews,
  submitReview,
  updateReview,
  deleteReview
};

