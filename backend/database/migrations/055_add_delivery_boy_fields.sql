-- Migration: Add delivery boy specific fields to users table
-- This migration adds fields for delivery boy onboarding: owned_bike, driving_license_number, contact_number

-- Add new columns to users table
ALTER TABLE users ADD COLUMN owned_bike BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN driving_license_number VARCHAR(50);
ALTER TABLE users ADD COLUMN contact_number VARCHAR(20);

-- Create index on contact_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_contact_number ON users(contact_number);

-- Create index on driving_license_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_driving_license ON users(driving_license_number);
