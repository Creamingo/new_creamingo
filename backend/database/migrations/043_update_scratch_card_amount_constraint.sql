-- Migration: Update scratch card amount constraint to support 4-7% of order total
-- Remove the upper limit (₹100) and change minimum to ₹1
-- This allows dynamic cashback calculation based on order total

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints
-- So we need to recreate the table

-- Step 1: Create new scratch_cards table with updated constraint
CREATE TABLE IF NOT EXISTS scratch_cards_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 1),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'revealed', 'credited', 'expired')),
    revealed_at DATETIME,
    credited_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Step 2: Copy existing data (if any)
INSERT INTO scratch_cards_new 
SELECT * FROM scratch_cards;

-- Step 3: Drop old table
DROP TABLE IF EXISTS scratch_cards;

-- Step 4: Rename new table
ALTER TABLE scratch_cards_new RENAME TO scratch_cards;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_scratch_cards_customer ON scratch_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_scratch_cards_order ON scratch_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_scratch_cards_status ON scratch_cards(status);

