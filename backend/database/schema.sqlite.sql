-- Creamingo Database Schema (SQLite)
-- SQLite Database Setup

-- Users table (Admin users)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy')),
    avatar TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    base_price DECIMAL(10,2) NOT NULL,
    base_weight VARCHAR(50),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discounted_price DECIMAL(10,2),
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    is_top_product BOOLEAN DEFAULT 0,
    is_bestseller BOOLEAN DEFAULT 0,
    allergens TEXT DEFAULT '[]',
    ingredients TEXT DEFAULT '[]',
    preparation_time INTEGER,
    serving_size VARCHAR(50),
    care_storage TEXT,
    delivery_guidelines TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    weight VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discounted_price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(200),
    button_text VARCHAR(50),
    button_url TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Banner Analytics table
CREATE TABLE IF NOT EXISTS banner_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    banner_id INTEGER NOT NULL,
    event_type VARCHAR(20) NOT NULL, -- 'view', 'click', 'conversion'
    customer_id INTEGER, -- NULL for anonymous users
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    referrer_url TEXT,
    revenue DECIMAL(10, 2) DEFAULT 0, -- Revenue from conversions (if applicable)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE
);

-- Indexes for banner_analytics
CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_id ON banner_analytics(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_event_type ON banner_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_created_at ON banner_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_event ON banner_analytics(banner_id, event_type);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Collection products (many-to-many relationship)
CREATE TABLE IF NOT EXISTS collection_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(collection_id, product_id)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'preparing', 'ready', 
        'out_for_delivery', 'delivered', 'cancelled'
    )),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time VARCHAR(20) NOT NULL,
    special_instructions TEXT,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_gateway_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Featured Categories table
CREATE TABLE IF NOT EXISTS featured_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id),
    CHECK (display_order >= 0)
);

-- Featured Products table
CREATE TABLE IF NOT EXISTS featured_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    section VARCHAR(50) NOT NULL CHECK (section IN ('top_products', 'bestsellers')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, section),
    CHECK (display_order >= 0)
);

