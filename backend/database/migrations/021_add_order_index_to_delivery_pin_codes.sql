-- Add order_index column to delivery_pin_codes table for drag-and-drop functionality
-- This migration adds the order_index column to enable reordering of delivery PIN codes

-- Add order_index column
ALTER TABLE delivery_pin_codes ADD COLUMN order_index INTEGER DEFAULT 0;

-- Create index on order_index for faster sorting
CREATE INDEX idx_delivery_pin_codes_order_index ON delivery_pin_codes(order_index);

-- Update existing records with order_index based on their current order
-- This will assign order_index values based on the current created_at order
UPDATE delivery_pin_codes 
SET order_index = (
    SELECT COUNT(*) + 1 
    FROM delivery_pin_codes dpc2 
    WHERE dpc2.created_at < delivery_pin_codes.created_at
);

-- Set default value for new records
-- Note: SQLite doesn't support ALTER COLUMN, so we'll handle this in the application
