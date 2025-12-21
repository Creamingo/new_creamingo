-- Migration: Create One Rupee Deals Table
-- Description: Table for managing ₹1 deals that unlock at specific cart amount thresholds

CREATE TABLE IF NOT EXISTS one_rupee_deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_title VARCHAR(200) NOT NULL,
    product_id INTEGER NOT NULL,
    threshold_amount DECIMAL(10,2) NOT NULL,
    deal_price DECIMAL(10,2) DEFAULT 1.00,
    max_quantity_per_order INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, threshold_amount)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_one_rupee_deals_product ON one_rupee_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_one_rupee_deals_active ON one_rupee_deals(is_active);
CREATE INDEX IF NOT EXISTS idx_one_rupee_deals_threshold ON one_rupee_deals(threshold_amount);
CREATE INDEX IF NOT EXISTS idx_one_rupee_deals_priority ON one_rupee_deals(priority);

