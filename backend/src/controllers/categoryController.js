const { query } = require('../config/db');
const { mapUploadFields, applyUploadUrl, normalizeUploadUrl } = require('../utils/urlHelpers');

const mapSubcategory = (req, subcategory) => (
  mapUploadFields(req, subcategory, ['image_url'])
);

const mapCategory = (req, category) => {
  if (!category) return category;

  const mapped = mapUploadFields(req, category, ['image_url']);

  if (mapped.subcategories) {
    let subcategories = mapped.subcategories;
    if (typeof subcategories === 'string') {
      try {
        subcategories = JSON.parse(subcategories);
      } catch (error) {
        subcategories = [];
      }
    }
    if (Array.isArray(subcategories)) {
      mapped.subcategories = subcategories.map((sub) => mapSubcategory(req, sub));
    }
  }

  return mapped;
};

const categorySlugToIdMap = {
  'cakes-by-flavor': 19,
  'cakes-for-occasion': 20,
  'kids-cake-collection': 21,
  'kids-favorite': 21,
  'crowd-favorite-cakes': 22,
  'crowd-favorite': 22,
  'love-relationship-cakes': 23,
  'love-relationship': 23,
  'milestone-year-cakes': 24,
  'milestone-year': 24,
  'small-treats-desserts': 26,
  'small-treats': 26,
  'flowers': 27,
  'sweets-dry-fruits': 28
};

