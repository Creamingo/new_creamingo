/**
 * Check if banners table has image_url_mobile column and list its values.
 * Use this to confirm why mobile might be showing desktop image.
 *
 * Run from project root (or backend folder with .env available):
 *   node backend/scripts/check-banner-mobile-column.js
 * Or from backend folder:
 *   node scripts/check-banner-mobile-column.js
 *
 * If column is missing, run: node backend/run_migration_065.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { query, pool } = require('../src/config/db');

async function check() {
  try {
    console.log('Checking banners table for image_url_mobile...\n');

    // 1. List columns (MySQL)
    let colResult = await query('SHOW COLUMNS FROM banners');
    let colRows = colResult.rows || colResult;
    let columns = Array.isArray(colRows) ? colRows.map(r => r.Field || r.field) : [];
    let hasMobile = columns.includes('image_url_mobile');

    console.log('Columns in banners:', columns.join(', '));
    console.log('image_url_mobile column exists:', hasMobile ? 'YES' : 'NO');

    if (!hasMobile) {
      console.log('\nAdding column image_url_mobile...');
      const connection = await pool.getConnection();
      try {
        await connection.execute('ALTER TABLE banners ADD COLUMN image_url_mobile TEXT NULL');
        console.log('✅ Column image_url_mobile added. Re-checking...\n');
        hasMobile = true;
      } catch (err) {
        const isDup = err.code === 'ER_DUP_FIELD_NAME' || err.code === 'ER_DUP_FIELDNAME' || (err.message && err.message.includes('Duplicate column'));
        if (isDup) {
          console.log('Column already exists (race?). Re-checking...\n');
          hasMobile = true;
        } else {
          console.error('Failed to add column:', err.message);
          console.log('\nRun manually: pnpm run migrate:banner-mobile');
          process.exit(1);
        }
      } finally {
        connection.release();
      }
      colResult = await query('SHOW COLUMNS FROM banners');
      colRows = colResult.rows || colResult;
      columns = Array.isArray(colRows) ? colRows.map(r => r.Field || r.field) : [];
      hasMobile = columns.includes('image_url_mobile');
    }

    if (!hasMobile) {
      console.log('\nColumn still missing. Run: pnpm run migrate:banner-mobile');
      process.exit(1);
    }

    // 2. Select banner id, title, image_url, image_url_mobile
    const result = await query(
      'SELECT id, title, image_url, image_url_mobile FROM banners ORDER BY order_index ASC, id ASC'
    );
    const rows = Array.isArray(result.rows) ? result.rows : (Array.isArray(result) ? result : []);

    console.log('\nBanners:');
    console.log('─'.repeat(80));
    rows.forEach((row, i) => {
      const mobile = row.image_url_mobile != null && String(row.image_url_mobile).trim() !== '';
      console.log(`${i + 1}. id=${row.id} title="${(row.title || '').slice(0, 30)}"`);
      console.log(`   image_url: ${(row.image_url || '').slice(0, 60)}...`);
      console.log(`   image_url_mobile: ${mobile ? (row.image_url_mobile || '').slice(0, 60) + '...' : '(empty/null)'}`);
      console.log('');
    });
    console.log('─'.repeat(80));
    const withMobile = rows.filter(r => r.image_url_mobile != null && String(r.image_url_mobile).trim() !== '');
    console.log(`Total banners: ${rows.length}. With image_url_mobile set: ${withMobile.length}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
