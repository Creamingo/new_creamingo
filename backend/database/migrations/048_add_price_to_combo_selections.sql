-- Migration: Add price and total columns to combo_selections
-- Description: Store combo item prices at order time (snapshot) to avoid recalculating with current prices

-- Add price column (unit price at time of order)
ALTER TABLE combo_selections ADD COLUMN price DECIMAL(10,2);

-- Add discounted_price column (discounted price at time of order, if applicable)
ALTER TABLE combo_selections ADD COLUMN discounted_price DECIMAL(10,2);

-- Add total column (price * quantity at time of order)
ALTER TABLE combo_selections ADD COLUMN total DECIMAL(10,2);

-- Add product_name column (snapshot of product name at order time)
ALTER TABLE combo_selections ADD COLUMN product_name VARCHAR(255);

-- Note: For existing records, these columns will be NULL
-- New orders will populate these values when created

