const { query } = require('../config/db');

// Fixed SQL query to handle missing slug column

// Get all featured products for a specific section
const getFeaturedProducts = async (req, res) => {
  try {
    const { section } = req.query;
    
    // Validate section parameter
    if (!section || !['top_products', 'bestsellers'].includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Section parameter is required and must be either "top_products" or "bestsellers"'
      });
    }
    
    const sql = `
      SELECT 
        fp.id,
        fp.product_id,
        fp.section,
        fp.display_order,
        fp.is_active,
        fp.is_featured,
        fp.is_top_product,
        fp.is_bestseller,
        fp.created_at,
        fp.updated_at,
        p.name as product_name,
        p.image_url as product_image,
        p.description as product_description,
        p.base_price as product_price,
        p.base_weight as product_weight,
        p.discount_percent as product_discount_percent,
        p.discounted_price as product_discounted_price,
        p.is_active as product_is_active,
        p.is_featured as product_is_featured,
        p.is_top_product as product_is_top_product,
        p.is_bestseller as product_is_bestseller,
        p.category_id,
        p.subcategory_id,
        c.name as category_name,
        sc.name as subcategory_name
      FROM featured_products fp
      JOIN products p ON fp.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE fp.section = ?
      ORDER BY fp.display_order ASC, fp.created_at ASC
    `;
    
    const result = await query(sql, [section]);
    
    // Fetch variants and gallery images for each product
    const productsWithDetails = await Promise.all(result.rows.map(async (product) => {
      // Fetch variants
      const variantsResult = await query(`
        SELECT 
          id,
          name,
          weight,
          price,
          discount_percent,
          discounted_price,
          stock_quantity,
          is_available
        FROM product_variants 
        WHERE product_id = ? AND is_available = 1
        ORDER BY price ASC
      `, [product.product_id]);
      
      // Fetch gallery images
      const galleryResult = await query(`
        SELECT image_url, display_order
        FROM product_gallery_images 
        WHERE product_id = ?
        ORDER BY display_order ASC
      `, [product.product_id]);
      
      return {
        ...product,
        variants: variantsResult.rows,
        gallery_images: galleryResult.rows.map(img => img.image_url)
      };
    }));
    
    res.status(200).json({
      success: true,
      data: productsWithDetails,
      count: productsWithDetails.length
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
};

// Get a single featured product
const getFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        fp.id,
        fp.product_id,
        fp.section,
        fp.display_order,
        fp.is_active,
        fp.created_at,
        fp.updated_at,
        p.name as product_name,
        p.image_url as product_image,
        p.description as product_description,
        p.base_price as product_price,
        p.is_active as product_is_active,
        LOWER(REPLACE(p.name, ' ', '-')) as product_slug
      FROM featured_products fp
      JOIN products p ON fp.product_id = p.id
      WHERE fp.id = ?
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching featured product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured product',
      error: error.message
    });
  }
};

