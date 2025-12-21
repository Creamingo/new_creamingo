const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runOrderDetailsMigrations() {
  try {
    console.log('Starting order details migrations (049 & 050)...');

    // Migration 049: Add complete order details
    console.log('\n--- Running Migration 049: Add complete order details ---');
    const migration049Path = path.join(__dirname, '../database/migrations/049_add_complete_order_details.sql');
    const migration049SQL = fs.readFileSync(migration049Path, 'utf8');

    const statements049 = migration049SQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements049) {
      if (statement.trim()) {
        try {
          await query(statement.trim());
          console.log('✓ Executed:', statement.substring(0, 80) + '...');
        } catch (error) {
          if (error.message.includes('duplicate column name') || 
              error.message.includes('already exists') ||
              error.message.includes('duplicate')) {
            console.log('✓ Column/index already exists, skipping:', statement.substring(0, 80) + '...');
          } else {
            console.error('❌ Error:', error.message);
            throw error;
          }
        }
      }
    }

    // Migration 050: Add calculated order totals
    console.log('\n--- Running Migration 050: Add calculated order totals ---');
    const migration050Path = path.join(__dirname, '../database/migrations/050_add_calculated_order_totals.sql');
    const migration050SQL = fs.readFileSync(migration050Path, 'utf8');

    const statements050 = migration050SQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements050) {
      if (statement.trim()) {
        try {
          await query(statement.trim());
          console.log('✓ Executed:', statement.substring(0, 80) + '...');
        } catch (error) {
          if (error.message.includes('duplicate column name') || 
              error.message.includes('already exists') ||
              error.message.includes('duplicate')) {
            console.log('✓ Column/index already exists, skipping:', statement.substring(0, 80) + '...');
          } else {
            console.error('❌ Error:', error.message);
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Order details migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migrations
runOrderDetailsMigrations();

