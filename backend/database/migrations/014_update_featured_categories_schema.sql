-- Migration: Update featured_categories table to support categories/subcategories and view flags
-- Description: Add support for both categories and subcategories, and device-specific display flags

-- First, let's backup existing data
CREATE TABLE IF NOT EXISTS featured_categories_backup AS 
SELECT * FROM featured_categories;

-- Drop the existing table and recreate with new schema
DROP TABLE IF EXISTS featured_categories;

-- Create new featured_categories table with enhanced schema
CREATE TABLE featured_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('category', 'subcategory')),
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    show_on_desktop BOOLEAN DEFAULT true,
    show_on_mobile BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one of category_id or subcategory_id is set
    CHECK (
        (item_type = 'category' AND category_id IS NOT NULL AND subcategory_id IS NULL) OR
        (item_type = 'subcategory' AND subcategory_id IS NOT NULL AND category_id IS NULL)
    ),
    
    -- Ensure unique items per type
    UNIQUE(category_id, item_type),
    UNIQUE(subcategory_id, item_type),
    
    -- Ensure display_order is non-negative
    CHECK (display_order >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_categories_display_order ON featured_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_categories_is_active ON featured_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_categories_category_id ON featured_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_featured_categories_subcategory_id ON featured_categories(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_featured_categories_item_type ON featured_categories(item_type);
CREATE INDEX IF NOT EXISTS idx_featured_categories_show_desktop ON featured_categories(show_on_desktop);
CREATE INDEX IF NOT EXISTS idx_featured_categories_show_mobile ON featured_categories(show_on_mobile);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_featured_categories_updated_at
    AFTER UPDATE ON featured_categories
    FOR EACH ROW
    WHEN NEW.id = OLD.id
BEGIN
    UPDATE featured_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Migrate existing data from backup
INSERT INTO featured_categories (
    item_type, 
    category_id, 
    display_order, 
    is_active, 
    show_on_desktop, 
    show_on_mobile, 
    created_at, 
    updated_at
)
SELECT 
    'category' as item_type,
    category_id,
    display_order,
    is_active,
    true as show_on_desktop,
    true as show_on_mobile,
    created_at,
    updated_at
FROM featured_categories_backup;

-- Drop the backup table
DROP TABLE featured_categories_backup;