// Add a product to featured list
const createFeaturedProduct = async (req, res) => {
  try {
    const { product_id, section, display_order = 0 } = req.body;
    
    // Validate input
    if (!product_id || !section) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and section are required'
      });
    }
    
    if (!['top_products', 'bestsellers'].includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Section must be either "top_products" or "bestsellers"'
      });
    }
    
    // Check if product exists
    const productCheck = await query(
      'SELECT id, name FROM products WHERE id = ?',
      [product_id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if product is already featured in this section
    const existingCheck = await query(
      'SELECT id FROM featured_products WHERE product_id = ? AND section = ?',
      [product_id, section]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Product is already featured in this section'
      });
    }
    
    // Check maximum limit for the section
    const countResult = await query(
      'SELECT COUNT(*) as count FROM featured_products WHERE section = ? AND is_active = 1',
      [section]
    );
    
    const currentCount = parseInt(countResult.rows[0].count);
    const maxLimit = section === 'top_products' ? 8 : 6;
    
    if (currentCount >= maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxLimit} products allowed for ${section} section`
      });
    }
    
    // Insert new featured product
    const insertSql = `
      INSERT INTO featured_products (product_id, section, display_order, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 1, NOW(), NOW())
    `;
    
    const insertResult = await query(insertSql, [product_id, section, display_order]);
    
    // Fetch the created featured product with product details
    const fetchSql = `
      SELECT 
        fp.id,
        fp.product_id,
        fp.section,
        fp.display_order,
        fp.is_active,
        fp.created_at,
        fp.updated_at,
        p.name as product_name,
        p.image_url as product_image,
        p.description as product_description,
        p.base_price as product_price,
        p.is_active as product_is_active,
        LOWER(REPLACE(p.name, ' ', '-')) as product_slug
      FROM featured_products fp
      JOIN products p ON fp.product_id = p.id
      WHERE fp.id = ?
    `;
    
    const newFeaturedProduct = await query(fetchSql, [insertResult.lastID]);
    
    res.status(201).json({
      success: true,
      message: 'Product added to featured list successfully',
      data: newFeaturedProduct.rows[0]
    });
  } catch (error) {
    console.error('Error creating featured product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to featured list',
      error: error.message
    });
  }
};

// Update a featured product
const updateFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_order, is_active } = req.body;
    
    // Check if featured product exists
    const existingCheck = await query(
      'SELECT id FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }
    
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    const updateSql = `
      UPDATE featured_products 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await query(updateSql, updateValues);
    
    // Fetch updated featured product
    const fetchSql = `
      SELECT 
        fp.id,
        fp.product_id,
        fp.section,
        fp.display_order,
        fp.is_active,
        fp.created_at,
        fp.updated_at,
        p.name as product_name,
        p.image_url as product_image,
        p.description as product_description,
        p.base_price as product_price,
        p.is_active as product_is_active,
        LOWER(REPLACE(p.name, ' ', '-')) as product_slug
      FROM featured_products fp
      JOIN products p ON fp.product_id = p.id
      WHERE fp.id = ?
    `;
    
    const updatedProduct = await query(fetchSql, [id]);
    
    res.status(200).json({
      success: true,
      message: 'Featured product updated successfully',
      data: updatedProduct.rows[0]
    });
  } catch (error) {
    console.error('Error updating featured product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured product',
      error: error.message
    });
  }
};

// Remove a product from featured list
const deleteFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if featured product exists
    const existingCheck = await query(
      'SELECT id FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    // Delete the featured product
    await query('DELETE FROM featured_products WHERE id = ?', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Product removed from featured list successfully'
    });
  } catch (error) {
    console.error('Error deleting featured product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from featured list',
      error: error.message
    });
  }
};

// Get available products that can be featured
const getAvailableProducts = async (req, res) => {
  try {
    const { section } = req.query;
    
    if (!section || !['top_products', 'bestsellers'].includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Section parameter is required and must be either "top_products" or "bestsellers"'
      });
    }
    
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.base_price,
        LOWER(REPLACE(p.name, ' ', '-')) as slug,
        p.is_active,
        CASE WHEN fp.id IS NOT NULL THEN 1 ELSE 0 END as is_featured
      FROM products p
      LEFT JOIN featured_products fp ON p.id = fp.product_id AND fp.section = ?
      WHERE p.is_active = 1
      ORDER BY p.name ASC
    `;
    
    const result = await query(sql, [section]);
    
    // Filter out already featured products
    const availableProducts = result.rows.filter(product => !product.is_featured);
    
    res.status(200).json({
      success: true,
      data: availableProducts,
      count: availableProducts.length
    });
  } catch (error) {
    console.error('Error fetching available products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available products',
      error: error.message
    });
  }
};

// Toggle featured product status
const toggleFeaturedProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if featured product exists
    const existingCheck = await query(
      'SELECT id, is_active FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    const currentStatus = existingCheck.rows[0].is_active;
    const newStatus = currentStatus ? 0 : 1;
    
    // Update status
    await query(
      'UPDATE featured_products SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    res.status(200).json({
      success: true,
      message: `Featured product ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: parseInt(id),
        is_active: newStatus === 1
      }
    });
  } catch (error) {
    console.error('Error toggling featured product status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle featured product status',
      error: error.message
    });
  }
};

// Reorder featured products
const reorderFeaturedProducts = async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Products must be an array'
      });
    }
    
    // Update display order for each product
    for (const product of products) {
      if (product.id && product.display_order !== undefined) {
        await query(
          'UPDATE featured_products SET display_order = ?, updated_at = NOW() WHERE id = ?',
          [product.display_order, product.id]
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Featured products reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder featured products',
      error: error.message
    });
  }
};

// Get section statistics
const getSectionStats = async (req, res) => {
  try {
    const sql = `
      SELECT 
        section,
        COUNT(*) as total_count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
      FROM featured_products
      GROUP BY section
    `;
    
    const result = await query(sql);
    
    const stats = {
      top_products: { total: 0, active: 0 },
      bestsellers: { total: 0, active: 0 }
    };
    
    result.rows.forEach(row => {
      if (row.section === 'top_products') {
        stats.top_products.total = row.total_count;
        stats.top_products.active = row.active_count;
      } else if (row.section === 'bestsellers') {
        stats.bestsellers.total = row.total_count;
        stats.bestsellers.active = row.active_count;
      }
    });
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching section stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch section statistics',
      error: error.message
    });
  }
};

