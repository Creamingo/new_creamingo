-- Update order_items table to support combo features
-- Add new columns for flavor, tier, and cake message

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll add columns without the IF NOT EXISTS clause
ALTER TABLE order_items ADD COLUMN flavor_id INTEGER;
ALTER TABLE order_items ADD COLUMN tier VARCHAR(50);
ALTER TABLE order_items ADD COLUMN cake_message TEXT;

-- Add foreign key constraint for flavor_id if it doesn't exist
-- (Assuming flavors are stored in subcategories table with specific IDs)
-- ALTER TABLE order_items ADD CONSTRAINT fk_order_items_flavor 
-- FOREIGN KEY (flavor_id) REFERENCES subcategories(id);

-- Update combo_selections table to reference order_item_id instead of cart_item_id
-- First, add the new column
ALTER TABLE combo_selections ADD COLUMN order_item_id INTEGER;

-- Create index for better performance
CREATE INDEX idx_combo_selections_order_item ON combo_selections(order_item_id);

-- Note: cart_item_id column is kept for backward compatibility
-- In production, you might want to migrate existing data and drop cart_item_id
