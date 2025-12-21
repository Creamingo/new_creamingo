-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Table: categories
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, slug VARCHAR(100),
    icon TEXT, icon_image_url TEXT,
    display_name TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: collections
DROP TABLE IF EXISTS collections;
CREATE TABLE collections (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: collection_products
DROP TABLE IF EXISTS collection_products;
CREATE TABLE collection_products (

id INT PRIMARY KEY AUTO_INCREMENT,
    collection_id INT NOT NULL,
    product_id INT NOT NULL,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(collection_id, product_id
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
)

-- Table: order_items
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (

id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    quantity INT NOT NULL 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    flavor_id INT, tier VARCHAR(50),
    cake_message TEXT, display_name VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: subcategories
DROP TABLE IF EXISTS subcategories;
CREATE TABLE subcategories (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    slug VARCHAR(100),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: products
DROP TABLE IF EXISTS products;
CREATE TABLE products (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INT NOT NULL,
    subcategory_id INT,
    base_price DECIMAL(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    preparation_time INT,
    serving_size VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discounted_price DECIMAL(10,2), is_top_product BOOLEAN DEFAULT 0,
    is_bestseller BOOLEAN DEFAULT 0,
    base_weight VARCHAR(50), delivery_guidelines TEXT,
    care_storage TEXT, ai_generated_description TEXT,
    final_description TEXT, order_index INT DEFAULT 0,
    short_description TEXT, rating DECIMAL(3,2) DEFAULT 0.0, review_count INT DEFAULT 0,
    is_new_launch BOOLEAN DEFAULT 0,
    is_trending BOOLEAN DEFAULT 0,
    meta_title VARCHAR(255), meta_description TEXT,
    tags TEXT, serving_size_description TEXT,
    is_eggless BOOLEAN DEFAULT 0,
    slug VARCHAR(255), preparation_time_hours INT DEFAULT 2,
    shape TEXT, country_of_origin TEXT,
    default_flavor VARCHAR(100), show_flavor_dropdown BOOLEAN DEFAULT 0,
    available_flavors TEXT, rating_count INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: settings
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: product_variants
DROP TABLE IF EXISTS product_variants;
CREATE TABLE product_variants (

id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(100) NOT NULL,
    weight VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    discounted_price DECIMAL(10,2), discount_percent DECIMAL(5,2) DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: customers
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, password VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME, wallet_balance DECIMAL(10,2) DEFAULT 0.00, welcome_bonus_credited BOOLEAN DEFAULT 0,
    referred_by INT, referral_code VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: pincodes
DROP TABLE IF EXISTS pincodes;
CREATE TABLE pincodes (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    pin_code VARCHAR(6) UNIQUE NOT NULL,
    delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(10) NOT NULL DEFAULT 'Active' ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, key_location_points TEXT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: featured_products
DROP TABLE IF EXISTS featured_products;
CREATE TABLE featured_products (

id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    section VARCHAR(50) NOT NULL ),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_featured BOOLEAN DEFAULT 0,
    is_top_product BOOLEAN DEFAULT 0,
    is_bestseller BOOLEAN DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: banners
DROP TABLE IF EXISTS banners;
CREATE TABLE banners (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(200),
    button_text VARCHAR(50),
    button_url TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: delivery_pin_codes
DROP TABLE IF EXISTS delivery_pin_codes;
CREATE TABLE delivery_pin_codes (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    pin_code VARCHAR(6) NOT NULL UNIQUE,
    delivery_charge DECIMAL(10, 2) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active' ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, order_index INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: featured_categories
DROP TABLE IF EXISTS featured_categories;
CREATE TABLE featured_categories (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        item_type VARCHAR(20) NOT NULL ),
        category_id INT REFERENCES categories(id) ON DELETE CASCADE,
        subcategory_id INT REFERENCES subcategories(id) ON DELETE CASCADE,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        show_on_desktop BOOLEAN DEFAULT 1,
        show_on_mobile BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(category_id, item_type),
        UNIQUE(subcategory_id, item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: orders
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' ),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time VARCHAR(20) NOT NULL,
    special_instructions TEXT,
    payment_method VARCHAR(20) NOT NULL ),
    payment_status VARCHAR(20) DEFAULT 'pending' ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_slot_id INT, delivery_slot_name VARCHAR(50),
    subtotal DECIMAL(10,2), promo_code VARCHAR(50),
    promo_discount DECIMAL(10,2) DEFAULT 0,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    cashback_amount DECIMAL(10,2) DEFAULT 0,
    scratch_card_id INT, item_count INT DEFAULT 0,
    combo_count INT DEFAULT 0,
    wallet_amount_used DECIMAL(10,2) DEFAULT 0,
    total_item_count INT DEFAULT 0,
    subtotal_after_promo DECIMAL(10,2), subtotal_after_wallet DECIMAL(10,2),
    final_delivery_charge DECIMAL(10,2) DEFAULT 0,
    deal_items_total DECIMAL(10,2) DEFAULT 0,
    regular_items_total DECIMAL(10,2), picked_up_at DATETIME,
    ready_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: payments
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (

id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_gateway_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: product_categories
DROP TABLE IF EXISTS product_categories;
CREATE TABLE product_categories (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, category_id
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      )

-- Table: product_review_images
DROP TABLE IF EXISTS product_review_images;
CREATE TABLE product_review_images (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    review_id INT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: users
CREATE TABLE "users" (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' ),
    avatar TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, order_index INT DEFAULT 0,
    driving_license_number VARCHAR(50), contact_number VARCHAR(20),
    owned_bike BOOLEAN DEFAULT 0)

-- Table: product_subcategories
DROP TABLE IF EXISTS product_subcategories;
CREATE TABLE product_subcategories (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        subcategory_id INT NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, subcategory_id
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      )

-- Table: delivery_slot_availability
DROP TABLE IF EXISTS delivery_slot_availability;
CREATE TABLE delivery_slot_availability (

id INT PRIMARY KEY AUTO_INCREMENT,
    slot_id INT NOT NULL,
    delivery_date DATE NOT NULL,
    available_orders INT NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    max_orders INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    FOREIGN KEY (slot_id) REFERENCES delivery_slots(id) ON DELETE CASCADE,
    UNIQUE(slot_id, delivery_date
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
)

-- Table: product_weight_tier_config
DROP TABLE IF EXISTS product_weight_tier_config;
CREATE TABLE product_weight_tier_config (

id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    weight VARCHAR(50) NOT NULL,                    -- "500gm", "1kg", "1.5kg", "3kg", "5kg"
    available_tiers TEXT NOT NULL,                  -- JSON array: "[1]" or "[1,2]" or "[1,2,3]" or "[1,2,3,4]"
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tier_upgrade_price DECIMAL(10,2) DEFAULT 0.00,  -- Optional: extra cost per tier
    default_tiers INT DEFAULT 1,                -- Default number of tiers to select
    is_active BOOLEAN DEFAULT 1,
    sort_order INT DEFAULT 0,                   -- For ordering weight options
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate weight configs for same product
    UNIQUE(product_id, weight
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
)

-- Table: delivery_slots
DROP TABLE IF EXISTS delivery_slots;
CREATE TABLE delivery_slots (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    slot_name VARCHAR(50) NOT NULL, -- e.g., "Morning", "Afternoon", "Evening"
    start_time TIME NOT NULL, -- e.g., "09:00:00"
    end_time TIME NOT NULL, -- e.g., "12:00:00"
    max_orders INT DEFAULT 50,
    is_active BOOLEAN DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, display_order_limit INT DEFAULT 10,
    availability_threshold_high INT DEFAULT 60,
    availability_threshold_medium INT DEFAULT 85
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: add_on_categories
DROP TABLE IF EXISTS add_on_categories;
CREATE TABLE add_on_categories (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: product_gallery_images
DROP TABLE IF EXISTS product_gallery_images;
CREATE TABLE product_gallery_images (

id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: delivery_orders
DROP TABLE IF EXISTS delivery_orders;
CREATE TABLE delivery_orders (

id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    delivery_boy_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    status VARCHAR(20) NOT NULL DEFAULT 'assigned' ),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' ),
    special_instructions TEXT,
    delivery_photo_url TEXT,
    delivered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    items_count INT DEFAULT 0,
    picked_up_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_boy_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: combo_selections
DROP TABLE IF EXISTS combo_selections;
CREATE TABLE combo_selections (

id INT PRIMARY KEY AUTO_INCREMENT,
    cart_item_id INT,
    add_on_product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    order_item_id INT, price DECIMAL(10,2),
    discounted_price DECIMAL(10,2), total DECIMAL(10,2),
    product_name VARCHAR(255),
    FOREIGN KEY (add_on_product_id) REFERENCES add_on_products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: weight_tier_mappings
DROP TABLE IF EXISTS weight_tier_mappings;
CREATE TABLE weight_tier_mappings (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    weight VARCHAR(50) NOT NULL UNIQUE,
    available_tiers TEXT NOT NULL, -- JSON array like "[1,2]" or "[2,3]"
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: delivery_tracking
DROP TABLE IF EXISTS delivery_tracking;
CREATE TABLE delivery_tracking (

id INT PRIMARY KEY AUTO_INCREMENT,
    delivery_order_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (delivery_order_id) REFERENCES delivery_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: promo_codes
DROP TABLE IF EXISTS promo_codes;
CREATE TABLE promo_codes (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT, discount_type VARCHAR(20) NOT NULL ), discount_value DECIMAL(10,2) NOT NULL , min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2), usage_limit INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP , status VARCHAR(20) DEFAULT 'active' )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: add_on_products
DROP TABLE IF EXISTS add_on_products;
CREATE TABLE add_on_products (

id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discounted_price DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES add_on_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: referrals
DROP TABLE IF EXISTS referrals;
CREATE TABLE referrals (

id INT PRIMARY KEY AUTO_INCREMENT,
        referrer_id INT NOT NULL,
        referee_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        referral_code VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' ),
        referrer_bonus_amount DECIMAL(10,2) DEFAULT 0.00,
        referee_bonus_amount DECIMAL(10,2) DEFAULT 0.00,
        referrer_bonus_credited BOOLEAN DEFAULT 0,
        referee_bonus_credited BOOLEAN DEFAULT 0,
        referrer_bonus_credited_at DATETIME,
        referee_bonus_credited_at DATETIME,
        first_order_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (referee_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (first_order_id) REFERENCES orders(id) ON DELETE SET NULL,
        UNIQUE(referee_id
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      )

-- Table: notifications
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (

id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  type VARCHAR(50) NOT NULL, -- 'wallet_credit', 'wallet_debit', 'referral_bonus', 'milestone', 'scratch_card', 'order', 'general'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON data for additional information
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: product_reviews
DROP TABLE IF EXISTS product_reviews;
CREATE TABLE product_reviews (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255),
    rating INT NOT NULL ,
    review_title VARCHAR(200),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT 0,
    is_approved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: wishlist
DROP TABLE IF EXISTS wishlist;
CREATE TABLE wishlist (

id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, UNIQUE(customer_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: banner_analytics
DROP TABLE IF EXISTS banner_analytics;
CREATE TABLE banner_analytics (

id INT PRIMARY KEY AUTO_INCREMENT,
    banner_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    event_type VARCHAR(20) NOT NULL,
    customer_id INT, ip_address VARCHAR(45),
    user_agent TEXT, referrer_url TEXT,
    revenue DECIMAL(10, 2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: deal_performance_cache
DROP TABLE IF EXISTS deal_performance_cache;
CREATE TABLE deal_performance_cache (

deal_id INT PRIMARY KEY AUTO_INCREMENT,
    total_views INT DEFAULT 0,
    total_clicks INT DEFAULT 0,
    total_adds INT DEFAULT 0,
    total_redemptions INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    total_revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    click_through_rate DECIMAL(5,2) DEFAULT 0,
    add_to_cart_rate DECIMAL(5,2) DEFAULT 0,
    redemption_rate DECIMAL(5,2) DEFAULT 0,
    avg_cart_value DECIMAL(10,2) DEFAULT 0,
    unique_customers INT DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES one_rupee_deals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: promo_code_analytics
DROP TABLE IF EXISTS promo_code_analytics;
CREATE TABLE promo_code_analytics (

id INT PRIMARY KEY AUTO_INCREMENT,
    promo_code_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    event_type VARCHAR(20) NOT NULL ), customer_id INT,
    order_id INT, cart_value DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    validation_result VARCHAR(20), failure_reason TEXT,
    ip_address VARCHAR(45), user_agent TEXT,
    referrer_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: product_attributes
DROP TABLE IF EXISTS product_attributes;
CREATE TABLE product_attributes (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_type VARCHAR(50) NOT NULL, -- 'flavor', 'shape', 'occasion', 'dietary'
    attribute_value VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: delivery_wallet_transactions
DROP TABLE IF EXISTS delivery_wallet_transactions;
CREATE TABLE delivery_wallet_transactions (

id INT PRIMARY KEY AUTO_INCREMENT,
        delivery_boy_id INT NOT NULL,
        order_id INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        type VARCHAR(20) NOT NULL ),
        amount DECIMAL(10, 2) NOT NULL ,
        meta TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (delivery_boy_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES delivery_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: delivery_target_tiers
DROP TABLE IF EXISTS delivery_target_tiers;
CREATE TABLE delivery_target_tiers (

id INT PRIMARY KEY AUTO_INCREMENT,
min_orders INT NOT NULL ,
max_orders INT, -- NULL means no upper limit
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
bonus_amount DECIMAL(10, 2) NOT NULL ,
tier_name VARCHAR(50), -- e.g., "Bronze", "Silver", "Gold"
is_active BOOLEAN DEFAULT 1,
display_order INT DEFAULT 0, -- For sorting tiers
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
UNIQUE(min_orders) -- Ensure no duplicate min_orders
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: wallet_usage
DROP TABLE IF EXISTS wallet_usage;
CREATE TABLE wallet_usage (

id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        customer_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        amount_used DECIMAL(10,2) NOT NULL ,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: one_rupee_deals
DROP TABLE IF EXISTS one_rupee_deals;
CREATE TABLE one_rupee_deals (

id INT PRIMARY KEY AUTO_INCREMENT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    deal_title VARCHAR(200) NOT NULL,
    product_id INT NOT NULL,
    threshold_amount DECIMAL(10,2) NOT NULL,
    deal_price DECIMAL(10,2) DEFAULT 1.00,
    max_quantity_per_order INT DEFAULT 1,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, threshold_amount
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
)

-- Table: wallet_transactions
DROP TABLE IF EXISTS wallet_transactions;
CREATE TABLE wallet_transactions (

id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        type VARCHAR(20) NOT NULL ),
        amount DECIMAL(10,2) NOT NULL ,
        order_id INT,
        description VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'completed' ),
        transaction_type VARCHAR(50) NOT NULL ),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: deal_analytics
DROP TABLE IF EXISTS deal_analytics;
CREATE TABLE deal_analytics (

id INT PRIMARY KEY AUTO_INCREMENT,
    deal_id INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    event_type VARCHAR(20) NOT NULL ), customer_id INT,
    order_id INT, cart_value DECIMAL(10,2),
    revenue DECIMAL(10,2) DEFAULT 0,
    ip_address VARCHAR(45), user_agent TEXT,
    referrer_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES one_rupee_deals(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Table: scratch_cards
CREATE TABLE "scratch_cards" (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        order_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL ,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' ),
        revealed_at DATETIME,
        credited_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )

-- Table: promo_code_performance_cache
DROP TABLE IF EXISTS promo_code_performance_cache;
CREATE TABLE promo_code_performance_cache (

promo_code_id INT PRIMARY KEY AUTO_INCREMENT,
    total_views INT DEFAULT 0,
    total_validations INT DEFAULT 0,
    successful_validations INT DEFAULT 0,
    failed_validations INT DEFAULT 0,
    total_applications INT DEFAULT 0,
    total_redemptions INT DEFAULT 0,
    total_abandons INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_discount_given DECIMAL(10,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    unique_customers INT DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    validation_success_rate DECIMAL(5,2) DEFAULT 0,
    redemption_rate DECIMAL(5,2) DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
