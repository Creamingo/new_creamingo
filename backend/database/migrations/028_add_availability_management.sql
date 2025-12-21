-- Migration 028: Add availability management fields to delivery slots
-- This migration adds fields to manage display order limits and availability

-- Add display order limit field to delivery_slots table
ALTER TABLE delivery_slots ADD COLUMN display_order_limit INTEGER DEFAULT 10;

-- Add availability management fields
ALTER TABLE delivery_slots ADD COLUMN availability_threshold_high INTEGER DEFAULT 60;
ALTER TABLE delivery_slots ADD COLUMN availability_threshold_medium INTEGER DEFAULT 85;

-- Update existing slots with default values
UPDATE delivery_slots SET 
    display_order_limit = 10,
    availability_threshold_high = 60,
    availability_threshold_medium = 85
WHERE display_order_limit IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_slots_display_order_limit ON delivery_slots(display_order_limit);

-- Add comments for documentation
-- display_order_limit: Maximum number of orders that can be displayed as available for this slot
-- availability_threshold_high: Percentage threshold for high availability (green)
-- availability_threshold_medium: Percentage threshold for medium availability (yellow)
