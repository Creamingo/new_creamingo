const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runDealAnalyticsMigrations() {
  try {
    console.log('Starting deal analytics migrations (052 & 053)...\n');

    // Migration 052: Create deal_analytics table
    console.log('--- Running Migration 052: Create deal_analytics table ---');
    const migration052Path = path.join(__dirname, '../database/migrations/052_create_deal_analytics.sql');
    const migration052SQL = fs.readFileSync(migration052Path, 'utf8');

    // Split by semicolon, but handle multi-line statements
    const lines = migration052SQL.split('\n');
    let currentStatement = '';
    const allStatements052 = [];

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
          allStatements052.push(stmt);
        }
        currentStatement = '';
      }
    }

    // If there's a remaining statement without semicolon, add it
    if (currentStatement.trim().length > 0) {
      allStatements052.push(currentStatement.trim());
    }

    // Separate CREATE TABLE from CREATE INDEX statements
    const createTableStatements = allStatements052.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE TABLE')
    );
    const createIndexStatements = allStatements052.filter(stmt => 
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

    console.log('\n--- Running Migration 053: Create deal_performance_cache table ---');
    const migration053Path = path.join(__dirname, '../database/migrations/053_create_deal_performance_cache.sql');
    const migration053SQL = fs.readFileSync(migration053Path, 'utf8');

    // Split by semicolon, but handle multi-line statements
    const lines053 = migration053SQL.split('\n');
    let currentStatement053 = '';
    const allStatements053 = [];

    for (const line of lines053) {
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
      
      currentStatement053 += (currentStatement053 ? ' ' : '') + trimmedLine;
      
      // If line ends with semicolon, we have a complete statement
      if (trimmedLine.endsWith(';')) {
        const stmt = currentStatement053.replace(/;+$/, '').trim();
        if (stmt.length > 0) {
          allStatements053.push(stmt);
        }
        currentStatement053 = '';
      }
    }

    // If there's a remaining statement without semicolon, add it
    if (currentStatement053.trim().length > 0) {
      allStatements053.push(currentStatement053.trim());
    }

    // Separate CREATE TABLE from CREATE INDEX statements
    const createTableStatements053 = allStatements053.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE TABLE')
    );
    const createIndexStatements053 = allStatements053.filter(stmt => 
      stmt.toUpperCase().startsWith('CREATE INDEX')
    );

    // Execute CREATE TABLE statements first
    for (const statement of createTableStatements053) {
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
    for (const statement of createIndexStatements053) {
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

    console.log('\n✅ Deal analytics migrations completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('   - deal_analytics (tracks deal events)');
    console.log('   - deal_performance_cache (aggregated performance metrics)');
    console.log('\n💡 You can now use the backfill feature to import historical order data.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migrations
runDealAnalyticsMigrations();

