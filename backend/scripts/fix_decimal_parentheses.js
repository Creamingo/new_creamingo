/**
 * Fix Missing Closing Parentheses in DECIMAL Definitions
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixDecimalParentheses() {
  console.log('🔧 Fixing missing closing parentheses in DECIMAL definitions...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix patterns like: DECIMAL(10, 2 NOT NULL, -> DECIMAL(10, 2) NOT NULL,
  content = content.replace(/DECIMAL\((\d+),\s*(\d+)\s+NOT NULL,/gi, 'DECIMAL($1, $2) NOT NULL,');
  
  // Fix patterns like: DECIMAL(10, 2 DEFAULT -> DECIMAL(10, 2) DEFAULT
  content = content.replace(/DECIMAL\((\d+),\s*(\d+)\s+DEFAULT/gi, 'DECIMAL($1, $2) DEFAULT');
  
  // Fix patterns like: DECIMAL(10, 8 NOT NULL -> DECIMAL(10, 8) NOT NULL (without comma)
  content = content.replace(/DECIMAL\((\d+),\s*(\d+)\s+NOT NULL([^,])/gi, 'DECIMAL($1, $2) NOT NULL$3');
  
  // Fix patterns like: DECIMAL(11, 8 NOT NULL -> DECIMAL(11, 8) NOT NULL (without comma)
  content = content.replace(/DECIMAL\((\d+),\s*(\d+)\s+NOT NULL([^,])/gi, 'DECIMAL($1, $2) NOT NULL$3');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed missing closing parentheses in DECIMAL definitions!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixDecimalParentheses();
}

module.exports = { fixDecimalParentheses };

