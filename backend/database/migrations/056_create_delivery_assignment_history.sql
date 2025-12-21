-- Migration: Create delivery assignment history table
-- This migration creates a table to track assignment changes for audit purposes

CREATE TABLE IF NOT EXISTS delivery_assignment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  old_delivery_boy_id INTEGER,
  new_delivery_boy_id INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (old_delivery_boy_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (new_delivery_boy_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for faster lookups by order_id
CREATE INDEX IF NOT EXISTS idx_delivery_assignment_history_order_id ON delivery_assignment_history(order_id);

-- Create index for faster lookups by delivery boy
CREATE INDEX IF NOT EXISTS idx_delivery_assignment_history_delivery_boy ON delivery_assignment_history(new_delivery_boy_id);
