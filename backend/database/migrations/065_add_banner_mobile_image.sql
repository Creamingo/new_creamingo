-- Migration: Add optional mobile image URL to banners for responsive display
-- Date: 2025-02-28
-- Description: Allows separate desktop (image_url) and mobile (image_url_mobile) images
--              so banners display without unwanted cropping on all devices.

ALTER TABLE banners ADD COLUMN image_url_mobile TEXT NULL;
