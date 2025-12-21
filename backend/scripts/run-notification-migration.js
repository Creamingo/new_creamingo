const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runNotificationMigration() {
  try {
    console.log('Starting notifications table migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/046_create_notifications_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement.trim());
          console.log('✓ Executed migration statement');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('✓ Table/index already exists, skipping...');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ Notifications table migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
runNotificationMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

