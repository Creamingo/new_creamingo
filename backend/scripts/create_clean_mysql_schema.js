/**
 * Create Clean MySQL Schema from PostgreSQL Schema
 * Properly converts all PostgreSQL syntax to MySQL
 */

const fs = require('fs');
const path = require('path');

const POSTGRES_SCHEMA = path.join(__dirname, '../database/schema.sql');
const MYSQL_SCHEMA = path.join(__dirname, '../database/mysql_export/schema_mysql_clean.sql');

function createCleanMySQLSchema() {
  console.log('🔄 Creating clean MySQL schema...\n');
  
  if (!fs.existsSync(POSTGRES_SCHEMA)) {
    console.error(`❌ PostgreSQL schema not found: ${POSTGRES_SCHEMA}`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(POSTGRES_SCHEMA, 'utf8');
  
  // Remove PostgreSQL extensions
  content = content.replace(/CREATE EXTENSION[^;]+;/gi, '');
  
  // Convert SERIAL to INT AUTO_INCREMENT
  content = content.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  content = content.replace(/\s+SERIAL\s+/gi, ' INT AUTO_INCREMENT ');
  content = content.replace(/SERIAL,/gi, 'INT AUTO_INCREMENT,');
  
  // Convert INTEGER to INT
  content = content.replace(/\bINTEGER\b/gi, 'INT');
  
  // Remove CHECK constraints
  content = content.replace(/CHECK\s*\([^)]+\)/gi, '');
  content = content.replace(/CHECK\s*\([^)]*\)/gs, '');
  
  // Clean up after CHECK removal
  content = content.replace(/,\s*\)\s*,/g, ',');
  content = content.replace(/\s+\)\s*,/g, ',');
  
  // Convert boolean
  content = content.replace(/BOOLEAN\s+DEFAULT\s+true/gi, 'BOOLEAN DEFAULT 1');
  content = content.replace(/BOOLEAN\s+DEFAULT\s+false/gi, 'BOOLEAN DEFAULT 0');
  
  // Convert TIMESTAMP to DATETIME
  content = content.replace(/TIMESTAMP\s+DEFAULT\s+NOW\(\)/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP\s+DEFAULT/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP,/gi, 'DATETIME,');
  content = content.replace(/TIMESTAMP\s*\)/gi, 'DATETIME)');
  
  // Convert TEXT[] to JSON
  content = content.replace(/TEXT\[\]/gi, 'JSON');
  
  // Remove DEFAULT from TEXT/JSON/BLOB
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+[^,)]+/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+'[^']*'/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+\{\}/gi, '$1');
  
  // Convert inline REFERENCES to separate FOREIGN KEY constraints
  // First, extract all foreign keys
  const tables = [];
  const tableMatches = content.matchAll(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\)\s*;/gi);
  
  for (const match of tableMatches) {
    const tableName = match[1];
    let tableBody = match[2];
    const foreignKeys = [];
    
    // Find all REFERENCES
    const refPattern = /(\w+)\s+(\w+(?:\([^)]+\))?)\s+(?:NOT\s+NULL\s+)?REFERENCES\s+(\w+)\((\w+)\)\s+ON\s+DELETE\s+(\w+)/gi;
    let refMatch;
    
    while ((refMatch = refPattern.exec(tableBody)) !== null) {
      const columnName = refMatch[1];
      const refTable = refMatch[3];
      const refColumn = refMatch[4];
      const onDelete = refMatch[5];
      foreignKeys.push(`    FOREIGN KEY (${columnName}) REFERENCES ${refTable}(${refColumn}) ON DELETE ${onDelete}`);
      
      // Remove the REFERENCES from column definition
      tableBody = tableBody.replace(
        new RegExp(`\\s+${columnName}\\s+[^,]+REFERENCES\\s+${refTable}\\(${refColumn}\\)\\s+ON\\s+DELETE\\s+${onDelete}`, 'gi'),
        ` ${columnName} ${refMatch[2]}`
      );
    }
    
    tables.push({ tableName, tableBody, foreignKeys });
  }
  
  // Rebuild CREATE TABLE statements
  for (const table of tables) {
    let newTable = `CREATE TABLE ${table.tableName} (\n${table.tableBody.trim()}`;
    
    if (table.foreignKeys.length > 0) {
      newTable += ',\n' + table.foreignKeys.join(',\n');
    }
    
    newTable += '\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
    
    const oldPattern = new RegExp(`CREATE TABLE\\s+${table.tableName}\\s*\\([\\s\\S]*?\\)\\s*;`, 'i');
    content = content.replace(oldPattern, newTable);
  }
  
  // Add DROP TABLE IF EXISTS before each CREATE TABLE
  content = content.replace(/(?<!DROP TABLE IF EXISTS\s+)(CREATE TABLE\s+(\w+))/gi, 'DROP TABLE IF EXISTS $2;\nCREATE TABLE $2');
  
  // Remove PostgreSQL triggers and functions
  content = content.replace(/CREATE\s+OR\s+REPLACE\s+FUNCTION[^;]+;/gs, '');
  content = content.replace(/CREATE\s+TRIGGER[^;]+;/gi, '');
  
  // Remove INSERT statements (we'll import data separately)
  content = content.replace(/INSERT\s+INTO[^;]+;/gi, '');
  
  // Remove CREATE INDEX statements (we'll add them separately if needed)
  content = content.replace(/CREATE\s+INDEX[^;]+;/gi, '');
  
  // Clean up
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Ensure output directory exists
  const outputDir = path.dirname(MYSQL_SCHEMA);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(MYSQL_SCHEMA, content, 'utf8');
  
  console.log('✅ Clean MySQL schema created!');
  console.log(`📂 File: ${MYSQL_SCHEMA}\n`);
}

if (require.main === module) {
  createCleanMySQLSchema();
}

module.exports = { createCleanMySQLSchema };

