const { query, db } = require('../src/config/db');
const path = require('path');
const fs = require('fs');

async function updateScratchCardConstraint() {
  try {
    console.log('Starting scratch card constraint update...');

    // Check if scratch_cards table exists
    try {
      await query('SELECT 1 FROM scratch_cards LIMIT 1');
      console.log('✓ scratch_cards table exists');
    } catch (error) {
      console.log('⚠ scratch_cards table does not exist. Skipping constraint update.');
      process.exit(0);
    }

    // Step 1: Create new table with updated constraint
    console.log('Creating new scratch_cards table with updated constraint...');
    await query(`
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
      )
    `);
    console.log('✓ New table created');

    // Step 2: Copy existing data
    console.log('Copying existing data...');
    const existingData = await query('SELECT * FROM scratch_cards');
    if (existingData.rows.length > 0) {
      for (const row of existingData.rows) {
        await query(`
          INSERT INTO scratch_cards_new 
          (id, customer_id, order_id, amount, status, revealed_at, credited_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          row.id,
          row.customer_id,
          row.order_id,
          row.amount,
          row.status,
          row.revealed_at,
          row.credited_at,
          row.created_at,
          row.updated_at
        ]);
      }
      console.log(`✓ Copied ${existingData.rows.length} existing scratch cards`);
    } else {
      console.log('✓ No existing data to copy');
    }

    // Step 3: Drop old table
    console.log('Dropping old table...');
    await query('DROP TABLE IF EXISTS scratch_cards');
    console.log('✓ Old table dropped');

    // Step 4: Rename new table
    console.log('Renaming new table...');
    await query('ALTER TABLE scratch_cards_new RENAME TO scratch_cards');
    console.log('✓ Table renamed');

    // Step 5: Recreate indexes
    console.log('Recreating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_scratch_cards_customer ON scratch_cards(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_scratch_cards_order ON scratch_cards(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_scratch_cards_status ON scratch_cards(status)'
    ];

    for (const indexSQL of indexes) {
      try {
        await query(indexSQL);
      } catch (error) {
        console.log(`⚠ Index might already exist: ${error.message}`);
      }
    }
    console.log('✓ Indexes recreated');

    console.log('\n✅ Scratch card constraint update completed successfully!');
    console.log('   - Minimum amount: ₹1 (was ₹10)');
    console.log('   - Maximum amount: No limit (was ₹100)');
    console.log('   - Now supports 4-7% of order total');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

updateScratchCardConstraint();

