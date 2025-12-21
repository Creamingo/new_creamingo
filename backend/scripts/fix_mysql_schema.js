/**
 * Fix MySQL Schema Syntax Issues
 * 
 * This script fixes common syntax errors in the generated MySQL schema
 * 
 * Usage:
 *   node scripts/fix_mysql_schema.js
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_mysql.sql');

function fixSchema() {
  console.log('🔧 Fixing MySQL schema syntax issues...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  const originalContent = content;
  
  // Fix: Remove quotes from table names
  content = content.replace(/CREATE TABLE\s+"([^"]+)"/gi, 'CREATE TABLE $1');
  content = content.replace(/CREATE TABLE\s+'([^']+)'/gi, 'CREATE TABLE $1');
  
  // Fix: Remove closing parenthesis before comma (e.g., "DEFAULT 'value' )," -> "DEFAULT 'value',")
  content = content.replace(/\)\s*,/g, ',');
  
  // Fix: Remove closing parenthesis at end of line before comma on next line
  content = content.replace(/\)\s*\n\s*,/g, ',\n');
  
  // Fix: Remove standalone closing parentheses that shouldn't be there
  // But keep them if they're part of a proper closing
  content = content.replace(/(DEFAULT\s+['"][^'"]+['"])\s*\)\s*,/gi, '$1,');
  content = content.replace(/(DEFAULT\s+\d+)\s*\)\s*,/gi, '$1,');
  
  // Fix: Fix incomplete VARCHAR definitions (e.g., "VARCHAR(50," -> "VARCHAR(50)")
  content = content.replace(/VARCHAR\((\d+),\s*([^)]*)$/gm, (match, size, rest) => {
    // If there's content after the comma, it might be part of the next field
    if (rest && !rest.includes(')')) {
      return `VARCHAR(${size}), ${rest}`;
    }
    return `VARCHAR(${size})`;
  });
  
  // Fix: Fix incomplete UNIQUE constraints (e.g., "UNIQUE(col1," -> "UNIQUE(col1)")
  content = content.replace(/UNIQUE\(([^,)]+),\s*([^)]*)$/gm, (match, col1, rest) => {
    if (rest && !rest.includes(')')) {
      return `UNIQUE(${col1}, ${rest})`;
    }
    return `UNIQUE(${col1})`;
  });
  
  // Fix: Remove closing parenthesis before FOREIGN KEY
  content = content.replace(/\)\s*,\s*FOREIGN KEY/gi, ',\n    FOREIGN KEY');
  
  // Fix: Remove closing parenthesis before UNIQUE
  content = content.replace(/\)\s*,\s*UNIQUE/gi, ',\n    UNIQUE');
  
  // Fix: Ensure proper table closing (should end with ) ENGINE=...)
  // Only add ENGINE if it doesn't already exist
  content = content.replace(/\)\s*$/gm, (match, offset, string) => {
    // Check if next line starts with ENGINE or if it's the end of file
    const nextChars = string.substring(offset + match.length, offset + match.length + 20);
    if (!nextChars.trim().startsWith('ENGINE') && !nextChars.trim().startsWith('--')) {
      return ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
    }
    return match;
  });
  
  // Fix: Remove duplicate ENGINE clauses
  content = content.replace(/\)\s+ENGINE=InnoDB[\s\S]*?ENGINE=InnoDB/gi, ') ENGINE=InnoDB');
  
  // Fix: Ensure semicolon at end of CREATE TABLE statements
  content = content.replace(/\)\s*ENGINE=InnoDB\s*$/gm, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  // Fix: Remove any remaining standalone closing parentheses on their own line
  content = content.replace(/^\s*\)\s*$/gm, '');
  
  // Fix: Clean up multiple consecutive commas
  content = content.replace(/,\s*,/g, ',');
  
  // Fix: Clean up trailing commas before closing parenthesis
  content = content.replace(/,\s*\)\s*ENGINE/g, '\n) ENGINE');
  content = content.replace(/,\s*\)\s*$/gm, '\n)');
  
  // Fix: Ensure proper spacing
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Write fixed content
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  if (content !== originalContent) {
    console.log('✅ Schema file fixed and saved!');
    console.log(`📂 File: ${SCHEMA_FILE}\n`);
  } else {
    console.log('ℹ️  No changes needed.\n');
  }
  
  console.log('📝 Next steps:');
  console.log('1. Review the fixed schema file');
  console.log('2. Upload to VPS and import:');
  console.log('   mysql -u creamingo_user -p creamingo < schema_mysql.sql');
}

if (require.main === module) {
  fixSchema();
}

module.exports = { fixSchema };

