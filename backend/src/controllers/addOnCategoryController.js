const { query } = require('../config/db');

// Get all add-on categories
const getAllAddOnCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM add_on_categories 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `);

    res.status(200).json({
      success: true,
      data: {
        categories: result.rows
      }
    });
  } catch (error) {
    console.error('Error fetching add-on categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on categories'
    });
  }
};

// Get add-on category by ID
const getAddOnCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT * FROM add_on_categories 
      WHERE id = ? AND is_active = 1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Add-on category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        category: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching add-on category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch add-on category'
    });
  }
};

// Create new add-on category
const createAddOnCategory = async (req, res) => {
  try {
    const { name, display_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category name already exists
    const existingCategory = await query(`
      SELECT id FROM add_on_categories 
      WHERE name = ? AND is_active = 1
    `, [name]);

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    const result = await query(`
      INSERT INTO add_on_categories (name, display_order) 
      VALUES (?, ?)
    `, [name, display_order || 0]);

    const newCategory = await query(`
      SELECT * FROM add_on_categories 
      WHERE id = ?
    `, [result.lastID || result.insertId]);

    res.status(201).json({
      success: true,
      data: {
        category: newCategory.rows[0]
      }
    });
  } catch (error) {
    console.error('Error creating add-on category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create add-on category'
    });
  }
};

// Update add-on category
const updateAddOnCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order, is_active } = req.body;
    const safeDisplayOrder = typeof display_order === 'undefined' ? null : display_order;
    const safeIsActive = typeof is_active === 'undefined' ? null : is_active;

    // Check if category exists
    const existingCategory = await query(`
      SELECT * FROM add_on_categories 
      WHERE id = ?
    `, [id]);

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Add-on category not found'
      });
    }

    // Check if new name conflicts with existing categories
    if (name && name !== existingCategory.rows[0].name) {
      const nameConflict = await query(`
        SELECT id FROM add_on_categories 
        WHERE name = ? AND id != ? AND is_active = 1
      `, [name, id]);

      if (nameConflict.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }

    await query(`
      UPDATE add_on_categories 
      SET name = COALESCE(?, name),
          display_order = COALESCE(?, display_order),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, safeDisplayOrder, safeIsActive, id]);

    const updatedCategory = await query(`
      SELECT * FROM add_on_categories 
      WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      data: {
        category: updatedCategory.rows[0]
      }
    });
  } catch (error) {
    console.error('Error updating add-on category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update add-on category'
    });
  }
};

// Delete add-on category (soft delete)
const deleteAddOnCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await query(`
      SELECT * FROM add_on_categories 
      WHERE id = ? AND is_active = 1
    `, [id]);

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Add-on category not found'
      });
    }

    // Check if category has products
    const productsCount = await query(`
      SELECT COUNT(*) as count FROM add_on_products 
      WHERE category_id = ? AND is_active = 1
    `, [id]);

    if (productsCount.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with active products. Please deactivate or delete products first.'
      });
    }

    // Soft delete
    await query(`
      UPDATE add_on_categories 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Add-on category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting add-on category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete add-on category'
    });
  }
};

module.exports = {
  getAllAddOnCategories,
  getAddOnCategoryById,
  createAddOnCategory,
  updateAddOnCategory,
  deleteAddOnCategory
};
