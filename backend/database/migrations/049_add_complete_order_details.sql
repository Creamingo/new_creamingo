-- Migration: Add complete order details to orders table
-- Description: Store all order details including promo codes, discounts, delivery charges, subtotals, and cashback info

-- Add subtotal (sum of all items + combos before discounts)
ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);

-- Add promo code used
ALTER TABLE orders ADD COLUMN promo_code VARCHAR(50);

-- Add promo discount amount
ALTER TABLE orders ADD COLUMN promo_discount DECIMAL(10,2) DEFAULT 0;

-- Add delivery charge
ALTER TABLE orders ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 0;

-- Add wallet amount used (already tracked in wallet_usage, but store here for quick access)
-- Note: This might already exist, but adding for completeness
-- ALTER TABLE orders ADD COLUMN wallet_amount_used DECIMAL(10,2) DEFAULT 0;

-- Add scratch card/cashback amount earned
ALTER TABLE orders ADD COLUMN cashback_amount DECIMAL(10,2) DEFAULT 0;

-- Add scratch card ID (reference to scratch_cards table)
ALTER TABLE orders ADD COLUMN scratch_card_id INTEGER;

-- Add item count (total number of parent products)
ALTER TABLE orders ADD COLUMN item_count INTEGER DEFAULT 0;

-- Add combo count (total number of combo/add-on items)
ALTER TABLE orders ADD COLUMN combo_count INTEGER DEFAULT 0;

-- Create index for promo code lookups
CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON orders(promo_code);

-- Create index for scratch card lookups
CREATE INDEX IF NOT EXISTS idx_orders_scratch_card ON orders(scratch_card_id);

-- Note: For existing records, these columns will be NULL or 0
-- New orders will populate these values when created

