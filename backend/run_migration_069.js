const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/069_vendor_applications_next_level.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 069: Add gst_number, doc URLs, document_checklist...');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    const statements = migration
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] Executing...`);
      try {
        await query(stmt);
        console.log('✅ OK');
      } catch (err) {
        if (err.message && err.message.includes('Duplicate column')) {
          console.warn('⚠️  Column already exists, skipping.');
        } else throw err;
      }
    }
    console.log('\n✅ Migration 069 completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
runMigration();
