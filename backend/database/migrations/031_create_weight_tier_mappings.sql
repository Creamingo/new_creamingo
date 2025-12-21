-- Migration 031: Create weight_tier_mappings table
-- This table stores the global mapping of which tiers are available for each weight

CREATE TABLE IF NOT EXISTS weight_tier_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight VARCHAR(50) NOT NULL UNIQUE,
    available_tiers TEXT NOT NULL, -- JSON array like "[1,2]" or "[2,3]"
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data based on current ProductSummary mapping
INSERT INTO weight_tier_mappings (weight, available_tiers) VALUES
('500gm', '[1]'),
('500 g', '[1]'),
('1kg', '[1]'),
('1 kg', '[1]'),
('1.5kg', '[1,2]'),
('1.5 kg', '[1,2]'),
('2kg', '[1,2]'),
('2 kg', '[1,2]'),
('2.5kg', '[1,2]'),
('2.5 kg', '[1,2]'),
('3kg', '[2,3]'),
('3 kg', '[2,3]'),
('3.5kg', '[2,3]'),
('3.5 kg', '[2,3]'),
('4kg', '[2,3]'),
('4 kg', '[2,3]'),
('4.5kg', '[2,3]'),
('4.5 kg', '[2,3]'),
('5kg', '[3,4]'),
('5 kg', '[3,4]');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weight_tier_mappings_weight ON weight_tier_mappings(weight);
CREATE INDEX IF NOT EXISTS idx_weight_tier_mappings_active ON weight_tier_mappings(is_active);
