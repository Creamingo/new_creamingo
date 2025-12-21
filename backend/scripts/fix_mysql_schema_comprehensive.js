/**
 * Comprehensive MySQL Schema Fixer
 * 
 * Fixes all syntax errors in the generated MySQL schema
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_mysql.sql');

function fixSchema() {
  console.log('🔧 Comprehensive MySQL schema fix...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix 1: Remove quotes from table names
  content = content.replace(/CREATE TABLE\s+"([^"]+)"/gi, 'CREATE TABLE $1');
  content = content.replace(/CREATE TABLE\s+'([^']+)'/gi, 'CREATE TABLE $1');
  
  // Fix 2: Fix incomplete VARCHAR definitions
  content = content.replace(/VARCHAR\((\d+),/g, 'VARCHAR($1)');
  
  // Fix 3: Fix incomplete DECIMAL definitions
  content = content.replace(/DECIMAL\((\d+),\s*(\d+),/g, 'DECIMAL($1, $2)');
  
  // Fix 4: Remove closing parentheses before commas
  content = content.replace(/\)\s*,/g, ',');
  
  // Fix 5: Fix UNIQUE constraints with ENGINE clause
  content = content.replace(/UNIQUE\(([^)]+)\)\s+ENGINE=/gi, 'UNIQUE($1)\n) ENGINE=');
  
  // Fix 6: Remove duplicate ENGINE clauses
  content = content.replace(/\)\s+ENGINE=InnoDB[^\n]*\n\)\s+ENGINE=InnoDB/gi, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  // Fix 7: Fix lines that have ENGINE in the middle (should be at the end)
  content = content.replace(/(UNIQUE\([^)]+\))\s+ENGINE=/gi, '$1\n) ENGINE=');
  
  // Fix 8: Ensure all CREATE TABLE statements end properly
  content = content.replace(/\)\s*ENGINE=InnoDB\s*$/gm, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  // Fix 9: Add missing closing parentheses for incomplete definitions
  // Fix incomplete field definitions at end of lines
  content = content.replace(/(VARCHAR\([^)]+),\s*([a-z_]+)\s+([A-Z]+)/gi, '$1), $2 $3');
  content = content.replace(/(DECIMAL\([^)]+),\s*([a-z_]+)\s+([A-Z]+)/gi, '$1), $2 $3');
  
  // Fix 10: Clean up malformed field definitions
  // Pattern: field_name TYPE(params, next_field
  content = content.replace(/(\w+)\s+(VARCHAR|DECIMAL|INTEGER)\(([^,)]+),\s*([a-z_]+)\s+([A-Z_]+)/gi, 
    (match, field, type, params, nextField, nextType) => {
      // If params doesn't have closing paren, it's incomplete
      if (!params.includes(')')) {
        return `${field} ${type}(${params}), ${nextField} ${nextType}`;
      }
      return match;
    }
  );
  
  // Fix 11: Remove standalone closing parentheses
  content = content.replace(/^\s*\)\s*$/gm, '');
  
  // Fix 12: Clean up multiple consecutive commas
  content = content.replace(/,\s*,/g, ',');
  
  // Fix 13: Fix trailing commas before closing parenthesis
  content = content.replace(/,\s*\)\s*ENGINE/g, '\n) ENGINE');
  
  // Fix 14: Ensure proper line breaks
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Fix 15: Fix specific pattern: field definitions on same line without proper separation
  // Split long lines that have multiple field definitions improperly joined
  content = content.split('\n').map(line => {
    // If line is very long and has multiple field definitions, try to split them
    if (line.length > 200 && line.includes('CREATE TABLE')) {
      // This is a table definition line - might need manual review
      return line;
    }
    // Fix lines with incomplete definitions followed by field names
    line = line.replace(/(\w+)\s+(VARCHAR|DECIMAL|INTEGER)\(([^)]+),\s*([a-z_]+)/gi, 
      (match, field, type, params, nextField) => {
        if (!params.includes(')')) {
          return `${field} ${type}(${params}),\n    ${nextField}`;
        }
        return match;
      }
    );
    return line;
  }).join('\n');
  
  // Write fixed content
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Schema file fixed!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
  console.log('⚠️  Please review the file for any remaining issues before importing.\n');
}

if (require.main === module) {
  fixSchema();
}

module.exports = { fixSchema };

