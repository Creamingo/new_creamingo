-- Migration: Add care_storage and delivery_guidelines fields to products table
-- Date: 2024-01-XX
-- Description: Adds two new text fields for product care & storage instructions and delivery guidelines

-- Add care_storage field to products table
ALTER TABLE products ADD COLUMN care_storage TEXT;

-- Add delivery_guidelines field to products table  
ALTER TABLE products ADD COLUMN delivery_guidelines TEXT;

-- Update existing products with default values (optional)
-- UPDATE products SET care_storage = 'Store in a cool, dry place. Refrigerate if required.' WHERE care_storage IS NULL;
-- UPDATE products SET delivery_guidelines = 'Handle with care during delivery. Keep upright and avoid direct sunlight.' WHERE delivery_guidelines IS NULL;
