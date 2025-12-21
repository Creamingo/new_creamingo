/**
 * Export All Tables from SQLite to MySQL Format
 * Properly exports all tables with correct MySQL syntax
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const SQLITE_DB_PATH = path.join(__dirname, '../database/creamingo.db');
const OUTPUT_FILE = path.join(__dirname, '../database/mysql_export/schema_all_tables_mysql.sql');

function convertToMySQL(sqliteSQL) {
  let mysqlSQL = sqliteSQL;
  
  // Remove SQLite-specific pragmas
  mysqlSQL = mysqlSQL.replace(/PRAGMA[^;]+;/gi, '');
  
  // Convert INTEGER PRIMARY KEY to INT PRIMARY KEY AUTO_INCREMENT
  mysqlSQL = mysqlSQL.replace(/INTEGER\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  
  // Convert AUTOINCREMENT to AUTO_INCREMENT
  mysqlSQL = mysqlSQL.replace(/AUTOINCREMENT/gi, 'AUTO_INCREMENT');
  
  // Convert INTEGER to INT
  mysqlSQL = mysqlSQL.replace(/\bINTEGER\b/gi, 'INT');
  
  // Convert NOW() to CURRENT_TIMESTAMP
  mysqlSQL = mysqlSQL.replace(/DEFAULT\s+NOW\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP');
  
  // Convert boolean
  mysqlSQL = mysqlSQL.replace(/BOOLEAN\s+DEFAULT\s+true/gi, 'BOOLEAN DEFAULT 1');
  mysqlSQL = mysqlSQL.replace(/BOOLEAN\s+DEFAULT\s+false/gi, 'BOOLEAN DEFAULT 0');
  
  // Remove CHECK constraints
  mysqlSQL = mysqlSQL.replace(/CHECK\s*\([^)]+\)/gi, '');
  
  // Remove DEFAULT from TEXT/JSON/BLOB
  mysqlSQL = mysqlSQL.replace(/(TEXT|JSON|BLOB)\s+DEFAULT\s+[^,)]+/gi, '$1');
  
  return mysqlSQL;
}

function exportAllTables() {
  console.log('🔄 Exporting all tables from SQLite to MySQL...\n');
  
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`❌ SQLite database not found: ${SQLITE_DB_PATH}`);
    process.exit(1);
  }
  
  const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error opening SQLite database:', err.message);
      process.exit(1);
    }
    console.log('✅ Connected to SQLite database\n');
  });
  
  const output = [];
  output.push('-- Creamingo Database Schema - All Tables');
  output.push('-- Exported from SQLite and converted to MySQL');
  output.push('');
  output.push('-- Disable foreign key checks');
  output.push('SET FOREIGN_KEY_CHECKS = 0;');
  output.push('');
  
  let tableCount = 0;
  
  db.serialize(() => {
    // Get all table names
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, tables) => {
      if (err) {
        console.error('❌ Error getting tables:', err);
        db.close();
        process.exit(1);
      }
      
      tableCount = tables.length;
      console.log(`📋 Found ${tableCount} tables\n`);
      if (err) {
        console.error('❌ Error getting tables:', err);
        db.close();
        process.exit(1);
      }
      
      console.log(`📋 Found ${tables.length} tables\n`);
      
      let processed = 0;
      
      tables.forEach((table) => {
        const tableName = table.name;
        
        // Get CREATE TABLE statement
        db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
          if (err) {
            console.error(`❌ Error getting schema for ${tableName}:`, err);
            processed++;
            if (processed === tables.length) {
              finishExport();
            }
            return;
          }
          
          if (row && row.sql) {
            let mysqlSQL = convertToMySQL(row.sql);
            
            // Extract column definitions and foreign keys
            const createMatch = mysqlSQL.match(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*)\)/i);
            
            if (createMatch) {
              const tableName = createMatch[1];
              let tableBody = createMatch[2];
              
              // Remove inline REFERENCES (we'll add them as separate FOREIGN KEY constraints)
              const foreignKeys = [];
              tableBody = tableBody.replace(/\s+REFERENCES\s+(\w+)\((\w+)\)\s+ON\s+DELETE\s+(\w+)/gi, (match, refTable, refCol, onDelete) => {
                // Try to find the column name before this REFERENCES
                const colMatch = tableBody.substring(0, tableBody.indexOf(match)).match(/(\w+)\s+[\w(]+[^,]*$/);
                if (colMatch) {
                  foreignKeys.push(`    FOREIGN KEY (${colMatch[1]}) REFERENCES ${refTable}(${refCol}) ON DELETE ${onDelete}`);
                }
                return '';
              });
              
              // Clean up table body
              tableBody = tableBody.trim();
              tableBody = tableBody.replace(/,\s*$/, '');
              
              // Build CREATE TABLE statement
              output.push(`-- Table: ${tableName}`);
              output.push(`DROP TABLE IF EXISTS ${tableName};`);
              output.push(`CREATE TABLE ${tableName} (`);
              
              // Split table body into lines and format
              const lines = tableBody.split(',').map(line => line.trim()).filter(line => line);
              lines.forEach((line, index) => {
                if (line) {
                  output.push(`    ${line}${index < lines.length - 1 || foreignKeys.length > 0 ? ',' : ''}`);
                }
              });
              
              // Add foreign keys
              if (foreignKeys.length > 0) {
                foreignKeys.forEach((fk, index) => {
                  output.push(fk + (index < foreignKeys.length - 1 ? ',' : ''));
                });
              }
              
              output.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
              output.push('');
            } else {
              // Fallback: use converted SQL as-is
              output.push(`-- Table: ${tableName}`);
              output.push(`DROP TABLE IF EXISTS ${tableName};`);
              output.push(mysqlSQL.replace(/\);$/, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'));
              output.push('');
            }
          }
          
          processed++;
          if (processed === tableCount) {
            finishExport();
          }
        });
      });
    });
  });
  
  function finishExport() {
    output.push('-- Re-enable foreign key checks');
    output.push('SET FOREIGN_KEY_CHECKS = 1;');
    output.push('');
    
    fs.writeFileSync(OUTPUT_FILE, output.join('\n'), 'utf8');
    
    console.log('✅ All tables exported!');
    console.log(`📂 File: ${OUTPUT_FILE}`);
    console.log(`📊 Total tables: ${tableCount}\n`);
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed\n');
      }
    });
  }
}

if (require.main === module) {
  exportAllTables();
}

module.exports = { exportAllTables };

