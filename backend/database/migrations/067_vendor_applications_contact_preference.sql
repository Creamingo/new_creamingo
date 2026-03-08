-- Add contact_preference for vendor applications (Quick win: how to reach applicant first)
ALTER TABLE vendor_applications
  ADD COLUMN contact_preference VARCHAR(20) NOT NULL DEFAULT 'phone'
  COMMENT 'phone, whatsapp, email';
