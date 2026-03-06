/**
 * Run support_tickets migration (064_support_tickets.sql).
 * Usage (from project root): node backend/src/scripts/runSupportTicketsMigration.js
 * Or from backend folder: node src/scripts/runSupportTicketsMigration.js
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { query } = require('../config/db');

const MIGRATION_FILE = path.join(__dirname, '../../database/migrations/064_support_tickets.sql');

async function run() {
  console.log('Running support_tickets migration...');
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error('Migration file not found:', MIGRATION_FILE);
    process.exit(1);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    try {
      await query(stmt);
      console.log('  OK:', stmt.slice(0, 60).replace(/\s+/g, ' ') + '...');
    } catch (err) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate'))) {
        console.log('  Skip (already exists):', stmt.slice(0, 50).replace(/\s+/g, ' ') + '...');
      } else {
        console.error('  Failed:', err.message);
        throw err;
      }
    }
  }

  console.log('Support tickets migration finished.');
}

run().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
