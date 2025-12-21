-- Creamingo Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Admin users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff', 'bakery_production', 'delivery_boy')),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,
    base_price DECIMAL(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    allergens TEXT[] DEFAULT '{}',
    ingredients TEXT[] DEFAULT '{}',
    preparation_time INTEGER, -- in minutes
    serving_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product variants table
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    weight VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Banners table
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(200),
    button_text VARCHAR(50),
    button_url TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Collections table
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Collection products (many-to-many relationship)
CREATE TABLE collection_products (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(collection_id, product_id)
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'preparing', 'ready', 
        'out_for_delivery', 'delivered', 'cancelled'
    )),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address JSONB NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time VARCHAR(20) NOT NULL,
    special_instructions TEXT,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'wallet')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_gateway_response JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Insert default admin user
INSERT INTO users (name, email, password, role) VALUES 
('Super Admin', 'admin@creamingo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'super_admin'),
('Staff User', 'staff@creamingo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'staff');
-- Note: The password hash above is for 'Creamingo@2427'

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES 
('site_name', '"Creamingo"', 'Website name'),
('site_description', '"Premium Cake Ordering Platform"', 'Website description'),
('contact_email', '"contact@creamingo.com"', 'Contact email'),
('contact_phone', '"+1234567890"', 'Contact phone'),
('delivery_areas', '["Downtown", "Uptown", "Midtown"]', 'Available delivery areas'),
('payment_methods', '["cash", "card", "upi", "wallet"]', 'Accepted payment methods'),
('business_hours', '{"monday": "9:00 AM - 9:00 PM", "tuesday": "9:00 AM - 9:00 PM", "wednesday": "9:00 AM - 9:00 PM", "thursday": "9:00 AM - 9:00 PM", "friday": "9:00 AM - 10:00 PM", "saturday": "9:00 AM - 10:00 PM", "sunday": "10:00 AM - 8:00 PM"}', 'Business hours'),
('social_links', '{"facebook": "https://facebook.com/creamingo", "instagram": "https://instagram.com/creamingo", "twitter": "https://twitter.com/creamingo"}', 'Social media links');

-- Insert sample categories
INSERT INTO categories (name, description, image_url, order_index) VALUES 
('Birthday Cakes', 'Delicious birthday cakes for all ages', 'https://example.com/birthday-cakes.jpg', 1),
('Wedding Cakes', 'Elegant wedding cakes for your special day', 'https://example.com/wedding-cakes.jpg', 2),
('Custom Cakes', 'Personalized cakes made to order', 'https://example.com/custom-cakes.jpg', 3),
('Cupcakes', 'Individual cupcakes in various flavors', 'https://example.com/cupcakes.jpg', 4);

-- Insert sample subcategories
INSERT INTO subcategories (name, description, category_id, image_url, order_index) VALUES 
('Kids Birthday Cakes', 'Fun and colorful cakes for children', 1, 'https://example.com/kids-birthday.jpg', 1),
('Adult Birthday Cakes', 'Sophisticated cakes for adults', 1, 'https://example.com/adult-birthday.jpg', 2),
('Traditional Wedding Cakes', 'Classic multi-tier wedding cakes', 2, 'https://example.com/traditional-wedding.jpg', 1),
('Modern Wedding Cakes', 'Contemporary wedding cake designs', 2, 'https://example.com/modern-wedding.jpg', 2);

-- Insert sample products
INSERT INTO products (name, description, category_id, subcategory_id, base_price, image_url, is_featured) VALUES 
('Chocolate Delight', 'Rich chocolate cake with chocolate ganache', 1, 1, 25.99, 'https://example.com/chocolate-delight.jpg', true),
('Vanilla Dream', 'Classic vanilla cake with buttercream frosting', 1, 2, 22.99, 'https://example.com/vanilla-dream.jpg', false),
('Red Velvet Royal', 'Luxurious red velvet cake with cream cheese frosting', 2, 3, 45.99, 'https://example.com/red-velvet-royal.jpg', true),
('Strawberry Shortcake', 'Fresh strawberry cake with whipped cream', 3, NULL, 28.99, 'https://example.com/strawberry-shortcake.jpg', false);

-- Insert sample product variants
INSERT INTO product_variants (product_id, name, weight, price, stock_quantity) VALUES 
(1, 'Small', '1/2 kg', 25.99, 10),
(1, 'Medium', '1 kg', 45.99, 8),
(1, 'Large', '2 kg', 85.99, 5),
(2, 'Small', '1/2 kg', 22.99, 12),
(2, 'Medium', '1 kg', 42.99, 10),
(3, 'Small', '1 kg', 45.99, 6),
(3, 'Medium', '2 kg', 85.99, 4),
(3, 'Large', '3 kg', 125.99, 2);

-- Insert sample banners
INSERT INTO banners (title, subtitle, button_text, button_url, image_url, order_index) VALUES 
('Welcome to Creamingo', 'Premium Cakes for Every Occasion', 'Order Now', '/products', 'https://example.com/banner1.jpg', 1),
('Special Offer', '20% Off on Birthday Cakes', 'Shop Now', '/categories/birthday', 'https://example.com/banner2.jpg', 2);

-- Insert sample collections
INSERT INTO collections (name, description, image_url, order_index) VALUES 
('Kids Favorites', 'Popular cakes loved by children', 'https://example.com/kids-favorites.jpg', 1),
('Trending Now', 'Currently popular cake designs', 'https://example.com/trending-now.jpg', 2),
('Premium Collection', 'Our finest and most luxurious cakes', 'https://example.com/premium-collection.jpg', 3);

-- Insert sample customers
INSERT INTO customers (name, email, phone, address) VALUES 
('John Doe', 'john@example.com', '+1234567890', '{"street": "123 Main St", "city": "New York", "state": "NY", "zip_code": "10001", "country": "USA"}'),
('Jane Smith', 'jane@example.com', '+1234567891', '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip_code": "90210", "country": "USA"}');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
