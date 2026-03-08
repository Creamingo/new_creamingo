-- Add city and pincode for vendor applications (location context)
ALTER TABLE vendor_applications
  ADD COLUMN city VARCHAR(100) DEFAULT NULL COMMENT 'City',
  ADD COLUMN pincode VARCHAR(20) DEFAULT NULL COMMENT 'Pincode';
