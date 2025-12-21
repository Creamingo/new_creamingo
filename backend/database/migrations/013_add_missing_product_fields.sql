-- Migration: Add missing fields to products table
-- Date: 2025-09-13
-- Description: Add base_weight, discount_percent, discounted_price, is_top_product, is_bestseller fields

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN base_weight VARCHAR(50);
ALTER TABLE products ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN discounted_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN is_top_product BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN is_bestseller BOOLEAN DEFAULT 0;

-- Add missing columns to product_variants table
ALTER TABLE product_variants ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN discounted_price DECIMAL(10,2);

-- Update existing products with default values
UPDATE products SET 
    base_weight = '1 kg',
    discount_percent = 0,
    discounted_price = base_price,
    is_top_product = 0,
    is_bestseller = 0
WHERE base_weight IS NULL;

-- Update existing product variants with default values
UPDATE product_variants SET 
    discount_percent = 0,
    discounted_price = price
WHERE discount_percent IS NULL;
