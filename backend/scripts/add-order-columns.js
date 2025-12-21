const { query } = require('../src/config/db');

async function addOrderColumns() {
  try {
    console.log('Adding missing columns to orders table...');

    const columns = [
      { name: 'subtotal', sql: 'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2)' },
      { name: 'promo_code', sql: 'ALTER TABLE orders ADD COLUMN promo_code VARCHAR(50)' },
      { name: 'promo_discount', sql: 'ALTER TABLE orders ADD COLUMN promo_discount DECIMAL(10,2) DEFAULT 0' },
      { name: 'delivery_charge', sql: 'ALTER TABLE orders ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 0' },
      { name: 'cashback_amount', sql: 'ALTER TABLE orders ADD COLUMN cashback_amount DECIMAL(10,2) DEFAULT 0' },
      { name: 'scratch_card_id', sql: 'ALTER TABLE orders ADD COLUMN scratch_card_id INTEGER' },
      { name: 'item_count', sql: 'ALTER TABLE orders ADD COLUMN item_count INTEGER DEFAULT 0' },
      { name: 'combo_count', sql: 'ALTER TABLE orders ADD COLUMN combo_count INTEGER DEFAULT 0' },
      { name: 'wallet_amount_used', sql: 'ALTER TABLE orders ADD COLUMN wallet_amount_used DECIMAL(10,2) DEFAULT 0' },
      { name: 'total_item_count', sql: 'ALTER TABLE orders ADD COLUMN total_item_count INTEGER DEFAULT 0' },
      { name: 'subtotal_after_promo', sql: 'ALTER TABLE orders ADD COLUMN subtotal_after_promo DECIMAL(10,2)' },
      { name: 'subtotal_after_wallet', sql: 'ALTER TABLE orders ADD COLUMN subtotal_after_wallet DECIMAL(10,2)' },
      { name: 'final_delivery_charge', sql: 'ALTER TABLE orders ADD COLUMN final_delivery_charge DECIMAL(10,2) DEFAULT 0' },
      { name: 'deal_items_total', sql: 'ALTER TABLE orders ADD COLUMN deal_items_total DECIMAL(10,2) DEFAULT 0' },
      { name: 'regular_items_total', sql: 'ALTER TABLE orders ADD COLUMN regular_items_total DECIMAL(10,2)' }
    ];

    for (const col of columns) {
      try {
        await query(col.sql);
        console.log(`✓ Added column: ${col.name}`);
      } catch (error) {
        if (error.message.includes('duplicate column name') || 
            error.message.includes('already exists')) {
          console.log(`✓ Column already exists: ${col.name}`);
        } else {
          console.error(`❌ Error adding ${col.name}:`, error.message);
          throw error;
        }
      }
    }

    // Add indexes
    try {
      await query('CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON orders(promo_code)');
      console.log('✓ Added index: idx_orders_promo_code');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error adding index:', error.message);
      }
    }

    try {
      await query('CREATE INDEX IF NOT EXISTS idx_orders_scratch_card ON orders(scratch_card_id)');
      console.log('✓ Added index: idx_orders_scratch_card');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error adding index:', error.message);
      }
    }

    console.log('\n✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addOrderColumns();

