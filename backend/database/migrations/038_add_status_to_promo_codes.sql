-- Migration: Add status field to promo_codes table
-- Description: Replace simple is_active boolean with status enum for better state management

-- Add status column
ALTER TABLE promo_codes ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'deleted'));

-- Migrate existing is_active values to status
UPDATE promo_codes SET status = CASE 
  WHEN is_active = 0 THEN 'inactive'
  WHEN datetime(valid_until) < datetime('now') THEN 'expired'
  ELSE 'active'
END;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);

