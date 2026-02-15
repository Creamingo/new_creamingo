-- Migration: Create Midnight Wish tables (Fulfill My Wish feature)
-- Description: Shareable wishes - wisher adds products + message, friends fulfill by ordering for them

-- Midnight wishes (one per "wish list" shared by link)
CREATE TABLE IF NOT EXISTS midnight_wishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  public_id VARCHAR(16) NOT NULL UNIQUE,
  message TEXT,
  occasion VARCHAR(100),
  delivery_pincode VARCHAR(10),
  delivery_address JSON,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_midnight_wishes_public_id (public_id),
  INDEX idx_midnight_wishes_customer (customer_id),
  INDEX idx_midnight_wishes_status (status)
);

-- Items in each wish (products the wisher wants)
CREATE TABLE IF NOT EXISTS midnight_wish_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wish_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT,
  quantity INT NOT NULL DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wish_id) REFERENCES midnight_wishes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_midnight_wish_items_wish (wish_id)
);
