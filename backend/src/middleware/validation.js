const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation Error: ${errorMessage}`
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy').default('staff')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional()
  }),

  // Customer auth schemas
  customerRegister: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional(),
    address: Joi.object().optional(),
    referralCode: Joi.string().allow('', null).optional()
  }),

  customerLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional()
  }),

  customerCheckEmail: Joi.object({
    email: Joi.string().email().required()
  }),

  updateCustomerProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/),
    address: Joi.object()
  }),

  changeCustomerPassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  // User schemas
  updateUser: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    role: Joi.string().valid('super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy'),
    avatar: Joi.string().uri(),
    is_active: Joi.boolean()
  }),

  // Banner schemas
  createBanner: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    subtitle: Joi.string().min(1).max(200),
    button_text: Joi.string().min(1).max(50),
    button_url: Joi.string().uri(),
    image_url: Joi.string().uri().required(),
    is_active: Joi.boolean().default(true),
    order_index: Joi.number().integer().min(0).default(0)
  }),

  updateBanner: Joi.object({
    title: Joi.string().min(1).max(100),
    subtitle: Joi.string().min(1).max(200),
    button_text: Joi.string().min(1).max(50),
    button_url: Joi.string().uri(),
    image_url: Joi.string().uri(),
    is_active: Joi.boolean(),
    order_index: Joi.number().integer().min(0)
  }),

  // Category schemas
  createCategory: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500),
    image_url: Joi.string().uri().required(),
    icon: Joi.string().allow('', null).optional(),
    icon_image_url: Joi.string().uri().allow('', null).optional(),
    display_name: Joi.string().max(100).allow('', null).optional(),
    is_active: Joi.boolean().default(true),
    order_index: Joi.number().integer().min(0).default(0)
  }),

  updateCategory: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(500),
    image_url: Joi.string().uri(),
    icon: Joi.string().allow('', null).optional(),
    icon_image_url: Joi.string().uri().allow('', null).optional(),
    display_name: Joi.string().max(100).allow('', null).optional(),
    is_active: Joi.boolean(),
    order_index: Joi.number().integer().min(0)
  }),

  // Subcategory schemas
  createSubcategory: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500),
    category_id: Joi.number().integer().positive().required(),
    image_url: Joi.string().uri().required(),
    is_active: Joi.boolean().default(true),
    order_index: Joi.number().integer().min(0).default(0)
  }),

  updateSubcategory: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(500),
    category_id: Joi.number().integer().positive(),
    image_url: Joi.string().uri(),
    is_active: Joi.boolean(),
    order_index: Joi.number().integer().min(0)
  }),

  // Product schemas
  createProduct: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000).required(),
    short_description: Joi.string().max(500).allow('').optional(),
    category_id: Joi.number().integer().positive(), // Legacy field for backward compatibility
    subcategory_id: Joi.number().integer().positive(), // Legacy field for backward compatibility
    // New multi-category fields
    category_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
    subcategory_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
    primary_category_id: Joi.number().integer().positive().optional(),
    primary_subcategory_id: Joi.number().integer().positive().optional(),
    base_price: Joi.number().positive().required(),
    base_weight: Joi.string().min(1).max(50).required(),
    discount_percent: Joi.number().min(0).max(100).default(0),
    image_url: Joi.string().uri().required(),
    is_active: Joi.boolean().default(true),
    is_featured: Joi.boolean().default(false),
    is_top_product: Joi.boolean().default(false),
    is_bestseller: Joi.boolean().default(false),
    is_new_launch: Joi.boolean().default(false),
    is_trending: Joi.boolean().default(false),
    is_eggless: Joi.boolean().default(false),
    preparation_time: Joi.number().integer().min(0), // in minutes
    preparation_time_hours: Joi.number().integer().min(0),
    serving_size: Joi.string().max(50),
    serving_size_description: Joi.string().max(200).allow('').optional(),
    care_storage: Joi.string().allow('').optional(),
    delivery_guidelines: Joi.string().allow('').optional(),
    shape: Joi.string().max(100).allow('').optional(),
    country_of_origin: Joi.string().max(100).allow('').optional(),
    rating: Joi.number().min(0).max(5).default(0),
    review_count: Joi.number().integer().min(0).default(0),
    meta_title: Joi.string().max(255).allow('').optional(),
    meta_description: Joi.string().max(500).allow('').optional(),
    tags: Joi.string().allow('').optional(),
    variations: Joi.array().items(
      Joi.object({
        weight: Joi.string().min(1).max(50).required(),
        price: Joi.number().positive().required(),
        discount_percent: Joi.number().min(0).max(100).default(0)
      })
    ).optional(),
    gallery_images: Joi.array().items(
      Joi.string().uri()
    ).optional()
  }).custom((value, helpers) => {
    // Custom validation: ensure at least one category is provided
    const hasLegacyCategory = value.category_id && value.category_id > 0;
    const hasMultiCategories = value.category_ids && value.category_ids.length > 0;
    
    if (!hasLegacyCategory && !hasMultiCategories) {
      return helpers.error('any.required', { message: 'At least one category must be provided (category_id or category_ids)' });
    }
    
    return value;
  }),

  updateProduct: Joi.object({
    name: Joi.string().min(1).max(200),
    description: Joi.string().max(1000),
    short_description: Joi.string().max(500).allow('').optional(),
    category_id: Joi.number().integer().positive(), // Legacy field for backward compatibility
    subcategory_id: Joi.number().integer().positive(), // Legacy field for backward compatibility
    // New multi-category fields
    category_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
    subcategory_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
    primary_category_id: Joi.number().integer().positive().optional(),
    primary_subcategory_id: Joi.number().integer().positive().optional(),
    base_price: Joi.number().positive(),
    base_weight: Joi.string().min(1).max(50),
    discount_percent: Joi.number().min(0).max(100),
    image_url: Joi.string().uri(),
    is_active: Joi.boolean(),
    is_featured: Joi.boolean(),
    is_top_product: Joi.boolean(),
    is_bestseller: Joi.boolean(),
    is_new_launch: Joi.boolean(),
    is_trending: Joi.boolean(),
    is_eggless: Joi.boolean(),
    preparation_time: Joi.number().integer().min(0),
    preparation_time_hours: Joi.number().integer().min(0),
    serving_size: Joi.string().max(50),
    serving_size_description: Joi.string().max(200).allow('').optional(),
    care_storage: Joi.string().allow('').optional(),
    delivery_guidelines: Joi.string().allow('').optional(),
    shape: Joi.string().max(100).allow('').optional(),
    country_of_origin: Joi.string().max(100).allow('').optional(),
    rating: Joi.number().min(0).max(5),
    review_count: Joi.number().integer().min(0),
    meta_title: Joi.string().max(255).allow('').optional(),
    meta_description: Joi.string().max(500).allow('').optional(),
    tags: Joi.string().allow('').optional(),
    variations: Joi.array().items(
      Joi.object({
        weight: Joi.string().min(1).max(50).required(),
        price: Joi.number().positive().required(),
        discount_percent: Joi.number().min(0).max(100).default(0)
      })
    ).optional(),
    gallery_images: Joi.array().items(
      Joi.string().uri()
    ).optional()
  }),

  // Product variant schemas
  createVariant: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    weight: Joi.string().min(1).max(50).required(),
    price: Joi.number().positive().required(),
    discount_percent: Joi.number().min(0).max(100).default(0),
    stock_quantity: Joi.number().integer().min(0).default(0),
    is_available: Joi.boolean().default(true)
  }),

  updateVariant: Joi.object({
    name: Joi.string().min(1).max(100),
    weight: Joi.string().min(1).max(50),
    price: Joi.number().positive(),
    discount_percent: Joi.number().min(0).max(100),
    stock_quantity: Joi.number().integer().min(0),
    is_available: Joi.boolean()
  }),

  // Collection schemas
  createCollection: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500),
    image_url: Joi.string().uri().required(),
    is_active: Joi.boolean().default(true),
    order_index: Joi.number().integer().min(0).default(0)
  }),

  updateCollection: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(500),
    image_url: Joi.string().uri(),
    is_active: Joi.boolean(),
    order_index: Joi.number().integer().min(0)
  }),

  // Order schemas
  createOrder: Joi.object({
    customer_id: Joi.number().integer().positive().required(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        variant_id: Joi.number().integer().positive().allow(null),
        quantity: Joi.number().integer().positive().required(),
        price: Joi.number().positive().required(),
        flavor_id: Joi.number().integer().positive().allow(null),
        tier: Joi.string().allow(null, ''),
        cake_message: Joi.string().allow(null, ''),
        product_name: Joi.string().allow(null, '').optional(),
        cart_item_id: Joi.string().allow(null, ''),
        combos: Joi.array().items(
          Joi.object({
            add_on_product_id: Joi.number().integer().positive().required(), // Required: database field from combo_selections table
            quantity: Joi.number().integer().positive().required(),
            price: Joi.number().positive().required(), // Unit price at order time
            discounted_price: Joi.number().min(0).optional() // Discounted price if applicable
          })
        ).allow(null)
      })
    ).min(1).required(),
    delivery_address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip_code: Joi.string().required(),
      country: Joi.string().required(),
      landmark: Joi.string().allow(null, '').optional(),
      // Optional precise map location for delivery (lat/lng)
      location: Joi.object({
        lat: Joi.number().optional(),
        lng: Joi.number().optional(),
        accuracy: Joi.number().allow(null).optional(),
        source: Joi.string().allow(null, '').optional(),
        name: Joi.string().allow(null, '').optional()
      }).allow(null).optional()
    }).required(),
    delivery_date: Joi.alternatives().try(
      Joi.date().min('now'),
      Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/)
    ).required(),
    delivery_time: Joi.string().required(),
    special_instructions: Joi.string().max(500).allow(null, ''),
    payment_method: Joi.string().valid('cash', 'card', 'upi', 'wallet').required(),
    wallet_amount_used: Joi.number().min(0).optional(),
    // Complete order details for logging (all optional)
    subtotal: Joi.number().min(0).optional(),
    promo_code: Joi.string().allow(null, '').optional(),
    promo_discount: Joi.number().min(0).optional(),
    delivery_charge: Joi.number().min(0).optional(),
    item_count: Joi.number().integer().min(0).optional(),
    combo_count: Joi.number().integer().min(0).optional(),
    // Banner ID for conversion tracking (optional)
    banner_id: Joi.number().integer().positive().allow(null).optional()
  }),

  updateOrder: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
    delivery_date: Joi.date(),
    delivery_time: Joi.string(),
    special_instructions: Joi.string().max(500)
  }),

  // Customer schemas
  createCustomer: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(15).required(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zip_code: Joi.string(),
      country: Joi.string(),
      // Optional precise map location saved with customer profile
      location: Joi.object({
        lat: Joi.number().optional(),
        lng: Joi.number().optional(),
        accuracy: Joi.number().allow(null).optional(),
        source: Joi.string().allow(null, '').optional()
      }).allow(null).optional()
    }).optional()
  }),

  updateCustomer: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().min(10).max(15),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zip_code: Joi.string(),
      country: Joi.string(),
      location: Joi.object({
        lat: Joi.number().optional(),
        lng: Joi.number().optional(),
        accuracy: Joi.number().allow(null).optional(),
        source: Joi.string().allow(null, '').optional()
      }).allow(null).optional()
    }).optional()
  }),

  // Settings schemas
  updateSettings: Joi.object({
    site_name: Joi.string().min(1).max(100),
    site_description: Joi.string().max(500),
    contact_email: Joi.string().email(),
    contact_phone: Joi.string().min(10).max(15),
    delivery_areas: Joi.array().items(Joi.string()),
    delivery_fee: Joi.number().min(0),
    free_delivery_threshold: Joi.number().min(0),
    delivery_time: Joi.string().max(100),
    payment_methods: Joi.array().items(Joi.string()),
    business_hours: Joi.object({
      monday: Joi.string(),
      tuesday: Joi.string(),
      wednesday: Joi.string(),
      thursday: Joi.string(),
      friday: Joi.string(),
      saturday: Joi.string(),
      sunday: Joi.string()
    }),
    social_links: Joi.object({
      facebook: Joi.string().uri().allow(''),
      instagram: Joi.string().uri().allow(''),
      twitter: Joi.string().uri().allow(''),
      youtube: Joi.string().uri().allow('')
    }),
    footer_text: Joi.string().max(500)
  }),

  // Featured Category schemas
  createFeaturedCategory: Joi.object({
    item_type: Joi.string().valid('category', 'subcategory').required(),
    category_id: Joi.number().integer().positive().when('item_type', {
      is: 'category',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    subcategory_id: Joi.number().integer().positive().when('item_type', {
      is: 'subcategory',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    display_order: Joi.number().integer().min(0).default(0),
    is_active: Joi.boolean().default(true),
    show_on_desktop: Joi.boolean().default(true),
    show_on_mobile: Joi.boolean().default(true)
  }),

  updateFeaturedCategory: Joi.object({
    display_order: Joi.number().integer().min(0),
    is_active: Joi.boolean(),
    show_on_desktop: Joi.boolean(),
    show_on_mobile: Joi.boolean()
  }),

  // Featured Product schemas
  createFeaturedProduct: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    section: Joi.string().valid('top_products', 'bestsellers').required(),
    display_order: Joi.number().integer().min(0).default(0)
  }),

  updateFeaturedProduct: Joi.object({
    display_order: Joi.number().integer().min(0),
    is_active: Joi.boolean()
  }),

  // User management validation
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy').required(),
    is_active: Joi.boolean().default(true),
    // Delivery boy specific fields
    owned_bike: Joi.boolean().when('role', {
      is: 'delivery_boy',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    driving_license_number: Joi.string().max(50).when('role', {
      is: 'delivery_boy',
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, '')
    }),
    contact_number: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).when('role', {
      is: 'delivery_boy',
      then: Joi.required(),
      otherwise: Joi.optional().allow(null, '')
    })
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid('super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy'),
    is_active: Joi.boolean(),
    // Delivery boy specific fields
    owned_bike: Joi.boolean().optional(),
    driving_license_number: Joi.string().max(50).optional().allow(null, ''),
    contact_number: Joi.string().pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/).optional().allow(null, '')
  }),

  toggleUserStatus: Joi.object({
    is_active: Joi.boolean().required()
  }),

  changePassword: Joi.object({
    password: Joi.string().min(6).required()
  }),

  // Banner validation schemas
  createBanner: Joi.object({
    title: Joi.string().max(100).required(),
    subtitle: Joi.string().max(200).allow(''),
    button_text: Joi.string().max(50).allow(''),
    button_url: Joi.string().allow(''),
    image_url: Joi.string().uri().required(),
    is_active: Joi.boolean(),
    order_index: Joi.number().integer().min(0)
  }),

  updateBanner: Joi.object({
    title: Joi.string().max(100),
    subtitle: Joi.string().max(200).allow(''),
    button_text: Joi.string().max(50).allow(''),
    button_url: Joi.string().allow(''),
    image_url: Joi.string().uri(),
    is_active: Joi.boolean(),
    order_index: Joi.number().integer().min(0)
  })
};

// Individual validation functions for easier use
const validateFeaturedCategory = validate(schemas.createFeaturedCategory);
const validateUpdateFeaturedCategory = validate(schemas.updateFeaturedCategory);
const validateFeaturedProduct = validate(schemas.createFeaturedProduct);
const validateUpdateFeaturedProduct = validate(schemas.updateFeaturedProduct);
const validateBanner = validate(schemas.createBanner);

module.exports = {
  validate,
  schemas,
  validateFeaturedCategory,
  validateUpdateFeaturedCategory,
  validateFeaturedProduct,
  validateUpdateFeaturedProduct,
  validateBanner
};
