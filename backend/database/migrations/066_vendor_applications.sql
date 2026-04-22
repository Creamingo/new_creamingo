-- Migration: Vendor applications (Become a Vendor signup)
-- Stores shop owner interest for multi-category marketplace; review and onboard later.

CREATE TABLE IF NOT EXISTS vendor_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  shop_name VARCHAR(200) DEFAULT NULL COMMENT 'Optional store/shop name',
  category_ids VARCHAR(255) NOT NULL COMMENT 'Comma-separated category IDs e.g. 1,3,5',
  customer_id INT DEFAULT NULL COMMENT 'If applied while logged in',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, contacted, approved, rejected',
  admin_notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_applications_status (status),
  INDEX idx_vendor_applications_created (created_at),
  INDEX idx_vendor_applications_email (email),
  INDEX idx_vendor_applications_customer (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);
