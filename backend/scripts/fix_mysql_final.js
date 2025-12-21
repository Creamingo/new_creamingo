/**
 * Final MySQL Schema Fix
 * Fixes all remaining syntax issues
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_mysql_from_postgres.sql');

function fixFinal() {
  console.log('🔧 Final MySQL schema fix...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix 1: Remove inline REFERENCES (MySQL doesn't support them)
  content = content.replace(/\s+REFERENCES\s+\w+\(\w+\)\s+ON\s+DELETE\s+\w+/gi, '');
  
  // Fix 2: Fix trailing commas before closing parenthesis
  content = content.replace(/,\s*\);$/gm, '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  content = content.replace(/,\s*\)\s*$/gm, '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  // Fix 3: Add FOREIGN KEY constraints for tables that need them
  // Map of table -> foreign keys
  const foreignKeys = {
    'subcategories': ['FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE'],
    'products': [
      'FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT',
      'FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL'
    ],
    'product_variants': ['FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE'],
    'collection_products': [
      'FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE',
      'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE'
    ],
    'orders': ['FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT'],
    'order_items': [
      'FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE',
      'FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT',
      'FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL'
    ],
    'payments': ['FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE']
  };
  
  // Add FOREIGN KEY constraints to each table
  for (const [tableName, fks] of Object.entries(foreignKeys)) {
    const pattern = new RegExp(`(CREATE TABLE\\s+${tableName}\\s*\\([\\s\\S]*?)(\\)\\s*ENGINE=)`, 'i');
    content = content.replace(pattern, (match, tableDef, closing) => {
      // Remove trailing comma if present
      const cleaned = tableDef.replace(/,\s*$/, '');
      const fkConstraints = fks.map(fk => `    ${fk}`).join(',\n');
      return `${cleaned},\n${fkConstraints}\n${closing}`;
    });
  }
  
  // Fix 4: Ensure all CREATE TABLE statements have ENGINE clause
  content = content.replace(/CREATE TABLE\s+\w+\s*\([^)]+\)\s*$/gm, (match) => {
    if (!match.includes('ENGINE=')) {
      return match.trim() + ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
    }
    return match;
  });
  
  // Fix 5: Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Final fixes applied!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixFinal();
}

module.exports = { fixFinal };

