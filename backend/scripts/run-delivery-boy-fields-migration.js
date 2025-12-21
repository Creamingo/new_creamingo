const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runDeliveryBoyFieldsMigration() {
  try {
    console.log('Starting delivery boy fields migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/055_add_delivery_boy_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.toLowerCase().startsWith('create index'));
    
    // Execute ALTER TABLE statements first
    for (const statement of statements) {
      if (statement.trim() && statement.toUpperCase().includes('ALTER TABLE')) {
        try {
          await query(statement.trim());
          console.log('✓ Executed:', statement.substring(0, 60) + '...');
        } catch (error) {
          if (error.message.includes('duplicate column name') || 
              error.message.includes('already exists') ||
              error.message.includes('duplicate')) {
            console.log('✓ Column already exists, skipping:', statement.substring(0, 60) + '...');
          } else {
            console.error('❌ Error executing statement:', statement.substring(0, 80));
            throw error;
          }
        }
      }
    }

    // Execute CREATE INDEX statements
    const indexStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && stmt.toUpperCase().includes('CREATE INDEX'));
    
    for (const statement of indexStatements) {
      if (statement.trim()) {
        try {
          await query(statement.trim());
          console.log('✓ Executed:', statement.substring(0, 60) + '...');
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('✓ Index already exists, skipping:', statement.substring(0, 60) + '...');
          } else {
            console.error('❌ Error executing statement:', statement.substring(0, 80));
            throw error;
          }
        }
      }
    }

    console.log('✅ Delivery boy fields migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
runDeliveryBoyFieldsMigration();
