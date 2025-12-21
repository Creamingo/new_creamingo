-- Banner Analytics Table
-- Tracks views, clicks, and conversions for banners

CREATE TABLE IF NOT EXISTS banner_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    banner_id INTEGER NOT NULL,
    event_type VARCHAR(20) NOT NULL, -- 'view', 'click', 'conversion'
    customer_id INTEGER, -- NULL for anonymous users
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    referrer_url TEXT,
    revenue DECIMAL(10, 2) DEFAULT 0, -- Revenue from conversions (if applicable)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_id ON banner_analytics(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_event_type ON banner_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_created_at ON banner_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_event ON banner_analytics(banner_id, event_type);

