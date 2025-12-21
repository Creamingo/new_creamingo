-- Migration: Insert sample delivery orders for testing
-- This migration adds sample delivery orders to test the delivery system

-- First, let's create a sample delivery boy user if it doesn't exist
INSERT OR IGNORE INTO users (id, name, email, password, role, is_active) 
VALUES (100, 'Delivery Boy Test', 'delivery@creamingo.com', '$2b$10$example', 'delivery_boy', 1);

-- Insert sample delivery orders
INSERT OR IGNORE INTO delivery_orders (
    order_id, 
    delivery_boy_id, 
    customer_name, 
    customer_phone, 
    customer_address, 
    delivery_date, 
    delivery_time, 
    status, 
    priority, 
    special_instructions,
    delivery_latitude,
    delivery_longitude
) VALUES 
(
    1, 
    100, 
    'John Doe', 
    '+1234567890', 
    '123 Main St, Downtown, City 12345', 
    '2024-01-15', 
    '14:00', 
    'assigned', 
    'high', 
    'Ring doorbell twice, leave at door if no answer',
    40.7128,
    -74.0060
),
(
    2, 
    100, 
    'Jane Smith', 
    '+1234567891', 
    '456 Oak Ave, Uptown, City 12346', 
    '2024-01-15', 
    '16:30', 
    'picked_up', 
    'medium', 
    'Call before delivery',
    40.7589,
    -73.9851
),
(
    3, 
    100, 
    'Mike Johnson', 
    '+1234567892', 
    '789 Pine St, Midtown, City 12347', 
    '2024-01-15', 
    '18:00', 
    'assigned', 
    'high', 
    'Fragile - handle with care',
    40.7505,
    -73.9934
),
(
    4, 
    100, 
    'Sarah Wilson', 
    '+1234567893', 
    '321 Elm St, Suburb, City 12348', 
    '2024-01-15', 
    '19:30', 
    'in_transit', 
    'low', 
    'Leave with neighbor if not home',
    40.7614,
    -73.9776
),
(
    5, 
    100, 
    'David Brown', 
    '+1234567894', 
    '654 Maple Ave, Downtown, City 12349', 
    '2024-01-15', 
    '20:00', 
    'delivered', 
    'medium', 
    'Delivered successfully',
    40.7505,
    -73.9934
);
