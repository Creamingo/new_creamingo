const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Database file path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/creamingo.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(-1);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Helper function to execute queries
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      // For SELECT queries
      // Convert PostgreSQL placeholders ($1, $2) to SQLite placeholders (?)
      let convertedSql = sql;
      const sqliteParams = [...params];
      
      // Remove RETURNING clause if present (SQLite doesn't support it in older versions)
      convertedSql = convertedSql.replace(/\s+RETURNING\s+.*$/i, '');
      
      // Simple conversion: replace $1, $2, etc. with ?
      if (sql.includes('$')) {
        convertedSql = convertedSql.replace(/\$\d+/g, '?');
      }
      
      db.all(convertedSql, sqliteParams, (err, rows) => {
        const duration = Date.now() - start;
        if (err) {
          console.error('Database query error:', err);
          console.error('SQL:', convertedSql);
          console.error('Params:', sqliteParams);
          reject(err);
        } else {
          console.log('Executed query', { sql: convertedSql, duration, rows: rows.length });
          resolve({ rows, rowCount: rows.length });
        }
      });
    } else {
      // For INSERT, UPDATE, DELETE queries
      // Convert PostgreSQL placeholders ($1, $2) to SQLite placeholders (?)
      let convertedSql = sql;
      const sqliteParams = [...params];
      
      // Simple conversion: replace $1, $2, etc. with ?
      // This is a basic implementation - for production, use a proper SQL parser
      if (sql.includes('$')) {
        convertedSql = sql.replace(/\$\d+/g, '?');
      }
      
      db.run(convertedSql, sqliteParams, function(err) {
        const duration = Date.now() - start;
        if (err) {
          console.error('Database query error:', err);
          console.error('SQL:', convertedSql);
          console.error('Params:', sqliteParams);
          reject(err);
        } else {
          console.log('Executed query', { sql: convertedSql, duration, rows: this.changes });
          resolve({ 
            rows: [], 
            rowCount: this.changes,
            lastID: this.lastID 
          });
        }
      });
    }
  });
};

// Helper function to execute a transaction
const transaction = async (callback) => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        db.run('BEGIN TRANSACTION');
        const result = await callback(db);
        db.run('COMMIT', (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        db.run('ROLLBACK');
        reject(error);
      }
    });
  });
};

// Helper function to get a single row
const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Database query error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Close database connection
const close = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        reject(err);
      } else {
        console.log('✅ Database connection closed');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  query,
  get,
  transaction,
  close
};
