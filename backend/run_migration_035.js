const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/035_update_order_items_for_combos.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 035: Update order_items and combo_selections...');
    
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments and split by semicolons
    const lines = migration.split('\n');
    let currentStatement = '';
    const statements = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comment lines
      if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
        continue;
      }
      
      currentStatement += ' ' + trimmedLine;
      
      // If line ends with semicolon, it's a complete statement
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 60)}...`);
      
      try {
        await query(stmt);
        console.log('✅ Statement executed successfully');
      } catch (error) {
        // SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so duplicate column errors are expected
        if (error.message && error.message.includes('duplicate column')) {
          console.log('⚠️  Column already exists, skipping...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration 035 executed successfully!');
    console.log('📊 Order items and combo selections tables updated');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

