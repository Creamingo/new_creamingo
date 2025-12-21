/**
 * Fix Double Closing Parentheses in FOREIGN KEY Constraints
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixDoubleParentheses() {
  console.log('🔧 Fixing double closing parentheses...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix double closing parentheses in FOREIGN KEY constraints
  content = content.replace(/REFERENCES\s+([^(]+)\(([^)]+)\)\)\s*ENGINE=/gi, 'REFERENCES $1($2)\n) ENGINE=');
  content = content.replace(/REFERENCES\s+([^(]+)\(([^)]+)\)\)\s*\)\s*ENGINE=/gi, 'REFERENCES $1($2)\n) ENGINE=');
  
  // Fix FOREIGN KEY with double closing parenthesis before ENGINE
  content = content.replace(/FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+([^(]+)\(([^)]+)\)\)\s*ENGINE=/gi, 
    'FOREIGN KEY ($1) REFERENCES $2($3)\n) ENGINE=');
  
  // Clean up
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed double closing parentheses!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixDoubleParentheses();
}

module.exports = { fixDoubleParentheses };

