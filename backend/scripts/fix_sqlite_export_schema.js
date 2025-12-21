/**
 * Fix SQLite Export Schema for MySQL
 * Fixes all syntax issues in the schema_mysql.sql file exported from SQLite
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_mysql.sql');

function fixSchema() {
  console.log('🔧 Fixing SQLite export schema for MySQL...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Add SET FOREIGN_KEY_CHECKS = 0 at the beginning
  if (!content.includes('SET FOREIGN_KEY_CHECKS')) {
    content = '-- Disable foreign key checks\nSET FOREIGN_KEY_CHECKS = 0;\n\n' + content;
  }
  
  // Fix 1: Convert INTEGER to INT
  content = content.replace(/\bINTEGER\b/gi, 'INT');
  
  // Fix 2: Fix fields on same line (e.g., "created_at DATETIME, slug VARCHAR(100)")
  content = content.replace(/(\w+)\s+(\w+(?:\([^)]+\))?),\s+(\w+)\s+(\w+(?:\([^)]+\))?)/g, (match, f1, t1, f2, t2) => {
    // Don't fix if it's part of a function call or already on separate lines
    if (match.includes('\n')) return match;
    return `${f1} ${t1},\n    ${f2} ${t2}`;
  });
  
  // Fix 3: Add ENGINE clause to all CREATE TABLE statements
  content = content.replace(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\)\s*$/gm, (match, tableName, tableBody) => {
    if (match.includes('ENGINE=')) return match;
    // Remove trailing commas before closing parenthesis
    const cleaned = tableBody.replace(/,\s*$/, '').trim();
    return `CREATE TABLE ${tableName} (\n${cleaned}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  });
  
  // Fix 4: Fix incomplete CREATE TABLE statements (missing closing parenthesis)
  content = content.replace(/CREATE TABLE\s+(\w+)\s*\(([^)]+)$/gm, (match, tableName, tableBody) => {
    return `CREATE TABLE ${tableName} (\n${tableBody}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  });
  
  // Fix 5: Add DROP TABLE IF EXISTS before each CREATE TABLE
  content = content.replace(/(?<!DROP TABLE IF EXISTS\s+)(CREATE TABLE\s+(\w+))/gi, 'DROP TABLE IF EXISTS $2;\nCREATE TABLE $2');
  
  // Fix 6: Remove duplicate AUTO_INCREMENT
  content = content.replace(/AUTO_INCREMENT\s+AUTO_INCREMENT/gi, 'AUTO_INCREMENT');
  
  // Fix 7: Fix BOOLEAN defaults
  content = content.replace(/BOOLEAN\s+DEFAULT\s+true/gi, 'BOOLEAN DEFAULT 1');
  content = content.replace(/BOOLEAN\s+DEFAULT\s+false/gi, 'BOOLEAN DEFAULT 0');
  
  // Fix 8: Remove DEFAULT from TEXT/JSON/BLOB columns
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+[^,)]+/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+'[^']*'/gi, '$1');
  
  // Fix 9: Clean up trailing commas before closing parenthesis
  content = content.replace(/,\s*\)\s*ENGINE=/g, '\n) ENGINE=');
  content = content.replace(/,\s*\)\s*$/gm, '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  // Fix 10: Fix UNIQUE constraints
  content = content.replace(/UNIQUE\(([^)]+)\)\s*\)/g, 'UNIQUE($1)\n)');
  
  // Fix 11: Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Add SET FOREIGN_KEY_CHECKS = 1 at the end
  if (!content.includes('SET FOREIGN_KEY_CHECKS = 1')) {
    content = content.trim() + '\n\n-- Re-enable foreign key checks\nSET FOREIGN_KEY_CHECKS = 1;\n';
  }
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed SQLite export schema!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixSchema();
}

module.exports = { fixSchema };

