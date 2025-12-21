-- Migration 028: Add max_orders column to delivery_slot_availability table
-- This allows date-specific max orders to be stored separately from the base slot max orders

ALTER TABLE delivery_slot_availability ADD COLUMN max_orders INTEGER;

-- Update existing records to use the base slot's max_orders
UPDATE delivery_slot_availability 
SET max_orders = (
    SELECT ds.max_orders 
    FROM delivery_slots ds 
    WHERE ds.id = delivery_slot_availability.slot_id
);

-- Make max_orders NOT NULL after populating existing records
-- Note: SQLite doesn't support ALTER COLUMN, so we'll need to recreate the table
-- For now, we'll leave it nullable and handle it in the application logic
