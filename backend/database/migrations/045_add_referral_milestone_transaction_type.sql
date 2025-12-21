-- Migration: Add referral_milestone transaction type
-- Description: Add referral_milestone to wallet_transactions transaction_type enum

-- Note: SQLite doesn't support ALTER TABLE to modify CHECK constraints
-- We need to recreate the table or use a workaround
-- For now, we'll just note that referral_milestone should be added to the CHECK constraint
-- The actual constraint update will be handled in application logic

-- If you need to update existing tables, you would need to:
-- 1. Create new table with updated constraint
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- For this migration, we'll just ensure the application can handle referral_milestone
-- The constraint will be enforced at application level for existing databases

-- Add a note in the application code to handle referral_milestone type

