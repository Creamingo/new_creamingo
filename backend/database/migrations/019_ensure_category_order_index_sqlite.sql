-- Migration: Ensure all categories have proper order_index values (SQLite version)
-- Description: Update existing categories to have sequential order_index values for drag-and-drop reordering

-- Update categories that have order_index = 0 or NULL to have sequential values
-- This ensures all categories can be properly reordered via drag-and-drop

-- First, update categories with NULL order_index to 0
UPDATE categories SET order_index = 0 WHERE order_index IS NULL;

-- Then, assign sequential order_index values based on current order (created_at)
-- This preserves the existing order while making it explicit
-- SQLite doesn't support UPDATE with CTE, so we use a different approach

-- Create a temporary table with the new order values
CREATE TEMPORARY TABLE temp_category_order AS
SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_order
FROM categories
WHERE order_index = 0 OR order_index IS NULL;

-- Update categories using the temporary table
UPDATE categories 
SET order_index = (
    SELECT new_order 
    FROM temp_category_order 
    WHERE temp_category_order.id = categories.id
)
WHERE id IN (SELECT id FROM temp_category_order);

-- Drop the temporary table
DROP TABLE temp_category_order;

-- Create index for better performance on order_index queries
CREATE INDEX IF NOT EXISTS idx_categories_order_index ON categories(order_index);

-- Create index for better performance on subcategories order_index queries
CREATE INDEX IF NOT EXISTS idx_subcategories_order_index ON subcategories(order_index);
