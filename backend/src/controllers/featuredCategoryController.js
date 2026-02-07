const { query } = require('../config/db');
const { applyUploadUrl } = require('../utils/urlHelpers');

const mapFeaturedCategory = (req, item) => ({
  ...item,
  category_image: applyUploadUrl(req, item.category_image),
  subcategory_image: applyUploadUrl(req, item.subcategory_image)
});

// Get all featured categories with their linked category/subcategory data
const getFeaturedCategories = async (req, res) => {
  try {
    const { device_type } = req.query; // Optional filter by device type
    
    let whereClause = '';
    let params = [];
    
    if (device_type) {
      if (device_type === 'desktop') {
        whereClause = 'WHERE fc.show_on_desktop = 1';
      } else if (device_type === 'mobile') {
        whereClause = 'WHERE fc.show_on_mobile = 1';
      }
    }
    
    const sql = `
      SELECT 
        fc.id,
        fc.item_type,
        fc.category_id,
        fc.subcategory_id,
        fc.display_order,
        fc.is_active,
        fc.show_on_desktop,
        fc.show_on_mobile,
        fc.created_at,
        fc.updated_at,
        c.name as category_name,
        c.image_url as category_image,
        c.description as category_description,
        sc.name as subcategory_name,
        sc.image_url as subcategory_image,
        sc.description as subcategory_description,
        parent_cat.name as parent_category_name
      FROM featured_categories fc
      LEFT JOIN categories c ON fc.category_id = c.id
      LEFT JOIN subcategories sc ON fc.subcategory_id = sc.id
      LEFT JOIN categories parent_cat ON sc.category_id = parent_cat.id
      ${whereClause}
      ORDER BY fc.display_order ASC, fc.created_at ASC
    `;
    
    const result = await query(sql, params);
    
    const items = result.rows.map((item) => mapFeaturedCategory(req, item));

    res.status(200).json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured categories',
      error: error.message
    });
  }
};

