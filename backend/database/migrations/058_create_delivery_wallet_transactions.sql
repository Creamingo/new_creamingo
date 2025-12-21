-- Migration: Create delivery wallet transactions table
-- Tracks earnings and payouts for delivery boys

CREATE TABLE IF NOT EXISTS delivery_wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_boy_id INTEGER NOT NULL,
  order_id INTEGER,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'bonus', 'penalty', 'payout')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  meta TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_boy_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES delivery_orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_delivery_boy
  ON delivery_wallet_transactions(delivery_boy_id);

CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_order
  ON delivery_wallet_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_type
  ON delivery_wallet_transactions(type);

CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_created
  ON delivery_wallet_transactions(created_at);

