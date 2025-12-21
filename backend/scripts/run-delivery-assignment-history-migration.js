const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runDeliveryAssignmentHistoryMigration() {
  try {
    console.log('Starting delivery assignment history migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/056_create_delivery_assignment_history.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement.trim());
          console.log('✓ Executed migration statement');
        } catch (error) {
          if (error.message.includes('duplicate column name') || 
              error.message.includes('already exists') ||
              error.message.includes('duplicate')) {
            console.log('✓ Table/index already exists, skipping...');
          } else {
            console.error('❌ Error executing statement:', statement.substring(0, 80));
            throw error;
          }
        }
      }
    }

    console.log('✅ Delivery assignment history migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
runDeliveryAssignmentHistoryMigration();
