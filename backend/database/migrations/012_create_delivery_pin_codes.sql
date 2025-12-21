-- Create delivery_pin_codes table
CREATE TABLE delivery_pin_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pin_code VARCHAR(6) NOT NULL UNIQUE,
    delivery_charge DECIMAL(10, 2) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on pin_code for faster lookups
CREATE INDEX idx_delivery_pin_codes_pin_code ON delivery_pin_codes(pin_code);

-- Create index on status for filtering
CREATE INDEX idx_delivery_pin_codes_status ON delivery_pin_codes(status);

-- Insert sample data
INSERT INTO delivery_pin_codes (pin_code, delivery_charge, locality, status) VALUES
('110001', 50.00, 'Connaught Place, New Delhi', 'active'),
('400001', 75.00, 'Fort, Mumbai', 'active'),
('560001', 60.00, 'Bangalore City, Bangalore', 'inactive'),
('700001', 55.00, 'BBD Bagh, Kolkata', 'active'),
('600001', 70.00, 'Chennai Central, Chennai', 'active'),
('110002', 45.00, 'Karol Bagh, New Delhi', 'active'),
('400002', 80.00, 'Andheri West, Mumbai', 'active'),
('560002', 65.00, 'Indiranagar, Bangalore', 'inactive'),
('700002', 50.00, 'Salt Lake, Kolkata', 'active'),
('600002', 75.00, 'Anna Nagar, Chennai', 'active'),
('110003', 55.00, 'Lajpat Nagar, New Delhi', 'active'),
('400003', 70.00, 'Bandra West, Mumbai', 'inactive');
