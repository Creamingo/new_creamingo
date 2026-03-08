-- GST, optional doc URLs, document checklist for vendor applications
ALTER TABLE vendor_applications
  ADD COLUMN gst_number VARCHAR(50) DEFAULT NULL COMMENT 'Optional GST number',
  ADD COLUMN shop_document_url VARCHAR(500) DEFAULT NULL COMMENT 'Optional shop/business doc URL',
  ADD COLUMN id_document_url VARCHAR(500) DEFAULT NULL COMMENT 'Optional ID document URL',
  ADD COLUMN document_checklist JSON DEFAULT NULL COMMENT 'Admin checklist e.g. {"id_received":true,"shop_received":true,"gst_verified":false}';
