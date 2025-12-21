-- Migration: Enhance product schema for Cake Description Page
-- Date: 2024-01-XX
-- Description: Add fields needed for comprehensive product description pages

-- Add new columns to products table for enhanced product details
ALTER TABLE products ADD COLUMN slug VARCHAR(255);
ALTER TABLE products ADD COLUMN short_description TEXT;
ALTER TABLE products ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE products ADD COLUMN review_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN is_eggless BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN preparation_time_hours INTEGER DEFAULT 2;
ALTER TABLE products ADD COLUMN serving_size_description TEXT;
ALTER TABLE products ADD COLUMN is_bestseller BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN is_new_launch BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN is_trending BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN meta_title VARCHAR(255);
ALTER TABLE products ADD COLUMN meta_description TEXT;
ALTER TABLE products ADD COLUMN tags TEXT;

-- Create product_attributes table for flexible product customization
CREATE TABLE product_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_type VARCHAR(50) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create product_reviews table for customer reviews
CREATE TABLE product_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(200),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT 0,
    is_approved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create product_review_images table for review photos
CREATE TABLE product_review_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_bestseller ON products(is_bestseller);
CREATE INDEX idx_products_new_launch ON products(is_new_launch);
CREATE INDEX idx_products_trending ON products(is_trending);
CREATE INDEX idx_products_eggless ON products(is_eggless);

CREATE INDEX idx_product_attributes_product ON product_attributes(product_id);
CREATE INDEX idx_product_attributes_type ON product_attributes(attribute_type);
CREATE INDEX idx_product_attributes_default ON product_attributes(is_default);

CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX idx_product_reviews_verified ON product_reviews(is_verified_purchase);

CREATE INDEX idx_product_review_images_review ON product_review_images(review_id);

-- Create triggers for updated_at (SQLite syntax)
CREATE TRIGGER update_product_attributes_updated_at 
    AFTER UPDATE ON product_attributes 
    FOR EACH ROW 
    BEGIN
        UPDATE product_attributes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_product_reviews_updated_at 
    AFTER UPDATE ON product_reviews 
    FOR EACH ROW 
    BEGIN
        UPDATE product_reviews SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update existing products with sample data
UPDATE products SET 
    slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', '')),
    short_description = SUBSTR(description, 1, 100) || '...',
    rating = 4.2 + (RANDOM() % 8) / 10.0, -- Random rating between 4.2-5.0
    review_count = 10 + (RANDOM() % 50), -- Random review count 10-60
    is_eggless = CASE WHEN RANDOM() % 2 = 0 THEN 1 ELSE 0 END,
    preparation_time_hours = 2 + (RANDOM() % 4), -- 2-6 hours
    serving_size_description = CASE 
        WHEN base_weight LIKE '%0.5%' THEN 'Serves 4-6 people'
        WHEN base_weight LIKE '%1%' THEN 'Serves 8-10 people'
        WHEN base_weight LIKE '%2%' THEN 'Serves 15-20 people'
        ELSE 'Serves 6-8 people'
    END,
    is_bestseller = CASE WHEN RANDOM() % 3 = 0 THEN 1 ELSE 0 END,
    is_new_launch = CASE WHEN RANDOM() % 5 = 0 THEN 1 ELSE 0 END,
    is_trending = CASE WHEN RANDOM() % 4 = 0 THEN 1 ELSE 0 END,
    meta_title = name || ' - Premium Cake | Creamingo',
    meta_description = SUBSTR(description, 1, 150) || '...',
    tags = '["cake", "premium", "fresh"]'
WHERE slug IS NULL;

-- Insert sample product attributes
INSERT INTO product_attributes (product_id, attribute_type, attribute_value, is_default, display_order) VALUES
(1, 'flavor', 'Chocolate', 1, 1),
(1, 'flavor', 'Vanilla', 0, 2),
(1, 'flavor', 'Strawberry', 0, 3),
(1, 'shape', 'Round', 1, 1),
(1, 'shape', 'Heart', 0, 2),
(1, 'shape', 'Square', 0, 3),
(1, 'occasion', 'Birthday', 1, 1),
(1, 'occasion', 'Anniversary', 0, 2),
(1, 'dietary', 'Eggless Available', 0, 1);

-- Insert sample reviews
INSERT INTO product_reviews (product_id, customer_name, customer_email, rating, review_title, review_text, is_verified_purchase, is_approved) VALUES
(1, 'Priya Sharma', 'priya@example.com', 5, 'Absolutely delicious!', 'The cake was fresh, moist, and exactly as described. Perfect for my daughter''s birthday party. Highly recommended!', 1, 1),
(1, 'Rajesh Kumar', 'rajesh@example.com', 4, 'Great taste and quality', 'Good quality cake with fresh ingredients. Delivery was on time and packaging was excellent.', 1, 1),
(1, 'Sneha Patel', 'sneha@example.com', 5, 'Exceeded expectations', 'The cake looked even better than the photos. Everyone at the party loved it. Will definitely order again!', 1, 1);

-- Insert sample review images
INSERT INTO product_review_images (review_id, image_url, display_order) VALUES
(1, 'https://example.com/review1.jpg', 1),
(2, 'https://example.com/review2.jpg', 1),
(3, 'https://example.com/review3.jpg', 1);
