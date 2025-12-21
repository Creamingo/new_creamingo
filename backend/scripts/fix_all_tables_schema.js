/**
 * Fix All Tables Schema for MySQL
 * Fixes syntax issues in schema_all_tables_mysql.sql
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixSchema() {
  console.log('🔧 Fixing all tables schema...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix 1: Remove duplicate AUTO_INCREMENT
  content = content.replace(/AUTO_INCREMENT\s+AUTO_INCREMENT/gi, 'AUTO_INCREMENT');
  
  // Fix 2: Fix incomplete FOREIGN KEY constraints
  content = content.replace(/FOREIGN KEY\s*\(([^)]+)\)\s*,/g, '');
  content = content.replace(/FOREIGN KEY\s*\(FOREIGN\)/g, '');
  
  // Fix 3: Fix malformed UNIQUE constraints
  content = content.replace(/UNIQUE\(([^,]+),\s*([^)]+)\)/g, 'UNIQUE($1, $2)');
  
  // Fix 4: Remove standalone FOREIGN KEY lines without REFERENCES
  content = content.replace(/^\s*FOREIGN KEY\s*\([^)]+\)\s*,?\s*$/gm, '');
  
  // Fix 5: Clean up trailing commas before closing parenthesis
  content = content.replace(/,\s*\)\s*ENGINE=/g, '\n) ENGINE=');
  
  // Fix 6: Fix fields on same line
  content = content.replace(/(\w+)\s+(\w+(?:\([^)]+\))?),\s+(\w+)\s+(\w+(?:\([^)]+\))?),/g, '$1 $2,\n    $3 $4,');
  
  // Fix 7: Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed all tables schema!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixSchema();
}

module.exports = { fixSchema };

