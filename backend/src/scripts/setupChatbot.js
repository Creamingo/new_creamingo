/**
 * Run chatbot migration and seed in one go.
 * Usage (from project root): node backend/src/scripts/setupChatbot.js
 * Or from backend folder: node src/scripts/setupChatbot.js
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { query } = require('../config/db');

const MIGRATION_FILE = path.join(__dirname, '../../database/migrations/063_create_chatbot_tables.sql');

async function runMigration() {
  console.log('Running chatbot migration...');
  if (!fs.existsSync(MIGRATION_FILE)) {
    throw new Error('Migration file not found: ' + MIGRATION_FILE);
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
      console.log('  OK:', stmt.slice(0, 55).replace(/\s+/g, ' ') + '...');
    } catch (err) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate'))) {
        console.log('  Skip (already exists)');
      } else throw err;
    }
  }
  console.log('Migration done.\n');
}

async function main() {
  await runMigration();
  console.log('Seeding default intents and FAQs...');
  const { seed } = require('./seedChatbotConfig.js');
  await seed();
  console.log('\nChatbot setup finished.');
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
