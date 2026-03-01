const { query } = require('../config/db');
const { normalizeUploadUrl, buildPublicUrlWithBase } = require('./urlHelpers');

const mapImageUrl = (baseUrl, value) => (
  buildPublicUrlWithBase(baseUrl, normalizeUploadUrl(value))
);

const mapCategory = (baseUrl, category) => ({
  ...category,
  image_url: mapImageUrl(baseUrl, category.image_url)
});

const mapSubcategory = (baseUrl, subcategory) => ({
  ...subcategory,
  image_url: mapImageUrl(baseUrl, subcategory.image_url)
});

/**
 * Helper functions for managing product-category relationships
 */

/**
 * Assign product to multiple categories
 * @param {number} productId - Product ID
 * @param {Array} categoryIds - Array of category IDs
 * @param {number} primaryCategoryId - Primary category ID (optional)
 */
const assignProductToCategories = async (productId, categoryIds, primaryCategoryId = null) => {
  if (!categoryIds || categoryIds.length === 0) return;

  // Clear existing category assignments
  await query('DELETE FROM product_categories WHERE product_id = ?', [productId]);

  // Insert new category assignments
  for (let i = 0; i < categoryIds.length; i++) {
    const categoryId = categoryIds[i];
    const isPrimary = primaryCategoryId ? categoryId === primaryCategoryId : (i === 0);
    
    await query(`
      INSERT INTO product_categories (product_id, category_id, is_primary, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [productId, categoryId, isPrimary, i + 1]);
  }
};

/**
 * Assign product to multiple subcategories
 * @param {number} productId - Product ID
 * @param {Array} subcategoryIds - Array of subcategory IDs
 * @param {number} primarySubcategoryId - Primary subcategory ID (optional)
 */
const assignProductToSubcategories = async (productId, subcategoryIds, primarySubcategoryId = null) => {
  if (!subcategoryIds || subcategoryIds.length === 0) return;

  // Clear existing subcategory assignments
  await query('DELETE FROM product_subcategories WHERE product_id = ?', [productId]);

  // Insert new subcategory assignments
  for (let i = 0; i < subcategoryIds.length; i++) {
    const subcategoryId = subcategoryIds[i];
    const isPrimary = primarySubcategoryId ? subcategoryId === primarySubcategoryId : (i === 0);
    
    await query(`
      INSERT INTO product_subcategories (product_id, subcategory_id, is_primary, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [productId, subcategoryId, isPrimary, i + 1]);
  }
};

/**
 * Assign product to multiple flavor subcategories
 * @param {number} productId - Product ID
 * @param {Array} flavorIds - Array of flavor subcategory IDs
 * @param {number} primaryFlavorId - Primary flavor ID (optional)
 */
const assignProductToFlavors = async (productId, flavorIds, primaryFlavorId = null) => {
  if (!flavorIds || flavorIds.length === 0) return;

  // Clear existing flavor assignments
  await query('DELETE FROM product_flavors WHERE product_id = ?', [productId]);

  // Insert new flavor assignments
  for (let i = 0; i < flavorIds.length; i++) {
    const flavorId = flavorIds[i];
    const isPrimary = primaryFlavorId ? flavorId === primaryFlavorId : (i === 0);

    await query(`
      INSERT INTO product_flavors (product_id, subcategory_id, is_primary, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [productId, flavorId, isPrimary, i + 1]);
  }
};

/**
 * Get product with all its categories and subcategories
 * @param {number} productId - Product ID
 * @returns {Object} Product with categories and subcategories arrays
 */
const getProductWithCategories = async (productId, baseUrl = '') => {
  // Get product basic info
  const productResult = await query(`
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.description,
      p.short_description,
      p.base_price,
      p.base_weight,
      p.discount_percent,
      p.discounted_price,
      p.image_url,
      p.is_active,
      p.is_featured,
      p.is_top_product,
      p.is_bestseller,
      p.is_new_launch,
      p.is_trending,
      p.is_eggless,
      p.shape,
      p.country_of_origin,
      p.preparation_time,
      p.preparation_time_hours,
      p.serving_size,
      p.serving_size_description,
      p.care_storage,
      p.delivery_guidelines,
      p.rating,
      p.review_count,
      p.rating_count,
      p.meta_title,
      p.meta_description,
      p.tags,
      p.created_at,
      p.updated_at
    FROM products p
    WHERE p.id = ?
  `, [productId]);

  if (productResult.rows.length === 0) {
    return null;
  }

  const product = productResult.rows[0];

  // Get categories
  const categoriesResult = await query(`
    SELECT 
      c.id,
      c.name,
      c.description,
      c.image_url,
      pc.is_primary,
      pc.display_order
    FROM product_categories pc
    JOIN categories c ON pc.category_id = c.id
    WHERE pc.product_id = ?
    ORDER BY pc.display_order ASC, pc.is_primary DESC
  `, [productId]);

  // Get subcategories
  const subcategoriesResult = await query(`
    SELECT 
      sc.id,
      sc.name,
      sc.description,
      sc.image_url,
      sc.category_id,
      psc.is_primary,
      psc.display_order
    FROM product_subcategories psc
    JOIN subcategories sc ON psc.subcategory_id = sc.id
    WHERE psc.product_id = ?
    ORDER BY psc.display_order ASC, psc.is_primary DESC
  `, [productId]);

  // Get flavors
  const flavorsResult = await query(`
    SELECT
      sc.id,
      sc.name,
      sc.description,
      sc.image_url,
      sc.category_id,
      pf.is_primary,
      pf.display_order
    FROM product_flavors pf
    JOIN subcategories sc ON pf.subcategory_id = sc.id
    WHERE pf.product_id = ?
    ORDER BY pf.display_order ASC, pf.is_primary DESC
  `, [productId]);

  // Get variants
  const variantsResult = await query(`
    SELECT 
      id,
      name,
      weight,
      price,
      discount_percent,
      discounted_price,
      stock_quantity,
      is_available,
      created_at,
      updated_at
    FROM product_variants 
    WHERE product_id = ?
    ORDER BY created_at ASC
  `, [productId]);

  // Get gallery images
  const galleryResult = await query(`
    SELECT image_url, display_order
    FROM product_gallery_images 
    WHERE product_id = ?
    ORDER BY display_order ASC
  `, [productId]);

  // Calculate discounted price if it's null
  product.discounted_price = product.discounted_price || 
    (product.discount_percent > 0 ? 
      product.base_price * (1 - product.discount_percent / 100) : 
      product.base_price);

  // Calculate discounted price for each variant if it's null
  variantsResult.rows.forEach(variant => {
    variant.discounted_price = variant.discounted_price || 
      (variant.discount_percent > 0 ? 
        variant.price * (1 - variant.discount_percent / 100) : 
        variant.price);
  });

  return {
    ...product,
    image_url: mapImageUrl(baseUrl, product.image_url),
    categories: (categoriesResult.rows || []).map((category) => mapCategory(baseUrl, category)),
    subcategories: (subcategoriesResult.rows || []).map((subcategory) => mapSubcategory(baseUrl, subcategory)),
    flavors: (flavorsResult.rows || []).map((flavor) => mapSubcategory(baseUrl, flavor)),
    variants: variantsResult.rows || [],
    gallery_images: (galleryResult.rows.map(row => row.image_url) || []).map((url) => mapImageUrl(baseUrl, url))
  };
};

/**
 * Get products with their categories and subcategories
 * @param {Array} productIds - Array of product IDs
 * @returns {Array} Array of products with categories and subcategories
 */
const getProductsWithCategories = async (productIds, baseUrl = '') => {
  if (!productIds || productIds.length === 0) return [];

  const placeholders = productIds.map(() => '?').join(',');
  
  // Get products basic info
  const productsResult = await query(`
    SELECT 
      p.id,
      p.name,
      p.slug,
      p.description,
      p.short_description,
      p.base_price,
      p.base_weight,
      p.discount_percent,
      p.discounted_price,
      p.image_url,
      p.is_active,
      p.is_featured,
      p.is_top_product,
      p.is_bestseller,
      p.is_new_launch,
      p.is_trending,
      p.is_eggless,
      p.shape,
      p.country_of_origin,
      p.preparation_time,
      p.preparation_time_hours,
      p.serving_size,
      p.serving_size_description,
      p.care_storage,
      p.delivery_guidelines,
      p.rating,
      p.review_count,
      p.rating_count,
      p.meta_title,
      p.meta_description,
      p.tags,
      p.created_at,
      p.updated_at
    FROM products p
    WHERE p.id IN (${placeholders})
  `, productIds);

  const products = productsResult.rows;

  // Get all categories for these products
  const categoriesResult = await query(`
    SELECT 
      pc.product_id,
      c.id,
      c.name,
      c.description,
      c.image_url,
      pc.is_primary,
      pc.display_order
    FROM product_categories pc
    JOIN categories c ON pc.category_id = c.id
    WHERE pc.product_id IN (${placeholders})
    ORDER BY pc.product_id, pc.display_order ASC, pc.is_primary DESC
  `, productIds);

  // Get all subcategories for these products
  const subcategoriesResult = await query(`
    SELECT 
      psc.product_id,
      sc.id,
      sc.name,
      sc.description,
      sc.image_url,
      sc.category_id,
      psc.is_primary,
      psc.display_order
    FROM product_subcategories psc
    JOIN subcategories sc ON psc.subcategory_id = sc.id
    WHERE psc.product_id IN (${placeholders})
    ORDER BY psc.product_id, psc.display_order ASC, psc.is_primary DESC
  `, productIds);

  // Get all flavors for these products
  const flavorsResult = await query(`
    SELECT
      pf.product_id,
      sc.id,
      sc.name,
      sc.description,
      sc.image_url,
      sc.category_id,
      pf.is_primary,
      pf.display_order
    FROM product_flavors pf
    JOIN subcategories sc ON pf.subcategory_id = sc.id
    WHERE pf.product_id IN (${placeholders})
    ORDER BY pf.product_id, pf.display_order ASC, pf.is_primary DESC
  `, productIds);

  // Get all variants for these products
  const variantsResult = await query(`
    SELECT 
      product_id,
      id,
      name,
      weight,
      price,
      discount_percent,
      discounted_price,
      stock_quantity,
      is_available,
      created_at,
      updated_at
    FROM product_variants 
    WHERE product_id IN (${placeholders})
    ORDER BY product_id, created_at ASC
  `, productIds);

  // Get all gallery images for these products
  const galleryResult = await query(`
    SELECT 
      product_id,
      image_url,
      display_order
    FROM product_gallery_images 
    WHERE product_id IN (${placeholders})
    ORDER BY product_id, display_order ASC
  `, productIds);

  // Group categories by product_id
  const categoriesByProduct = {};
  categoriesResult.rows.forEach(cat => {
    if (!categoriesByProduct[cat.product_id]) {
      categoriesByProduct[cat.product_id] = [];
    }
    categoriesByProduct[cat.product_id].push(cat);
  });

  // Group subcategories by product_id
  const subcategoriesByProduct = {};
  subcategoriesResult.rows.forEach(subcat => {
    if (!subcategoriesByProduct[subcat.product_id]) {
      subcategoriesByProduct[subcat.product_id] = [];
    }
    subcategoriesByProduct[subcat.product_id].push(subcat);
  });

  // Group flavors by product_id
  const flavorsByProduct = {};
  flavorsResult.rows.forEach(flavor => {
    if (!flavorsByProduct[flavor.product_id]) {
      flavorsByProduct[flavor.product_id] = [];
    }
    flavorsByProduct[flavor.product_id].push(flavor);
  });

  // Group variants by product_id
  const variantsByProduct = {};
  variantsResult.rows.forEach(variant => {
    if (!variantsByProduct[variant.product_id]) {
      variantsByProduct[variant.product_id] = [];
    }
    variantsByProduct[variant.product_id].push(variant);
  });

  // Group gallery images by product_id
  const galleryByProduct = {};
  galleryResult.rows.forEach(img => {
    if (!galleryByProduct[img.product_id]) {
      galleryByProduct[img.product_id] = [];
    }
    galleryByProduct[img.product_id].push(img.image_url);
  });

  // Combine all data
  return products.map(product => {
    // Calculate discounted price if it's null
    product.discounted_price = product.discounted_price || 
      (product.discount_percent > 0 ? 
        product.base_price * (1 - product.discount_percent / 100) : 
        product.base_price);

    // Calculate discounted price for each variant if it's null
    const variants = variantsByProduct[product.id] || [];
    variants.forEach(variant => {
      variant.discounted_price = variant.discounted_price || 
        (variant.discount_percent > 0 ? 
          variant.price * (1 - variant.discount_percent / 100) : 
          variant.price);
    });

    return {
      ...product,
      image_url: mapImageUrl(baseUrl, product.image_url),
      categories: (categoriesByProduct[product.id] || []).map((category) => mapCategory(baseUrl, category)),
      subcategories: (subcategoriesByProduct[product.id] || []).map((subcategory) => mapSubcategory(baseUrl, subcategory)),
      flavors: (flavorsByProduct[product.id] || []).map((flavor) => mapSubcategory(baseUrl, flavor)),
      variants: variants,
      gallery_images: (galleryByProduct[product.id] || []).map((url) => mapImageUrl(baseUrl, url))
    };
  });
};

/**
 * Remove product from a specific category
 * @param {number} productId - Product ID
 * @param {number} categoryId - Category ID
 */
const removeProductFromCategory = async (productId, categoryId) => {
  await query('DELETE FROM product_categories WHERE product_id = ? AND category_id = ?', [productId, categoryId]);
};

/**
 * Remove product from a specific subcategory
 * @param {number} productId - Product ID
 * @param {number} subcategoryId - Subcategory ID
 */
const removeProductFromSubcategory = async (productId, subcategoryId) => {
  await query('DELETE FROM product_subcategories WHERE product_id = ? AND subcategory_id = ?', [productId, subcategoryId]);
};

/**
 * Set primary category for a product
 * @param {number} productId - Product ID
 * @param {number} categoryId - Category ID
 */
const setPrimaryCategory = async (productId, categoryId) => {
  // First, unset all primary categories for this product
  await query('UPDATE product_categories SET is_primary = false WHERE product_id = ?', [productId]);
  
  // Then set the specified category as primary
  await query('UPDATE product_categories SET is_primary = true WHERE product_id = ? AND category_id = ?', [productId, categoryId]);
};

/**
 * Set primary subcategory for a product
 * @param {number} productId - Product ID
 * @param {number} subcategoryId - Subcategory ID
 */
const setPrimarySubcategory = async (productId, subcategoryId) => {
  // First, unset all primary subcategories for this product
  await query('UPDATE product_subcategories SET is_primary = false WHERE product_id = ?', [productId]);
  
  // Then set the specified subcategory as primary
  await query('UPDATE product_subcategories SET is_primary = true WHERE product_id = ? AND subcategory_id = ?', [productId, subcategoryId]);
};

module.exports = {
  assignProductToCategories,
  assignProductToSubcategories,
  assignProductToFlavors,
  getProductWithCategories,
  getProductsWithCategories,
  removeProductFromCategory,
  removeProductFromSubcategory,
  setPrimaryCategory,
  setPrimarySubcategory
};