-- Insert default admin user (password: Creamingo@2427)
INSERT OR IGNORE INTO users (name, email, password, role) VALUES 
('Super Admin', 'admin@creamingo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'super_admin'),
('Staff User', 'staff@creamingo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'staff');

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES 
('site_name', '"Creamingo"', 'Website name'),
('site_description', '"Premium Cake Ordering Platform"', 'Website description'),
('contact_email', '"contact@creamingo.com"', 'Contact email'),
('contact_phone', '"+1234567890"', 'Contact phone'),
('delivery_areas', '["Downtown", "Uptown", "Midtown"]', 'Available delivery areas'),
('payment_methods', '["cash", "card", "upi", "wallet"]', 'Accepted payment methods'),
('business_hours', '{"monday": "9:00 AM - 9:00 PM", "tuesday": "9:00 AM - 9:00 PM", "wednesday": "9:00 AM - 9:00 PM", "thursday": "9:00 AM - 9:00 PM", "friday": "9:00 AM - 10:00 PM", "saturday": "9:00 AM - 10:00 PM", "sunday": "10:00 AM - 8:00 PM"}', 'Business hours'),
('social_links', '{"facebook": "https://facebook.com/creamingo", "instagram": "https://instagram.com/creamingo", "twitter": "https://twitter.com/creamingo"}', 'Social media links');

-- Insert sample categories
INSERT OR IGNORE INTO categories (name, description, image_url, order_index) VALUES 
('Birthday Cakes', 'Delicious birthday cakes for all ages', 'https://example.com/birthday-cakes.jpg', 1),
('Wedding Cakes', 'Elegant wedding cakes for your special day', 'https://example.com/wedding-cakes.jpg', 2),
('Custom Cakes', 'Personalized cakes made to order', 'https://example.com/custom-cakes.jpg', 3),
('Cupcakes', 'Individual cupcakes in various flavors', 'https://example.com/cupcakes.jpg', 4),
('Pick a Cake by Flavor', 'Cakes organized by delicious flavors', '/Design 1.webp', 5),
('Birthday', 'Celebrate special birthdays with our delicious cakes', '/Design 1.webp', 6),
('Anniversary', 'Mark your special milestones with our anniversary cakes', '/Design 2.webp', 7),
('Engagement', 'Celebrate your engagement with our elegant cakes', '/Design 3.webp', 8),
('Wedding', 'Make your wedding day perfect with our wedding cakes', '/Design 4.webp', 9),
('New Beginning', 'Start new chapters with our celebration cakes', '/Design 1.webp', 10),
('No Reason Cake', 'Sometimes you just need a cake for no reason at all', '/Design 2.webp', 11);

-- Insert sample subcategories
INSERT OR IGNORE INTO subcategories (name, description, category_id, image_url, order_index) VALUES 
('Kids Birthday Cakes', 'Fun and colorful cakes for children', 1, 'https://example.com/kids-birthday.jpg', 1),
('Adult Birthday Cakes', 'Sophisticated cakes for adults', 1, 'https://example.com/adult-birthday.jpg', 2),
('Traditional Wedding Cakes', 'Classic multi-tier wedding cakes', 2, 'https://example.com/traditional-wedding.jpg', 1),
('Modern Wedding Cakes', 'Contemporary wedding cake designs', 2, 'https://example.com/modern-wedding.jpg', 2),
('Chocolate', 'Rich and decadent chocolate cakes', 5, '/Design 1.webp', 1),
('Choco Truffle', 'Luxurious truffle chocolate cakes', 5, '/Design 1.webp', 2),
('Pineapple', 'Fresh and tropical pineapple cakes', 5, '/Design 2.webp', 3),
('Red Velvet', 'Classic red velvet with cream cheese', 5, '/Design 2.webp', 4),
('Butterscotch', 'Sweet and creamy butterscotch', 5, '/Design 1.webp', 5),
('Black Forest', 'Cherry and chocolate combination', 5, '/Design 3.webp', 6),
('Strawberry', 'Fresh strawberry delight', 5, '/Design 4.webp', 7),
('Mixed Fruits', 'Fresh fruits and cream delight', 5, '/Design 4.webp', 8),
('Vanilla', 'Classic vanilla with rich frosting', 5, '/Design 2.webp', 9),
('Blueberry', 'Sweet blueberry flavor', 5, '/Design 3.webp', 10),
-- Occasion subcategories
('Chocolate Birthday', 'Rich chocolate birthday cakes', 6, '/Design 1.webp', 1),
('Vanilla Birthday', 'Classic vanilla birthday cakes', 6, '/Design 2.webp', 2),
('Strawberry Birthday', 'Fresh strawberry birthday cakes', 6, '/Design 3.webp', 3),
('Red Velvet Birthday', 'Luxurious red velvet birthday cakes', 6, '/Design 4.webp', 4),
('Butterscotch Birthday', 'Sweet butterscotch birthday cakes', 6, '/Design 1.webp', 5),
('Chocolate Anniversary', 'Rich chocolate anniversary cakes', 7, '/Design 2.webp', 1),
('Vanilla Anniversary', 'Classic vanilla anniversary cakes', 7, '/Design 3.webp', 2),
('Strawberry Anniversary', 'Fresh strawberry anniversary cakes', 7, '/Design 4.webp', 3),
('Red Velvet Anniversary', 'Luxurious red velvet anniversary cakes', 7, '/Design 1.webp', 4),
('Butterscotch Anniversary', 'Sweet butterscotch anniversary cakes', 7, '/Design 2.webp', 5),
('Chocolate Engagement', 'Rich chocolate engagement cakes', 8, '/Design 3.webp', 1),
('Vanilla Engagement', 'Classic vanilla engagement cakes', 8, '/Design 4.webp', 2),
('Strawberry Engagement', 'Fresh strawberry engagement cakes', 8, '/Design 1.webp', 3),
('Red Velvet Engagement', 'Luxurious red velvet engagement cakes', 8, '/Design 2.webp', 4),
('Butterscotch Engagement', 'Sweet butterscotch engagement cakes', 8, '/Design 3.webp', 5),
('Chocolate Wedding', 'Rich chocolate wedding cakes', 9, '/Design 4.webp', 1),
('Vanilla Wedding', 'Classic vanilla wedding cakes', 9, '/Design 1.webp', 2),
('Strawberry Wedding', 'Fresh strawberry wedding cakes', 9, '/Design 2.webp', 3),
('Red Velvet Wedding', 'Luxurious red velvet wedding cakes', 9, '/Design 3.webp', 4),
('Butterscotch Wedding', 'Sweet butterscotch wedding cakes', 9, '/Design 4.webp', 5),
('Chocolate New Beginning', 'Rich chocolate new beginning cakes', 10, '/Design 1.webp', 1),
('Vanilla New Beginning', 'Classic vanilla new beginning cakes', 10, '/Design 2.webp', 2),
('Strawberry New Beginning', 'Fresh strawberry new beginning cakes', 10, '/Design 3.webp', 3),
('Red Velvet New Beginning', 'Luxurious red velvet new beginning cakes', 10, '/Design 4.webp', 4),
('Butterscotch New Beginning', 'Sweet butterscotch new beginning cakes', 10, '/Design 1.webp', 5),
('Chocolate No Reason', 'Rich chocolate no reason cakes', 11, '/Design 2.webp', 1),
('Vanilla No Reason', 'Classic vanilla no reason cakes', 11, '/Design 3.webp', 2),
('Strawberry No Reason', 'Fresh strawberry no reason cakes', 11, '/Design 4.webp', 3),
('Red Velvet No Reason', 'Luxurious red velvet no reason cakes', 11, '/Design 1.webp', 4),
('Butterscotch No Reason', 'Sweet butterscotch no reason cakes', 11, '/Design 2.webp', 5);

-- Insert sample products
INSERT OR IGNORE INTO products (name, description, category_id, subcategory_id, base_price, base_weight, discount_percent, discounted_price, image_url, is_featured, is_top_product, is_bestseller) VALUES 
('Chocolate Delight', 'Rich chocolate cake with chocolate ganache', 1, 1, 25.99, '1 kg', 10, 23.39, 'https://example.com/chocolate-delight.jpg', 1, 1, 1),
('Vanilla Dream', 'Classic vanilla cake with buttercream frosting', 1, 2, 22.99, '1 kg', 0, 22.99, 'https://example.com/vanilla-dream.jpg', 0, 0, 1),
('Red Velvet Royal', 'Luxurious red velvet cake with cream cheese frosting', 2, 3, 45.99, '2 kg', 15, 39.09, 'https://example.com/red-velvet-royal.jpg', 1, 1, 0),
('Strawberry Shortcake', 'Fresh strawberry cake with whipped cream', 3, NULL, 28.99, '1.5 kg', 5, 27.54, 'https://example.com/strawberry-shortcake.jpg', 0, 0, 0);

-- Insert sample product variants
INSERT OR IGNORE INTO product_variants (product_id, name, weight, price, discount_percent, discounted_price, stock_quantity) VALUES 
(1, 'Small', '1/2 kg', 25.99, 10, 23.39, 10),
(1, 'Medium', '1 kg', 45.99, 10, 41.39, 8),
(1, 'Large', '2 kg', 85.99, 10, 77.39, 5),
(2, 'Small', '1/2 kg', 22.99, 0, 22.99, 12),
(2, 'Medium', '1 kg', 42.99, 0, 42.99, 10),
(3, 'Small', '1 kg', 45.99, 15, 39.09, 6),
(3, 'Medium', '2 kg', 85.99, 15, 73.09, 4),
(3, 'Large', '3 kg', 125.99, 15, 107.09, 2);

-- Insert sample featured categories
INSERT OR IGNORE INTO featured_categories (category_id, display_order, is_active) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1);

-- Insert sample featured products
INSERT OR IGNORE INTO featured_products (product_id, section, display_order, is_active) VALUES
-- Top Products (max 5)
(1, 'top_products', 1, 1),
(2, 'top_products', 2, 1),
(3, 'top_products', 3, 1),
-- Bestsellers (max 10)
(1, 'bestsellers', 1, 1),
(2, 'bestsellers', 2, 1),
(3, 'bestsellers', 3, 1),
(4, 'bestsellers', 4, 1);

-- Insert sample banners
INSERT OR IGNORE INTO banners (title, subtitle, button_text, button_url, image_url, order_index) VALUES 
('Welcome to Creamingo', 'Premium Cakes for Every Occasion', 'Order Now', '/products', 'https://example.com/banner1.jpg', 1),
('Special Offer', '20% Off on Birthday Cakes', 'Shop Now', '/categories/birthday', 'https://example.com/banner2.jpg', 2);

-- Insert sample collections
INSERT OR IGNORE INTO collections (name, description, image_url, order_index) VALUES 
('Kids Favorites', 'Popular cakes loved by children', 'https://example.com/kids-favorites.jpg', 1),
('Trending Now', 'Currently popular cake designs', 'https://example.com/trending-now.jpg', 2),
('Premium Collection', 'Our finest and most luxurious cakes', 'https://example.com/premium-collection.jpg', 3);

-- Insert sample customers
INSERT OR IGNORE INTO customers (name, email, phone, address) VALUES 
('John Doe', 'john@example.com', '+1234567890', '{"street": "123 Main St", "city": "New York", "state": "NY", "zip_code": "10001", "country": "USA"}'),
('Jane Smith', 'jane@example.com', '+1234567891', '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip_code": "90210", "country": "USA"}');

-- Create indexes for better performance (after all tables and data are created)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_featured_categories_display_order ON featured_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_categories_is_active ON featured_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_categories_category_id ON featured_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_products_section ON featured_products(section);
CREATE INDEX IF NOT EXISTS idx_featured_products_display_order ON featured_products(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_products_is_active ON featured_products(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_products_product_id ON featured_products(product_id);
CREATE INDEX IF NOT EXISTS idx_featured_products_section_order ON featured_products(section, display_order);