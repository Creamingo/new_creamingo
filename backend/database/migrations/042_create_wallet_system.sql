-- Migration: Create Wallet System Tables
-- Description: Wallet tables for cashback system including transactions, scratch cards, and wallet balance

-- Add wallet_balance column to customers table (or we can calculate from transactions)
-- We'll calculate balance from transactions for accuracy, but adding a cached balance field for performance
ALTER TABLE customers ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00;

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    order_id INTEGER,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'welcome_bonus', 
        'order_cashback', 
        'referral_bonus', 
        'birthday_bonus', 
        'review_reward', 
        'festival_offer',
        'order_redemption',
        'order_refund'
    )),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Scratch cards table
CREATE TABLE IF NOT EXISTS scratch_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 10 AND amount <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'revealed', 'credited', 'expired')),
    revealed_at DATETIME,
    credited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Wallet usage tracking (tracks wallet amount used per order)
CREATE TABLE IF NOT EXISTS wallet_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    amount_used DECIMAL(10,2) NOT NULL CHECK (amount_used > 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Add welcome_bonus_credited flag to customers table
ALTER TABLE customers ADD COLUMN welcome_bonus_credited BOOLEAN DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer ON wallet_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order ON wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_scratch_cards_customer ON scratch_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_scratch_cards_order ON scratch_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_scratch_cards_status ON scratch_cards(status);
CREATE INDEX IF NOT EXISTS idx_wallet_usage_order ON wallet_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_usage_customer ON wallet_usage(customer_id);

