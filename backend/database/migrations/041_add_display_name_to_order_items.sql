-- Add display_name column to order_items table to store flavor-specific product names
-- This ensures that the exact product name the customer selected is preserved

ALTER TABLE order_items ADD COLUMN display_name VARCHAR(255);

