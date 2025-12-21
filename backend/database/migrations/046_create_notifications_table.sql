-- Migration: Create notifications table
-- Description: Table to store user notifications for wallet, referrals, and other activities

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'wallet_credit', 'wallet_debit', 'referral_bonus', 'milestone', 'scratch_card', 'order', 'general'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON data for additional information
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(customer_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

