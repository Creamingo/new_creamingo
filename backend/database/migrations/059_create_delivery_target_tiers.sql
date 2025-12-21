-- Migration: Create delivery target tiers table
-- Configures daily delivery targets and bonus amounts for delivery boys

CREATE TABLE IF NOT EXISTS delivery_target_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  min_orders INTEGER NOT NULL CHECK (min_orders >= 0),
  max_orders INTEGER, -- NULL means no upper limit
  bonus_amount DECIMAL(10, 2) NOT NULL CHECK (bonus_amount >= 0),
  tier_name VARCHAR(50), -- e.g., "Bronze", "Silver", "Gold"
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0, -- For sorting tiers
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(min_orders) -- Ensure no duplicate min_orders
);

CREATE INDEX IF NOT EXISTS idx_delivery_target_tiers_active
  ON delivery_target_tiers(is_active);

CREATE INDEX IF NOT EXISTS idx_delivery_target_tiers_display_order
  ON delivery_target_tiers(display_order);

-- Insert default tiers (can be modified by admin later)
INSERT OR IGNORE INTO delivery_target_tiers (min_orders, max_orders, bonus_amount, tier_name, display_order) VALUES
  (5, 6, 25.00, 'Starter', 1),
  (7, 9, 75.00, 'Bronze', 2),
  (10, 14, 150.00, 'Silver', 3),
  (15, 19, 200.00, 'Gold', 4),
  (20, NULL, 300.00, 'Platinum', 5);
