-- Migration: Create combo_selections table
-- Description: Stores user's combo selections for cart items

CREATE TABLE IF NOT EXISTS combo_selections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_item_id INTEGER,
    add_on_product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (add_on_product_id) REFERENCES add_on_products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_combo_selections_cart_item ON combo_selections(cart_item_id);
CREATE INDEX IF NOT EXISTS idx_combo_selections_addon_product ON combo_selections(add_on_product_id);
