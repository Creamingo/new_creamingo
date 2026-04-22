-- Create product_flavors junction table
CREATE TABLE IF NOT EXISTS product_flavors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  subcategory_id INT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_flavors_product ON product_flavors(product_id);
CREATE INDEX idx_product_flavors_subcategory ON product_flavors(subcategory_id);
CREATE INDEX idx_product_flavors_primary ON product_flavors(is_primary);

-- Migrate flavor subcategories into product_flavors (avoid duplicates)
INSERT INTO product_flavors (product_id, subcategory_id, is_primary, display_order, created_at, updated_at)
SELECT psc.product_id, psc.subcategory_id, psc.is_primary, psc.display_order, psc.created_at, psc.updated_at
FROM product_subcategories psc
LEFT JOIN product_flavors pf
  ON pf.product_id = psc.product_id AND pf.subcategory_id = psc.subcategory_id
WHERE psc.subcategory_id IN (9, 10, 12, 14, 11, 13, 17, 16, 15, 18)
  AND pf.id IS NULL;

-- Remove non-primary flavor assignments from product_subcategories
DELETE psc FROM product_subcategories psc
JOIN products p ON psc.product_id = p.id
WHERE psc.subcategory_id IN (9, 10, 12, 14, 11, 13, 17, 16, 15, 18)
  AND psc.is_primary = 0
  AND (p.subcategory_id IS NULL OR p.subcategory_id <> psc.subcategory_id);

-- Ensure each product keeps a primary subcategory if any remain
UPDATE product_subcategories ps
JOIN (
  SELECT product_id, MIN(id) AS min_id
  FROM product_subcategories
  GROUP BY product_id
  HAVING SUM(is_primary) = 0
) missing ON ps.id = missing.min_id
SET ps.is_primary = 1;

-- If legacy subcategory_id points to a flavor, reset to primary subcategory
UPDATE products p
LEFT JOIN product_subcategories ps ON ps.product_id = p.id AND ps.is_primary = 1
SET p.subcategory_id = ps.subcategory_id
WHERE p.subcategory_id IN (9, 10, 12, 14, 11, 13, 17, 16, 15, 18);
