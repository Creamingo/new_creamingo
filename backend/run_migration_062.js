const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/062_create_midnight_wishes.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 062: Create midnight_wishes tables...');

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
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 70)}...`);
      try {
        await query(stmt);
        console.log('✅ Statement executed successfully');
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.warn('⚠️  Table/index already exists, skipping...');
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migration 062 executed successfully!');
    console.log('📊 midnight_wishes and midnight_wish_items tables created');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
