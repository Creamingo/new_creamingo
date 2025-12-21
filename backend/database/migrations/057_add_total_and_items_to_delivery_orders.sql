-- Migration: Add total_amount and items_count to delivery_orders table
-- This migration adds columns to store order total and items count directly in delivery_orders
-- to avoid dependency on JOIN with orders table

-- Add total_amount column to store order total
ALTER TABLE delivery_orders ADD COLUMN total_amount DECIMAL(10, 2) DEFAULT 0;

-- Add items_count column to store number of items in the order
ALTER TABLE delivery_orders ADD COLUMN items_count INTEGER DEFAULT 0;

-- Update existing records to populate these fields from orders table
UPDATE delivery_orders 
SET total_amount = (
    SELECT COALESCE(o.total, o.total_amount, 0)
    FROM orders o
    WHERE o.id = delivery_orders.order_id
    LIMIT 1
),
items_count = (
    SELECT COUNT(*)
    FROM order_items oi
    WHERE oi.order_id = delivery_orders.order_id
)
WHERE order_id IS NOT NULL;
