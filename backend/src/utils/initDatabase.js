const fs = require('fs');
const path = require('path');
const { query, get } = require('../config/db');

/**
 * Initialize MySQL database with schema and sample data
 */
const initDatabase = async () => {
  try {
    console.log('🔄 Initializing MySQL database...');
    
    // Read the MySQL schema file (prefer MySQL-specific schema if exists)
    let schemaPath = path.join(__dirname, '../../database/schema.sql');
    
    // Check if MySQL-specific schema exists
    const mysqlSchemaPath = path.join(__dirname, '../../database/schema.mysql.sql');
    if (fs.existsSync(mysqlSchemaPath)) {
      schemaPath = mysqlSchemaPath;
    }
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements (MySQL requires this)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (err) {
          // Ignore "table already exists" errors
          if (!err.message.includes('already exists') && !err.message.includes('Duplicate')) {
            console.warn('Warning executing statement:', err.message);
          }
        }
      }
    }
    
    console.log('✅ Database initialized successfully!');
    
    // Verify tables were created
    const { rows: tables } = await query("SELECT TABLE_NAME as name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [process.env.DB_NAME]);
    const tableNames = tables.map(row => row.name);
    
    console.log('📊 Created tables:', tableNames.join(', '));
    
    // Check if we have users
    const userResult = await get("SELECT COUNT(*) as count FROM users");
    const userCount = userResult ? userResult.count : 0;
    
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
    const result = await get(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [process.env.DB_NAME]
    );
    
    return !result; // Return true if users table doesn't exist
  } catch (error) {
    return true; // If there's an error, assume we need initialization
  }
};

module.exports = {
  initDatabase,
  needsInitialization
};
