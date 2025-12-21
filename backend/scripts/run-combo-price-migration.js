const { query } = require('../src/config/db');

async function runComboPriceMigration() {
  try {
    console.log('Adding price columns to combo_selections table...');
    
    const statements = [
      'ALTER TABLE combo_selections ADD COLUMN price DECIMAL(10,2)',
      'ALTER TABLE combo_selections ADD COLUMN discounted_price DECIMAL(10,2)',
      'ALTER TABLE combo_selections ADD COLUMN total DECIMAL(10,2)',
      'ALTER TABLE combo_selections ADD COLUMN product_name VARCHAR(255)'
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
    
    console.log('\n✅ Combo price migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runComboPriceMigration();

