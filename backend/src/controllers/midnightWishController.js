const crypto = require('crypto');
const { query } = require('../config/db');
const { applyUploadUrl } = require('../utils/urlHelpers');
const { getBaseUrl, buildPublicUrlWithBase, normalizeUploadUrl } = require('../utils/urlHelpers');

const PUBLIC_ID_LENGTH = 8;

function generatePublicId() {
  return crypto.randomBytes(Math.ceil(PUBLIC_ID_LENGTH / 2))
    .toString('hex')
    .slice(0, PUBLIC_ID_LENGTH);
}

/**
 * Create a new midnight wish (authenticated)
 * Body: { message?, occasion?, delivery_pincode?, delivery_address?, items: [{ product_id, variant_id?, quantity }] }
 */
const createWish = async (req, res) => {
  try {
    const customer_id = req.customer.id;
    const { message, occasion, delivery_pincode, delivery_address, items } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product is required in your wish'
      });
    }

    // Validate items
    const validItems = items
      .map((it) => ({
        product_id: parseInt(it.product_id, 10),
        variant_id: it.variant_id != null ? parseInt(it.variant_id, 10) : null,
        quantity: Math.max(1, parseInt(it.quantity, 10) || 1)
      }))
      .filter((it) => !isNaN(it.product_id));

    if (validItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid product IDs are required'
      });
    }

    // Check products exist and are active
    for (const it of validItems) {
      const prod = await query(
        'SELECT id FROM products WHERE id = ? AND is_active = 1',
        [it.product_id]
      );
      if (!prod.rows || prod.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Product ${it.product_id} not found or not available`
        });
      }
    }

    let publicId = generatePublicId();
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      const existing = await query('SELECT id FROM midnight_wishes WHERE public_id = ?', [publicId]);
      if (!existing.rows || existing.rows.length === 0) break;
      publicId = generatePublicId();
      attempts++;
    }
    if (attempts >= maxAttempts) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate unique wish link. Please try again.'
      });
    }

    const deliveryAddressJson = delivery_address
      ? (typeof delivery_address === 'string' ? delivery_address : JSON.stringify(delivery_address))
      : null;

    const insertWish = await query(
      `INSERT INTO midnight_wishes (customer_id, public_id, message, occasion, delivery_pincode, delivery_address, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        customer_id,
        publicId,
        message || null,
        occasion || null,
        delivery_pincode || null,
        deliveryAddressJson
      ]
    );

    const wishId = insertWish.lastID;
    if (!wishId) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create wish'
      });
    }

    for (let i = 0; i < validItems.length; i++) {
      const it = validItems[i];
      await query(
        `INSERT INTO midnight_wish_items (wish_id, product_id, variant_id, quantity, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [wishId, it.product_id, it.variant_id, it.quantity, i]
      );
    }

    const shareUrl = `${process.env.FRONTEND_URL || ''}/midnight-wish/wish/${publicId}`.replace(/\/$/, '');

    res.status(201).json({
      success: true,
      message: 'Wish created successfully',
      wish: {
        id: wishId,
        public_id: publicId,
        share_url: shareUrl,
        message: message || null,
        occasion: occasion || null,
        item_count: validItems.length
      }
    });
  } catch (error) {
    console.error('Error creating midnight wish:', error);
    const isMissingTable = error.code === 'ER_NO_SUCH_TABLE' || (error.message && error.message.includes("doesn't exist"));
    if (isMissingTable) {
      return res.status(503).json({
        success: false,
        message: 'Midnight Wish is not set up yet. Run: node run_migration_062.js from the backend folder.',
        code: 'MIGRATION_REQUIRED'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create wish',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current customer's wishes (authenticated)
 */
const getMyWishes = async (req, res) => {
  try {
    const customer_id = req.customer.id;

    const result = await query(
      `SELECT mw.id, mw.public_id, mw.message, mw.occasion, mw.status, mw.created_at,
              (SELECT COUNT(*) FROM midnight_wish_items WHERE wish_id = mw.id) AS item_count
       FROM midnight_wishes mw
       WHERE mw.customer_id = ?
       ORDER BY mw.created_at DESC`,
      [customer_id]
    );

    const baseUrl = getBaseUrl(req);
    const frontendBase = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

    const wishes = (result.rows || []).map((row) => ({
      id: row.id,
      public_id: row.public_id,
      share_url: frontendBase ? `${frontendBase}/midnight-wish/wish/${row.public_id}` : null,
      message: row.message,
      occasion: row.occasion,
      status: row.status,
      item_count: row.item_count || 0,
      created_at: row.created_at
    }));

    res.json({
      success: true,
      wishes,
      count: wishes.length
    });
  } catch (error) {
    console.error('Error fetching my wishes:', error);
    const isMissingTable = error.code === 'ER_NO_SUCH_TABLE' || (error.message && error.message.includes("doesn't exist"));
    if (isMissingTable) {
      return res.status(503).json({
        success: false,
        message: 'Midnight Wish is not set up yet. Run: node run_migration_062.js from the backend folder.',
        code: 'MIGRATION_REQUIRED'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get wish by public ID (public, no auth) - for share link / fulfill page
 */
const getWishByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Wish link is invalid' });
    }

    const wishResult = await query(
      `SELECT mw.id, mw.public_id, mw.message, mw.occasion, mw.delivery_pincode, mw.delivery_address, mw.status, mw.created_at,
              c.name AS wisher_name
       FROM midnight_wishes mw
       JOIN customers c ON c.id = mw.customer_id
       WHERE mw.public_id = ?`,
      [publicId]
    );

    if (!wishResult.rows || wishResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'This wish link is invalid or has been removed'
      });
    }

    const wish = wishResult.rows[0];
    if (wish.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This wish is no longer active',
        status: wish.status
      });
    }

    const itemsResult = await query(
      `SELECT mwi.id, mwi.product_id, mwi.variant_id, mwi.quantity, mwi.sort_order,
              p.name AS product_name, p.slug AS product_slug, p.image_url, p.base_price, p.discount_percent, p.discounted_price,
              pv.name AS variant_name, pv.weight AS variant_weight, pv.price AS variant_price, pv.discounted_price AS variant_discounted_price
       FROM midnight_wish_items mwi
       JOIN products p ON p.id = mwi.product_id
       LEFT JOIN product_variants pv ON pv.id = mwi.variant_id
       WHERE mwi.wish_id = ?
       ORDER BY mwi.sort_order ASC, mwi.id ASC`,
      [wish.id]
    );

    const baseUrl = getBaseUrl(req);
    const items = (itemsResult.rows || []).map((row) => {
      const price = row.variant_discounted_price != null
        ? parseFloat(row.variant_discounted_price)
        : (row.discounted_price != null ? parseFloat(row.discounted_price) : parseFloat(row.base_price));
      const imageUrl = buildPublicUrlWithBase(baseUrl, normalizeUploadUrl(row.image_url));
      return {
        id: row.id,
        product_id: row.product_id,
        variant_id: row.variant_id,
        quantity: row.quantity,
        product_name: row.product_name,
        product_slug: row.product_slug,
        image_url: imageUrl,
        base_price: parseFloat(row.base_price),
        discounted_price: price,
        variant: row.variant_id
          ? {
              id: row.variant_id,
              name: row.variant_name,
              weight: row.variant_weight,
              price: parseFloat(row.variant_price),
              discounted_price: row.variant_discounted_price != null ? parseFloat(row.variant_discounted_price) : null
            }
          : null
      };
    });

    let deliveryAddress = null;
    if (wish.delivery_address) {
      try {
        deliveryAddress = typeof wish.delivery_address === 'string'
          ? JSON.parse(wish.delivery_address)
          : wish.delivery_address;
      } catch (_) {
        deliveryAddress = null;
      }
    }

    res.json({
      success: true,
      wish: {
        public_id: wish.public_id,
        message: wish.message,
        occasion: wish.occasion,
        wisher_first_name: wish.wisher_name ? wish.wisher_name.split(/\s+/)[0] : null,
        delivery_pincode: wish.delivery_pincode,
        delivery_address: deliveryAddress,
        created_at: wish.created_at,
        items
      }
    });
  } catch (error) {
    console.error('Error fetching wish by publicId:', error);
    const isMissingTable = error.code === 'ER_NO_SUCH_TABLE' || (error.message && error.message.includes("doesn't exist"));
    if (isMissingTable) {
      return res.status(503).json({
        success: false,
        message: 'Midnight Wish is not set up yet. Run: node run_migration_062.js from the backend folder.',
        code: 'MIGRATION_REQUIRED'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to load wish',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a wish (authenticated, own wish only)
 */
const deleteWish = async (req, res) => {
  try {
    const customer_id = req.customer.id;
    const wishId = parseInt(req.params.wishId, 10);

    if (!wishId || isNaN(wishId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wish'
      });
    }

    const existing = await query(
      'SELECT id FROM midnight_wishes WHERE id = ? AND customer_id = ?',
      [wishId, customer_id]
    );

    if (!existing.rows || existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Wish not found or you cannot delete it'
      });
    }

    await query('DELETE FROM midnight_wish_items WHERE wish_id = ?', [wishId]);
    await query('DELETE FROM midnight_wishes WHERE id = ? AND customer_id = ?', [wishId, customer_id]);

    res.json({
      success: true,
      message: 'Wish deleted'
    });
  } catch (error) {
    console.error('Error deleting midnight wish:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete wish',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createWish,
  getMyWishes,
  getWishByPublicId,
  deleteWish
};
