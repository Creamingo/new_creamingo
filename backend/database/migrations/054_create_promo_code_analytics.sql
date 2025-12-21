-- Promo Code Analytics Table
-- Tracks views, validation attempts, applications, and redemptions for promo codes

CREATE TABLE IF NOT EXISTS promo_code_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promo_code_id INTEGER NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'validate', 'apply', 'redeem', 'abandon')),
    customer_id INTEGER, -- NULL for anonymous users
    order_id INTEGER, -- NULL for non-redemption events
    cart_value DECIMAL(10,2), -- Cart value at time of event
    discount_amount DECIMAL(10,2) DEFAULT 0, -- Discount amount (for redeem events)
    revenue DECIMAL(10,2) DEFAULT 0, -- Revenue from order (for redeem events)
    validation_result VARCHAR(20), -- 'success' or 'failed' (for validate events)
    failure_reason TEXT, -- Reason for validation failure
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    referrer_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_promo_code_analytics_promo_code_id ON promo_code_analytics(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_analytics_event_type ON promo_code_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_promo_code_analytics_created_at ON promo_code_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_promo_code_analytics_promo_event ON promo_code_analytics(promo_code_id, event_type);
CREATE INDEX IF NOT EXISTS idx_promo_code_analytics_customer_id ON promo_code_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_analytics_order_id ON promo_code_analytics(order_id);

-- Performance cache table for quick analytics lookups
CREATE TABLE IF NOT EXISTS promo_code_performance_cache (
    promo_code_id INTEGER PRIMARY KEY,
    total_views INTEGER DEFAULT 0,
    total_validations INTEGER DEFAULT 0,
    successful_validations INTEGER DEFAULT 0,
    failed_validations INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    total_redemptions INTEGER DEFAULT 0,
    total_abandons INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_discount_given DECIMAL(10,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0, -- Redemptions / Views * 100
    validation_success_rate DECIMAL(5,2) DEFAULT 0, -- Successful validations / Total validations * 100
    redemption_rate DECIMAL(5,2) DEFAULT 0, -- Redemptions / Applications * 100
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_promo_code_performance_cache_last_updated ON promo_code_performance_cache(last_updated);
