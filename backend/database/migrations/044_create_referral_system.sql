-- Migration: Create Referral System Tables
-- Description: Tables for Refer & Earn system including referral codes and referral tracking

-- Add referral_code column to customers table
-- Each customer gets a unique referral code
ALTER TABLE customers ADD COLUMN referral_code VARCHAR(20) UNIQUE;

-- Add referred_by column to customers table (stores the referrer's customer_id)
ALTER TABLE customers ADD COLUMN referred_by INTEGER;

-- Add foreign key constraint for referred_by
-- Note: SQLite doesn't support adding foreign keys via ALTER TABLE, so we'll handle this in application logic

-- Referrals table - tracks referral relationships and bonus status
CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL,
    referee_id INTEGER NOT NULL,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'credited', 'expired', 'cancelled')),
    referrer_bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    referee_bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    referrer_bonus_credited BOOLEAN DEFAULT 0,
    referee_bonus_credited BOOLEAN DEFAULT 0,
    referrer_bonus_credited_at DATETIME,
    referee_bonus_credited_at DATETIME,
    first_order_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (first_order_id) REFERENCES orders(id) ON DELETE SET NULL,
    UNIQUE(referee_id) -- Each user can only be referred once
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON customers(referral_code);
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON customers(referred_by);

