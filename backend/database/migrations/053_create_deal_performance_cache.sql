-- Deal Performance Cache Table
-- Stores aggregated performance metrics for quick queries
-- Updated via triggers or scheduled jobs

CREATE TABLE IF NOT EXISTS deal_performance_cache (
    deal_id INTEGER PRIMARY KEY,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_adds INTEGER DEFAULT 0,
    total_redemptions INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0, -- (redemptions / views) * 100
    click_through_rate DECIMAL(5,2) DEFAULT 0, -- (clicks / views) * 100
    add_to_cart_rate DECIMAL(5,2) DEFAULT 0, -- (adds / clicks) * 100
    redemption_rate DECIMAL(5,2) DEFAULT 0, -- (redemptions / adds) * 100
    avg_cart_value DECIMAL(10,2) DEFAULT 0, -- Average cart value when deal was added
    unique_customers INTEGER DEFAULT 0, -- Unique customers who redeemed
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES one_rupee_deals(id) ON DELETE CASCADE
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_deal_performance_cache_last_updated ON deal_performance_cache(last_updated);

