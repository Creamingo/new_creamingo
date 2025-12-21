const { query } = require('../config/db');

// Get all subcategories
const getSubcategories = async (req, res) => {
  try {
    const { category_id, is_active } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (category_id) {
      whereConditions.push(`sc.category_id = ?`);
      queryParams.push(category_id);
    }

    if (is_active !== undefined) {
      whereConditions.push(`sc.is_active = ?`);
      queryParams.push(is_active === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const subcategoriesQuery = `
      SELECT 
        sc.id,
        sc.name,
        sc.description,
        sc.image_url,
        sc.category_id,
        sc.is_active,
        sc.order_index,
        sc.created_at,
        sc.updated_at,
        c.name as category_name
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      ${whereClause}
      ORDER BY sc.order_index ASC, sc.created_at DESC
    `;

    const result = await query(subcategoriesQuery, queryParams);

    res.json({
      success: true,
      data: { subcategories: result.rows }
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single subcategory
const getSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        sc.*,
        c.name as category_name
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE sc.id = ?
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: { subcategory: result.rows[0] }
    });
  } catch (error) {
    console.error('Get subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, description, category_id, image_url, is_active = true, order_index = 0 } = req.body;

    // Verify category exists
    const categoryResult = await query(
      'SELECT id FROM categories WHERE id = ? AND is_active = 1',
      [category_id]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const result = await query(`
      INSERT INTO subcategories (name, description, category_id, image_url, is_active, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [name, description, category_id, image_url, is_active, order_index]);

    const subcategoryId = result.lastID;

    // Fetch the created subcategory
    const subcategoryResult = await query(`
      SELECT 
        sc.*,
        c.name as category_name
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE sc.id = ?
    `, [subcategoryId]);

    const subcategory = subcategoryResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: { subcategory }
    });
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update subcategory
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if subcategory exists
    const existingSubcategory = await query(
      'SELECT id FROM subcategories WHERE id = ?',
      [id]
    );

    if (existingSubcategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Verify category if provided
    if (updateData.category_id) {
      const categoryResult = await query(
        'SELECT id FROM categories WHERE id = ? AND is_active = 1',
        [updateData.category_id]
      );

      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    // Build update query dynamically
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

    updates.push('updated_at = datetime(\'now\')');
    values.push(id);

    const queryText = `
      UPDATE subcategories 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    await query(queryText, values);

    // Fetch the updated subcategory
    const subcategoryResult = await query(`
      SELECT 
        sc.*,
        c.name as category_name
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE sc.id = ?
    `, [id]);

    const subcategory = subcategoryResult.rows[0];

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: { subcategory }
    });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete subcategory
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if subcategory exists
    const existingSubcategory = await query(
      'SELECT id FROM subcategories WHERE id = ?',
      [id]
    );

    if (existingSubcategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Check if subcategory has products
    const productsCheck = await query(
      'SELECT COUNT(*) as count FROM products WHERE subcategory_id = ?',
      [id]
    );

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subcategory that has products. Consider deactivating it instead.'
      });
    }

    await query('DELETE FROM subcategories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update subcategory order (bulk update)
const updateSubcategoryOrder = async (req, res) => {
  try {
    const { subcategories } = req.body;
    
    if (!Array.isArray(subcategories)) {
      return res.status(400).json({
        success: false,
        message: 'Subcategories must be an array'
      });
    }

    // Update each subcategory's order_index
    for (const subcategory of subcategories) {
      if (subcategory.id && subcategory.order_index !== undefined) {
        await query(
          'UPDATE subcategories SET order_index = ?, updated_at = datetime(\'now\') WHERE id = ?',
          [subcategory.order_index, subcategory.id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Subcategory order updated successfully'
    });
  } catch (error) {
    console.error('Update subcategory order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  updateSubcategoryOrder
};
