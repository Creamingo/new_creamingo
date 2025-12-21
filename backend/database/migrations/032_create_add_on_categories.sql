-- Migration: Create add_on_categories table
-- Description: Stores categories for add-on products (Candles, Balloons, etc.)

CREATE TABLE IF NOT EXISTS add_on_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_add_on_categories_active ON add_on_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_add_on_categories_display_order ON add_on_categories(display_order);

-- Insert initial categories
INSERT INTO add_on_categories (name, display_order) VALUES
('Candles', 1),
('Balloons', 2),
('Cake Toppers', 3),
('Celebration Essentials', 4);
