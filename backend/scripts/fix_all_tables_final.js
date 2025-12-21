/**
 * Final Fix for All Tables Schema
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixFinal() {
  console.log('🔧 Final fix for all tables schema...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix 1: Fix FOREIGN KEY (DEFAULT) - should be category_id for add_on_products
  content = content.replace(/FOREIGN KEY \(DEFAULT\) REFERENCES add_on_categories\(id\)/g, 'FOREIGN KEY (category_id) REFERENCES add_on_categories(id)');
  
  // Fix 2: Fix incomplete ON DELETE clauses
  content = content.replace(/ON DELETE SET\s*\)/g, 'ON DELETE SET NULL)');
  content = content.replace(/ON DELETE SET\s*,/g, 'ON DELETE SET NULL,');
  
  // Fix 3: Fix broken DECIMAL definitions
  content = content.replace(/DECIMAL\((\d+),\s*\n\s*(\d+)\)/g, 'DECIMAL($1, $2)');
  
  // Fix 4: Remove empty lines between fields
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Fix 5: Fix fields that got split across lines incorrectly
  content = content.replace(/(\w+)\s+DECIMAL\((\d+),\s*\n\s*(\d+)\)/g, '$1 DECIMAL($2, $3)');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Final fixes applied!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixFinal();
}

module.exports = { fixFinal };

