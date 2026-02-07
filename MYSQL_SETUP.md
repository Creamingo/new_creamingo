# MySQL Setup Guide

This guide will help you set up MySQL for the Creamingo application.

## Prerequisites

- MySQL Server 8.0 or higher installed
- Root access to MySQL server

## Step 1: Install MySQL

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Windows
Download and install MySQL from: https://dev.mysql.com/downloads/mysql/

### macOS
```bash
brew install mysql
brew services start mysql
```

## Step 2: Create Database and User

1. **Login to MySQL as root:**
```bash
mysql -u root -p
```

2. **Create database:**
```sql
CREATE DATABASE creamingo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Create user and grant privileges:**
```sql
CREATE USER 'creamingo_user'@'localhost' IDENTIFIED BY 'creamingo_secure_password_2024';
GRANT ALL PRIVILEGES ON creamingo_db.* TO 'creamingo_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Allow connections from VPS (if needed):**
```sql
-- Allow connections from any host (use with caution in production)
CREATE USER 'creamingo_user'@'%' IDENTIFIED BY 'creamingo_secure_password_2024';
GRANT ALL PRIVILEGES ON creamingo_db.* TO 'creamingo_user'@'%';
FLUSH PRIVILEGES;
```

5. **Or allow from specific IP:**
```sql
CREATE USER 'creamingo_user'@'192.168.1.100' IDENTIFIED BY 'creamingo_secure_password_2024';
GRANT ALL PRIVILEGES ON creamingo_db.* TO 'creamingo_user'@'192.168.1.100';
FLUSH PRIVILEGES;
```

## Step 3: Configure MySQL for Remote Connections (VPS)

1. **Edit MySQL configuration:**
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

2. **Find and comment out or change:**
```ini
# bind-address = 127.0.0.1
bind-address = 0.0.0.0
```

3. **Restart MySQL:**
```bash
sudo systemctl restart mysql
```

4. **Configure firewall (if using UFW):**
```bash
sudo ufw allow 3306/tcp
```

## Step 4: Update .env File

Copy `.env.example` to `.env` and update the database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=creamingo_user
DB_PASSWORD=creamingo_secure_password_2024
DB_NAME=creamingo_db
DB_ALLOWED_HOSTS=%
```

For VPS deployment, update `DB_HOST` to your MySQL server IP:
```env
DB_HOST=your_mysql_server_ip
```

## Step 5: Install MySQL Driver

```bash
cd backend
pnpm install mysql2
```

## Step 6: Initialize Database

The database will be automatically initialized when you start the backend server. Alternatively, you can run:

```bash
cd backend
node src/utils/initDatabase.js
```

## Step 7: Verify Connection

Start the backend server:
```bash
cd backend
pnpm run dev
```

You should see:
```
✅ Connected to MySQL database (IST timezone)
```

## Troubleshooting

### Connection Refused
- Check MySQL is running: `sudo systemctl status mysql`
- Verify firewall allows port 3306
- Check `bind-address` in MySQL config

### Access Denied
- Verify username and password in `.env`
- Check user privileges: `SHOW GRANTS FOR 'creamingo_user'@'localhost';`
- Ensure user exists for the correct host

### Database Not Found
- Create database: `CREATE DATABASE creamingo_db;`
- Verify database exists: `SHOW DATABASES;`

### Timezone Issues
- MySQL will automatically use IST timezone (+05:30)
- Verify with: `SELECT @@session.time_zone;`

## Security Best Practices

1. **Use strong passwords** - Change default passwords
2. **Limit remote access** - Only allow specific IPs when possible
3. **Use SSL/TLS** - Enable SSL for remote connections
4. **Regular backups** - Set up automated backups
5. **Update regularly** - Keep MySQL updated

## Migration from SQLite

If you have existing SQLite data:

1. Export SQLite data to SQL
2. Convert SQL syntax to MySQL format
3. Import into MySQL database
4. Verify data integrity

See `VPS_DEPLOYMENT_GUIDE.md` for detailed migration steps.

