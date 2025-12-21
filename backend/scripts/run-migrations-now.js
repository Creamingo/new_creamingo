const { query } = require('../src/config/db');

async function runMigrations() {
  try {
    console.log('Adding columns to orders table...');
    
    const statements = [
      'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2)',
      'ALTER TABLE orders ADD COLUMN promo_code VARCHAR(50)',
      'ALTER TABLE orders ADD COLUMN promo_discount DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN cashback_amount DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN scratch_card_id INTEGER',
      'ALTER TABLE orders ADD COLUMN item_count INTEGER DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN combo_count INTEGER DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN wallet_amount_used DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN total_item_count INTEGER DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN subtotal_after_promo DECIMAL(10,2)',
      'ALTER TABLE orders ADD COLUMN subtotal_after_wallet DECIMAL(10,2)',
      'ALTER TABLE orders ADD COLUMN final_delivery_charge DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN deal_items_total DECIMAL(10,2) DEFAULT 0',
      'ALTER TABLE orders ADD COLUMN regular_items_total DECIMAL(10,2)'
    ];
    
    for (const stmt of statements) {
      try {
        await query(stmt);
        console.log('✓ Added:', stmt.substring(0, 60) + '...');
      } catch (error) {
        if (error.message.includes('duplicate column name') || 
            error.message.includes('already exists')) {
          console.log('⊘ Skipped (already exists):', stmt.substring(0, 60) + '...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ All migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();

