/**
 * Fix Colon Before ENGINE Clause
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixColonBeforeEngine() {
  console.log('🔧 Fixing colon before ENGINE clause...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix patterns like: : ENGINE= -> ) ENGINE=
  content = content.replace(/:\s*ENGINE=/gi, ') ENGINE=');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed colon before ENGINE clause!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixColonBeforeEngine();
}

module.exports = { fixColonBeforeEngine };

