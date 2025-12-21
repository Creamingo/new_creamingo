-- Migration: Add many-to-many relationship between products and categories/subcategories
-- Date: 2024-01-XX
-- Description: Creates junction tables to support multiple categories and subcategories per product

-- Create product_categories junction table
CREATE TABLE product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT 0, -- Mark primary category
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, category_id)
);

-- Create product_subcategories junction table  
CREATE TABLE product_subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    subcategory_id INTEGER NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT 0, -- Mark primary subcategory
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, subcategory_id)
);

-- Add indexes for better performance
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
CREATE INDEX idx_product_categories_primary ON product_categories(is_primary);
CREATE INDEX idx_product_subcategories_product ON product_subcategories(product_id);
CREATE INDEX idx_product_subcategories_subcategory ON product_subcategories(subcategory_id);
CREATE INDEX idx_product_subcategories_primary ON product_subcategories(is_primary);

-- Migrate existing data from products table to junction tables
-- Migrate existing category relationships
INSERT INTO product_categories (product_id, category_id, is_primary, display_order)
SELECT 
    id, 
    category_id, 
    1, -- All existing categories are primary (1 = true in SQLite)
    1  -- Default display order
FROM products 
WHERE category_id IS NOT NULL;

-- Migrate existing subcategory relationships
INSERT INTO product_subcategories (product_id, subcategory_id, is_primary, display_order)
SELECT 
    id, 
    subcategory_id, 
    1, -- All existing subcategories are primary (1 = true in SQLite)
    1  -- Default display order
FROM products 
WHERE subcategory_id IS NOT NULL;

-- Create triggers for updated_at (SQLite syntax)
CREATE TRIGGER update_product_categories_updated_at 
    AFTER UPDATE ON product_categories 
    FOR EACH ROW 
    BEGIN
        UPDATE product_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_product_subcategories_updated_at 
    AFTER UPDATE ON product_subcategories 
    FOR EACH ROW 
    BEGIN
        UPDATE product_subcategories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Note: SQLite doesn't support COMMENT ON statements, so we'll document in code comments
-- Junction table for many-to-many relationship between products and categories
-- is_primary: Indicates if this is the primary category for the product
-- display_order: Order in which categories should be displayed for the product
-- 
-- Junction table for many-to-many relationship between products and subcategories  
-- is_primary: Indicates if this is the primary subcategory for the product
-- display_order: Order in which subcategories should be displayed for the product
