/**
 * Remove All Incorrect Foreign Keys
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function removeIncorrectFKs() {
  console.log('🔧 Removing all incorrect foreign keys...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // List of columns that should NOT have foreign keys (non-FK columns)
  const invalidFKColumns = [
    'created_at', 'updated_at', 'display_name', 'product_name',
    'rating_count', 'order_id', 'subcategory_id', 'referee_id',
    'is_bestseller', 'last_updated', 'timestamp', 'ready_at',
    'picked_up_at', 'slug', 'Foreign', 'category_id', 'product_id',
    'review_id', 'collection_id', 'add_on_product_id'
  ];
  
  // But we need to keep valid foreign keys, so let's be more specific
  // Remove foreign keys that reference wrong columns
  content = content.replace(/FOREIGN KEY\s*\(is_bestseller\)[^)]+\)\s*\)/gi, '');
  content = content.replace(/FOREIGN KEY\s*\(last_updated\)[^)]+\)\s*\)/gi, '');
  content = content.replace(/FOREIGN KEY\s*\(timestamp\)[^)]+\)\s*\)/gi, '');
  content = content.replace(/FOREIGN KEY\s*\(ready_at\)[^)]+\)\s*\)/gi, '');
  content = content.replace(/FOREIGN KEY\s*\(picked_up_at\)[^)]+\)\s*\)/gi, '');
  content = content.replace(/FOREIGN KEY\s*\(slug\)[^)]+\)\s*\)/gi, '');
  content = content.replace(/FOREIGN KEY\s*\(Foreign\)[^)]+\)\s*\)/gi, '');
  
  // Fix duplicate FOREIGN KEY clauses
  content = content.replace(/FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+([^(]+)\([^)]+\)\)\s+REFERENCES/gi, 'FOREIGN KEY ($1) REFERENCES $2');
  
  // Fix FOREIGN KEY with double closing parenthesis
  content = content.replace(/FOREIGN KEY\s*\(([^)]+)\)\s+REFERENCES\s+([^(]+)\(([^)]+)\)\)\s*\)\s*ENGINE=/gi, 'FOREIGN KEY ($1) REFERENCES $2($3)\n) ENGINE=');
  
  // Clean up trailing commas
  content = content.replace(/,\s*\)\s*ENGINE=/g, '\n) ENGINE=');
  
  // Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Removed incorrect foreign keys!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  removeIncorrectFKs();
}

module.exports = { removeIncorrectFKs };

