-- Migration: Create add_on_products table
-- Description: Stores individual add-on products within categories

CREATE TABLE IF NOT EXISTS add_on_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES add_on_categories(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_add_on_products_category ON add_on_products(category_id);
CREATE INDEX IF NOT EXISTS idx_add_on_products_active ON add_on_products(is_active);
CREATE INDEX IF NOT EXISTS idx_add_on_products_display_order ON add_on_products(display_order);

-- Insert sample products for each category
INSERT INTO add_on_products (category_id, name, description, price, image_url, display_order) VALUES
-- Candles
(1, 'Birthday Candles Set', 'Colorful birthday candles for celebration', 45.00, '/images/addons/candles/birthday-candles.jpg', 1),
(1, 'Aromatic Scented Candle', 'Lavender scented candle for ambiance', 120.00, '/images/addons/candles/scented-candle.jpg', 2),
(1, 'Decorative Tea Light', 'Small decorative tea light candles', 25.00, '/images/addons/candles/tea-light.jpg', 3),

-- Balloons
(2, 'Happy Birthday Balloons', 'Colorful birthday balloons set', 80.00, '/images/addons/balloons/birthday-balloons.jpg', 1),
(2, 'Heart Shaped Balloons', 'Red heart balloons for special occasions', 60.00, '/images/addons/balloons/heart-balloons.jpg', 2),
(2, 'Number Balloons', 'Large number balloons for age celebration', 150.00, '/images/addons/balloons/number-balloons.jpg', 3),

-- Cake Toppers
(3, 'Happy Birthday Topper', 'Classic birthday cake topper', 35.00, '/images/addons/toppers/birthday-topper.jpg', 1),
(3, 'Wedding Cake Topper', 'Elegant wedding cake topper', 200.00, '/images/addons/toppers/wedding-topper.jpg', 2),
(3, 'Anniversary Topper', 'Beautiful anniversary cake topper', 75.00, '/images/addons/toppers/anniversary-topper.jpg', 3),

-- Celebration Essentials
(4, 'Party Hats Set', 'Colorful party hats for guests', 50.00, '/images/addons/essentials/party-hats.jpg', 1),
(4, 'Confetti Pack', 'Colorful confetti for celebration', 30.00, '/images/addons/essentials/confetti.jpg', 2),
(4, 'Streamers Set', 'Decorative streamers for decoration', 40.00, '/images/addons/essentials/streamers.jpg', 3);
