-- Migration: Add discount fields to products table
-- Description: Add base_weight, base_price, discount_percent, and auto-calculated discounted_price

-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_weight VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;

-- Add auto-calculated discounted_price column
ALTER TABLE products ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(10,2) 
GENERATED ALWAYS AS (base_price - (base_price * discount_percent / 100)) STORED;

-- Update existing products to have base values (migrate from existing price/weight)
UPDATE products SET 
  base_weight = weight,
  base_price = price,
  discount_percent = 0
WHERE base_weight IS NULL OR base_price IS NULL;

-- Add constraints
ALTER TABLE products ADD CONSTRAINT chk_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100);
ALTER TABLE products ADD CONSTRAINT chk_base_price CHECK (base_price > 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_discount_percent ON products(discount_percent);
CREATE INDEX IF NOT EXISTS idx_products_discounted_price ON products(discounted_price);
CREATE INDEX IF NOT EXISTS idx_products_active_discounts ON products(discount_percent) WHERE discount_percent > 0;

-- Add discount fields to product_variants table
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS discounted_price NUMERIC(10,2) 
GENERATED ALWAYS AS (price - (price * discount_percent / 100)) STORED;

-- Add constraints for product_variants
ALTER TABLE product_variants ADD CONSTRAINT chk_variant_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Create indexes for product_variants
CREATE INDEX IF NOT EXISTS idx_product_variants_discount_percent ON product_variants(discount_percent);
CREATE INDEX IF NOT EXISTS idx_product_variants_discounted_price ON product_variants(discounted_price);

-- Sample data update (optional - for testing)
UPDATE products SET 
  discount_percent = 15.00
WHERE id = 1;

UPDATE products SET 
  discount_percent = 10.00
WHERE id = 2;
