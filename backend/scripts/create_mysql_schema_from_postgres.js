/**
 * Create MySQL Schema from PostgreSQL Schema
 * 
 * Converts the PostgreSQL schema.sql to MySQL format
 * This is more reliable than converting from SQLite dump
 */

const fs = require('fs');
const path = require('path');

const POSTGRES_SCHEMA = path.join(__dirname, '../database/schema.sql');
const MYSQL_SCHEMA = path.join(__dirname, '../database/mysql_export/schema_mysql_from_postgres.sql');

function convertPostgresToMySQL() {
  console.log('🔄 Converting PostgreSQL schema to MySQL...\n');
  
  if (!fs.existsSync(POSTGRES_SCHEMA)) {
    console.error(`❌ PostgreSQL schema not found: ${POSTGRES_SCHEMA}`);
    console.log('ℹ️  Will use SQLite export instead.\n');
    return false;
  }
  
  let content = fs.readFileSync(POSTGRES_SCHEMA, 'utf8');
  
  // Remove PostgreSQL-specific extensions
  content = content.replace(/CREATE EXTENSION[^;]+;/gi, '');
  
  // Convert SERIAL to INT AUTO_INCREMENT
  content = content.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  content = content.replace(/\s+SERIAL\s+/gi, ' INT AUTO_INCREMENT ');
  content = content.replace(/SERIAL,/gi, 'INT AUTO_INCREMENT,');
  
  // Convert INTEGER to INT (for primary keys that aren't SERIAL)
  content = content.replace(/INTEGER\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  
  // Convert VARCHAR without length to VARCHAR(255)
  content = content.replace(/VARCHAR\s+NOT\s+NULL/gi, 'VARCHAR(255) NOT NULL');
  content = content.replace(/VARCHAR\s+UNIQUE/gi, 'VARCHAR(255) UNIQUE');
  content = content.replace(/VARCHAR,/gi, 'VARCHAR(255),');
  content = content.replace(/VARCHAR\s*\)/gi, 'VARCHAR(255))');
  
  // Convert TEXT[] arrays to JSON (but remove DEFAULT values for TEXT/JSON columns)
  content = content.replace(/TEXT\[\]/gi, 'JSON');
  
  // Remove DEFAULT values from TEXT, JSON, and BLOB columns (MySQL doesn't allow defaults)
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+[^,)]+/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+'[^']*'/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+"[^"]*"/gi, '$1');
  content = content.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+\{\}/gi, '$1');
  
  // Remove CHECK constraints (MySQL has limited support, remove for compatibility)
  // Handle both inline and multi-line CHECK constraints
  content = content.replace(/CHECK\s*\([^)]+\)/gi, '');
  content = content.replace(/CHECK\s*\([^)]*\)/gs, ''); // Multi-line CHECK
  // Clean up any trailing commas or parentheses left after removing CHECK
  content = content.replace(/,\s*\)\s*,/g, ',');
  content = content.replace(/\s+\)\s*,/g, ',');
  content = content.replace(/DEFAULT\s+['"][^'"]+['"]\s*\)\s*,/gi, (match) => {
    return match.replace(/\s*\)\s*,/, ',');
  });
  
  // Convert boolean true/false to 1/0 for MySQL
  content = content.replace(/BOOLEAN\s+DEFAULT\s+true/gi, 'BOOLEAN DEFAULT 1');
  content = content.replace(/BOOLEAN\s+DEFAULT\s+false/gi, 'BOOLEAN DEFAULT 0');
  content = content.replace(/BOOLEAN\s+DEFAULT\s+'true'/gi, "BOOLEAN DEFAULT 1");
  content = content.replace(/BOOLEAN\s+DEFAULT\s+'false'/gi, "BOOLEAN DEFAULT 0");
  
  // Convert NOW() to CURRENT_TIMESTAMP
  content = content.replace(/DEFAULT\s+NOW\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP');
  
  // Convert TIMESTAMP to DATETIME (but keep CURRENT_TIMESTAMP)
  content = content.replace(/TIMESTAMP\s+DEFAULT\s+CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP\s+DEFAULT\s+NOW\(\)/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP\s+DEFAULT/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  content = content.replace(/TIMESTAMP,/gi, 'DATETIME,');
  content = content.replace(/TIMESTAMP\s*\)/gi, 'DATETIME)');
  
  // Fix any incorrect CURRENT_DATETIME to CURRENT_TIMESTAMP
  content = content.replace(/CURRENT_DATETIME/gi, 'CURRENT_TIMESTAMP');
  
  // Add DROP TABLE IF EXISTS before each CREATE TABLE
  content = content.replace(/CREATE TABLE\s+(\w+)/gi, 'DROP TABLE IF EXISTS $1;\nCREATE TABLE $1');
  
  // Add ENGINE and CHARSET to each CREATE TABLE
  content = content.replace(/\);$/gm, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  // Remove RETURNING clauses (MySQL doesn't support them)
  content = content.replace(/\s+RETURNING\s+.*$/gim, '');
  
  // Ensure output directory exists
  const outputDir = path.dirname(MYSQL_SCHEMA);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write converted schema
  fs.writeFileSync(MYSQL_SCHEMA, content, 'utf8');
  
  console.log('✅ MySQL schema created from PostgreSQL schema!');
  console.log(`📂 File: ${MYSQL_SCHEMA}\n`);
  console.log('📝 Next steps:');
  console.log('1. Review the converted schema');
  console.log('2. Import to MySQL:');
  console.log('   mysql -u creamingo_user -p creamingo < schema_mysql_from_postgres.sql');
  console.log('3. Then import the data:');
  console.log('   mysql -u creamingo_user -p creamingo < data_mysql.sql\n');
  
  return true;
}

if (require.main === module) {
  convertPostgresToMySQL();
}

module.exports = { convertPostgresToMySQL };

