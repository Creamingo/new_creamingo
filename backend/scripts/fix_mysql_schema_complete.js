/**
 * Complete MySQL Schema Fixer
 * Fixes all PostgreSQL-specific syntax for MySQL compatibility
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_mysql_from_postgres.sql');

function fixSchema() {
  console.log('🔧 Comprehensive MySQL schema fix...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix 1: Convert JSONB to JSON (MySQL doesn't have JSONB)
  content = content.replace(/JSONB/gi, 'JSON');
  
  // Fix 2: Remove PostgreSQL-specific extensions
  content = content.replace(/CREATE EXTENSION[^;]+;/gi, '');
  
  // Fix 3: Convert SERIAL to INT AUTO_INCREMENT
  content = content.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  content = content.replace(/\s+SERIAL\s+/gi, ' INT AUTO_INCREMENT ');
  content = content.replace(/SERIAL,/gi, 'INT AUTO_INCREMENT,');
  
  // Fix 4: Convert INTEGER to INT for primary keys
  content = content.replace(/INTEGER\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  
  // Fix 5: Remove CHECK constraints
  content = content.replace(/CHECK\s*\([^)]+\)/gi, '');
  content = content.replace(/CHECK\s*\([^)]*\)/gs, '');
  
  // Fix 6: Clean up trailing commas/parentheses after CHECK removal
  content = content.replace(/,\s*\)\s*,/g, ',');
  content = content.replace(/\s+\)\s*,/g, ',');
  content = content.replace(/DEFAULT\s+['"][^'"]+['"]\s*\)\s*,/gi, (match) => {
    return match.replace(/\s*\)\s*,/, ',');
  });
  
  // Fix 7: Convert boolean true/false to 1/0
  content = content.replace(/BOOLEAN\s+DEFAULT\s+true/gi, 'BOOLEAN DEFAULT 1');
  content = content.replace(/BOOLEAN\s+DEFAULT\s+false/gi, 'BOOLEAN DEFAULT 0');
  content = content.replace(/BOOLEAN\s+DEFAULT\s+'true'/gi, "BOOLEAN DEFAULT 1");
  content = content.replace(/BOOLEAN\s+DEFAULT\s+'false'/gi, "BOOLEAN DEFAULT 0");
  
  // Fix 8: Remove DEFAULT values from TEXT, JSON, and BLOB columns
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+[^,)]+/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+'[^']*'/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+"[^"]*"/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+\{\}/gi, '$1');
  
  // Fix 9: Convert TIMESTAMP to DATETIME (but keep CURRENT_TIMESTAMP)
  content = content.replace(/TIMESTAMP\s+DEFAULT\s+CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP\s+DEFAULT\s+NOW\(\)/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP\s+DEFAULT/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP,/gi, 'DATETIME,');
  content = content.replace(/TIMESTAMP\s*\)/gi, 'DATETIME)');
  
  // Fix 10: Fix any incorrect CURRENT_DATETIME to CURRENT_TIMESTAMP
  content = content.replace(/CURRENT_DATETIME/gi, 'CURRENT_TIMESTAMP');
  
  // Fix 11: Convert TEXT[] arrays to JSON
  content = content.replace(/TEXT\[\]/gi, 'JSON');
  
  // Fix 12: Remove ENGINE clauses from INSERT statements
  content = content.replace(/\)\s+ENGINE=InnoDB[^;]+$/gm, ');');
  content = content.replace(/INSERT\s+INTO[^;]+ENGINE=InnoDB[^;]+;/gi, (match) => {
    return match.replace(/\s+ENGINE=InnoDB[^;]+$/, ';');
  });
  
  // Fix 13: Remove ENGINE clauses from CREATE INDEX statements
  content = content.replace(/CREATE\s+INDEX[^;]+ENGINE=InnoDB[^;]+;/gi, (match) => {
    return match.replace(/\s+ENGINE=InnoDB[^;]+$/, ';');
  });
  
  // Fix 14: Remove PostgreSQL triggers and functions (MySQL uses different syntax)
  content = content.replace(/CREATE\s+OR\s+REPLACE\s+FUNCTION[^;]+;/gs, '');
  content = content.replace(/CREATE\s+TRIGGER[^;]+ENGINE=InnoDB[^;]+;/gi, '');
  
  // Fix 15: Add DROP TABLE IF EXISTS before each CREATE TABLE (if not already present)
  content = content.replace(/(?<!DROP TABLE IF EXISTS\s+)(?<!;\s*)(CREATE TABLE\s+(\w+))/gi, 'DROP TABLE IF EXISTS $2;\nCREATE TABLE $2');
  
  // Fix 16: Ensure proper ENGINE clause only on CREATE TABLE statements
  content = content.replace(/CREATE TABLE[^;]+\)\s*$/gm, (match) => {
    if (!match.includes('ENGINE=')) {
      return match.trim() + ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
    }
    return match;
  });
  
  // Fix 17: Clean up multiple consecutive newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Fix 18: Remove trailing spaces
  content = content.replace(/[ \t]+$/gm, '');
  
  // Fix 19: Fix INTEGER type (should be INT in MySQL)
  content = content.replace(/\bINTEGER\b/gi, 'INT');
  
  // Fix 20: Remove invalid syntax from order_items (trailing space before comma)
  content = content.replace(/INTEGER\s+NOT\s+NULL\s+,/gi, 'INT NOT NULL,');
  
  // Write fixed content
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Schema file completely fixed!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
  console.log('📝 Fixed issues:');
  console.log('  ✓ JSONB → JSON');
  console.log('  ✓ Removed CHECK constraints');
  console.log('  ✓ Removed DEFAULT from TEXT/JSON/BLOB');
  console.log('  ✓ Removed PostgreSQL triggers/functions');
  console.log('  ✓ Removed ENGINE from INSERT/INDEX statements');
  console.log('  ✓ Fixed boolean defaults');
  console.log('  ✓ Fixed TIMESTAMP → DATETIME\n');
}

if (require.main === module) {
  fixSchema();
}

module.exports = { fixSchema };

