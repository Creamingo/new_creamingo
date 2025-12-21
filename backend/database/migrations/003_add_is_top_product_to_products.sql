-- Migration: Add is_top_product and is_bestseller columns to products table
-- Description: Add boolean columns to mark products as Top Products and Bestsellers

-- Add is_top_product column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_top_product BOOLEAN DEFAULT FALSE;

-- Add is_bestseller column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance when filtering top products
CREATE INDEX IF NOT EXISTS idx_products_is_top_product ON products(is_top_product);
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON products(is_bestseller);

-- Create indexes for combined filtering (active top products and bestsellers)
CREATE INDEX IF NOT EXISTS idx_products_active_top_products ON products(is_active, is_top_product) WHERE is_active = TRUE AND is_top_product = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active_bestsellers ON products(is_active, is_bestseller) WHERE is_active = TRUE AND is_bestseller = TRUE;

-- Update some existing products to be top products and bestsellers (optional)
UPDATE products SET is_top_product = TRUE WHERE id IN (1, 2, 3) ON CONFLICT DO NOTHING;
UPDATE products SET is_bestseller = TRUE WHERE id IN (1, 2, 3, 4, 5) ON CONFLICT DO NOTHING;
