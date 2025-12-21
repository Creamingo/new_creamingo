/**
 * Fix Extra Closing Parentheses After DEFAULT Values
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixExtraParentheses() {
  console.log('🔧 Fixing extra closing parentheses after DEFAULT values...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix patterns like: DEFAULT 'value' ), -> DEFAULT 'value',
  // But only if it's not the last field before ENGINE
  content = content.replace(/DEFAULT\s+'([^']+)'\s+\)\s*,/gi, "DEFAULT '$1',");
  
  // Fix patterns like: DEFAULT 'value' ) without comma (last field before ENGINE)
  // We need to be careful here - only if followed by ENGINE
  content = content.replace(/DEFAULT\s+'([^']+)'\s+\)\s*\n\s*\)\s*ENGINE=/gi, "DEFAULT '$1'\n) ENGINE=");
  
  // Fix patterns like: DEFAULT 'value' ) followed by newline and ENGINE
  content = content.replace(/DEFAULT\s+'([^']+)'\s+\)\s*\n\s*ENGINE=/gi, "DEFAULT '$1'\n) ENGINE=");
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed extra closing parentheses after DEFAULT values!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixExtraParentheses();
}

module.exports = { fixExtraParentheses };

