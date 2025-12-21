const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runWalletMigration() {
  try {
    console.log('Starting wallet system migration...');

    // Check if wallet_balance column exists
    try {
      await query('SELECT wallet_balance FROM customers LIMIT 1');
      console.log('✓ wallet_balance column already exists');
    } catch (error) {
      console.log('Adding wallet_balance column...');
      await query('ALTER TABLE customers ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00');
      console.log('✓ wallet_balance column added');
    }

    // Check if welcome_bonus_credited column exists
    try {
      await query('SELECT welcome_bonus_credited FROM customers LIMIT 1');
      console.log('✓ welcome_bonus_credited column already exists');
    } catch (error) {
      console.log('Adding welcome_bonus_credited column...');
      await query('ALTER TABLE customers ADD COLUMN welcome_bonus_credited BOOLEAN DEFAULT 0');
      console.log('✓ welcome_bonus_credited column added');
    }

    // Create wallet_transactions table
    console.log('Creating wallet_transactions table...');
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        order_id INTEGER,
        description VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
          'welcome_bonus', 'order_cashback', 'referral_bonus', 'birthday_bonus', 
          'review_reward', 'festival_offer', 'order_redemption', 'order_refund'
        )),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ wallet_transactions table created');

    // Create delivery_wallet_transactions table (for delivery boys)
    console.log('Creating delivery_wallet_transactions table...');
    await query(`
      CREATE TABLE IF NOT EXISTS delivery_wallet_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        delivery_boy_id INTEGER NOT NULL,
        order_id INTEGER,
        type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'bonus', 'penalty', 'payout')),
        amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
        meta TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (delivery_boy_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES delivery_orders(id) ON DELETE SET NULL
      )
    `);
    console.log('✓ delivery_wallet_transactions table created');

    // Create scratch_cards table
    console.log('Creating scratch_cards table...');
    await query(`
      CREATE TABLE IF NOT EXISTS scratch_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        order_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK (amount >= 10 AND amount <= 100),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'revealed', 'credited', 'expired')),
        revealed_at DATETIME,
        credited_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ scratch_cards table created');

    // Create wallet_usage table
    console.log('Creating wallet_usage table...');
    await query(`
      CREATE TABLE IF NOT EXISTS wallet_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        amount_used DECIMAL(10,2) NOT NULL CHECK (amount_used > 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ wallet_usage table created');

    // Create indexes
    console.log('Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer ON wallet_transactions(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order ON wallet_transactions(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status)',
      'CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_scratch_cards_customer ON scratch_cards(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_scratch_cards_order ON scratch_cards(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_scratch_cards_status ON scratch_cards(status)',
      'CREATE INDEX IF NOT EXISTS idx_wallet_usage_order ON wallet_usage(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_wallet_usage_customer ON wallet_usage(customer_id)',
      // Delivery wallet indexes
      'CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_delivery_boy ON delivery_wallet_transactions(delivery_boy_id)',
      'CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_order ON delivery_wallet_transactions(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_type ON delivery_wallet_transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_delivery_wallet_tx_created ON delivery_wallet_transactions(created_at)'
    ];

    for (const indexSQL of indexes) {
      try {
        await query(indexSQL);
      } catch (error) {
        console.log(`⚠ Index might already exist: ${error.message}`);
      }
    }
    console.log('✓ Indexes created');

    console.log('\n✅ Wallet system migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runWalletMigration();

