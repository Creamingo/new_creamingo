-- Migration: Create delivery slots tables
-- This migration creates tables for managing delivery time slots and their availability

-- Create delivery_slots table
CREATE TABLE delivery_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_name VARCHAR(50) NOT NULL, -- e.g., "Morning", "Afternoon", "Evening"
    start_time TIME NOT NULL, -- e.g., "09:00:00"
    end_time TIME NOT NULL, -- e.g., "12:00:00"
    max_orders INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create delivery_slot_availability table for daily availability
CREATE TABLE delivery_slot_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id INTEGER NOT NULL,
    delivery_date DATE NOT NULL,
    available_orders INTEGER NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES delivery_slots(id) ON DELETE CASCADE,
    UNIQUE(slot_id, delivery_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_slots_active ON delivery_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_display_order ON delivery_slots(display_order);
CREATE INDEX IF NOT EXISTS idx_delivery_slot_availability_date ON delivery_slot_availability(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_slot_availability_slot_id ON delivery_slot_availability(slot_id);

-- Insert default delivery slots
INSERT INTO delivery_slots (slot_name, start_time, end_time, max_orders, is_active, display_order) VALUES
('Morning', '09:00:00', '12:00:00', 50, 1, 1),
('Afternoon', '12:00:00', '17:00:00', 50, 1, 2),
('Evening', '17:00:00', '21:00:00', 50, 1, 3);

-- Add delivery slot fields to orders table
ALTER TABLE orders ADD COLUMN delivery_slot_id INTEGER;
ALTER TABLE orders ADD COLUMN delivery_slot_name VARCHAR(50);
ALTER TABLE orders ADD COLUMN delivery_date DATE;

-- Create index for orders delivery slot
CREATE INDEX IF NOT EXISTS idx_orders_delivery_slot_id ON orders(delivery_slot_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
