const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runDealMigration() {
  try {
    console.log('Starting one rupee deals table migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/047_create_one_rupee_deals.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement.trim());
          console.log('✓ Executed migration statement');
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('✓ Table/index already exists, skipping...');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ One rupee deals table migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
runDealMigration();

