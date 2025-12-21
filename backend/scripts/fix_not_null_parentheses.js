/**
 * Fix Extra Closing Parentheses After NOT NULL
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixNotNullParentheses() {
  console.log('🔧 Fixing extra closing parentheses after NOT NULL...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix patterns like: NOT NULL ), -> NOT NULL,
  content = content.replace(/NOT NULL\s+\)\s*,/gi, 'NOT NULL,');
  
  // Fix patterns like: NOT NULL ) followed by newline (last field before ENGINE)
  // But only if it's not followed by another field definition
  content = content.replace(/NOT NULL\s+\)\s*\n\s*\)\s*ENGINE=/gi, 'NOT NULL\n) ENGINE=');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed extra closing parentheses after NOT NULL!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixNotNullParentheses();
}

module.exports = { fixNotNullParentheses };

