/**
 * Final Syntax Fix for Schema
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixSyntax() {
  console.log('🔧 Final syntax fixes...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix 1: Remove orphaned string values that are not part of field definitions
  content = content.replace(/^\s*"([^"]+)",?\s*$/gm, '');
  content = content.replace(/^\s*"([^"]+)"\s*$/gm, '');
  
  // Fix 2: Fix malformed field definitions with ) NOT NULL,
  content = content.replace(/\)\s+NOT\s+NULL,?\s*$/gm, ' NOT NULL,');
  
  // Fix 3: Remove orphaned comment lines that break syntax
  content = content.replace(/^\s*--\s*e\.g\.,\s*$/gm, '');
  
  // Fix 4: Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Fix 5: Remove trailing commas before closing parenthesis
  content = content.replace(/,\s*\)\s*ENGINE=/g, '\n) ENGINE=');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Final syntax fixes applied!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixSyntax();
}

module.exports = { fixSyntax };

