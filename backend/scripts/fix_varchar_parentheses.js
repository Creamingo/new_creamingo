/**
 * Fix Missing Closing Parentheses in VARCHAR Definitions
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixVarcharParentheses() {
  console.log('🔧 Fixing missing closing parentheses in VARCHAR definitions...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix patterns like: VARCHAR(100 NOT NULL, -> VARCHAR(100) NOT NULL,
  content = content.replace(/VARCHAR\((\d+)\s+NOT NULL,/gi, 'VARCHAR($1) NOT NULL,');
  
  // Fix patterns like: VARCHAR(100 DEFAULT -> VARCHAR(100) DEFAULT
  content = content.replace(/VARCHAR\((\d+)\s+DEFAULT/gi, 'VARCHAR($1) DEFAULT');
  
  // Fix patterns like: VARCHAR(100 UNIQUE -> VARCHAR(100) UNIQUE
  content = content.replace(/VARCHAR\((\d+)\s+UNIQUE/gi, 'VARCHAR($1) UNIQUE');
  
  // Fix patterns like: VARCHAR(255 NOT NULL -> VARCHAR(255) NOT NULL (without comma)
  content = content.replace(/VARCHAR\((\d+)\s+NOT NULL([^,])/gi, 'VARCHAR($1) NOT NULL$2');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed missing closing parentheses in VARCHAR definitions!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixVarcharParentheses();
}

module.exports = { fixVarcharParentheses };

