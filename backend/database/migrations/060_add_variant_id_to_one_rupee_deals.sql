-- Add variant_id to one_rupee_deals for weight-specific pricing
ALTER TABLE one_rupee_deals
  ADD COLUMN variant_id INT NULL AFTER product_id;

-- Optional foreign key for referential integrity
-- Note: If your environment doesn't allow FK changes, comment this out.
ALTER TABLE one_rupee_deals
  ADD CONSTRAINT fk_one_rupee_deals_variant
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
  ON DELETE SET NULL;