// Get a single featured category
const getFeaturedCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        fc.id,
        fc.item_type,
        fc.category_id,
        fc.subcategory_id,
        fc.display_order,
        fc.is_active,
        fc.show_on_desktop,
        fc.show_on_mobile,
        fc.created_at,
        fc.updated_at,
        c.name as category_name,
        c.image_url as category_image,
        c.description as category_description,
        sc.name as subcategory_name,
        sc.image_url as subcategory_image,
        sc.description as subcategory_description,
        parent_cat.name as parent_category_name
      FROM featured_categories fc
      LEFT JOIN categories c ON fc.category_id = c.id
      LEFT JOIN subcategories sc ON fc.subcategory_id = sc.id
      LEFT JOIN categories parent_cat ON sc.category_id = parent_cat.id
      WHERE fc.id = ?
    `;
    
    const result = await query(sql, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: mapFeaturedCategory(req, result.rows[0])
    });
  } catch (error) {
    console.error('Error fetching featured category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured category',
      error: error.message
    });
  }
};

// Add a category or subcategory to featured list
const createFeaturedCategory = async (req, res) => {
  try {
    const { 
      item_type, 
      category_id, 
      subcategory_id, 
      display_order = 0, 
      show_on_desktop = true, 
      show_on_mobile = true 
    } = req.body;
    
    // Validate input
    if (!item_type || !['category', 'subcategory'].includes(item_type)) {
      return res.status(400).json({
        success: false,
        message: 'Item type must be either "category" or "subcategory"'
      });
    }
    
    if (item_type === 'category' && !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required for category type'
      });
    }
    
    if (item_type === 'subcategory' && !subcategory_id) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory ID is required for subcategory type'
      });
    }
    
    // Check if item exists and get details
    let itemCheck, itemName;
    if (item_type === 'category') {
      itemCheck = await query(
        'SELECT id, name FROM categories WHERE id = ?',
        [category_id]
      );
      itemName = 'Category';
    } else {
      itemCheck = await query(
        'SELECT id, name FROM subcategories WHERE id = ?',
        [subcategory_id]
      );
      itemName = 'Subcategory';
    }
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `${itemName} not found`
      });
    }
    
    // Check if item is already featured
    let existingCheck;
    if (item_type === 'category') {
      existingCheck = await query(
        'SELECT id FROM featured_categories WHERE category_id = ? AND item_type = ?',
        [category_id, item_type]
      );
    } else {
      existingCheck = await query(
        'SELECT id FROM featured_categories WHERE subcategory_id = ? AND item_type = ?',
        [subcategory_id, item_type]
      );
    }
    
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `${itemName} is already featured`
      });
    }
    
    // Check maximum limits for each device type
    const desktopCountResult = await query(
      'SELECT COUNT(*) as count FROM featured_categories WHERE is_active = 1 AND show_on_desktop = 1'
    );
    const mobileCountResult = await query(
      'SELECT COUNT(*) as count FROM featured_categories WHERE is_active = 1 AND show_on_mobile = 1'
    );
    
    const desktopCount = parseInt(desktopCountResult.rows[0].count);
    const mobileCount = parseInt(mobileCountResult.rows[0].count);
    
    if (show_on_desktop && desktopCount >= 7) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 7 featured items allowed for desktop view'
      });
    }
    
    if (show_on_mobile && mobileCount >= 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 featured items allowed for mobile view'
      });
    }
    
    // Insert new featured item
    const insertSql = `
      INSERT INTO featured_categories (
        item_type, 
        category_id, 
        subcategory_id, 
        display_order, 
        is_active, 
        show_on_desktop, 
        show_on_mobile, 
        created_at, 
        updated_at
      )
      VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW())
    `;
    
    const insertResult = await query(insertSql, [
      item_type, 
      category_id || null, 
      subcategory_id || null, 
      display_order, 
      show_on_desktop ? 1 : 0, 
      show_on_mobile ? 1 : 0
    ]);
    
    // Fetch the created featured item with details
    const fetchSql = `
      SELECT 
        fc.id,
        fc.item_type,
        fc.category_id,
        fc.subcategory_id,
        fc.display_order,
        fc.is_active,
        fc.show_on_desktop,
        fc.show_on_mobile,
        fc.created_at,
        fc.updated_at,
        c.name as category_name,
        c.image_url as category_image,
        c.description as category_description,
        sc.name as subcategory_name,
        sc.image_url as subcategory_image,
        sc.description as subcategory_description,
        parent_cat.name as parent_category_name
      FROM featured_categories fc
      LEFT JOIN categories c ON fc.category_id = c.id
      LEFT JOIN subcategories sc ON fc.subcategory_id = sc.id
      LEFT JOIN categories parent_cat ON sc.category_id = parent_cat.id
      WHERE fc.id = ?
    `;
    
    const newFeaturedItem = await query(fetchSql, [insertResult.lastID]);
    
    res.status(201).json({
      success: true,
      message: `${itemName} added to featured list successfully`,
      data: mapFeaturedCategory(req, newFeaturedItem.rows[0])
    });
  } catch (error) {
    console.error('Error creating featured item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to featured list',
      error: error.message
    });
  }
};

// Update a featured category
const updateFeaturedCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { display_order, is_active, show_on_desktop, show_on_mobile } = req.body;
    
    // Check if featured category exists
    const existingCheck = await query(
      'SELECT id FROM featured_categories WHERE id = ?',
      [id]
    );
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured category not found'
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
    
    if (show_on_desktop !== undefined) {
      updateFields.push('show_on_desktop = ?');
      updateValues.push(show_on_desktop ? 1 : 0);
    }
    
    if (show_on_mobile !== undefined) {
      updateFields.push('show_on_mobile = ?');
      updateValues.push(show_on_mobile ? 1 : 0);
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
      UPDATE featured_categories 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await query(updateSql, updateValues);
    
    // Fetch updated featured category
    const fetchSql = `
      SELECT 
        fc.id,
        fc.item_type,
        fc.category_id,
        fc.subcategory_id,
        fc.display_order,
        fc.is_active,
        fc.show_on_desktop,
        fc.show_on_mobile,
        fc.created_at,
        fc.updated_at,
        c.name as category_name,
        c.image_url as category_image,
        c.description as category_description,
        sc.name as subcategory_name,
        sc.image_url as subcategory_image,
        sc.description as subcategory_description,
        parent_cat.name as parent_category_name
      FROM featured_categories fc
      LEFT JOIN categories c ON fc.category_id = c.id
      LEFT JOIN subcategories sc ON fc.subcategory_id = sc.id
      LEFT JOIN categories parent_cat ON sc.category_id = parent_cat.id
      WHERE fc.id = ?
    `;
    
    const updatedCategory = await query(fetchSql, [id]);
    
    res.status(200).json({
      success: true,
      message: 'Featured category updated successfully',
      data: mapFeaturedCategory(req, updatedCategory.rows[0])
    });
  } catch (error) {
    console.error('Error updating featured category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured category',
      error: error.message
    });
  }
};

// Remove a category from featured list
const deleteFeaturedCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if featured category exists
    const existingCheck = await query(
      'SELECT id FROM featured_categories WHERE id = ?',
      [id]
    );
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured category not found'
      });
    }
    
    // Delete the featured category
    await query('DELETE FROM featured_categories WHERE id = ?', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Category removed from featured list successfully'
    });
  } catch (error) {
    console.error('Error deleting featured category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove category from featured list',
      error: error.message
    });
  }
};

// Get available categories and subcategories that can be featured
const getAvailableCategories = async (req, res) => {
  try {
    const { item_type } = req.query; // Optional filter by item type
    
    let sql, result;
    
    if (item_type === 'subcategory') {
      // Get available subcategories
      sql = `
        SELECT 
          sc.id,
          sc.name,
          sc.description,
          sc.image_url,
          sc.is_active,
          sc.category_id,
          c.name as parent_category_name,
          'subcategory' as item_type,
          CASE WHEN fc.id IS NOT NULL THEN 1 ELSE 0 END as is_featured
        FROM subcategories sc
        LEFT JOIN categories c ON sc.category_id = c.id
        LEFT JOIN featured_categories fc ON sc.id = fc.subcategory_id AND fc.item_type = 'subcategory'
        WHERE sc.is_active = 1
        ORDER BY c.name ASC, sc.name ASC
      `;
    } else if (item_type === 'category') {
      // Get available categories
      sql = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.image_url,
          c.is_active,
          NULL as category_id,
          NULL as parent_category_name,
          'category' as item_type,
          CASE WHEN fc.id IS NOT NULL THEN 1 ELSE 0 END as is_featured
        FROM categories c
        LEFT JOIN featured_categories fc ON c.id = fc.category_id AND fc.item_type = 'category'
        WHERE c.is_active = 1
        ORDER BY c.name ASC
      `;
    } else {
      // Get both categories and subcategories
      const categoriesSql = `
        SELECT 
          c.id,
          c.name,
          c.description,
          c.image_url,
          c.is_active,
          NULL as category_id,
          NULL as parent_category_name,
          'category' as item_type,
          CASE WHEN fc.id IS NOT NULL THEN 1 ELSE 0 END as is_featured
        FROM categories c
        LEFT JOIN featured_categories fc ON c.id = fc.category_id AND fc.item_type = 'category'
        WHERE c.is_active = 1
      `;
      
      const subcategoriesSql = `
        SELECT 
          sc.id,
          sc.name,
          sc.description,
          sc.image_url,
          sc.is_active,
          sc.category_id,
          c.name as parent_category_name,
          'subcategory' as item_type,
          CASE WHEN fc.id IS NOT NULL THEN 1 ELSE 0 END as is_featured
        FROM subcategories sc
        LEFT JOIN categories c ON sc.category_id = c.id
        LEFT JOIN featured_categories fc ON sc.id = fc.subcategory_id AND fc.item_type = 'subcategory'
        WHERE sc.is_active = 1
      `;
      
      const [categoriesResult, subcategoriesResult] = await Promise.all([
        query(categoriesSql),
        query(subcategoriesSql)
      ]);
      
      result = {
        rows: [...categoriesResult.rows, ...subcategoriesResult.rows]
      };
    }
    
    if (!result) {
      result = await query(sql);
    }
    
    // Filter out already featured items
    const availableItems = result.rows
      .filter(item => !item.is_featured)
      .map((item) => ({
        ...item,
        image_url: applyUploadUrl(req, item.image_url)
      }));
    
    res.status(200).json({
      success: true,
      data: availableItems,
      count: availableItems.length
    });
  } catch (error) {
    console.error('Error fetching available categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available categories',
      error: error.message
    });
  }
};

