const { query } = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runTargetTiersMigration() {
  try {
    console.log('Starting delivery target tiers migration...');

    // Read and execute the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/059_create_delivery_target_tiers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and split by semicolons, but keep multi-line statements together
    const cleanedSQL = migrationSQL
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('--'))
      .join('\n');

    // Split by semicolons, but ensure we don't split inside parentheses
    const statements = [];
    let currentStatement = '';
    let parenDepth = 0;
    
    for (let i = 0; i < cleanedSQL.length; i++) {
      const char = cleanedSQL[i];
      currentStatement += char;
      
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;
      
      if (char === ';' && parenDepth === 0) {
        const trimmed = currentStatement.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    // Execute statements one by one
    for (const statement of statements) {
      if (!statement || statement.trim().length === 0) continue;
      
      try {
        await query(statement);
        const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
        console.log(`✓ Executed: ${preview}...`);
      } catch (error) {
        // Ignore "table already exists" or "index already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('UNIQUE constraint') ||
            error.message.includes('duplicate column name')) {
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.log(`⚠ Skipped (already exists): ${preview}...`);
        } else {
          console.error(`❌ Error executing statement: ${statement.substring(0, 100)}`);
          throw error;
        }
      }
    }

    console.log('\n✅ Delivery target tiers migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runTargetTiersMigration();
