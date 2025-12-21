-- Migration: Create featured_categories table
-- Description: Table to manage featured categories for homepage display

CREATE TABLE IF NOT EXISTS featured_categories (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique category per featured list
    UNIQUE(category_id),
    
    -- Ensure display_order is non-negative
    CHECK (display_order >= 0)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_featured_categories_display_order ON featured_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_categories_is_active ON featured_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_categories_category_id ON featured_categories(category_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_featured_categories_updated_at
    BEFORE UPDATE ON featured_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_featured_categories_updated_at();

-- Insert some sample featured categories (assuming categories table exists)
-- Note: These will only work if categories with IDs 1, 2, 3 exist
INSERT INTO featured_categories (category_id, display_order, is_active) VALUES
(1, 1, true),
(2, 2, true),
(3, 3, true)
ON CONFLICT (category_id) DO NOTHING;
