const fs = require('fs');
const path = require('path');
const { db } = require('../config/db');

/**
 * Initialize SQLite database with schema and sample data
 */
const initDatabase = async () => {
  try {
    console.log('🔄 Initializing SQLite database...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema as one statement
    await new Promise((resolve, reject) => {
      db.exec(schema, (err) => {
        if (err) {
          console.error('Error executing schema:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    console.log('✅ Database initialized successfully!');
    
    // Verify tables were created
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.name));
        }
      });
    });
    
    console.log('📊 Created tables:', tables.join(', '));
    
    // Check if we have users
    const userCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
    
    console.log(`👥 Users in database: ${userCount}`);
    
    if (userCount > 0) {
      console.log('🔑 Default login credentials:');
      console.log('   Super Admin: admin@creamingo.com / Creamingo@2427');
      console.log('   Staff User: staff@creamingo.com / Creamingo@2427');
    }
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

/**
 * Check if database needs initialization
 */
const needsInitialization = async () => {
  try {
    const result = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    
    return !result; // Return true if users table doesn't exist
  } catch (error) {
    return true; // If there's an error, assume we need initialization
  }
};

module.exports = {
  initDatabase,
  needsInitialization
};
