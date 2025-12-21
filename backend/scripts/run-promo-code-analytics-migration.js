const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runPromoCodeAnalyticsMigration() {
  try {
    console.log('Starting promo code analytics migration (054)...\n');

    // Migration 054: Create promo_code_analytics tables
    console.log('--- Running Migration 054: Create promo_code_analytics tables ---');
    const migration054Path = path.join(__dirname, '../database/migrations/054_create_promo_code_analytics.sql');
    const migration054SQL = fs.readFileSync(migration054Path, 'utf8');

    // Split by semicolon, but handle multi-line statements
    const lines = migration054SQL.split('\n');
    let currentStatement = '';
    const allStatements = [];

    for (const line of lines) {
      // Remove inline comments (-- comment)
      let cleanLine = line;
      const commentIndex = cleanLine.indexOf('--');
      if (commentIndex >= 0) {
        cleanLine = cleanLine.substring(0, commentIndex);
      }
      const trimmedLine = cleanLine.trim();
      
      // Skip empty lines
      if (trimmedLine.length === 0) {
        continue;
      }
      
      currentStatement += (currentStatement ? ' ' : '') + trimmedLine;
      
      // If line ends with semicolon, we have a complete statement
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement.replace(/;+$/, '').trim();
        if (stmt.length > 0) {
          allStatements.push(stmt);
        }
        currentStatement = '';
      }
    }

    // If there's a remaining statement without semicolon, add it
    if (currentStatement.trim().length > 0) {
      allStatements.push(currentStatement.trim());
    }

    // Separate CREATE TABLE from CREATE INDEX statements
    const createTableStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE TABLE')
    );
    const createIndexStatements = allStatements.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE INDEX')
    );

    // Execute CREATE TABLE statements first
    for (const statement of createTableStatements) {
      try {
        // Ensure statement ends with semicolon
        const sqlStatement = statement.endsWith(';') ? statement : statement + ';';
        await query(sqlStatement);
        console.log('✓ Created table');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('✓ Table already exists, skipping');
        } else {
          console.error('❌ Error creating table:', error.message);
          throw error;
        }
      }
    }

    // Then execute CREATE INDEX statements
    for (const statement of createIndexStatements) {
      try {
        await query(statement);
        console.log('✓ Created index:', statement.substring(0, 60) + '...');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('✓ Index already exists, skipping');
        } else {
          console.error('❌ Error creating index:', error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ Promo code analytics migration completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('   - promo_code_analytics (tracks promo code events)');
    console.log('   - promo_code_performance_cache (aggregated performance metrics)');
    console.log('\n💡 You can now use the backfill feature to import historical order data.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
runPromoCodeAnalyticsMigration();
