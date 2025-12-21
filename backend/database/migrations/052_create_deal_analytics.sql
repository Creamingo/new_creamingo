-- Deal Analytics Table
-- Tracks views, clicks, add_to_cart, and purchases for deals

CREATE TABLE IF NOT EXISTS deal_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deal_id INTEGER NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'click', 'add_to_cart', 'purchase')),
    customer_id INTEGER, -- NULL for anonymous users
    order_id INTEGER, -- NULL for non-purchase events
    cart_value DECIMAL(10,2), -- Cart value at time of event
    revenue DECIMAL(10,2) DEFAULT 0, -- Revenue from purchase (if event_type = 'purchase')
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    referrer_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES one_rupee_deals(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deal_analytics_deal_id ON deal_analytics(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_analytics_event_type ON deal_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_deal_analytics_created_at ON deal_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_deal_analytics_deal_event ON deal_analytics(deal_id, event_type);
CREATE INDEX IF NOT EXISTS idx_deal_analytics_customer_id ON deal_analytics(customer_id);
CREATE INDEX IF NOT EXISTS idx_deal_analytics_order_id ON deal_analytics(order_id);

