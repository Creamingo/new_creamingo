-- Migration: Create promo codes table
-- Description: Add promo codes/coupons system for discounts

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_from, valid_until);

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order_amount, valid_from, valid_until, is_active) VALUES
('WELCOME20', '20% off on first order', 'percentage', 20, 500, datetime('now'), datetime('now', '+1 year'), 1),
('FESTIVE25', '25% off festive cakes', 'percentage', 25, 800, datetime('now'), datetime('now', '+6 months'), 1),
('SUMMER15', '15% off summer specials', 'percentage', 15, 600, datetime('now'), datetime('now', '+3 months'), 1),
('FLAT100', 'Flat ₹100 off on orders above ₹1000', 'fixed', 100, 1000, datetime('now'), datetime('now', '+1 year'), 1),
('FLAT200', 'Flat ₹200 off on orders above ₹2000', 'fixed', 200, 2000, datetime('now'), datetime('now', '+1 year'), 1);