// Toggle featured status in featured_products table
const toggleFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const currentCheck = await query(
      'SELECT id, is_featured FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (currentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    const currentStatus = currentCheck.rows[0].is_featured;
    const newStatus = !currentStatus;
    
    // Update featured_products table
    await query(
      'UPDATE featured_products SET is_featured = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    // Also update the main products table to keep them in sync
    const productCheck = await query(
      'SELECT product_id FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (productCheck.rows.length > 0) {
      const productId = productCheck.rows[0].product_id;
      await query(
        'UPDATE products SET is_featured = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, productId]
      );
    }
    
    res.json({
      success: true,
      message: `Featured status ${newStatus ? 'enabled' : 'disabled'} successfully`,
      featured_product: {
        id: parseInt(id),
        is_featured: newStatus
      }
    });
  } catch (error) {
    console.error('Toggle featured status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle top product status in featured_products table
const toggleTopProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const currentCheck = await query(
      'SELECT id, is_top_product, section FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (currentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    const currentStatus = currentCheck.rows[0].is_top_product;
    const newStatus = !currentStatus;
    const section = currentCheck.rows[0].section;
    
    // Update featured_products table
    await query(
      'UPDATE featured_products SET is_top_product = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    // Also update the main products table to keep them in sync
    const productCheck = await query(
      'SELECT product_id FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (productCheck.rows.length > 0) {
      const productId = productCheck.rows[0].product_id;
      await query(
        'UPDATE products SET is_top_product = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, productId]
      );
      
      // If disabling top product and it's in top_products section, remove from featured_products
      if (!newStatus && section === 'top_products') {
        await query(
          'DELETE FROM featured_products WHERE id = ?',
          [id]
        );
      }
    }
    
    res.json({
      success: true,
      message: `Top product status ${newStatus ? 'enabled' : 'disabled'} successfully`,
      featured_product: {
        id: parseInt(id),
        is_top_product: newStatus
      }
    });
  } catch (error) {
    console.error('Toggle top product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle bestseller status in featured_products table
const toggleBestsellerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const currentCheck = await query(
      'SELECT id, is_bestseller, section FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (currentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    const currentStatus = currentCheck.rows[0].is_bestseller;
    const newStatus = !currentStatus;
    const section = currentCheck.rows[0].section;
    
    // Update featured_products table
    await query(
      'UPDATE featured_products SET is_bestseller = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    // Also update the main products table to keep them in sync
    const productCheck = await query(
      'SELECT product_id FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (productCheck.rows.length > 0) {
      const productId = productCheck.rows[0].product_id;
      await query(
        'UPDATE products SET is_bestseller = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, productId]
      );
      
      // If disabling bestseller and it's in bestsellers section, remove from featured_products
      if (!newStatus && section === 'bestsellers') {
        await query(
          'DELETE FROM featured_products WHERE id = ?',
          [id]
        );
      }
    }
    
    res.json({
      success: true,
      message: `Bestseller status ${newStatus ? 'enabled' : 'disabled'} successfully`,
      featured_product: {
        id: parseInt(id),
        is_bestseller: newStatus
      }
    });
  } catch (error) {
    console.error('Toggle bestseller status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle active status in featured_products table
const toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const currentCheck = await query(
      'SELECT id, is_active FROM featured_products WHERE id = ?',
      [id]
    );
    
    if (currentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured product not found'
      });
    }
    
    const currentStatus = currentCheck.rows[0].is_active;
    const newStatus = !currentStatus;
    
    // Update featured_products table
    await query(
      'UPDATE featured_products SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    res.json({
      success: true,
      message: `Active status ${newStatus ? 'enabled' : 'disabled'} successfully`,
      featured_product: {
        id: parseInt(id),
        is_active: newStatus
      }
    });
  } catch (error) {
    console.error('Toggle active status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getFeaturedProducts,
  getFeaturedProduct,
  createFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  getAvailableProducts,
  getSectionStats,
  toggleFeaturedProductStatus,
  reorderFeaturedProducts,
  toggleFeaturedStatus,
  toggleTopProductStatus,
  toggleBestsellerStatus,
  toggleActiveStatus
};