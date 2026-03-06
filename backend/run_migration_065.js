/**
 * Run migration 065: Add image_url_mobile to banners table.
 * Usage: node run_migration_065.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('./src/config/db');

const SQL = 'ALTER TABLE banners ADD COLUMN image_url_mobile TEXT NULL';

async function runMigration() {
  try {
    console.log('🔄 Running migration 065: Add banner mobile image column...');

    const connection = await pool.getConnection();
    try {
      await connection.execute(SQL);
      console.log('✅ Column image_url_mobile added.');
    } catch (err) {
      const isDuplicate = err.code === 'ER_DUP_FIELD_NAME' || err.code === 'ER_DUP_FIELDNAME' || (err.message && err.message.includes('Duplicate column'));
      if (isDuplicate) {
        console.warn('⚠️  Column image_url_mobile already exists, skipping.');
      } else {
        throw err;
      }
    } finally {
      connection.release();
    }

    console.log('\n✅ Migration 065 completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();
