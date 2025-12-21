const { query } = require('../config/db');

// Get all add-on products with category info
const getAllAddOnProducts = async (req, res) => {
  try {
    const { category_id } = req.query;
    
    let sql = `
      SELECT p.*, c.name as category_name 
      FROM add_on_products p 
      JOIN add_on_categories c ON p.category_id = c.id 
      WHERE p.is_active = 1 AND c.is_active = 1
    `;
    let params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    sql += ' ORDER BY c.display_order ASC, p.display_order ASC';

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      data: {
        products: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching add-on products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on products'
    });
  }
};

// Get add-on products by category
const getAddOnProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const result = await query(`
      SELECT p.*, c.name as category_name 
      FROM add_on_products p 
      JOIN add_on_categories c ON p.category_id = c.id 
      WHERE p.category_id = ? AND p.is_active = 1 AND c.is_active = 1
      ORDER BY p.display_order ASC
    `, [categoryId]);

    res.status(200).json({
      success: true,
      data: {
        products: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching add-on products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on products'
    });
  }
};

// Get add-on product by ID
const getAddOnProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT p.*, c.name as category_name 
      FROM add_on_products p 
      JOIN add_on_categories c ON p.category_id = c.id 
      WHERE p.id = ? AND p.is_active = 1 AND c.is_active = 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Add-on product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching add-on product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on product'
    });
  }
};

// Create new add-on product
const createAddOnProduct = async (req, res) => {
  try {
    const { category_id, name, description, price, discount_percentage, discounted_price, image_url, display_order } = req.body;

    if (!category_id || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Category ID, name, and price are required'
      });
    }

    // Check if category exists
    const categoryExists = await query(`
      SELECT id FROM add_on_categories 
      WHERE id = ? AND is_active = 1
    `, [category_id]);

    if (categoryExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Check if product name already exists in the same category
    const existingProduct = await query(`
      SELECT id FROM add_on_products 
      WHERE name = ? AND category_id = ? AND is_active = 1
    `, [name, category_id]);

    if (existingProduct.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Product name already exists in this category'
      });
    }

    const result = await query(`
      INSERT INTO add_on_products (category_id, name, description, price, discount_percentage, discounted_price, image_url, display_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [category_id, name, description, price, discount_percentage || 0, discounted_price || price, image_url, display_order || 0]);

    const newProduct = await query(`
      SELECT p.*, c.name as category_name 
      FROM add_on_products p 
      JOIN add_on_categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      data: {
        product: newProduct.rows[0]
      }
    });
  } catch (error) {
    console.error('Error creating add-on product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create add-on product'
    });
  }
};

// Update add-on product
const updateAddOnProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, discount_percentage, discounted_price, image_url, display_order, is_active } = req.body;

    // Check if product exists
    const existingProduct = await query(`
      SELECT * FROM add_on_products 
      WHERE id = ?
    `, [id]);

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Add-on product not found'
      });
    }

    // Check if new category exists (if provided)
    if (category_id && category_id !== existingProduct.rows[0].category_id) {
      const categoryExists = await query(`
        SELECT id FROM add_on_categories 
        WHERE id = ? AND is_active = 1
      `, [category_id]);

      if (categoryExists.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    // Check if new name conflicts with existing products in the same category
    if (name && name !== existingProduct.rows[0].name) {
      const targetCategoryId = category_id || existingProduct.rows[0].category_id;
      const nameConflict = await query(`
        SELECT id FROM add_on_products 
        WHERE name = ? AND category_id = ? AND id != ? AND is_active = 1
      `, [name, targetCategoryId, id]);

      if (nameConflict.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Product name already exists in this category'
        });
      }
    }

    await query(`
      UPDATE add_on_products 
      SET category_id = COALESCE(?, category_id),
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          discount_percentage = COALESCE(?, discount_percentage),
          discounted_price = COALESCE(?, discounted_price),
          image_url = COALESCE(?, image_url),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [category_id, name, description, price, discount_percentage, discounted_price, image_url, display_order, is_active, id]);

    const updatedProduct = await query(`
      SELECT p.*, c.name as category_name 
      FROM add_on_products p 
      JOIN add_on_categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      data: {
        product: updatedProduct.rows[0]
      }
    });
  } catch (error) {
    console.error('Error updating add-on product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update add-on product'
    });
  }
};

// Delete add-on product (soft delete)
const deleteAddOnProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await query(`
      SELECT * FROM add_on_products 
      WHERE id = ? AND is_active = 1
    `, [id]);

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Add-on product not found'
      });
    }

    // Check if product is in any combo selections
    const comboCount = await query(`
      SELECT COUNT(*) as count FROM combo_selections 
      WHERE add_on_product_id = ?
    `, [id]);

    if (comboCount.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product that is part of existing combo selections'
      });
    }

    // Soft delete
    await query(`
      UPDATE add_on_products 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Add-on product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting add-on product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete add-on product'
    });
  }
};

module.exports = {
  getAllAddOnProducts,
  getAddOnProductsByCategory,
  getAddOnProductById,
  createAddOnProduct,
  updateAddOnProduct,
  deleteAddOnProduct
};
