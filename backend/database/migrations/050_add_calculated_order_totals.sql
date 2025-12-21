-- Migration: Add pre-calculated totals to orders table
-- Description: Store all calculated values to avoid recalculation on order confirmation page

-- Add wallet amount used (for quick access without joining wallet_usage table)
ALTER TABLE orders ADD COLUMN wallet_amount_used DECIMAL(10,2) DEFAULT 0;

-- Add total item count (items + combos combined)
ALTER TABLE orders ADD COLUMN total_item_count INTEGER DEFAULT 0;

-- Add subtotal after promo discount (subtotal - promo_discount)
ALTER TABLE orders ADD COLUMN subtotal_after_promo DECIMAL(10,2);

-- Add subtotal after wallet discount (subtotal - promo_discount - wallet_amount_used)
ALTER TABLE orders ADD COLUMN subtotal_after_wallet DECIMAL(10,2);

-- Add final delivery charge (actual charge applied, 0 if free delivery)
-- This avoids checking FREE_DELIVERY_THRESHOLD on confirmation page
ALTER TABLE orders ADD COLUMN final_delivery_charge DECIMAL(10,2) DEFAULT 0;

-- Add deal items total (if deals are used, separate from regular items)
ALTER TABLE orders ADD COLUMN deal_items_total DECIMAL(10,2) DEFAULT 0;

-- Add regular items total (excluding deals)
ALTER TABLE orders ADD COLUMN regular_items_total DECIMAL(10,2);

-- Note: These values are calculated once at order creation and stored
-- This eliminates all calculations on order confirmation/display pages

