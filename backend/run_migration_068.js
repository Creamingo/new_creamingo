const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/068_vendor_applications_city_pincode.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 068: Add city & pincode to vendor_applications...');
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
    console.log('\n✅ Migration 068 completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
runMigration();
