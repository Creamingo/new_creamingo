-- Migration: Create featured_products table
-- Description: Table to manage featured products for Top Products and Bestsellers sections

CREATE TABLE IF NOT EXISTS featured_products (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL CHECK (section IN ('top_products', 'bestsellers')),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique product per section
    UNIQUE(product_id, section),
    
    -- Ensure display_order is non-negative
    CHECK (display_order >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_featured_products_section ON featured_products(section);
CREATE INDEX IF NOT EXISTS idx_featured_products_display_order ON featured_products(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_products_is_active ON featured_products(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_products_product_id ON featured_products(product_id);
CREATE INDEX IF NOT EXISTS idx_featured_products_section_order ON featured_products(section, display_order);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_featured_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_featured_products_updated_at
    BEFORE UPDATE ON featured_products
    FOR EACH ROW
    EXECUTE FUNCTION update_featured_products_updated_at();

-- Insert some sample featured products (assuming products table exists)
-- Note: These will only work if products with IDs 1, 2, 3, 4, 5 exist
INSERT INTO featured_products (product_id, section, display_order, is_active) VALUES
-- Top Products (max 5)
(1, 'top_products', 1, true),
(2, 'top_products', 2, true),
(3, 'top_products', 3, true),
-- Bestsellers (max 10)
(1, 'bestsellers', 1, true),
(2, 'bestsellers', 2, true),
(3, 'bestsellers', 3, true),
(4, 'bestsellers', 4, true),
(5, 'bestsellers', 5, true)
ON CONFLICT (product_id, section) DO NOTHING;