// Get all categories
const getCategories = async (req, res) => {
  try {
    const { is_active, include_subcategories } = req.query;

    let whereClause = '';
    let queryParams = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      whereClause = `WHERE c.is_active = ?`;
      queryParams.push(is_active === 'true');
    }

    const categoriesQuery = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.image_url,
        c.display_name,
        c.is_active,
        c.order_index,
        c.created_at,
        c.updated_at,
        ${include_subcategories === 'true' ? `
          COALESCE(
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', sc.id,
                'name', sc.name,
                'description', sc.description,
                'image_url', sc.image_url,
                'is_active', sc.is_active,
                'order_index', sc.order_index,
                'created_at', sc.created_at
              )
            ), 
            JSON_ARRAY()
          ) as subcategories
        ` : 'NULL as subcategories'}
      FROM categories c
      ${include_subcategories === 'true' ? 'LEFT JOIN subcategories sc ON c.id = sc.category_id' : ''}
      ${whereClause}
      ${include_subcategories === 'true' ? 'GROUP BY c.id' : ''}
      ORDER BY c.order_index ASC, c.created_at DESC
    `;

    const result = await query(categoriesQuery, queryParams);
    const categories = result.rows.map((category) => mapCategory(req, category));

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single category
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        c.*,
        COALESCE(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', sc.id,
              'name', sc.name,
              'description', sc.description,
              'image_url', sc.image_url,
              'is_active', sc.is_active,
              'order_index', sc.order_index,
              'created_at', sc.created_at
            )
          ), 
          JSON_ARRAY()
        ) as subcategories
      FROM categories c
      LEFT JOIN subcategories sc ON c.id = sc.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: { category: mapCategory(req, result.rows[0]) }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, description, image_url, display_name, is_active = true, order_index = 0 } = req.body;
    const normalizedImageUrl = normalizeUploadUrl(image_url);
    

    const result = await query(`
      INSERT INTO categories (name, description, image_url, display_name, is_active, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [name, description, normalizedImageUrl, display_name, is_active, order_index]);

    const categoryId = result.lastID;

    // Fetch the created category
    const categoryResult = await query(`
      SELECT * FROM categories WHERE id = ?
    `, [categoryId]);

    const category = mapCategory(req, categoryResult.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.image_url) {
      updateData.image_url = normalizeUploadUrl(updateData.image_url);
    }
    delete updateData.icon;
    delete updateData.icon_image_url;
    

    // Check if category exists
    const existingCategory = await query(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
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

    updates.push('updated_at = NOW()');
    values.push(id);

    const queryText = `
      UPDATE categories 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    await query(queryText, values);

    // Fetch the updated category
    const categoryResult = await query(`
      SELECT * FROM categories WHERE id = ?
    `, [id]);

    const category = mapCategory(req, categoryResult.rows[0]);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await query(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productsCheck = await query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that has products. Consider deactivating it instead.'
      });
    }

    // Check if category has subcategories
    const subcategoriesCheck = await query(
      'SELECT COUNT(*) as count FROM subcategories WHERE category_id = ?',
      [id]
    );

    if (parseInt(subcategoriesCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that has subcategories. Delete subcategories first.'
      });
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get cake flavor category with its subcategories
const getCakeFlavorCategory = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['cakes-by-flavor'];
    let categoryResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!categoryResult.rows || categoryResult.rows.length === 0) {
      // Fallback to legacy name lookup
      categoryResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Pick a Cake by Flavor']
      );
    }

    if (!categoryResult.rows || categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cake flavor category not found'
      });
    }

    const category = mapCategory(req, categoryResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [category.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category,
        subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching cake flavor category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cake flavor category',
      error: error.message
    });
  }
};

// Get occasion categories for "Cakes for Any Occasion" section
const getOccasionCategories = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['cakes-for-occasion'];
    let occasionCategoryResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!occasionCategoryResult.rows || occasionCategoryResult.rows.length === 0) {
      // Fallback to legacy name lookup
      occasionCategoryResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Cakes for Any Occasion']
      );
    }

    if (!occasionCategoryResult.rows || occasionCategoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cakes for Any Occasion category not found'
      });
    }

    const occasionCategory = mapCategory(req, occasionCategoryResult.rows[0]);

    // Get all subcategories for this category - similar to milestone-year-cakes
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index DESC, name ASC',
      [occasionCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: occasionCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching occasion categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching occasion categories',
      error: error.message
    });
  }
};

// Get Kid's Cake Collection category with its subcategories
const getKidsCakeCollection = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['kids-cake-collection'];
    let kidsCategoryResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!kidsCategoryResult.rows || kidsCategoryResult.rows.length === 0) {
      // Fallback to legacy name lookup
      kidsCategoryResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Kid\'s Cake Collection']
      );
    }

    if (!kidsCategoryResult.rows || kidsCategoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Kid\'s Cake Collection category not found'
      });
    }

    const kidsCategory = mapCategory(req, kidsCategoryResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [kidsCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: kidsCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching Kid\'s Cake Collection:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Kid\'s Cake Collection',
      error: error.message
    });
  }
};

// Get Crowd-Favorite Cakes category with its subcategories
const getCrowdFavoriteCakes = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['crowd-favorite-cakes'];
    let crowdFavoriteResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!crowdFavoriteResult.rows || crowdFavoriteResult.rows.length === 0) {
      // Fallback to legacy name lookup
      crowdFavoriteResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Crowd-Favorite Cakes']
      );
    }

    if (!crowdFavoriteResult.rows || crowdFavoriteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crowd-Favorite Cakes category not found'
      });
    }

    const crowdFavoriteCategory = mapCategory(req, crowdFavoriteResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [crowdFavoriteCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: crowdFavoriteCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching Crowd-Favorite Cakes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Crowd-Favorite Cakes',
      error: error.message
    });
  }
};

// Get Love and Relationship Cakes category with its subcategories
const getLoveAndRelationshipCakes = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['love-relationship-cakes'];
    let loveRelationshipResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!loveRelationshipResult.rows || loveRelationshipResult.rows.length === 0) {
      // Fallback to legacy name lookup
      loveRelationshipResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Love and Relationship Cakes']
      );
    }

    if (!loveRelationshipResult.rows || loveRelationshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Love and Relationship Cakes category not found'
      });
    }

    const loveRelationshipCategory = mapCategory(req, loveRelationshipResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [loveRelationshipCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: loveRelationshipCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching Love and Relationship Cakes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Love and Relationship Cakes',
      error: error.message
    });
  }
};

// Get Cakes for Every Milestone Year category with its subcategories
const getCakesForEveryMilestoneYear = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['milestone-year-cakes'];
    let milestoneResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!milestoneResult.rows || milestoneResult.rows.length === 0) {
      // Fallback to legacy name lookup
      milestoneResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Cakes for Every Milestone Year']
      );
    }

    if (!milestoneResult.rows || milestoneResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cakes for Every Milestone Year category not found'
      });
    }

    const milestoneCategory = mapCategory(req, milestoneResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [milestoneCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: milestoneCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching Cakes for Every Milestone Year:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Cakes for Every Milestone Year',
      error: error.message
    });
  }
};

// Get Flowers category with its subcategories
const getFlowers = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['flowers'];
    let flowersResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!flowersResult.rows || flowersResult.rows.length === 0) {
      // Fallback to legacy name lookup
      flowersResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Flowers']
      );
    }

    if (!flowersResult.rows || flowersResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Flowers category not found'
      });
    }

    const flowersCategory = mapCategory(req, flowersResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [flowersCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: flowersCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching Flowers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Flowers',
      error: error.message
    });
  }
};

// Get Sweets and Dry Fruits category with its subcategories
const getSweetsAndDryFruits = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['sweets-dry-fruits'];
    let sweetsResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!sweetsResult.rows || sweetsResult.rows.length === 0) {
      // Fallback to legacy name lookup
      sweetsResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Sweets and Dry Fruits']
      );
    }

    if (!sweetsResult.rows || sweetsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sweets and Dry Fruits category not found'
      });
    }

    const sweetsCategory = mapCategory(req, sweetsResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [sweetsCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: sweetsCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching Sweets and Dry Fruits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Sweets and Dry Fruits',
      error: error.message
    });
  }
};

// Get subcategories by category slug
const getSubcategoriesByCategorySlug = async (req, res) => {
  try {
    const { categorySlug } = req.params;

    // Map slugs directly to category IDs
    // Get the category ID from the slug
    const categoryId = categorySlugToIdMap[categorySlug];

    if (!categoryId) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // First, find the category by ID
    const categoryResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!categoryResult.rows || categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = mapCategory(req, categoryResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [categoryId]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category,
        subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching subcategories by category slug:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
};

// Get specific subcategory by category and subcategory slugs
const getSubcategoryBySlugs = async (req, res) => {
  try {
    const { categorySlug, subCategorySlug } = req.params;
    
    console.log('getSubcategoryBySlugs called with:', { categorySlug, subCategorySlug });

    // Map slugs directly to category IDs
    // Get the category ID from the slug
    const categoryId = categorySlugToIdMap[categorySlug];

    if (!categoryId) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // First, find the category by ID
    const categoryResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!categoryResult.rows || categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = mapCategory(req, categoryResult.rows[0]);

    // Find the specific subcategory by matching the slug
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [categoryId]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));
    
    // Find the subcategory that matches the slug
    // First try to match using the slug column if it exists, otherwise generate from name
    const subcategory = subcategories.find(sub => {
      // If slug column exists and is not null, use it
      if (sub.slug && sub.slug.trim() !== '') {
        return sub.slug.toLowerCase() === subCategorySlug.toLowerCase();
      }
      // Otherwise, generate slug from name
      const subSlug = sub.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/'/g, '');
      return subSlug === subCategorySlug.toLowerCase();
    });

    if (!subcategory) {
      // Return available subcategories for debugging
      const availableSlugs = subcategories.map(sub => {
        if (sub.slug && sub.slug.trim() !== '') {
          return sub.slug;
        }
        return sub.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and').replace(/'/g, '');
      });
      
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found',
        requestedSlug: subCategorySlug,
        availableSlugs: availableSlugs,
        availableSubcategories: subcategories.map(sub => ({ id: sub.id, name: sub.name, slug: sub.slug }))
      });
    }

    res.json({
      success: true,
      data: {
        category,
        subcategory
      }
    });
  } catch (error) {
    console.error('Error fetching subcategory by slugs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategory',
      error: error.message
    });
  }
};

// Update category order (bulk update)
const updateCategoryOrder = async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array'
      });
    }

    // Update each category's order_index
    for (const category of categories) {
      if (category.id && category.order_index !== undefined) {
        await query(
          'UPDATE categories SET order_index = ?, updated_at = NOW() WHERE id = ?',
          [category.order_index, category.id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Category order updated successfully'
    });
  } catch (error) {
    console.error('Update category order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Small Treats Desserts category with its subcategories
const getSmallTreatsDesserts = async (req, res) => {
  try {
    const categoryId = categorySlugToIdMap['small-treats-desserts'];
    let treatsResult = await query(
      'SELECT * FROM categories WHERE id = ? AND is_active = 1',
      [categoryId]
    );

    if (!treatsResult.rows || treatsResult.rows.length === 0) {
      // Fallback to legacy name lookup
      treatsResult = await query(
        'SELECT * FROM categories WHERE name = ? AND is_active = 1',
        ['Small Treats Desserts']
      );
    }

    if (!treatsResult.rows || treatsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Small Treats Desserts category not found'
      });
    }

    const treatsCategory = mapCategory(req, treatsResult.rows[0]);

    // Get all subcategories for this category
    const subcategoriesResult = await query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = 1 ORDER BY order_index ASC, name ASC',
      [treatsCategory.id]
    );

    const subcategories = (subcategoriesResult.rows || []).map((sub) => mapSubcategory(req, sub));

    res.json({
      success: true,
      data: {
        category: treatsCategory,
        subcategories: subcategories
      }
    });
  } catch (error) {
    console.error('Error fetching Small Treats Desserts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Small Treats Desserts',
      error: error.message
    });
  }
};

// Get all main categories for Most Loved Categories section
const getAllMainCategories = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        image_url,
        display_name,
        is_active,
        order_index,
        created_at,
        updated_at
      FROM categories 
      WHERE is_active = 1 
      ORDER BY order_index ASC, created_at ASC
    `);

    res.json({
      success: true,
      data: { categories: result.rows.map((category) => mapCategory(req, category)) }
    });
  } catch (error) {
    console.error('Get all main categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  getCakeFlavorCategory,
  getOccasionCategories,
  getKidsCakeCollection,
  getCrowdFavoriteCakes,
  getLoveAndRelationshipCakes,
  getCakesForEveryMilestoneYear,
  getFlowers,
  getSweetsAndDryFruits,
  getSmallTreatsDesserts,
  getSubcategoriesByCategorySlug,
  getSubcategoryBySlugs,
  getAllMainCategories
};
