/**
 * Fix Incorrect Foreign Key Constraints
 * Removes foreign keys that reference non-FK columns (created_at, updated_at, display_name, etc.)
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function fixIncorrectFKs() {
  console.log('🔧 Fixing incorrect foreign key constraints...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // List of columns that should NOT have foreign keys
  const invalidFKColumns = [
    'created_at', 'updated_at', 'display_name', 'product_name',
    'rating_count', 'order_id', 'subcategory_id', 'referee_id'
  ];
  
  // Remove foreign keys on invalid columns
  invalidFKColumns.forEach(col => {
    const pattern = new RegExp(`FOREIGN KEY\\s*\\(${col}\\)\\s+REFERENCES[^,)]+[,\\)]`, 'gi');
    content = content.replace(pattern, '');
  });
  
  // Fix "FOREIGN KEY (column) NULL," patterns
  content = content.replace(/FOREIGN KEY\s*\([^)]+\)\s+NULL,?\s*/gi, '');
  
  // Fix "UNIQUE(column), REFERENCES" patterns
  content = content.replace(/UNIQUE\(([^)]+)\),\s*REFERENCES/gi, 'UNIQUE($1),\n    FOREIGN KEY ($1) REFERENCES');
  
  // Clean up multiple commas
  content = content.replace(/,\s*,/g, ',');
  
  // Clean up trailing commas before closing parenthesis
  content = content.replace(/,\s*\)\s*ENGINE=/g, '\n) ENGINE=');
  
  // Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed incorrect foreign key constraints!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixIncorrectFKs();
}

module.exports = { fixIncorrectFKs };

