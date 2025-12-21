const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/037_create_promo_codes.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 037: Create promo codes table...');
    
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
      await query(stmt);
      console.log('✅ Statement executed successfully');
    }
    
    console.log('✅ Migration 037 executed successfully!');
    console.log('📊 Promo codes table created with sample data');
    
    // Verify the table was created
    const result = await query('SELECT COUNT(*) as count FROM promo_codes');
    const count = result.rows?.[0]?.count || result[0]?.count || 0;
    console.log(`📈 Found ${count} promo codes in the database`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

