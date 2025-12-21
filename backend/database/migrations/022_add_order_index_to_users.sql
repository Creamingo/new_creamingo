-- Migration: Add order_index column to users table for drag-and-drop functionality
-- Date: 2025-01-28
-- Description: Add order_index column to enable reordering of users in the admin panel

-- Add order_index column
ALTER TABLE users ADD COLUMN order_index INTEGER DEFAULT 0;

-- Create index on order_index for faster sorting
CREATE INDEX IF NOT EXISTS idx_users_order_index ON users(order_index);

-- Update existing records with order_index based on their current order
-- This will assign order_index values based on the current created_at order
UPDATE users 
SET order_index = (
    SELECT COUNT(*) + 1 
    FROM users u2 
    WHERE u2.created_at < users.created_at
);

-- Set default value for new records
-- Note: SQLite doesn't support ALTER COLUMN, so we'll handle this in the application
