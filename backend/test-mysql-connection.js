/**
 * Test MySQL Connection Script
 * Run this to diagnose MySQL connection issues
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Testing MySQL Connection...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
  
  console.log('Configuration:');
  console.log('  Host:', config.host);
  console.log('  Port:', config.port);
  console.log('  User:', config.user);
  console.log('  Database:', config.database);
  console.log('  Password:', config.password ? '***SET***' : 'NOT SET');
  console.log('');
  
  if (!config.user || !config.password || !config.database) {
    console.error('❌ Missing required configuration!');
    console.error('Please check your .env file has:');
    console.error('  - DB_USER');
    console.error('  - DB_PASSWORD');
    console.error('  - DB_NAME');
    return;
  }
  
  try {
    console.log('Attempting to connect...');
    
    // Try connecting without database first (to check if server is reachable)
    const testConfig = { ...config };
    delete testConfig.database;
    
    const connection = await mysql.createConnection(testConfig);
    console.log('✅ Successfully connected to MySQL server!');
    
    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [config.database]);
    if (databases.length === 0) {
      console.log(`\n⚠️  Database '${config.database}' does not exist.`);
      console.log('Creating database...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Database '${config.database}' created!`);
    } else {
      console.log(`✅ Database '${config.database}' exists.`);
    }
    
    // Check if user exists and has privileges
    const [users] = await connection.execute(
      "SELECT User, Host FROM mysql.user WHERE User = ?",
      [config.user]
    );
    
    if (users.length === 0) {
      console.log(`\n⚠️  User '${config.user}' does not exist.`);
      console.log('Creating user...');
      await connection.execute(
        `CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?`,
        [config.user, config.password]
      );
      await connection.execute(
        `CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?`,
        [config.user, config.password]
      );
      console.log(`✅ User '${config.user}' created!`);
    } else {
      console.log(`✅ User '${config.user}' exists.`);
    }
    
    // Grant privileges
    console.log('Granting privileges...');
    await connection.execute(
      `GRANT ALL PRIVILEGES ON \`${config.database}\`.* TO ?@'%'`,
      [config.user]
    );
    await connection.execute(
      `GRANT ALL PRIVILEGES ON \`${config.database}\`.* TO ?@'localhost'`,
      [config.user]
    );
    await connection.execute('FLUSH PRIVILEGES');
    console.log('✅ Privileges granted!');
    
    // Now try connecting with database
    await connection.end();
    
    const dbConnection = await mysql.createConnection(config);
    console.log(`\n✅ Successfully connected to database '${config.database}'!`);
    await dbConnection.end();
    
    console.log('\n🎉 All checks passed! Your MySQL setup is correct.');
    console.log('You can now start your backend server.');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('\nCommon issues:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('  - MySQL server is not running');
      console.error('  - Or MySQL is not accepting remote connections');
      console.error('  - Check bind-address in MySQL config (should be 0.0.0.0)');
      console.error('  - Verify firewall allows port 3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  - Wrong username or password');
      console.error('  - Check your .env file credentials');
      console.error('  - Verify user exists and has proper host permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('  - Database does not exist');
      console.error('  - Run this script again to create it');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('  - Cannot reach MySQL server');
      console.error('  - Check DB_HOST in .env file (should be VPS IP/domain)');
      console.error('  - Verify network connectivity: ping ' + config.host);
      console.error('  - Check firewall settings on VPS');
      console.error('  - Verify MySQL is configured for remote connections');
    } else if (error.code === 'EHOSTUNREACH') {
      console.error('  - Host unreachable');
      console.error('  - Check VPS IP address is correct');
      console.error('  - Verify network connectivity');
    } else {
      console.error('  - Unknown error:', error);
      console.error('  - Full error:', JSON.stringify(error, null, 2));
    }
    
    console.error('\nFor VPS MySQL setup, see: VPS_MYSQL_CONNECTION.md');
    
    process.exit(1);
  }
}

testConnection();

