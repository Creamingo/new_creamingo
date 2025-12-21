/**
 * Fix MySQL Foreign Key References
 * MySQL doesn't support inline REFERENCES - need to convert to separate FOREIGN KEY constraints
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../database/mysql_export/schema_mysql_from_postgres.sql');

function fixReferences() {
  console.log('🔧 Fixing MySQL foreign key references...\n');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
  
  // Fix 1: Convert inline REFERENCES to separate FOREIGN KEY constraints
  // Pattern: column_name TYPE REFERENCES table(id) ON DELETE action
  content = content.replace(/(\w+)\s+(\w+(?:\([^)]+\))?)\s+NOT\s+NULL\s+REFERENCES\s+(\w+)\((\w+)\)\s+ON\s+DELETE\s+(\w+)/gi, 
    '$1 $2 NOT NULL');
  content = content.replace(/(\w+)\s+(\w+(?:\([^)]+\))?)\s+REFERENCES\s+(\w+)\((\w+)\)\s+ON\s+DELETE\s+(\w+)/gi, 
    '$1 $2');
  
  // Now add FOREIGN KEY constraints at the end of each CREATE TABLE
  const tableMatches = content.matchAll(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\)\s+ENGINE=/gi);
  const tables = [];
  
  for (const match of tableMatches) {
    const tableName = match[1];
    const tableBody = match[2];
    const fullMatch = match[0];
    
    // Find all REFERENCES in the table body
    const refMatches = tableBody.matchAll(/(\w+)\s+(\w+(?:\([^)]+\))?)\s+(?:NOT\s+NULL\s+)?REFERENCES\s+(\w+)\((\w+)\)\s+ON\s+DELETE\s+(\w+)/gi);
    const foreignKeys = [];
    
    for (const refMatch of refMatches) {
      const columnName = refMatch[1];
      const refTable = refMatch[3];
      const refColumn = refMatch[4];
      const onDelete = refMatch[5];
      foreignKeys.push(`    FOREIGN KEY (${columnName}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete}`);
    }
    
    if (foreignKeys.length > 0) {
      tables.push({
        tableName,
        fullMatch,
        foreignKeys,
        tableBody: tableBody.replace(/\s+REFERENCES\s+\w+\(\w+\)\s+ON\s+DELETE\s+\w+/gi, '')
      });
    }
  }
  
  // Replace CREATE TABLE statements with fixed versions
  for (const table of tables) {
    const oldPattern = new RegExp(`CREATE TABLE\\s+${table.tableName}\\s*\\([\\s\\S]*?\\)\\s+ENGINE=`, 'i');
    const newBody = table.tableBody.trim();
    const fkConstraints = table.foreignKeys.join(',\n');
    const newTable = `CREATE TABLE ${table.tableName} (\n${newBody},\n${fkConstraints}\n) ENGINE=`;
    content = content.replace(oldPattern, newTable);
  }
  
  // Fix 2: Fix UNIQUE constraint with semicolon (should be comma)
  content = content.replace(/UNIQUE\(([^)]+)\);/g, 'UNIQUE($1),');
  
  // Fix 3: Remove trailing semicolons before closing parenthesis in CREATE TABLE
  content = content.replace(/,\s*\);(\s+ENGINE=)/g, '\n)$1');
  content = content.replace(/,\s*\)\s*ENGINE=/g, '\n) ENGINE=');
  
  // Fix 4: Clean up double commas
  content = content.replace(/,\s*,/g, ',');
  
  // Fix 5: Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(SCHEMA_FILE, content, 'utf8');
  
  console.log('✅ Fixed foreign key references!');
  console.log(`📂 File: ${SCHEMA_FILE}\n`);
}

if (require.main === module) {
  fixReferences();
}

module.exports = { fixReferences };

