-- Migration: Add is_active field to users table
-- Description: Add is_active boolean field to users table for user management

-- Add is_active column to users table
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Update existing users to be active by default
UPDATE users SET is_active = 1 WHERE is_active IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
