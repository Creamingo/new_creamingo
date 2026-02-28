/**
 * Run migration 065: Add image_url_mobile to banners table.
 * Usage: node run_migration_065.js
 */
const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

const migrationPath = path.join(__dirname, 'database/migrations/065_add_banner_mobile_image.sql');

async function runMigration() {
  try {
    console.log('🔄 Running migration 065: Add banner mobile image column...');

    const migration = fs.readFileSync(migrationPath, 'utf8');

    const statements = migration
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] Executing: ALTER TABLE banners ADD COLUMN...`);
      try {
        await query(stmt);
        console.log('✅ Column image_url_mobile added.');
      } catch (err) {
        if (err.code === 'ER_DUP_FIELD_NAME' || err.message?.includes('Duplicate column')) {
          console.warn('⚠️  Column image_url_mobile already exists, skipping.');
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ Migration 065 completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();
