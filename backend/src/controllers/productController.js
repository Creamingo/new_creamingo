const { query } = require('../config/db');
const {
  assignProductToCategories,
  assignProductToSubcategories,
  getProductWithCategories,
  getProductsWithCategories,
  removeProductFromCategory,
  removeProductFromSubcategory,
  setPrimaryCategory,
  setPrimarySubcategory
} = require('../utils/productCategoryHelpers');

// Helper function to normalize search terms (remove punctuation)
const normalizeSearchTerm = (term) => {
  return term
    .toLowerCase()
    .replace(/'/g, '')  // Remove apostrophes
    .replace(/-/g, '')  // Remove hyphens
    .replace(/\./g, '') // Remove periods
    .trim();
};

// SQL function to normalize strings in database (removes punctuation)
// This creates a SQL expression that can be used in LIKE queries
const sqlNormalize = (column) => {
  return `REPLACE(REPLACE(REPLACE(LOWER(${column}), '''', ''), '-', ''), '.', '')`;
};

// Get all products with pagination and filters
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category_id,
      subcategory_id,
      category_ids, // New: support multiple categories
      subcategory_ids, // New: support multiple subcategories
      category, // Slug-based category filtering
      subcategory, // Slug-based subcategory filtering
      is_active,
      is_featured,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Convert to integers for MySQL
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;
    let whereConditions = [];
    let queryParams = [];

    // Build WHERE conditions
    if (category_id) {
      const categoryIdInt = parseInt(category_id, 10);
      if (!isNaN(categoryIdInt)) {
        whereConditions.push(`p.id IN (
          SELECT DISTINCT product_id 
          FROM product_categories 
          WHERE category_id = ?
        )`);
        queryParams.push(categoryIdInt);
      }
    }

    if (subcategory_id) {
      const subcategoryIdInt = parseInt(subcategory_id, 10);
      if (!isNaN(subcategoryIdInt)) {
        whereConditions.push(`p.id IN (
          SELECT DISTINCT product_id 
          FROM product_subcategories 
          WHERE subcategory_id = ?
        )`);
        queryParams.push(subcategoryIdInt);
      }
    }

    // Handle multiple categories filter
    if (category_ids) {
      const categoryIdArray = Array.isArray(category_ids) ? category_ids : category_ids.split(',');
      // Convert all to integers for MySQL
      const categoryIdInts = categoryIdArray.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (categoryIdInts.length > 0) {
        const categoryPlaceholders = categoryIdInts.map(() => '?').join(',');
        whereConditions.push(`p.id IN (
          SELECT DISTINCT product_id 
          FROM product_categories 
          WHERE category_id IN (${categoryPlaceholders})
        )`);
        queryParams.push(...categoryIdInts);
      }
    }

    // Handle multiple subcategories filter
    if (subcategory_ids) {
      const subcategoryIdArray = Array.isArray(subcategory_ids) ? subcategory_ids : subcategory_ids.split(',');
      // Convert all to integers for MySQL
      const subcategoryIdInts = subcategoryIdArray.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (subcategoryIdInts.length > 0) {
        const subcategoryPlaceholders = subcategoryIdInts.map(() => '?').join(',');
        whereConditions.push(`p.id IN (
          SELECT DISTINCT product_id 
          FROM product_subcategories 
          WHERE subcategory_id IN (${subcategoryPlaceholders})
        )`);
        queryParams.push(...subcategoryIdInts);
      }
    }

    if (is_active !== undefined) {
      whereConditions.push(`p.is_active = ?`);
      // Convert to integer: 'true', '1', 1 → 1, everything else → 0
      const isActiveValue = (is_active === 'true' || is_active === '1' || is_active === 1) ? 1 : 0;
      queryParams.push(isActiveValue);
    }

    if (is_featured !== undefined) {
      whereConditions.push(`p.is_featured = ?`);
      // Convert to integer: 'true', '1', 1 → 1, everything else → 0
      const isFeaturedValue = (is_featured === 'true' || is_featured === '1' || is_featured === 1) ? 1 : 0;
      queryParams.push(isFeaturedValue);
    }

    if (search) {
      whereConditions.push(`(p.name LIKE ? OR p.description LIKE ?)`);
      queryParams.push(`%${search}%`);
      queryParams.push(`%${search}%`);
    }

    // Handle slug-based category filtering
    if (category) {
      // Convert category slug to category ID
      const categorySlugToIdMap = {
        'cakes-for-occasion': 20,
        'cakes-by-flavor': 19,
        'kids-cake-collection': 21,
        'crowd-favorite-cakes': 22,
        'love-relationship-cakes': 23,
        'milestone-year-cakes': 24,
        'small-treats-desserts': 26,
        'flowers': 27,
        'sweets-dry-fruits': 28
      };
      
      const categoryId = categorySlugToIdMap[category];
      if (categoryId) {
        whereConditions.push(`p.id IN (
          SELECT DISTINCT product_id 
          FROM product_categories 
          WHERE category_id = ?
        )`);
        queryParams.push(categoryId);
      }
    }

    // Handle slug-based subcategory filtering
    if (subcategory) {
      // Convert subcategory slug to subcategory ID
      const subcategorySlugToIdMap = {
        // Cakes for Any Occasion subcategories
        'birthday': 19,
        'anniversary': 20,
        'engagement': 21,
        'wedding': 22,
        'new-beginning': 23,
        'no-reason-cake': 24,
        // Cakes by Flavor subcategories
        'chocolate': 9,
        'choco-truffle': 10,
        'red-velvet': 12,
        'black-forest': 14,
        'pineapple': 11,
        'butterscotch': 13,
        'vanilla': 17,
        'mixed-fruit': 16,
        'mixed-fruits': 16,
        'strawberry': 15,
        'blueberry': 18,
        // Kid's Cake Collection subcategories
        'barbie-doll': 90,
        'cartoon-cakes': 91,
        'designer-cakes': 92,
        'number-cakes': 93,
        'super-hero-cakes': 94,
        // Crowd-Favorite Cakes subcategories
        'fondant-cakes': 33,
        'multi-tier': 34,
        'photo-cakes': 30,
        'pinata-cakes': 31,
        'unicorn-cakes': 32,
        // Love and Relationship Cakes subcategories
        'cake-for-brother': 37,
        'cake-for-father': 35,
        'cake-for-her': 40,
        'cake-for-him': 39,
        'cake-for-mother': 36,
        'cake-for-sister': 38,
        // Cakes for Every Milestone Year subcategories
        '1-year': 42,
        'half-year': 41,
        '5-year': 43,
        '5-years': 43,
        '10-year': 44,
        '10-years': 44,
        '25-year': 45,
        '25-years': 45,
        '50-year': 46,
        '50-years': 46,
        // Flowers subcategories
        'all-flowers-combos': 56,
        'bridal-bouquet': 55,
        'rose-bouquet': 54,
        'mixed-flower-bouquet': 53,
        // Sweets and Dry Fruits subcategories
        'chocolates-and-combos': 57,
        'sweets-and-combos': 58,
        'dry-fruits-and-combos': 59,
        // Small Treats Desserts subcategories
        'pastries': 49,
        'puddings': 50,
        'brownies': 51,
        'cookies': 52
      };
      
      const subcategoryId = subcategorySlugToIdMap[subcategory];
      if (subcategoryId) {
        whereConditions.push(`p.id IN (
          SELECT DISTINCT product_id 
          FROM product_subcategories 
          WHERE subcategory_id = ?
        )`);
        queryParams.push(subcategoryId);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort parameters
    const allowedSortFields = ['name', 'base_price', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count (use a copy of queryParams to avoid modifying the original)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, [...queryParams]);
    const total = parseInt(countResult.rows[0].total);

    // Get products (without variants for now - we'll fetch them separately)
    // Create a new array with limit and offset for the products query
    // Ensure limitNum and offset are integers
    const finalLimit = Number.isInteger(limitNum) ? limitNum : 10;
    const finalOffset = Number.isInteger(offset) ? offset : 0;
    const productsQueryParams = [...queryParams, finalLimit, finalOffset];
    
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.category_id,
        p.subcategory_id,
        p.base_price,
        p.base_weight,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.is_active,
        p.is_featured,
        p.is_top_product,
        p.is_bestseller,
        p.preparation_time,
        p.serving_size,
        p.care_storage,
        p.delivery_guidelines,
        p.rating,
        p.review_count,
        p.rating_count,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      ${whereClause}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    // Debug: Log query and params count for troubleshooting
    const placeholderCount = (productsQuery.match(/\?/g) || []).length;
    if (placeholderCount !== productsQueryParams.length) {
      console.error('Parameter mismatch detected:', {
        query: productsQuery,
        placeholderCount,
        paramCount: productsQueryParams.length,
        params: productsQueryParams,
        whereClause
      });
    }

    const productsResult = await query(productsQuery, productsQueryParams);

    // Get product IDs for fetching categories and subcategories
    const productIds = productsResult.rows.map(p => p.id);
    
    // Fetch products with their categories, subcategories, variants, and gallery images
    const products = await getProductsWithCategories(productIds);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current_page: pageNum,
          per_page: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single product by ID
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await getProductWithCategories(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single product by slug (for SEO-friendly URLs)
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const productQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.short_description,
        p.slug,
        p.category_id,
        p.subcategory_id,
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
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.slug = ? AND p.is_active = 1
    `;

    const productResult = await query(productQuery, [slug]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    // Get product categories and subcategories
    const categoriesQuery = `
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
    `;
    
    const categoriesResult = await query(categoriesQuery, [product.id]);
    product.categories = categoriesResult.rows || [];

    // Get product subcategories
    const subcategoriesQuery = `
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
    `;
    
    const subcategoriesResult = await query(subcategoriesQuery, [product.id]);
    product.subcategories = subcategoriesResult.rows || [];

    // Get product variants
    const variantsQuery = `
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
      WHERE product_id = ? AND is_available = 1
      ORDER BY created_at ASC
    `;
    
    const variantsResult = await query(variantsQuery, [product.id]);
    product.variants = variantsResult.rows || [];

    // Get gallery images
    const galleryQuery = `
      SELECT image_url, display_order
      FROM product_gallery_images 
      WHERE product_id = ?
      ORDER BY display_order ASC
    `;
    
    const galleryResult = await query(galleryQuery, [product.id]);
    product.gallery_images = galleryResult.rows.map(row => row.image_url) || [];

    // Get product attributes
    const attributesQuery = `
      SELECT 
        attribute_type,
        attribute_value,
        is_default,
        display_order
      FROM product_attributes 
      WHERE product_id = ?
      ORDER BY attribute_type, display_order ASC
    `;
    
    const attributesResult = await query(attributesQuery, [product.id]);
    
    // Group attributes by type
    const attributes = {};
    attributesResult.rows.forEach(attr => {
      if (!attributes[attr.attribute_type]) {
        attributes[attr.attribute_type] = [];
      }
      attributes[attr.attribute_type].push({
        value: attr.attribute_value,
        isDefault: attr.is_default === 1,
        displayOrder: attr.display_order
      });
    });
    product.attributes = attributes;

    // Get product reviews
    const reviewsQuery = `
      SELECT 
        id,
        customer_name,
        rating,
        review_title,
        review_text,
        is_verified_purchase,
        created_at
      FROM product_reviews 
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const reviewsResult = await query(reviewsQuery, [product.id]);
    product.reviews = reviewsResult.rows || [];

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get related products
const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    // First get the product's category and subcategory
    const productQuery = `
      SELECT category_id, subcategory_id, name
      FROM products 
      WHERE id = ?
    `;
    
    const productResult = await query(productQuery, [id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    // Get related products from same category/subcategory
    const relatedQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.short_description,
        p.slug,
        p.base_price,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.rating,
        p.review_count,
        p.is_top_product,
        p.is_bestseller,
        p.is_new_launch,
        p.is_trending,
        p.is_featured,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id != ? 
        AND p.is_active = 1
        AND (p.category_id = ? OR p.subcategory_id = ?)
      ORDER BY p.rating DESC, p.review_count DESC
      LIMIT ?
    `;

    const relatedResult = await query(relatedQuery, [
      id, 
      product.category_id, 
      product.subcategory_id, 
      parseInt(limit)
    ]);

    res.json({
      success: true,
      data: {
        products: relatedResult.rows,
        count: relatedResult.rows.length
      }
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get product reviews
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get reviews with pagination
    const reviewsQuery = `
      SELECT 
        id,
        customer_name,
        rating,
        review_title,
        review_text,
        is_verified_purchase,
        created_at
      FROM product_reviews 
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const reviewsResult = await query(reviewsQuery, [id, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product_reviews 
      WHERE product_id = ? AND is_approved = 1
    `;
    
    const countResult = await query(countQuery, [id]);
    const total = countResult.rows[0].total;

    // Get review images for each review
    const reviewIds = reviewsResult.rows.map(review => review.id);
    let reviewImages = [];
    
    if (reviewIds.length > 0) {
      const imagesQuery = `
        SELECT review_id, image_url, display_order
        FROM product_review_images 
        WHERE review_id IN (${reviewIds.map(() => '?').join(',')})
        ORDER BY review_id, display_order ASC
      `;
      
      const imagesResult = await query(imagesQuery, reviewIds);
      reviewImages = imagesResult.rows;
    }

    // Attach images to reviews and parse category data
    const reviewsWithImages = reviewsResult.rows.map(review => {
      review.images = reviewImages
        .filter(img => img.review_id === review.id)
        .map(img => img.image_url);
      
      // Parse category data if it exists in review_text
      try {
        if (review.review_text && review.review_text.startsWith('{')) {
          const categoryData = JSON.parse(review.review_text);
          if (categoryData.selected_categories || categoryData.category_ratings) {
            review.selected_categories = categoryData.selected_categories || [];
            review.category_ratings = categoryData.category_ratings || {};
            review.overall_rating = categoryData.overall_rating || review.rating;
            review.manual_overall_rating = categoryData.manual_overall_rating || review.rating;
            // Keep the original review_text as the actual review text
            review.review_text = categoryData.review_text || '';
          }
        }
      } catch (e) {
        // If parsing fails, keep the original review_text
        console.log('Failed to parse category data for review:', review.id);
      }
      
      // Ensure ratings object exists for frontend compatibility
      if (!review.ratings) {
        // Check if we have category data in review_text
        let categoryData = null;
        try {
          categoryData = JSON.parse(review.review_text || '{}');
        } catch (e) {
          // review_text is not JSON, treat as regular review text
        }
        
        if (categoryData && categoryData.category_ratings) {
          // Use the stored category ratings
          review.ratings = {
            taste: categoryData.category_ratings.taste || 0,
            presentation: categoryData.category_ratings.presentation || 0,
            freshness: categoryData.category_ratings.freshness || 0,
            valueForMoney: categoryData.category_ratings.valueForMoney || 0,
            deliveryExperience: categoryData.category_ratings.deliveryExperience || 0,
            overall: categoryData.calculated_overall_rating || categoryData.overall_rating || review.rating || 0
          };
        } else {
          // Fallback to overall rating for all categories
          review.ratings = {
            taste: review.rating || 0,
            presentation: review.rating || 0,
            freshness: review.rating || 0,
            valueForMoney: review.rating || 0,
            deliveryExperience: review.rating || 0,
            overall: review.rating || 0
          };
        }
      }
      
      return review;
    });

    // Calculate rating breakdown from reviews
    const ratingBreakdown = {
      taste: 0,
      presentation: 0,
      freshness: 0,
      valueForMoney: 0,
      deliveryExperience: 0
    };
    
    let totalReviewsWithRatings = 0;
    let totalReviewsWithOverallRating = 0;
    let overallRatingSum = 0;
    
    reviewsWithImages.forEach(review => {
      // Use the processed ratings object
      if (review.ratings) {
        ratingBreakdown.taste += review.ratings.taste || 0;
        ratingBreakdown.presentation += review.ratings.presentation || 0;
        ratingBreakdown.freshness += review.ratings.freshness || 0;
        ratingBreakdown.valueForMoney += review.ratings.valueForMoney || 0;
        ratingBreakdown.deliveryExperience += review.ratings.deliveryExperience || 0;
        totalReviewsWithRatings++;
        
        // Use the calculated overall rating for the average
        if (review.ratings.overall > 0) {
          overallRatingSum += review.ratings.overall;
        }
      }
    });
    
    const totalReviews = totalReviewsWithRatings;
    
    // Calculate averages
    if (totalReviews > 0) {
      ratingBreakdown.taste = Math.round((ratingBreakdown.taste / totalReviews) * 10) / 10;
      ratingBreakdown.presentation = Math.round((ratingBreakdown.presentation / totalReviews) * 10) / 10;
      ratingBreakdown.freshness = Math.round((ratingBreakdown.freshness / totalReviews) * 10) / 10;
      ratingBreakdown.valueForMoney = Math.round((ratingBreakdown.valueForMoney / totalReviews) * 10) / 10;
      ratingBreakdown.deliveryExperience = Math.round((ratingBreakdown.deliveryExperience / totalReviews) * 10) / 10;
    }

    res.json({
      success: true,
      data: {
        reviews: reviewsWithImages,
        ratingBreakdown: ratingBreakdown,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      short_description,
      category_id,
      subcategory_id,
      category_ids, // New: support multiple categories
      subcategory_ids, // New: support multiple subcategories
      primary_category_id, // New: primary category
      primary_subcategory_id, // New: primary subcategory
      base_price,
      base_weight,
      discount_percent = 0,
      image_url,
      is_active = 1,
      is_featured = 0,
      is_top_product = 0,
      is_bestseller = 0,
      preparation_time,
      serving_size,
      care_storage,
      delivery_guidelines
    } = req.body;

    // Validate discount_percent
    if (discount_percent < 0 || discount_percent > 100) {
      return res.status(400).json({
        success: false,
        message: 'Discount percent must be between 0 and 100'
      });
    }

    // Determine which categories to use (new multi-category or legacy single category)
    const categoriesToUse = category_ids || (category_id ? [category_id] : []);
    const subcategoriesToUse = subcategory_ids || (subcategory_id ? [subcategory_id] : []);

    // Verify categories exist
    if (categoriesToUse.length > 0) {
      const categoryPlaceholders = categoriesToUse.map(() => '?').join(',');
      const categoryResult = await query(
        `SELECT id FROM categories WHERE id IN (${categoryPlaceholders}) AND is_active = 1`,
        categoriesToUse
      );

      if (categoryResult.rows.length !== categoriesToUse.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more categories are invalid or inactive'
        });
      }
    }

    // Verify subcategories exist if provided (includes flavor subcategories)
    if (subcategoriesToUse.length > 0) {
      const subcategoryPlaceholders = subcategoriesToUse.map(() => '?').join(',');
      const subcategoryResult = await query(
        `SELECT id FROM subcategories WHERE id IN (${subcategoryPlaceholders}) AND is_active = 1`,
        subcategoriesToUse
      );

      if (subcategoryResult.rows.length !== subcategoriesToUse.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more subcategories are invalid or inactive'
        });
      }
    }

    // Calculate discounted price
    const discountedPrice = discount_percent > 0 ? 
      base_price * (1 - discount_percent / 100) : 
      base_price;

    // Generate slug from product name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Use first category as legacy category_id for backward compatibility
    const legacyCategoryId = categoriesToUse.length > 0 ? categoriesToUse[0] : null;
    const legacySubcategoryId = subcategoriesToUse.length > 0 ? subcategoriesToUse[0] : null;

    const result = await query(`
      INSERT INTO products (
        name, slug, description, short_description, category_id, subcategory_id, base_price, base_weight, discount_percent, discounted_price,
        image_url, is_active, is_featured, is_top_product, is_bestseller, is_eggless,
        preparation_time, serving_size, care_storage, delivery_guidelines, shape, country_of_origin, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      name, slug, description, short_description, legacyCategoryId, legacySubcategoryId, base_price, base_weight, discount_percent, discountedPrice,
      image_url, is_active, is_featured, is_top_product, is_bestseller, (req.body.is_eggless ? 1 : 0),
      preparation_time, serving_size, care_storage, delivery_guidelines, req.body.shape || 'Round', req.body.country_of_origin || 'India'
    ]);

    const productId = result.lastID;

    // Assign product to multiple categories if provided
    if (categoriesToUse.length > 0) {
      await assignProductToCategories(productId, categoriesToUse, primary_category_id);
    }

    // Assign product to multiple subcategories if provided
    if (subcategoriesToUse.length > 0) {
      await assignProductToSubcategories(productId, subcategoriesToUse, primary_subcategory_id);
    }

    // Handle product variations if provided
    if (req.body.variations && Array.isArray(req.body.variations) && req.body.variations.length > 0) {
      for (const variation of req.body.variations) {
        const { weight, price, discount_percent = 0 } = variation;
        
        // Calculate discounted price for variation
        const variationDiscountedPrice = discount_percent > 0 ? 
          price * (1 - discount_percent / 100) : 
          price;
        
        await query(`
          INSERT INTO product_variants (
            product_id, name, weight, price, discount_percent, discounted_price, 
            stock_quantity, is_available, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          productId,
          `${req.body.name} - ${weight}`, // Use product name + weight as variant name
          weight,
          price,
          discount_percent,
          variationDiscountedPrice,
          0, // Default stock quantity
          1  // Default is_available
        ]);
      }
    }

    // Handle product gallery images if provided
    if (req.body.gallery_images && Array.isArray(req.body.gallery_images) && req.body.gallery_images.length > 0) {
      for (let i = 0; i < req.body.gallery_images.length; i++) {
        const imageUrl = req.body.gallery_images[i];
        await query(`
          INSERT INTO product_gallery_images (
            product_id, image_url, display_order, created_at, updated_at
          ) VALUES (?, ?, ?, NOW(), NOW())
        `, [
          productId,
          imageUrl,
          i + 1 // Display order starts from 1
        ]);
      }
    }

    // Fetch the created product with all details including categories, subcategories, variations and gallery images
    const product = await getProductWithCategories(productId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate discount_percent if provided
    if (updateData.discount_percent !== undefined) {
      if (updateData.discount_percent < 0 || updateData.discount_percent > 100) {
        return res.status(400).json({
          success: false,
          message: 'Discount percent must be between 0 and 100'
        });
      }
    }

    // Check if product exists
    const existingProduct = await query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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

    // Verify subcategory if provided (skip validation for flavor subcategories)
    if (updateData.subcategory_id && updateData.category_id) {
      // Flavor subcategory IDs that can be assigned to any product
      const flavorSubcategoryIds = [9, 10, 12, 14, 11, 13, 17, 16, 15, 18];
      
      if (!flavorSubcategoryIds.includes(Number(updateData.subcategory_id))) {
        const subcategoryResult = await query(
          'SELECT id FROM subcategories WHERE id = ? AND category_id = ? AND is_active = 1',
          [updateData.subcategory_id, updateData.category_id]
        );

        if (subcategoryResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid subcategory for this category'
          });
        }
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && 
          key !== 'variations' && 
          key !== 'gallery_images' &&
          key !== 'category_ids' &&
          key !== 'subcategory_ids' &&
          key !== 'primary_category_id' &&
          key !== 'primary_subcategory_id') {
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

    // Generate new slug if name is being updated
    if (updateData.name !== undefined) {
      const slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      
      updates.push('slug = ?');
      values.push(slug);
    }

    // Calculate discounted price if discount_percent or base_price is being updated
    if (updateData.discount_percent !== undefined || updateData.base_price !== undefined) {
      const currentProduct = await query('SELECT base_price, discount_percent FROM products WHERE id = ?', [id]);
      const currentBasePrice = updateData.base_price !== undefined ? updateData.base_price : currentProduct.rows[0].base_price;
      const currentDiscountPercent = updateData.discount_percent !== undefined ? updateData.discount_percent : currentProduct.rows[0].discount_percent;
      
      const discountedPrice = currentDiscountPercent > 0 ? 
        currentBasePrice * (1 - currentDiscountPercent / 100) : 
        currentBasePrice;
      
      updates.push('discounted_price = ?');
      values.push(discountedPrice);
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const queryText = `
      UPDATE products 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    await query(queryText, values);

    // Handle multi-category fields if provided
    if (updateData.category_ids !== undefined || updateData.subcategory_ids !== undefined) {
      const categoriesToUse = updateData.category_ids || [];
      const subcategoriesToUse = updateData.subcategory_ids || [];
      const primaryCategoryId = updateData.primary_category_id;
      const primarySubcategoryId = updateData.primary_subcategory_id;

      // Update categories if provided
      if (updateData.category_ids !== undefined) {
        // Delete existing category associations
        await query('DELETE FROM product_categories WHERE product_id = ?', [id]);
        
        // Add new category associations
        if (categoriesToUse.length > 0) {
          await assignProductToCategories(id, categoriesToUse, primaryCategoryId);
        }
      }

      // Update subcategories if provided
      if (updateData.subcategory_ids !== undefined) {
        // Delete existing subcategory associations
        await query('DELETE FROM product_subcategories WHERE product_id = ?', [id]);
        
        // Add new subcategory associations
        if (subcategoriesToUse.length > 0) {
          await assignProductToSubcategories(id, subcategoriesToUse, primarySubcategoryId);
        }
      }
    }

    // Handle product variations if provided
    if (req.body.variations !== undefined) {
      // Only update variations if the array is explicitly provided and not empty
      // This prevents accidental deletion of variations when frontend sends empty array
      if (Array.isArray(req.body.variations) && req.body.variations.length > 0) {
        // Delete existing variations
        await query('DELETE FROM product_variants WHERE product_id = ?', [id]);
        
        // Insert new variations
        for (const variation of req.body.variations) {
          const { weight, price, discount_percent = 0 } = variation;
          
          // Calculate discounted price for variation
          const variationDiscountedPrice = discount_percent > 0 ? 
            price * (1 - discount_percent / 100) : 
            price;
          
          await query(`
            INSERT INTO product_variants (
              product_id, name, weight, price, discount_percent, discounted_price, 
              stock_quantity, is_available, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            id,
            `${updateData.name || 'Product'} - ${weight}`, // Use updated name or fallback
            weight,
            price,
            discount_percent,
            variationDiscountedPrice,
            0, // Default stock quantity
            1  // Default is_available
          ]);
        }
      }
      // If variations is an empty array, we don't delete existing variations
      // This preserves existing variations when frontend sends empty array
    }

    // Handle product gallery images if provided
    if (req.body.gallery_images !== undefined) {
      // Only update gallery images if the array is explicitly provided and not empty
      // This prevents accidental deletion of gallery images when frontend sends empty array
      if (Array.isArray(req.body.gallery_images) && req.body.gallery_images.length > 0) {
        // Delete existing gallery images
        await query('DELETE FROM product_gallery_images WHERE product_id = ?', [id]);
        
        // Insert new gallery images
        for (let i = 0; i < req.body.gallery_images.length; i++) {
          const imageUrl = req.body.gallery_images[i];
          await query(`
            INSERT INTO product_gallery_images (
              product_id, image_url, display_order, created_at, updated_at
            ) VALUES (?, ?, ?, NOW(), NOW())
          `, [
            id,
            imageUrl,
            i + 1 // Display order starts from 1
          ]);
        }
      }
      // If gallery_images is an empty array, we don't delete existing gallery images
      // This preserves existing gallery images when frontend sends empty array
    }

    // Fetch the updated product with all details
    const productResult = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.subcategory_id,
        p.base_price,
        p.base_weight,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.is_active,
        p.is_featured,
        p.is_top_product,
        p.is_bestseller,
        p.preparation_time,
        p.serving_size,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id = ?
    `, [id]);

    const product = productResult.rows[0];
    
    // Calculate discounted price if it's null
    product.discounted_price = product.discounted_price || 
      (product.discount_percent > 0 ? 
        product.base_price * (1 - product.discount_percent / 100) : 
        product.base_price);

    // Get variations for this product
    const variantsQuery = `
      SELECT 
        id,
        weight,
        price,
        discount_percent,
        discounted_price,
        created_at,
        updated_at
      FROM product_variants 
      WHERE product_id = ?
      ORDER BY created_at ASC
    `;
    
    const variantsResult = await query(variantsQuery, [id]);
    
    // Calculate discounted price for each variant if it's null
    variantsResult.rows.forEach(variant => {
      variant.discounted_price = variant.discounted_price || 
        (variant.discount_percent > 0 ? 
          variant.price * (1 - variant.discount_percent / 100) : 
          variant.price);
    });
    
    product.variants = variantsResult.rows || [];

    // Get gallery images for this product
    const galleryQuery = `
      SELECT image_url, display_order
      FROM product_gallery_images 
      WHERE product_id = ?
      ORDER BY display_order ASC
    `;
    
    const galleryResult = await query(galleryQuery, [id]);
    product.gallery_images = galleryResult.rows.map(row => row.image_url) || [];

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product has any orders
    const orderCheck = await query(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
      [id]
    );

    if (parseInt(orderCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product that has been ordered. Consider deactivating it instead.'
      });
    }

    // Delete product variants first
    await query('DELETE FROM product_variants WHERE product_id = ?', [id]);

    // Delete product
    await query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Product variants management
const getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT * FROM product_variants 
      WHERE product_id = ? 
      ORDER BY created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: { variants: result.rows }
    });
  } catch (error) {
    console.error('Get product variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const createProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, weight, price, stock_quantity = 0, is_available = 1 } = req.body;

    // Check if product exists
    const productResult = await query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const result = await query(`
      INSERT INTO product_variants (
        product_id, name, weight, price, stock_quantity, is_available, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [id, name, weight, price, stock_quantity, is_available]);

    res.status(201).json({
      success: true,
      message: 'Product variant created successfully',
      data: { variant: result.rows[0] }
    });
  } catch (error) {
    console.error('Create product variant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateProductVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;
    const updateData = req.body;

    // Check if variant exists and belongs to product
    const existingVariant = await query(
      'SELECT id FROM product_variants WHERE id = ? AND product_id = ?',
      [variantId, id]
    );

    if (existingVariant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(variantId);

    const queryText = `
      UPDATE product_variants 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
    `;

    const result = await query(queryText, values);

    res.json({
      success: true,
      message: 'Product variant updated successfully',
      data: { variant: result.rows[0] }
    });
  } catch (error) {
    console.error('Update product variant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteProductVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;

    // Check if variant exists and belongs to product
    const existingVariant = await query(
      'SELECT id FROM product_variants WHERE id = ? AND product_id = ?',
      [variantId, id]
    );

    if (existingVariant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Check if variant has any orders
    const orderCheck = await query(
      'SELECT COUNT(*) as count FROM order_items WHERE variant_id = ?',
      [variantId]
    );

    if (parseInt(orderCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete variant that has been ordered. Consider deactivating it instead.'
      });
    }

    await query('DELETE FROM product_variants WHERE id = ?', [variantId]);

    res.json({
      success: true,
      message: 'Product variant deleted successfully'
    });
  } catch (error) {
    console.error('Delete product variant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Top Products (products marked as is_top_product = 1)
const getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.subcategory_id,
        p.base_price,
        p.base_weight,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.is_active,
        p.is_featured,
        p.is_top_product,
        p.is_bestseller,
        p.preparation_time,
        p.serving_size,
        p.rating,
        p.review_count,
        p.slug,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.is_top_product = 1 AND p.is_active = 1
      ORDER BY p.id ASC
      LIMIT ?
    `, [limit]);

    // Get product IDs to fetch variants
    const productIds = result.rows.map(p => p.id);
    
    // Fetch products with their categories, subcategories, variants, and gallery images
    const products = productIds.length > 0 ? await getProductsWithCategories(productIds) : [];

    res.json({
      success: true,
      data: {
        products: products,
        count: products.length
      }
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle Top Product status
const toggleTopProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await query(
      'SELECT id, is_top_product FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStatus = existingProduct.rows[0].is_top_product;
    const newStatus = !currentStatus;

    // Update the product
    await query(
      'UPDATE products SET is_top_product = ?, updated_at = NOW() WHERE id = ? ',
      [newStatus, id]
    );

    // If marking as top product, automatically add to featured_products table
    if (newStatus) {
      try {
        // Check if already exists in featured_products
        const existingFeatured = await query(
          'SELECT id FROM featured_products WHERE product_id = ? AND section = ?',
          [id, 'top_products']
        );

        if (existingFeatured.rows.length === 0) {
          // Get the next display order
          const orderResult = await query(
            'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM featured_products WHERE section = ?',
            ['top_products']
          );
          const nextOrder = orderResult.rows[0].next_order;

          // Add to featured_products
          await query(
            'INSERT INTO featured_products (product_id, section, display_order, is_active) VALUES (?, ?, ?, 1)',
            [id, 'top_products', nextOrder]
          );
        }
      } catch (featuredError) {
        console.error('Error adding to featured products:', featuredError);
        // Don't fail the main operation if featured products sync fails
      }
    } else {
      // If unmarking as top product, remove from featured_products
      try {
        await query(
          'DELETE FROM featured_products WHERE product_id = ? AND section = ?',
          [id, 'top_products']
        );
      } catch (featuredError) {
        console.error('Error removing from featured products:', featuredError);
        // Don't fail the main operation if featured products sync fails
      }
    }

    // Fetch the updated product with all details
    const productResult = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.subcategory_id,
        p.base_price,
        p.base_weight,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.is_active,
        p.is_featured,
        p.is_top_product,
        p.is_bestseller,
        p.preparation_time,
        p.serving_size,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id = ?
    `, [id]);

    const product = productResult.rows[0];
    
    // Calculate discounted price if it's null
    product.discounted_price = product.discounted_price || 
      (product.discount_percent > 0 ? 
        product.base_price * (1 - product.discount_percent / 100) : 
        product.base_price);

    res.json({
      success: true,
      message: `Product ${newStatus ? 'marked as' : 'removed from'} Top Product`,
      data: { product }
    });
  } catch (error) {
    console.error('Toggle top product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Bestsellers (products marked as is_bestseller = 1)
const getBestsellers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get product IDs first
    const productIdsResult = await query(`
      SELECT p.id
      FROM products p
      WHERE p.is_bestseller = 1 AND p.is_active = 1
      ORDER BY p.id ASC
      LIMIT ?
    `, [limit]);

    const productIds = productIdsResult.rows.map(row => row.id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        data: {
          products: [],
          count: 0
        }
      });
    }

    // Use getProductsWithCategories to get full product data with variants, ratings, etc.
    const products = await getProductsWithCategories(productIds);

    res.json({
      success: true,
      data: {
        products: products,
        count: products.length
      }
    });
  } catch (error) {
    console.error('Get bestsellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle Bestseller status
const toggleBestseller = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await query(
      'SELECT id, is_bestseller FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStatus = existingProduct.rows[0].is_bestseller;
    const newStatus = !currentStatus;

    // Update the product
    await query(
      'UPDATE products SET is_bestseller = ?, updated_at = NOW() WHERE id = ? ',
      [newStatus, id]
    );

    // If marking as bestseller, automatically add to featured_products table
    if (newStatus) {
      try {
        // Check if already exists in featured_products
        const existingFeatured = await query(
          'SELECT id FROM featured_products WHERE product_id = ? AND section = ?',
          [id, 'bestsellers']
        );

        if (existingFeatured.rows.length === 0) {
          // Get the next display order
          const orderResult = await query(
            'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM featured_products WHERE section = ?',
            ['bestsellers']
          );
          const nextOrder = orderResult.rows[0].next_order;

          // Add to featured_products
          await query(
            'INSERT INTO featured_products (product_id, section, display_order, is_active) VALUES (?, ?, ?, 1)',
            [id, 'bestsellers', nextOrder]
          );
        }
      } catch (featuredError) {
        console.error('Error adding to featured products:', featuredError);
        // Don't fail the main operation if featured products sync fails
      }
    } else {
      // If unmarking as bestseller, remove from featured_products
      try {
        await query(
          'DELETE FROM featured_products WHERE product_id = ? AND section = ?',
          [id, 'bestsellers']
        );
      } catch (featuredError) {
        console.error('Error removing from featured products:', featuredError);
        // Don't fail the main operation if featured products sync fails
      }
    }

    // Fetch the updated product with all details
    const productResult = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.subcategory_id,
        p.base_price,
        p.base_weight,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.is_active,
        p.is_featured,
        p.is_top_product,
        p.is_bestseller,
        p.preparation_time,
        p.serving_size,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id = ?
    `, [id]);

    const product = productResult.rows[0];
    
    // Calculate discounted price if it's null
    product.discounted_price = product.discounted_price || 
      (product.discount_percent > 0 ? 
        product.base_price * (1 - product.discount_percent / 100) : 
        product.base_price);

    res.json({
      success: true,
      message: `Product ${newStatus ? 'marked as' : 'removed from'} Bestseller`,
      data: { product }
    });
  } catch (error) {
    console.error('Toggle bestseller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle Featured status
const toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await query(
      'SELECT id, is_featured FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStatus = existingProduct.rows[0].is_featured;
    const newStatus = !currentStatus;

    // Update the product
    await query(
      'UPDATE products SET is_featured = ?, updated_at = NOW() WHERE id = ? ',
      [newStatus, id]
    );

    // If marking as featured, automatically add to featured_products table
    if (newStatus) {
      try {
        // Check if already exists in featured_products
        const existingFeatured = await query(
          'SELECT id FROM featured_products WHERE product_id = ? AND section = ?',
          [id, 'featured']
        );

        if (existingFeatured.rows.length === 0) {
          // Get the next display order
          const orderResult = await query(
            'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM featured_products WHERE section = ?',
            ['featured']
          );
          const nextOrder = orderResult.rows[0].next_order;

          // Add to featured_products
          await query(
            'INSERT INTO featured_products (product_id, section, display_order, is_active) VALUES (?, ?, ?, 1)',
            [id, 'featured', nextOrder]
          );
        }
      } catch (featuredError) {
        console.error('Error adding to featured products:', featuredError);
        // Don't fail the main operation if featured products sync fails
      }
    } else {
      // If unmarking as featured, remove from featured_products
      try {
        await query(
          'DELETE FROM featured_products WHERE product_id = ? AND section = ?',
          [id, 'featured']
        );
      } catch (featuredError) {
        console.error('Error removing from featured products:', featuredError);
        // Don't fail the main operation if featured products sync fails
      }
    }

    // Fetch the updated product with all details
    const productResult = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.subcategory_id,
        p.base_price,
        p.base_weight,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.is_active,
        p.is_featured,
        p.is_top_product,
        p.is_bestseller,
        p.preparation_time,
        p.serving_size,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id = ?
    `, [id]);

    const product = productResult.rows[0];
    
    // Calculate discounted price if it's null
    product.discounted_price = product.discounted_price || 
      (product.discount_percent > 0 ? 
        product.base_price * (1 - product.discount_percent / 100) : 
        product.base_price);

    res.json({
      success: true,
      message: `Product ${newStatus ? 'marked as' : 'removed from'} Featured`,
      data: { product }
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle Active status
const toggleActive = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await query(
      'SELECT id, is_active FROM products WHERE id = ?',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const currentStatus = existingProduct.rows[0].is_active;
    const newStatus = !currentStatus;

    // Update the product
    await query(
      'UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ? ',
      [newStatus, id]
    );

    // Fetch the updated product with all details
    const productResult = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.category_id,
        p.subcategory_id,
        p.base_price,
        p.base_weight,
        p.discount_percent,
        p.discounted_price,
        p.image_url,
        p.is_active,
        p.is_featured,
        p.is_top_product,
        p.is_bestseller,
        p.preparation_time,
        p.serving_size,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id = ?
    `, [id]);

    const product = productResult.rows[0];
    
    // Calculate discounted price if it's null
    product.discounted_price = product.discounted_price || 
      (product.discount_percent > 0 ? 
        product.base_price * (1 - product.discount_percent / 100) : 
        product.base_price);

    res.json({
      success: true,
      message: `Product ${newStatus ? 'activated' : 'deactivated'}`,
      data: { product }
    });
  } catch (error) {
    console.error('Toggle active error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search products by query
const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Filter out stop words and clean the query
    const stopWords = [
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'were', 'will', 'with', 'this', 'these', 'those',
      'what', 'which', 'who', 'whom', 'whose', 'why', 'how', 'when',
      'where', 'can', 'could', 'should', 'would', 'may', 'might',
      'must', 'shall', 'have', 'has', 'had', 'do', 'does', 'did',
      'am', 'is', 'are', 'was', 'were', 'been', 'being', 'i', 'you',
      'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ];

    // Clean and filter the query
    const cleanedQuery = q.trim();
    // Normalize the query by removing punctuation before splitting
    const normalizedCleanedQuery = normalizeSearchTerm(cleanedQuery);
    const words = normalizedCleanedQuery.split(/\s+/).filter(word => {
      // Remove stop words and words shorter than 2 characters
      return word.length >= 2 && !stopWords.includes(word);
    });

    // Require minimum query length (3 characters after cleaning)
    const meaningfulQuery = words.join(' ').trim();
    if (meaningfulQuery.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must contain at least 3 meaningful characters. Please avoid common words like "the", "this", "is", etc.'
      });
    }

    // If no meaningful words after filtering, return empty results
    if (words.length === 0) {
      return res.json({
        success: true,
        data: {
          products: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    const offset = (page - 1) * limit;
    // Use the cleaned meaningful query for search
    const searchTerm = `%${meaningfulQuery}%`;
    const searchQueryLower = meaningfulQuery.toLowerCase();

    // Map search terms to subcategory IDs for better matching
    // This helps when users search for "Chocolate Cake" to find products in "Chocolate" subcategory
    const subcategorySearchMap = {
      'chocolate': 9,
      'choco truffle': 10,
      'truffle': 10,
      'red velvet': 12,
      'black forest': 14,
      'pineapple': 11,
      'butterscotch': 13,
      'vanilla': 17,
      'mixed fruit': 16,
      'mixed fruits': 16,
      'strawberry': 15,
      'blueberry': 18,
      'birthday': 19,
      'anniversary': 20,
      'engagement': 21,
      'wedding': 22,
      'fondant': 33,
      'photo cake': 30,
      'pinata': 31,
      'unicorn': 32,
      'barbie': 90,
      'cartoon': 91,
      'designer': 92,
      'number': 93,
      'super hero': 94,
      'pastries': 49,
      'pudding': 50,
      'brownie': 51,
      'cookie': 52
    };

    // Check if search query exactly matches a subcategory name (normalized)
    // First check against the map, then verify with database
    const normalizedQuery = normalizeSearchTerm(searchQueryLower.trim());
    let exactSubcategoryMatch = null;
    
    // Common words that might follow a subcategory name (e.g., "Birthday Cake", "Chocolate Cake")
    const commonSuffixes = ['cake', 'cakes', 'product', 'products', 'item', 'items'];
    
    // Check map for exact matches
    for (const [key, subcategoryId] of Object.entries(subcategorySearchMap)) {
      const normalizedKey = key.replace(/-/g, ' ');
      // Check for exact match (case-insensitive, ignoring hyphens)
      if (normalizedQuery === normalizedKey || 
          normalizedQuery === key || 
          normalizedQuery === key.replace(/\s+/g, '-')) {
        exactSubcategoryMatch = subcategoryId;
        break;
      }
      
      // Check if query starts with subcategory name followed by common words
      // e.g., "birthday cake" should match "birthday" subcategory
      const queryWithoutSuffix = normalizedQuery.split(/\s+/).filter(word => 
        !commonSuffixes.includes(word.toLowerCase())
      ).join(' ');
      
      if (queryWithoutSuffix === normalizedKey || queryWithoutSuffix === key) {
        exactSubcategoryMatch = subcategoryId;
        break;
      }
    }
    
    // Also check database for exact subcategory name match
    if (!exactSubcategoryMatch) {
      try {
        const subcategoryCheck = await query(
          `SELECT id FROM subcategories WHERE ${sqlNormalize('TRIM(name)')} = ? AND is_active = 1 LIMIT 1`,
          [normalizedQuery]
        );
        if (subcategoryCheck.rows && subcategoryCheck.rows.length > 0) {
          exactSubcategoryMatch = subcategoryCheck.rows[0].id;
        } else {
          // Check if query without common suffixes matches a subcategory
          const queryWithoutSuffix = normalizedQuery.split(/\s+/).filter(word => 
            !commonSuffixes.includes(word.toLowerCase())
          ).join(' ');
          if (queryWithoutSuffix !== normalizedQuery) {
            const normalizedQueryWithoutSuffix = normalizeSearchTerm(queryWithoutSuffix);
            const subcategoryCheck2 = await query(
              `SELECT id FROM subcategories WHERE ${sqlNormalize('TRIM(name)')} = ? AND is_active = 1 LIMIT 1`,
              [normalizedQueryWithoutSuffix]
            );
            if (subcategoryCheck2.rows && subcategoryCheck2.rows.length > 0) {
              exactSubcategoryMatch = subcategoryCheck2.rows[0].id;
            }
          }
        }
      } catch (err) {
        console.error('Error checking subcategory name:', err);
      }
    }

    // Find matching subcategory IDs from the search query (for partial matches)
    const matchingSubcategoryIds = [];
    for (const [key, subcategoryId] of Object.entries(subcategorySearchMap)) {
      if (searchQueryLower.includes(key) && !exactSubcategoryMatch) {
        matchingSubcategoryIds.push(subcategoryId);
      }
    }

    // Build WHERE conditions for finding matching product IDs
    let whereConditions = [];
    let queryParams = [];

    // If exact subcategory match, only show products from that subcategory
    // This ensures search results match the category page results
    if (exactSubcategoryMatch) {
      // Only show products in the exact subcategory match
      whereConditions.push(`EXISTS (
        SELECT 1 FROM product_subcategories psc_exact 
        WHERE psc_exact.product_id = p.id 
        AND psc_exact.subcategory_id = ?
      )`);
      queryParams.push(exactSubcategoryMatch);
    } else {
      // Text search condition with relevance ranking
      // Prioritize: Product name > Category name > Subcategory name > Description
      // Use word boundaries for better matching (search for each meaningful word)
      const searchWords = meaningfulQuery.split(/\s+/);
      
      // Build conditions for each meaningful word
      const wordConditions = [];
      const wordParams = [];
      
      searchWords.forEach(word => {
        // Normalize search term for comparison
        const normalizedWordTerm = normalizeSearchTerm(word);
        const normalizedSearchTerm = `%${normalizedWordTerm}%`;
        wordConditions.push(`(
          ${sqlNormalize('p.name')} LIKE ? OR 
          EXISTS (
            SELECT 1 FROM product_categories pc2 
            JOIN categories c2 ON pc2.category_id = c2.id 
            WHERE pc2.product_id = p.id AND ${sqlNormalize('c2.name')} LIKE ?
          ) OR
          EXISTS (
            SELECT 1 FROM product_subcategories psc2 
            JOIN subcategories sc2 ON psc2.subcategory_id = sc2.id 
            WHERE psc2.product_id = p.id AND ${sqlNormalize('sc2.name')} LIKE ?
          ) OR
          ${sqlNormalize('p.description')} LIKE ?
        )`);
        wordParams.push(normalizedSearchTerm, normalizedSearchTerm, normalizedSearchTerm, normalizedSearchTerm);
      });
      
      // All words must match (AND condition for better accuracy)
      whereConditions.push(`(${wordConditions.join(' AND ')})`);
      queryParams.push(...wordParams);

      // Add subcategory matching if found (for partial matches like "Chocolate Cake")
      if (matchingSubcategoryIds.length > 0) {
        const placeholders = matchingSubcategoryIds.map(() => '?').join(',');
        whereConditions.push(`EXISTS (
          SELECT 1 FROM product_subcategories psc3 
          WHERE psc3.product_id = p.id 
          AND psc3.subcategory_id IN (${placeholders})
        )`);
        queryParams.push(...matchingSubcategoryIds);
      }
    }

    const whereClause = whereConditions.join(' OR ');

    // Get distinct product IDs with relevance scoring (only for non-exact subcategory matches)
    let productIdsQuery;
    let productIdsParams;
    
    if (exactSubcategoryMatch) {
      // For exact subcategory matches, no relevance scoring needed
      productIdsQuery = `
        SELECT DISTINCT p.id
        FROM products p
        WHERE p.is_active = 1 AND (${whereClause})
        ORDER BY p.${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `;
      productIdsParams = [...queryParams, limit, offset];
    } else {
      // Relevance: Product name match (highest) > Category match > Subcategory match > Description match
      const searchWords = meaningfulQuery.split(/\s+/);
      const relevanceCases = searchWords.map((word, index) => {
        const normalizedWordTerm = normalizeSearchTerm(word);
        const normalizedSearchTerm = `%${normalizedWordTerm}%`;
        return `(
          CASE 
            WHEN ${sqlNormalize('p.name')} LIKE ? THEN ${10 - index}
            WHEN EXISTS (SELECT 1 FROM product_categories pc 
                        JOIN categories c ON pc.category_id = c.id 
                        WHERE pc.product_id = p.id AND ${sqlNormalize('c.name')} LIKE ?) THEN ${7 - index}
            WHEN EXISTS (SELECT 1 FROM product_subcategories psc 
                        JOIN subcategories sc ON psc.subcategory_id = sc.id 
                        WHERE psc.product_id = p.id AND ${sqlNormalize('sc.name')} LIKE ?) THEN ${5 - index}
            WHEN ${sqlNormalize('p.description')} LIKE ? THEN ${3 - index}
            ELSE 0
          END
        )`;
      }).join(' + ');

      const relevanceParams = [];
      searchWords.forEach(word => {
        const normalizedWordTerm = normalizeSearchTerm(word);
        const normalizedSearchTerm = `%${normalizedWordTerm}%`;
        relevanceParams.push(normalizedSearchTerm, normalizedSearchTerm, normalizedSearchTerm, normalizedSearchTerm);
      });

      productIdsQuery = `
        SELECT DISTINCT 
          p.id,
          (${relevanceCases}) as relevance_score
        FROM products p
        WHERE p.is_active = 1 AND (${whereClause})
        ORDER BY relevance_score DESC, p.${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `;
      productIdsParams = [...queryParams, ...relevanceParams, limit, offset];
    }

    // Execute first query to get product IDs
    const productIdsResult = await query(productIdsQuery, productIdsParams);
    const productIds = productIdsResult.rows.map(row => row.id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        data: {
          products: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    // Get full product details with primary category and subcategory
    const placeholders = productIds.map(() => '?').join(',');
    
    let searchQuery;
    if (exactSubcategoryMatch) {
      // For exact matches, use default sort
      searchQuery = `
        SELECT 
          p.*,
          (SELECT c.name FROM product_categories pc 
           JOIN categories c ON pc.category_id = c.id 
           WHERE pc.product_id = p.id 
           ORDER BY pc.is_primary DESC, pc.display_order ASC 
           LIMIT 1) as category_name,
          (SELECT sc.name FROM product_subcategories psc 
           JOIN subcategories sc ON psc.subcategory_id = sc.id 
           WHERE psc.product_id = p.id 
           ORDER BY psc.is_primary DESC, psc.display_order ASC 
           LIMIT 1) as subcategory_name
        FROM products p
        WHERE p.id IN (${placeholders})
        ORDER BY p.${sort_by} ${sort_order}
      `;
    } else {
      // For text searches, maintain relevance order
      const relevanceOrder = productIds.map((id, index) => `WHEN ${id} THEN ${index}`).join(' ');
      searchQuery = `
        SELECT 
          p.*,
          (SELECT c.name FROM product_categories pc 
           JOIN categories c ON pc.category_id = c.id 
           WHERE pc.product_id = p.id 
           ORDER BY pc.is_primary DESC, pc.display_order ASC 
           LIMIT 1) as category_name,
          (SELECT sc.name FROM product_subcategories psc 
           JOIN subcategories sc ON psc.subcategory_id = sc.id 
           WHERE psc.product_id = p.id 
           ORDER BY psc.is_primary DESC, psc.display_order ASC 
           LIMIT 1) as subcategory_name,
          CASE p.id ${relevanceOrder} END as relevance_order
        FROM products p
        WHERE p.id IN (${placeholders})
        ORDER BY relevance_order
      `;
    }

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.is_active = 1 AND (${whereClause})
    `;

    const [productsResult, countResult] = await Promise.all([
      query(searchQuery, productIds),
      query(countQuery, queryParams)
    ]);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products: productsResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get search autocomplete suggestions (products, flavors, categories)
const getSearchAutocomplete = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          products: [],
          flavors: [],
          categories: []
        }
      });
    }

    // Normalize the search query
    const normalizedQuery = normalizeSearchTerm(q.trim());
    const searchTerm = `%${normalizedQuery}%`;
    const exactMatch = `%${normalizedQuery}%`;
    const startsWith = `${normalizedQuery}%`;

    // Get products matching product names (limit 5)
    const productsQuery = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.slug,
        p.image_url,
        p.base_price,
        p.discounted_price,
        (SELECT c.name FROM product_categories pc 
         JOIN categories c ON pc.category_id = c.id 
         WHERE pc.product_id = p.id 
         ORDER BY pc.is_primary DESC, pc.display_order ASC 
         LIMIT 1) as category_name
      FROM products p
      WHERE p.is_active = 1 
        AND ${sqlNormalize('p.name')} LIKE ?
      ORDER BY 
        CASE 
          WHEN ${sqlNormalize('p.name')} LIKE ? THEN 1
          WHEN ${sqlNormalize('p.name')} LIKE ? THEN 2
          ELSE 3
        END,
        p.name ASC
      LIMIT 5
    `;
    
    // Get matching subcategories (flavors) - limit 5
    const flavorsQuery = `
      SELECT DISTINCT
        sc.id,
        sc.name,
        sc.description,
        c.slug as category_slug
      FROM subcategories sc
      JOIN categories c ON sc.category_id = c.id
      WHERE sc.is_active = 1 
        AND c.is_active = 1
        AND (${sqlNormalize('sc.name')} LIKE ? OR ${sqlNormalize('sc.description')} LIKE ?)
      ORDER BY 
        CASE 
          WHEN ${sqlNormalize('sc.name')} LIKE ? THEN 1
          WHEN ${sqlNormalize('sc.name')} LIKE ? THEN 2
          ELSE 3
        END,
        sc.name ASC
      LIMIT 5
    `;

    // Get matching categories - limit 3
    const categoriesQuery = `
      SELECT DISTINCT
        c.id,
        c.name,
        c.slug,
        c.description
      FROM categories c
      WHERE c.is_active = 1 
        AND (${sqlNormalize('c.name')} LIKE ? OR ${sqlNormalize('c.description')} LIKE ?)
      ORDER BY 
        CASE 
          WHEN ${sqlNormalize('c.name')} LIKE ? THEN 1
          WHEN ${sqlNormalize('c.name')} LIKE ? THEN 2
          ELSE 3
        END,
        c.name ASC
      LIMIT 3
    `;

    const [productsResult, flavorsResult, categoriesResult] = await Promise.all([
      query(productsQuery, [exactMatch, exactMatch, startsWith]),
      query(flavorsQuery, [exactMatch, exactMatch, exactMatch, startsWith]),
      query(categoriesQuery, [exactMatch, exactMatch, exactMatch, startsWith])
    ]);

    // For autocomplete, only fetch products from categories/subcategories if the category/subcategory NAME matches
    // (not description) to avoid showing too many irrelevant results
    // Fetch products from matching categories (only if category name matches, not description)
    let categoryProducts = [];
    const matchingCategoryNames = categoriesResult.rows?.filter(c => 
      normalizeSearchTerm(c.name).includes(normalizedQuery)
    ) || [];
    
    if (matchingCategoryNames.length > 0) {
      const categoryIds = matchingCategoryNames.map(c => c.id);
      const categoryPlaceholders = categoryIds.map(() => '?').join(',');
      
      const categoryProductsQuery = `
        SELECT DISTINCT
          p.id,
          p.name,
          p.slug,
          p.image_url,
          p.base_price,
          p.discounted_price,
          (SELECT c.name FROM product_categories pc2 
           JOIN categories c ON pc2.category_id = c.id 
           WHERE pc2.product_id = p.id 
           ORDER BY pc2.is_primary DESC, pc2.display_order ASC 
           LIMIT 1) as category_name
        FROM products p
        INNER JOIN product_categories pc ON p.id = pc.product_id
        WHERE p.is_active = 1 
          AND pc.category_id IN (${categoryPlaceholders})
          AND p.id NOT IN (
            SELECT DISTINCT p2.id
            FROM products p2
            WHERE p2.is_active = 1 
              AND ${sqlNormalize('p2.name')} LIKE ?
          )
        ORDER BY p.name ASC
        LIMIT 5
      `;
      
      const categoryProductsResult = await query(
        categoryProductsQuery, 
        [...categoryIds, exactMatch]
      );
      categoryProducts = categoryProductsResult.rows || [];
    }

    // Fetch products from matching subcategories (only if subcategory name matches, not description)
    let subcategoryProducts = [];
    const matchingSubcategoryNames = flavorsResult.rows?.filter(f => 
      normalizeSearchTerm(f.name).includes(normalizedQuery)
    ) || [];
    
    if (matchingSubcategoryNames.length > 0) {
      const subcategoryIds = matchingSubcategoryNames.map(f => f.id);
      const subcategoryPlaceholders = subcategoryIds.map(() => '?').join(',');
      
      // Build query to exclude products already found by name or category
      let subcategoryProductsQuery = `
        SELECT DISTINCT
          p.id,
          p.name,
          p.slug,
          p.image_url,
          p.base_price,
          p.discounted_price,
          (SELECT sc.name FROM product_subcategories psc2 
           JOIN subcategories sc ON psc2.subcategory_id = sc.id 
           WHERE psc2.product_id = p.id 
           ORDER BY psc2.is_primary DESC, psc2.display_order ASC 
           LIMIT 1) as subcategory_name,
          (SELECT c.name FROM product_categories pc2 
           JOIN categories c ON pc2.category_id = c.id 
           WHERE pc2.product_id = p.id 
           ORDER BY pc2.is_primary DESC, pc2.display_order ASC 
           LIMIT 1) as category_name
        FROM products p
        INNER JOIN product_subcategories psc ON p.id = psc.product_id
        WHERE p.is_active = 1 
          AND psc.subcategory_id IN (${subcategoryPlaceholders})
          AND p.id NOT IN (
            SELECT DISTINCT p2.id
            FROM products p2
            WHERE p2.is_active = 1 
              AND ${sqlNormalize('p2.name')} LIKE ?
          )
      `;
      
      const subcategoryParams = [...subcategoryIds, exactMatch];
      
      // If there are matching categories, exclude products already found from those categories
      if (matchingCategoryNames.length > 0) {
        const categoryIds = matchingCategoryNames.map(c => c.id);
        const categoryPlaceholders = categoryIds.map(() => '?').join(',');
        subcategoryProductsQuery += `
          AND p.id NOT IN (
            SELECT DISTINCT p3.id
            FROM products p3
            INNER JOIN product_categories pc3 ON p3.id = pc3.product_id
            WHERE p3.is_active = 1 
              AND pc3.category_id IN (${categoryPlaceholders})
          )
        `;
        subcategoryParams.push(...categoryIds);
      }
      
      subcategoryProductsQuery += `
        ORDER BY p.name ASC
        LIMIT 5
      `;
      
      const subcategoryProductsResult = await query(
        subcategoryProductsQuery,
        subcategoryParams
      );
      subcategoryProducts = subcategoryProductsResult.rows || [];
    }

    // Combine all products, removing duplicates
    const allProducts = [];
    const productIds = new Set();
    
    // Add direct product name matches first (highest priority)
    if (productsResult.rows) {
      productsResult.rows.forEach(product => {
        if (!productIds.has(product.id)) {
          productIds.add(product.id);
          allProducts.push(product);
        }
      });
    }
    
    // Add category products
    categoryProducts.forEach(product => {
      if (!productIds.has(product.id)) {
        productIds.add(product.id);
        allProducts.push(product);
      }
    });
    
    // Add subcategory products
    subcategoryProducts.forEach(product => {
      if (!productIds.has(product.id)) {
        productIds.add(product.id);
        allProducts.push(product);
      }
    });

    // Limit to 10 products total
    const limitedProducts = allProducts.slice(0, 10);

    res.json({
      success: true,
      data: {
        products: limitedProducts,
        flavors: flavorsResult.rows || [],
        categories: [] // Don't return categories, show products instead
      }
    });
  } catch (error) {
    console.error('Search autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search products by occasion and flavor combination
const searchProductsByOccasionAndFlavor = async (req, res) => {
  try {
    const { occasion, flavor, page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = req.query;

    if (!occasion || !flavor) {
      return res.status(400).json({
        success: false,
        message: 'Both occasion and flavor are required'
      });
    }

    const offset = (page - 1) * limit;

    const searchQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.is_active = 1 
        AND (
          sc.name LIKE ? OR
          sc.name LIKE ? OR
          p.name LIKE ? OR
          p.name LIKE ? OR
          p.description LIKE ? OR
          p.description LIKE ?
        )
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.is_active = 1 
        AND (
          sc.name LIKE ? OR
          sc.name LIKE ? OR
          p.name LIKE ? OR
          p.name LIKE ? OR
          p.description LIKE ? OR
          p.description LIKE ?
        )
    `;

    const occasionTerm = `%${occasion}%`;
    const flavorTerm = `%${flavor}%`;

    const [productsResult, countResult] = await Promise.all([
      query(searchQuery, [occasionTerm, flavorTerm, occasionTerm, flavorTerm, occasionTerm, flavorTerm, limit, offset]),
      query(countQuery, [occasionTerm, flavorTerm, occasionTerm, flavorTerm, occasionTerm, flavorTerm])
    ]);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        products: productsResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Search products by occasion and flavor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add product to categories
const addProductToCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_ids, primary_category_id } = req.body;

    if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'category_ids array is required'
      });
    }

    // Check if product exists
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify categories exist
    const categoryPlaceholders = category_ids.map(() => '?').join(',');
    const categoryResult = await query(
      `SELECT id FROM categories WHERE id IN (${categoryPlaceholders}) AND is_active = 1`,
      category_ids
    );

    if (categoryResult.rows.length !== category_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more categories are invalid or inactive'
      });
    }

    // Assign product to categories
    await assignProductToCategories(id, category_ids, primary_category_id);

    // Fetch updated product
    const product = await getProductWithCategories(id);

    res.json({
      success: true,
      message: 'Product categories updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Add product to categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove product from category
const removeProductFromCategoryController = async (req, res) => {
  try {
    const { id, categoryId } = req.params;

    // Check if product exists
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Remove from category
    await query('DELETE FROM product_categories WHERE product_id = ? AND category_id = ?', [id, categoryId]);

    // Fetch updated product
    const product = await getProductWithCategories(id);

    res.json({
      success: true,
      message: 'Product removed from category successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Remove product from category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Set primary category for product
const setPrimaryCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id } = req.body;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'category_id is required'
      });
    }

    // Check if product exists
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if category is assigned to product
    const categoryCheck = await query(
      'SELECT id FROM product_categories WHERE product_id = ? AND category_id = ?',
      [id, category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category is not assigned to this product'
      });
    }

    // Set as primary
    await setPrimaryCategory(id, category_id);

    // Fetch updated product
    const product = await getProductWithCategories(id);

    res.json({
      success: true,
      message: 'Primary category set successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Set primary category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add product to subcategories
const addProductToSubcategories = async (req, res) => {
  try {
    const { id } = req.params;
    const { subcategory_ids, primary_subcategory_id } = req.body;

    if (!subcategory_ids || !Array.isArray(subcategory_ids) || subcategory_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'subcategory_ids array is required'
      });
    }

    // Check if product exists
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify subcategories exist
    const subcategoryPlaceholders = subcategory_ids.map(() => '?').join(',');
    const subcategoryResult = await query(
      `SELECT id FROM subcategories WHERE id IN (${subcategoryPlaceholders}) AND is_active = 1`,
      subcategory_ids
    );

    if (subcategoryResult.rows.length !== subcategory_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more subcategories are invalid or inactive'
      });
    }

    // Assign product to subcategories
    await assignProductToSubcategories(id, subcategory_ids, primary_subcategory_id);

    // Fetch updated product
    const product = await getProductWithCategories(id);

    res.json({
      success: true,
      message: 'Product subcategories updated successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Add product to subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Remove product from subcategory
const removeProductFromSubcategoryController = async (req, res) => {
  try {
    const { id, subcategoryId } = req.params;

    // Check if product exists
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Remove from subcategory
    await query('DELETE FROM product_subcategories WHERE product_id = ? AND subcategory_id = ?', [id, subcategoryId]);

    // Fetch updated product
    const product = await getProductWithCategories(id);

    res.json({
      success: true,
      message: 'Product removed from subcategory successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Remove product from subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Set primary subcategory for product
const setPrimarySubcategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { subcategory_id } = req.body;

    if (!subcategory_id) {
      return res.status(400).json({
        success: false,
        message: 'subcategory_id is required'
      });
    }

    // Check if product exists
    const existingProduct = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if subcategory is assigned to product
    const subcategoryCheck = await query(
      'SELECT id FROM product_subcategories WHERE product_id = ? AND subcategory_id = ?',
      [id, subcategory_id]
    );

    if (subcategoryCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory is not assigned to this product'
      });
    }

    // Set as primary
    await setPrimarySubcategory(id, subcategory_id);

    // Fetch updated product
    const product = await getProductWithCategories(id);

    res.json({
      success: true,
      message: 'Primary subcategory set successfully',
      data: { product }
    });
  } catch (error) {
    console.error('Set primary subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Review management functions
const createReview = async (req, res) => {
  try {
    const {
      product_id,
      customer_name,
      customer_email,
      rating,
      review_title,
      review_text,
      is_verified_purchase = false,
      is_approved = false,
      images = []
    } = req.body;

    // Validate required fields
    if (!product_id || !customer_name || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, customer name, and rating are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const productQuery = 'SELECT id FROM products WHERE id = ?';
    const productResult = await query(productQuery, [product_id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Insert review
    const insertReviewQuery = `
      INSERT INTO product_reviews (
        product_id, customer_name, customer_email, rating, 
        review_title, review_text, is_verified_purchase, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const reviewResult = await query(insertReviewQuery, [
      product_id, customer_name, customer_email, rating,
      review_title, review_text, is_verified_purchase, is_approved
    ]);

    const reviewId = reviewResult.lastID;

    // Insert review images if provided
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const insertImageQuery = `
          INSERT INTO product_review_images (review_id, image_url, display_order)
          VALUES (?, ?, ?)
        `;
        await query(insertImageQuery, [reviewId, images[i], i + 1]);
      }
    }

    // Update product rating and review count
    await updateProductRatingStats(product_id);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review_id: reviewId }
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const {
      customer_name,
      customer_email,
      rating,
      review_title,
      review_text,
      is_verified_purchase,
      is_approved
    } = req.body;

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (customer_name !== undefined) {
      updateFields.push('customer_name = ?');
      updateValues.push(customer_name);
    }
    if (customer_email !== undefined) {
      updateFields.push('customer_email = ?');
      updateValues.push(customer_email);
    }
    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }
    if (review_title !== undefined) {
      updateFields.push('review_title = ?');
      updateValues.push(review_title);
    }
    if (review_text !== undefined) {
      updateFields.push('review_text = ?');
      updateValues.push(review_text);
    }
    if (is_verified_purchase !== undefined) {
      updateFields.push('is_verified_purchase = ?');
      updateValues.push(is_verified_purchase);
    }
    if (is_approved !== undefined) {
      updateFields.push('is_approved = ?');
      updateValues.push(is_approved);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(reviewId);

    const updateQuery = `
      UPDATE product_reviews 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = await query(updateQuery, updateValues);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Get product_id to update rating stats
    const getProductQuery = 'SELECT product_id FROM product_reviews WHERE id = ?';
    const productResult = await query(getProductQuery, [reviewId]);
    
    if (productResult.rows.length > 0) {
      await updateProductRatingStats(productResult.rows[0].product_id);
    }

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

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Get product_id before deleting
    const getProductQuery = 'SELECT product_id FROM product_reviews WHERE id = ?';
    const productResult = await query(getProductQuery, [reviewId]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const productId = productResult.rows[0].product_id;

    // Delete review images first
    const deleteImagesQuery = 'DELETE FROM product_review_images WHERE review_id = ?';
    await query(deleteImagesQuery, [reviewId]);

    // Delete review
    const deleteReviewQuery = 'DELETE FROM product_reviews WHERE id = ?';
    const result = await query(deleteReviewQuery, [reviewId]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Update product rating stats
    await updateProductRatingStats(productId);

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

// Helper function to update product rating statistics
const updateProductRatingStats = async (productId) => {
  try {
    const statsQuery = `
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_count,
        COUNT(CASE WHEN review_text IS NOT NULL AND review_text != '' AND review_text != 'null' THEN 1 END) as review_count
      FROM product_reviews 
      WHERE product_id = ? AND is_approved = 1
    `;
    
    const statsResult = await query(statsQuery, [productId]);
    const stats = statsResult.rows[0];
    
    const avgRating = stats.avg_rating ? parseFloat(stats.avg_rating.toFixed(2)) : 0;
    const totalCount = stats.total_count || 0;
    const reviewCount = stats.review_count || 0;
    const ratingCount = totalCount - reviewCount; // Ratings without written reviews

    // Update product with new stats
    const updateProductQuery = `
      UPDATE products 
      SET rating = ?, review_count = ?, rating_count = ?
      WHERE id = ?
    `;
    
    await query(updateProductQuery, [avgRating, reviewCount, ratingCount, productId]);
    
  } catch (error) {
    console.error('Update product rating stats error:', error);
  }
};

// Get testimonials for homepage (approved reviews with text)
const getTestimonials = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const testimonialsQuery = `
      SELECT 
        pr.id,
        pr.customer_name,
        pr.rating,
        pr.review_text as comment,
        pr.review_title,
        pr.created_at,
        pr.is_verified_purchase,
        p.name as product_name,
        c.name as category_name
      FROM product_reviews pr
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pr.is_approved = 1
        AND pr.review_text IS NOT NULL
        AND pr.review_text != ''
        AND pr.review_text != 'null'
        AND pr.rating >= 4
      ORDER BY pr.rating DESC, pr.created_at DESC
      LIMIT ?
    `;

    const result = await query(testimonialsQuery, [limit]);
    const testimonials = result.rows || [];

    // Transform testimonials to match frontend format
    const transformedTestimonials = testimonials.map((testimonial, index) => {
      // Extract location from customer name or use a default location generator
      // In a real scenario, you might store location separately
      const locations = [
        'Mumbai, Maharashtra',
        'Delhi, NCR',
        'Bangalore, Karnataka',
        'Pune, Maharashtra',
        'Hyderabad, Telangana',
        'Chennai, Tamil Nadu'
      ];
      const location = locations[index % locations.length];

      // Determine gender based on name patterns (basic heuristic)
      const firstName = testimonial.customer_name.split(' ')[0].toLowerCase();
      const femaleNames = ['priya', 'anjali', 'meera', 'sneha', 'kavita', 'radha', 'shilpa'];
      const gender = femaleNames.includes(firstName) ? 'female' : 'male';

      // Stock avatars based on gender
      const stockAvatars = {
        female: [
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        ],
        male: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
        ]
      };
      const stockAvatar = stockAvatars[gender][index % stockAvatars[gender].length];

      return {
        id: testimonial.id,
        name: testimonial.customer_name,
        location: location,
        rating: testimonial.rating,
        comment: testimonial.comment,
        occasion: testimonial.review_title || testimonial.product_name || 'Special Celebration',
        avatar: `/images/testimonials/${testimonial.customer_name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        stockAvatar: stockAvatar,
        gender: gender,
        product_name: testimonial.product_name,
        is_verified: testimonial.is_verified_purchase === 1
      };
    });

    res.json({
      success: true,
      data: {
        testimonials: transformedTestimonials,
        count: transformedTestimonials.length
      }
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  getProductBySlug,
  getRelatedProducts,
  getProductReviews,
  getTestimonials,
  // public create (approved=false)
  createPublicReview: async (req, res) => {
    try {
      const { id } = req.params; // product id
      const {
        customer_name,
        customer_email,
        overall_rating,
        manual_overall_rating,
        selected_categories = [],
        category_ratings = {},
        review_text,
        image_url
      } = req.body;

      // Use overall_rating if provided, otherwise fall back to manual_overall_rating
      const finalRating = overall_rating || manual_overall_rating || 0;
      
      if (!customer_name || !finalRating) {
        return res.status(400).json({ success: false, message: 'Name and rating are required' });
      }

      // Auto-calculate individual category ratings based on the logic
      let processedCategoryRatings = {};
      
      if (selected_categories.length > 0 && Object.keys(category_ratings).length > 0) {
        // User has manually rated some categories - use those values
        processedCategoryRatings = { ...category_ratings };
        
        // Fill in missing categories with the overall rating
        selected_categories.forEach(categoryId => {
          if (!processedCategoryRatings[categoryId]) {
            processedCategoryRatings[categoryId] = finalRating;
          }
        });
      } else if (manual_overall_rating > 0) {
        // User gave only overall rating - set all categories to that value
        processedCategoryRatings = {
          taste: manual_overall_rating,
          presentation: manual_overall_rating,
          freshness: manual_overall_rating,
          valueForMoney: manual_overall_rating,
          deliveryExperience: manual_overall_rating
        };
      }

      // insert basic review (unapproved by default)
      const insertReview = `
        INSERT INTO product_reviews (
          product_id, customer_name, customer_email, rating, review_title, review_text, is_verified_purchase, is_approved
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)
      `;
      const result = await query(insertReview, [id, customer_name, customer_email || null, Math.min(Math.max(finalRating,1),5), null, review_text || null]);
      const reviewId = result.lastID;

      // Store category ratings and selected categories in review_text as JSON for now
      // In a production system, you'd want separate tables for this
      if (Object.keys(processedCategoryRatings).length > 0) {
        const categoryData = {
          selected_categories: selected_categories.length > 0 ? selected_categories : ['taste', 'presentation', 'freshness', 'valueForMoney', 'deliveryExperience'],
          category_ratings: processedCategoryRatings,
          overall_rating: finalRating,
          manual_overall_rating,
          calculated_overall_rating: finalRating // Store the calculated overall rating
        };
        
        // Update the review with category data
        await query(
          'UPDATE product_reviews SET review_text = ? WHERE id = ?',
          [JSON.stringify(categoryData), reviewId]
        );
      }

      if (image_url) {
        await query('INSERT INTO product_review_images (review_id, image_url, display_order) VALUES (?, ?, 1)', [reviewId, image_url]);
      }

      return res.status(201).json({ success: true, message: 'Review submitted. Pending approval.', data: { review_id: reviewId } });
    } catch (e) {
      console.error('Public create review error:', e);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
  toggleTopProduct,
  getBestsellers,
  toggleBestseller,
  toggleFeatured,
  toggleActive,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  searchProducts,
  getSearchAutocomplete,
  searchProductsByOccasionAndFlavor,
  // New category management functions
  addProductToCategories,
  removeProductFromCategoryController,
  setPrimaryCategoryController,
  addProductToSubcategories,
  removeProductFromSubcategoryController,
  setPrimarySubcategoryController,
  // Review management functions
  createReview,
  updateReview,
  deleteReview
};