// Toggle featured category status
const toggleFeaturedCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if featured category exists
    const existingCheck = await query(
      'SELECT id, is_active FROM featured_categories WHERE id = ?',
      [id]
    );
    
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Featured category not found'
      });
    }
    
    const currentStatus = existingCheck.rows[0].is_active;
    const newStatus = currentStatus ? 0 : 1;
    
    // Update status
    await query(
      'UPDATE featured_categories SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );
    
    res.status(200).json({
      success: true,
      message: `Featured category ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: parseInt(id),
        is_active: newStatus === 1
      }
    });
  } catch (error) {
    console.error('Error toggling featured category status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle featured category status',
      error: error.message
    });
  }
};

// Reorder featured categories
const reorderFeaturedCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array'
      });
    }
    
    // Update display order for each category
    for (const category of categories) {
      if (category.id && category.display_order !== undefined) {
        await query(
          'UPDATE featured_categories SET display_order = ?, updated_at = NOW() WHERE id = ?',
          [category.display_order, category.id]
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Featured categories reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering featured categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder featured categories',
      error: error.message
    });
  }
};

module.exports = {
  getFeaturedCategories,
  getFeaturedCategory,
  createFeaturedCategory,
  updateFeaturedCategory,
  deleteFeaturedCategory,
  getAvailableCategories,
  toggleFeaturedCategoryStatus,
  reorderFeaturedCategories
};