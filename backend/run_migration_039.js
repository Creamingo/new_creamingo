const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/039_add_password_to_customers.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 039: Add password field to customers...');
    
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
    
    console.log('\n✅ Migration 039 executed successfully!');
    
    // Verify the migration
    const result = await query('PRAGMA table_info(customers)');
    const columns = result.rows || result;
    const hasPassword = columns.some(col => col.name === 'password');
    const hasIsActive = columns.some(col => col.name === 'is_active');
    
    if (hasPassword && hasIsActive) {
      console.log('📊 Password and is_active fields added successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

