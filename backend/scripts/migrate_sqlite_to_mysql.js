/**
 * SQLite to MySQL Migration Helper Script
 * 
 * This script helps convert SQLite database to MySQL format
 * Run this on your local machine before migrating to VPS
 * 
 * Usage:
 *   node scripts/migrate_sqlite_to_mysql.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const SQLITE_DB_PATH = path.join(__dirname, '../database/creamingo.db');
const OUTPUT_DIR = path.join(__dirname, '../database/mysql_export');
const SCHEMA_FILE = path.join(OUTPUT_DIR, 'schema_mysql.sql');
const DATA_FILE = path.join(OUTPUT_DIR, 'data_mysql.sql');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// SQLite to MySQL type mapping
const typeMapping = {
  'INTEGER': 'INT',
  'TEXT': 'TEXT',
  'REAL': 'DECIMAL(10,2)',
  'BLOB': 'BLOB',
  'NUMERIC': 'DECIMAL(10,2)'
};

// Convert SQLite SQL to MySQL format
function convertToMySQL(sqliteSQL) {
  let mysqlSQL = sqliteSQL;
  
  // Remove SQLite-specific pragmas
  mysqlSQL = mysqlSQL.replace(/PRAGMA[^;]+;/gi, '');
  
  // First, remove any existing AUTOINCREMENT or AUTO_INCREMENT to avoid duplicates
  mysqlSQL = mysqlSQL.replace(/\s+AUTOINCREMENT/gi, '');
  mysqlSQL = mysqlSQL.replace(/\s+AUTO_INCREMENT/gi, '');
  
  // Convert INTEGER PRIMARY KEY to AUTO_INCREMENT
  mysqlSQL = mysqlSQL.replace(/INTEGER\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  
  // Convert SERIAL to INT AUTO_INCREMENT (if present)
  mysqlSQL = mysqlSQL.replace(/SERIAL\s+PRIMARY\s+KEY/gi, 'INT PRIMARY KEY AUTO_INCREMENT');
  
  // Handle cases where AUTO_INCREMENT might already be present (remove duplicates)
  mysqlSQL = mysqlSQL.replace(/AUTO_INCREMENT\s+AUTO_INCREMENT/gi, 'AUTO_INCREMENT');
  
  // Convert NOW() to CURRENT_TIMESTAMP
  mysqlSQL = mysqlSQL.replace(/DEFAULT\s+NOW\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP');
  
  // Convert boolean INTEGER to TINYINT(1)
  mysqlSQL = mysqlSQL.replace(/is_active\s+INTEGER\s+DEFAULT\s+(\d+)/gi, 'is_active TINYINT(1) DEFAULT $1');
  mysqlSQL = mysqlSQL.replace(/is_featured\s+INTEGER\s+DEFAULT\s+(\d+)/gi, 'is_featured TINYINT(1) DEFAULT $1');
  mysqlSQL = mysqlSQL.replace(/is_available\s+INTEGER\s+DEFAULT\s+(\d+)/gi, 'is_available TINYINT(1) DEFAULT $1');
  
  // Remove SQLite-specific constraints
  mysqlSQL = mysqlSQL.replace(/CHECK\s*\([^)]+\)/gi, '');
  
  // Convert TEXT[] arrays to JSON (PostgreSQL style, but we'll handle it)
  mysqlSQL = mysqlSQL.replace(/TEXT\[\]/gi, 'JSON');
  
  // Add ENGINE and CHARSET
  mysqlSQL = mysqlSQL.replace(/\);$/gm, ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  
  return mysqlSQL;
}

// Escape string for MySQL
function escapeMySQL(str) {
  if (str === null || str === undefined) {
    return 'NULL';
  }
  if (typeof str === 'number') {
    return str.toString();
  }
  if (typeof str === 'boolean') {
    return str ? '1' : '0';
  }
  // Escape single quotes and backslashes
  return "'" + str.toString().replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

// Export schema
function exportSchema(db) {
  return new Promise((resolve, reject) => {
    const schemaSQL = [];
    
    db.serialize(() => {
      // Get all table names
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, tables) => {
        if (err) {
          reject(err);
          return;
        }
        
        let processed = 0;
        if (tables.length === 0) {
          resolve('');
          return;
        }
        
        tables.forEach((table, index) => {
          const tableName = table.name;
          
          // Get CREATE TABLE statement
          db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
            if (err) {
              console.error(`Error getting schema for ${tableName}:`, err);
              processed++;
              if (processed === tables.length) {
                resolve(schemaSQL.join('\n\n'));
              }
              return;
            }
            
            if (row && row.sql) {
              let mysqlSQL = convertToMySQL(row.sql);
              schemaSQL.push(`-- Table: ${tableName}\n${mysqlSQL}`);
            }
            
            processed++;
            if (processed === tables.length) {
              resolve(schemaSQL.join('\n\n'));
            }
          });
        });
      });
    });
  });
}

// Export data
function exportData(db) {
  return new Promise((resolve, reject) => {
    const dataSQL = [];
    
    db.serialize(() => {
      // Get all table names
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, tables) => {
        if (err) {
          reject(err);
          return;
        }
        
        let processed = 0;
        if (tables.length === 0) {
          resolve('');
          return;
        }
        
        tables.forEach((table) => {
          const tableName = table.name;
          
          // Get table columns
          db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err) {
              console.error(`Error getting columns for ${tableName}:`, err);
              processed++;
              if (processed === tables.length) {
                resolve(dataSQL.join('\n\n'));
              }
              return;
            }
            
            const columnNames = columns.map(col => col.name);
            
            // Get all rows
            db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
              if (err) {
                console.error(`Error getting data for ${tableName}:`, err);
                processed++;
                if (processed === tables.length) {
                  resolve(dataSQL.join('\n\n'));
                }
                return;
              }
              
              if (rows.length > 0) {
                dataSQL.push(`-- Data for table: ${tableName}`);
                dataSQL.push(`SET FOREIGN_KEY_CHECKS = 0;`);
                dataSQL.push(`TRUNCATE TABLE ${tableName};`);
                
                // Generate INSERT statements in batches
                const batchSize = 100;
                for (let i = 0; i < rows.length; i += batchSize) {
                  const batch = rows.slice(i, i + batchSize);
                  const values = batch.map(row => {
                    const rowValues = columnNames.map(col => escapeMySQL(row[col]));
                    return `(${rowValues.join(', ')})`;
                  });
                  
                  dataSQL.push(`INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES\n${values.join(',\n')};`);
                }
                
                dataSQL.push(`SET FOREIGN_KEY_CHECKS = 1;`);
                dataSQL.push('');
              }
              
              processed++;
              if (processed === tables.length) {
                resolve(dataSQL.join('\n\n'));
              }
            });
          });
        });
      });
    });
  });
}

// Main migration function
async function migrate() {
  console.log('🔄 Starting SQLite to MySQL migration...\n');
  
  // Check if SQLite database exists
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.error(`❌ SQLite database not found at: ${SQLITE_DB_PATH}`);
    process.exit(1);
  }
  
  console.log(`📂 SQLite database: ${SQLITE_DB_PATH}`);
  console.log(`📂 Output directory: ${OUTPUT_DIR}\n`);
  
  // Open SQLite database
  const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error opening SQLite database:', err.message);
      process.exit(1);
    }
    console.log('✅ Connected to SQLite database\n');
  });
  
  try {
    // Export schema
    console.log('📋 Exporting schema...');
    const schema = await exportSchema(db);
    fs.writeFileSync(SCHEMA_FILE, schema);
    console.log(`✅ Schema exported to: ${SCHEMA_FILE}\n`);
    
    // Export data
    console.log('📊 Exporting data...');
    const data = await exportData(db);
    fs.writeFileSync(DATA_FILE, data);
    console.log(`✅ Data exported to: ${DATA_FILE}\n`);
    
    // Close database
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed\n');
      }
    });
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review the exported SQL files:');
    console.log(`   - Schema: ${SCHEMA_FILE}`);
    console.log(`   - Data: ${DATA_FILE}`);
    console.log('2. Make any necessary manual adjustments');
    console.log('3. Import to MySQL on your VPS:');
    console.log('   mysql -u creamingo_user -p creamingo < schema_mysql.sql');
    console.log('   mysql -u creamingo_user -p creamingo < data_mysql.sql');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = { migrate, convertToMySQL, escapeMySQL };

