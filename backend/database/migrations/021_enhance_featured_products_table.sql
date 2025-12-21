-- Migration: Enhance featured_products table with status fields
-- Date: 2025-01-28
-- Description: Add status fields to featured_products table to match products table functionality

-- Add status fields to featured_products table
ALTER TABLE featured_products ADD COLUMN is_featured BOOLEAN DEFAULT 0;
ALTER TABLE featured_products ADD COLUMN is_top_product BOOLEAN DEFAULT 0;
ALTER TABLE featured_products ADD COLUMN is_bestseller BOOLEAN DEFAULT 0;

-- Update existing records to sync with products table
UPDATE featured_products 
SET is_top_product = 1 
WHERE section = 'top_products';

UPDATE featured_products 
SET is_bestseller = 1 
WHERE section = 'bestsellers';

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_featured_products_is_featured ON featured_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_featured_products_is_top_product ON featured_products(is_top_product);
CREATE INDEX IF NOT EXISTS idx_featured_products_is_bestseller ON featured_products(is_bestseller);
