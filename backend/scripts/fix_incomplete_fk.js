/**
 * Fix Incomplete FOREIGN KEY Constraints
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_mysql_clean.sql');

function fixIncompleteFK() {
  console.log('🔧 Fixing incomplete FOREIGN KEY constraints...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix incomplete FOREIGN KEY constraints
  content = content.replace(/FOREIGN KEY \(category_id\)\s*\)/g, 'FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE)');
  content = content.replace(/FOREIGN KEY \(product_id\)\s*\)/g, 'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)');
  content = content.replace(/FOREIGN KEY \(subcategory_id\)\s*\)/g, 'FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL)');
  content = content.replace(/FOREIGN KEY \(order_id\)\s*\)/g, 'FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE)');
  content = content.replace(/FOREIGN KEY \(variant_id\)\s*\)/g, 'FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL)');
  content = content.replace(/FOREIGN KEY \(customer_id\)\s*\)/g, 'FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT)');
  
  // Fix fields on same line (e.g., "description TEXT, category_id INT,")
  content = content.replace(/(\w+)\s+(\w+(?:\([^)]+\))?),\s+(\w+)\s+(\w+(?:\([^)]+\))?),/g, '$1 $2,\n    $3 $4,');
  content = content.replace(/(\w+)\s+(\w+(?:\([^)]+\))?),\s+(\w+)\s+(\w+(?:\([^)]+\))?)\s*\)/g, '$1 $2,\n    $3 $4)');
  content = content.replace(/(\w+)\s+(\w+(?:\([^)]+\))?),\s+(\w+)\s+(\w+(?:\([^)]+\))?)\s*$/gm, '$1 $2,\n    $3 $4');
  
  // Fix id on same line as CREATE TABLE
  content = content.replace(/CREATE TABLE\s+(\w+)\s*\(\s*id\s+INT/g, 'CREATE TABLE $1 (\n    id INT');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed incomplete FOREIGN KEY constraints!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixIncompleteFK();
}

module.exports = { fixIncompleteFK };

