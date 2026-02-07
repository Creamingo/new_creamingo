const mysql = require('mysql2/promise');
const path = require('path');
// Load environment variables from root .env file
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Set Node.js timezone to IST
process.env.TZ = 'Asia/Kolkata';

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+05:30' // IST timezone
});

// Test connection and set timezone
pool.getConnection()
  .then(async (connection) => {
    // Set session timezone to IST
    await connection.execute("SET time_zone = '+05:30'");
    console.log('✅ Connected to MySQL database (IST timezone)');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error connecting to MySQL:');
    console.error('Error message:', err.message || 'Unknown error');
    console.error('Error code:', err.code || 'N/A');
    console.error('Error details:', err);
    console.error('\nPlease check:');
    console.error('1. MySQL server is running');
    console.error('2. Database credentials in .env file are correct');
    console.error('3. Database and user exist in MySQL');
    console.error('4. User has proper privileges');
    console.error('\nCurrent config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'NOT SET',
      database: process.env.DB_NAME || 'NOT SET',
      password: process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'
    });
    process.exit(-1);
  });

// Helper function to execute queries
const query = async (sql, params = []) => {
  try {
    const start = Date.now();
    
    // Convert PostgreSQL placeholders ($1, $2) to MySQL placeholders (?)
    let convertedSql = sql;
    const mysqlParams = [...params];
    
    // Convert $1, $2, etc. to ? for MySQL
    if (sql.includes('$')) {
      // Find all $N patterns and replace with ?
      convertedSql = convertedSql.replace(/\$\d+/g, '?');
    }
    
    // Execute query using connection to get metadata
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(convertedSql, mysqlParams);
      const duration = Date.now() - start;
      
      // For INSERT/UPDATE/DELETE, get affected rows from result
      const isModifyingQuery = /^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(convertedSql.trim());
      
      if (isModifyingQuery) {
        // For modifying queries, rows is an OkPacket with affectedRows and insertId
        const affectedRows = rows.affectedRows || 0;
        const insertId = rows.insertId || null;
        
        console.log('Executed query', { sql: convertedSql, duration, affectedRows, insertId });
        return { 
          rows: [], 
          rowCount: affectedRows,
          lastID: insertId 
        };
      } else {
        console.log('Executed query', { sql: convertedSql, duration, rows: rows.length });
        return { rows, rowCount: rows.length };
      }
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Database query error:', err);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
};

// Helper function to execute a transaction
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Helper function to get a single row
const get = async (sql, params = []) => {
  try {
    // Convert PostgreSQL placeholders ($1, $2) to MySQL placeholders (?)
    let convertedSql = sql;
    const mysqlParams = [...params];
    
    if (sql.includes('$')) {
      convertedSql = convertedSql.replace(/\$\d+/g, '?');
    }
    
    const [rows] = await pool.execute(convertedSql, mysqlParams);
    return rows[0] || null;
  } catch (err) {
    console.error('Database query error:', err);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
};

// Close database connection pool
const close = async () => {
  try {
    await pool.end();
    console.log('✅ MySQL connection pool closed');
  } catch (err) {
    console.error('Error closing database pool:', err);
    throw err;
  }
};

module.exports = {
  pool,
  query,
  get,
  transaction,
  close
};
