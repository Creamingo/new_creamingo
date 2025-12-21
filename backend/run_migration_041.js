/**
 * Migration 041: Add display_name column to order_items table
 * 
 * This migration adds a display_name column to store flavor-specific product names.
 * 
 * Run this script with: node run_migration_041.js
 */

const fs = require('fs');
const path = require('path');
const { query } = require('./src/config/db');

async function runMigration() {
  try {
    console.log('Starting migration 041: Add display_name to order_items...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', '041_add_display_name_to_order_items.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✓ Migration 041 completed successfully!');
    console.log('  Added display_name column to order_items table');
    process.exit(0);
  } catch (error) {
    // Check if column already exists (SQLite error)
    if (error.message && (
      error.message.includes('duplicate column') || 
      error.message.includes('already exists')
    )) {
      console.log('⚠ Migration 041 already applied (column exists)');
      process.exit(0);
    } else {
      console.error('✗ Migration 041 failed:', error.message);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the migration
runMigration();

