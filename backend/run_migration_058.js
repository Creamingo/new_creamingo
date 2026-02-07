/**
 * Migration 058: Normalize upload URLs to relative /uploads/...
 *
 * Run this script with: node run_migration_058.js
 */

const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

async function runMigration() {
  try {
    console.log('Starting migration 058: Normalize upload URLs...');

    const migrationPath = path.join(__dirname, 'database', 'migrations', '058_normalize_upload_urls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      await query(statement);
    }

    console.log('✓ Migration 058 completed successfully!');
    console.log('  Normalized absolute upload URLs to /uploads/...');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration 058 failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
