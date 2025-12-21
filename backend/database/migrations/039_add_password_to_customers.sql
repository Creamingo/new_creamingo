-- Migration: Add password field to customers table
-- Description: Enable customer authentication by adding password field with bcrypt hashing support

-- Add password column (nullable initially for existing customers)
ALTER TABLE customers ADD COLUMN password VARCHAR(255);

-- Add is_active column for account management
ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT 1;

-- Add last_login tracking
ALTER TABLE customers ADD COLUMN last_login DATETIME;

-- Create index on email for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create index on is_active for filtering active customers
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

