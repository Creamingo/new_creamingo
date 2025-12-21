const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/038_add_status_to_promo_codes.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 038: Add status field to promo_codes...');
    
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    const lines = migration.split('\n');
    let currentStatement = '';
    const statements = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
        continue;
      }
      
      currentStatement += ' ' + trimmedLine;
      
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        currentStatement = '';
      }
    }
    
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 60)}...`);
      await query(stmt);
      console.log('✅ Statement executed successfully');
    }
    
    console.log('\n✅ Migration 038 executed successfully!');
    
    // Verify the migration
    const result = await query('SELECT status FROM promo_codes LIMIT 1');
    if (result.rows || result) {
      console.log('📊 Status field added and migration completed!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

