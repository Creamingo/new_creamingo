-- Migration: Add rating_count column to products table
-- Date: 2024-01-XX
-- Description: Add rating_count column to distinguish between ratings and reviews

-- Add rating_count column to products table
ALTER TABLE products ADD COLUMN rating_count INTEGER DEFAULT 0;

-- Update existing products with rating counts
-- This will calculate rating_count for existing products
UPDATE products SET rating_count = (
  SELECT COUNT(*) - COUNT(CASE WHEN review_text IS NOT NULL AND review_text != '' AND review_text != 'null' THEN 1 END)
  FROM product_reviews 
  WHERE product_reviews.product_id = products.id AND product_reviews.is_approved = 1
);
