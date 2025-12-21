-- Migration: Add discount fields to add_on_products table
-- Description: Adds discount_percentage and discounted_price fields for add-on products

-- Add discount fields to add_on_products table
ALTER TABLE add_on_products ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE add_on_products ADD COLUMN discounted_price DECIMAL(10,2) DEFAULT 0;

-- Update existing products to set discounted_price = price where discount_percentage = 0
UPDATE add_on_products SET discounted_price = price WHERE discount_percentage = 0 OR discount_percentage IS NULL;
