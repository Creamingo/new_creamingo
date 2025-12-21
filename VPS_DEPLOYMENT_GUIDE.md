# 🚀 Creamingo VPS Deployment Guide

Complete guide for deploying Creamingo platform on a VPS server with MySQL database migration.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Initial Setup](#vps-initial-setup)
3. [Database Migration (SQLite to MySQL)](#database-migration-sqlite-to-mysql)
4. [Application Setup](#application-setup)
5. [Nginx Configuration](#nginx-configuration)
6. [Process Management with PM2](#process-management-with-pm2)
7. [File Permissions and Security](#file-permissions-and-security)
8. [Testing and Verification](#testing-and-verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: Version 24.12.0 or higher
- **pnpm**: Version 8.0.0 or higher
- **MySQL**: Version 8.0 or higher
- **Nginx**: Latest stable version
- **PM2**: For process management
- **Git**: For cloning repository

### VPS Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 20GB free space
- **OS**: Ubuntu 20.04 LTS or higher (recommended)
- **Network**: Public IP address with ports 80, 443, 3000, 3001, 5000 accessible

---

## VPS Initial Setup

### 1. Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### 2. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Install Node.js and pnpm

```bash
# Install Node.js 24.x
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation (should show v24.12.0 or higher)
node --version
npm --version

# Install pnpm globally
npm install -g pnpm

# Verify pnpm
pnpm --version
```

**Note:** If Node.js 24.x is not available via NodeSource, you can use NVM (Node Version Manager) to install the specific version:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 24.12.0
nvm install 24.12.0
nvm use 24.12.0
nvm alias default 24.12.0

# Verify installation
node --version  # Should show v24.12.0
```

### 4. Set System Timezone to IST

```bash
# Set system timezone to IST (Asia/Kolkata)
sudo timedatectl set-timezone Asia/Kolkata

# Verify timezone
timedatectl

# Check current time
date

# The output should show IST timezone
```

### 5. Install MySQL

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Verify MySQL is running
sudo systemctl status mysql
```

### 5.1. Configure MySQL Timezone to IST

```bash
# Login to MySQL
sudo mysql -u root -p

# Set MySQL timezone to IST
SET GLOBAL time_zone = '+05:30';
SET time_zone = '+05:30';

# Verify timezone
SELECT @@global.time_zone, @@session.time_zone;
SELECT NOW();

# Exit MySQL
EXIT;
```

**Make MySQL timezone permanent:**

```bash
# Edit MySQL configuration file
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add the following line under [mysqld] section:
# default-time-zone = '+05:30'

# Or create a separate configuration file
sudo nano /etc/mysql/conf.d/timezone.cnf
```

Add this content:
```ini
[mysqld]
default-time-zone = '+05:30'
```

```bash
# Restart MySQL to apply changes
sudo systemctl restart mysql

# Verify timezone is set correctly
sudo mysql -u root -p -e "SELECT @@global.time_zone, @@session.time_zone, NOW();"
```

### 6. Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### 7. Install PM2

```bash
npm install -g pm2

# Verify PM2 installation
pm2 --version
```

### 8. Create Application Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/creamingo
sudo chown -R $USER:$USER /var/www/creamingo

# Create subdirectories
mkdir -p /var/www/creamingo/{frontend,admin-panel,backend,uploads,logs}
```

---

## Database Migration (SQLite to MySQL)

### 1. Backup SQLite Database

On your local machine (where SQLite database exists):

```bash
# Navigate to backend directory
cd backend/database

# Create a backup of SQLite database
cp creamingo.db creamingo_backup_$(date +%Y%m%d_%H%M%S).db

# Verify backup
ls -lh creamingo*.db
```

### 2. Export SQLite Data to SQL

#### Option A: Using sqlite3 (Recommended)

```bash
# Install sqlite3 if not already installed
# On Windows: Download from sqlite.org
# On Linux/Mac: sudo apt install sqlite3 or brew install sqlite3

# Export schema and data
sqlite3 creamingo.db .dump > creamingo_export.sql

# Or export only data (INSERT statements)
sqlite3 creamingo.db .mode insert .output creamingo_data.sql .dump

# Or export schema only
sqlite3 creamingo.db .schema > creamingo_schema.sql
```

#### Option B: Using Python Script (Alternative)

Create a migration script `export_sqlite_to_mysql.py`:

```python
#!/usr/bin/env python3
import sqlite3
import sys

def export_to_mysql(sqlite_db, output_file):
    conn = sqlite3.connect(sqlite_db)
    cursor = conn.cursor()
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table[0]
            if table_name == 'sqlite_sequence':
                continue
                
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            # Get all data
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            
            if rows:
                # Generate INSERT statements
                col_names = [col[1] for col in columns]
                f.write(f"\n-- Table: {table_name}\n")
                f.write(f"INSERT INTO {table_name} ({', '.join(col_names)}) VALUES\n")
                
                values = []
                for row in rows:
                    row_values = []
                    for val in row:
                        if val is None:
                            row_values.append('NULL')
                        elif isinstance(val, str):
                            # Escape single quotes
                            val = val.replace("'", "''")
                            row_values.append(f"'{val}'")
                        else:
                            row_values.append(str(val))
                    values.append(f"({', '.join(row_values)})")
                
                f.write(',\n'.join(values) + ';\n\n')
    
    conn.close()
    print(f"Exported data to {output_file}")

if __name__ == '__main__':
    export_to_mysql('creamingo.db', 'creamingo_mysql_export.sql')
```

Run the script:
```bash
python3 export_sqlite_to_mysql.py
```

### 3. Convert SQLite SQL to MySQL Compatible Format

Create a conversion script or manually edit the exported SQL:

**Key differences to handle:**
- SQLite uses `INTEGER PRIMARY KEY`, MySQL uses `AUTO_INCREMENT`
- SQLite uses `TEXT`, MySQL uses `VARCHAR` or `TEXT`
- SQLite uses `REAL`, MySQL uses `DECIMAL` or `FLOAT`
- SQLite uses `BLOB`, MySQL uses `BLOB` or `LONGBLOB`
- Remove SQLite-specific syntax like `AUTOINCREMENT`
- Convert `INTEGER PRIMARY KEY` to `INT PRIMARY KEY AUTO_INCREMENT`
- Handle boolean values (SQLite uses 0/1, MySQL uses BOOLEAN or TINYINT(1))

**Manual conversion checklist:**
1. Replace `INTEGER PRIMARY KEY` with `INT PRIMARY KEY AUTO_INCREMENT`
2. Replace `TEXT` with `VARCHAR(255)` or `TEXT` as appropriate
3. Replace `REAL` with `DECIMAL(10,2)` for prices
4. Replace boolean `INTEGER` with `BOOLEAN` or `TINYINT(1)`
5. Remove SQLite-specific pragmas
6. Convert `INSERT` statements to MySQL format if needed

### 4. Create MySQL Database on VPS

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE creamingo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'creamingo_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON creamingo.* TO 'creamingo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Import Schema to MySQL

First, you need to convert the PostgreSQL schema (from `backend/database/schema.sql`) to MySQL format, or use the exported SQLite schema and convert it.

**Create MySQL-compatible schema file:**

```bash
# On your local machine, review schema.sql and create MySQL version
# Key changes needed:
# - SERIAL -> INT AUTO_INCREMENT
# - VARCHAR without length -> VARCHAR(255)
# - TEXT[] -> JSON or separate table
# - Remove PostgreSQL-specific extensions
# - TIMESTAMP DEFAULT NOW() -> TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**Import schema:**

```bash
# On VPS, import the converted schema
mysql -u creamingo_user -p creamingo < creamingo_mysql_schema.sql
```

### 6. Import Data to MySQL

```bash
# On VPS, import the converted data
mysql -u creamingo_user -p creamingo < creamingo_mysql_data.sql

# Verify import
mysql -u creamingo_user -p creamingo -e "SHOW TABLES;"
mysql -u creamingo_user -p creamingo -e "SELECT COUNT(*) FROM products;"
```

### 7. Run Migrations (if needed)

If you have migration files, you may need to run them:

```bash
# Navigate to backend directory
cd /var/www/creamingo/backend

# Review migration files and convert SQLite syntax to MySQL
# Then run migrations manually or through your migration system
```

---

## Application Setup

### 1. Clone Repository

```bash
cd /var/www/creamingo
git clone https://your-repository-url.git .
# Or if you need to upload files manually:
# Use SCP, SFTP, or upload via file manager
```

### 2. Install Dependencies

```bash
# Install root dependencies (if any)
pnpm install

# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install

# Install admin panel dependencies
cd ../admin-panel
pnpm install
```

### 3. Update Backend Database Configuration

Create/update `backend/.env`:

```bash
cd /var/www/creamingo/backend
nano .env
```

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=creamingo
DB_USER=creamingo_user
DB_PASSWORD=your_secure_password_here

# Timezone Configuration (IST - Indian Standard Time)
TZ=Asia/Kolkata

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# File Upload Configuration
UPLOAD_PATH=/var/www/creamingo/backend/uploads
MAX_FILE_SIZE=5242880

# CORS Configuration (Update with your VPS IP or domain later)
CORS_ORIGIN=http://YOUR_VPS_IP:3000,http://YOUR_VPS_IP:3001,http://YOUR_VPS_IP:5000

# Email Configuration (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# FRONTEND_URL=http://YOUR_VPS_IP:3000
```

### 4. Update Backend Database Connection

You need to modify `backend/src/config/db.js` to use MySQL instead of SQLite.

**Install MySQL driver:**
```bash
cd /var/www/creamingo/backend
pnpm add mysql2
```

**Update `backend/src/config/db.js`:**

const mysql = require('mysql2/promise');
require('dotenv').config();

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
    console.error('❌ Error connecting to MySQL:', err.message);
    process.exit(-1);
  });

// Helper function to execute queries
const query = async (sql, params = []) => {
  try {
    const start = Date.now();
    const [rows] = await pool.execute(sql, params);
    const duration = Date.now() - start;
    console.log('Executed query', { sql, duration, rows: rows.length });
    return { rows, rowCount: rows.length };
  } catch (err) {
    console.error('Database query error:', err);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
};

// Helper function to get a single row
const get = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

// Helper function to execute a transaction
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
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

// Close database connection
const close = async () => {
  await pool.end();
  console.log('✅ Database connection closed');
};

module.exports = {
  pool,
  query,
  get,
  transaction,
  close
};
```

### 5. Update Frontend Environment

Create `frontend/.env.production`:

```bash
cd /var/www/creamingo/frontend
nano .env.production
```

```env
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP:5000/api
NEXT_PUBLIC_ENVIRONMENT=production
```

### 6. Update Admin Panel Environment

Create `admin-panel/.env.production`:

```bash
cd /var/www/creamingo/admin-panel
nano .env.production
```

```env
REACT_APP_API_URL=http://YOUR_VPS_IP:5000/api
REACT_APP_ENVIRONMENT=production
```

### 7. Build Applications

```bash
# Build frontend
cd /var/www/creamingo/frontend
pnpm run build

# Build admin panel
cd /var/www/creamingo/admin-panel
pnpm run build
```

### 8. Set Up File Permissions

```bash
# Set proper ownership
sudo chown -R $USER:$USER /var/www/creamingo

# Set uploads directory permissions
chmod -R 755 /var/www/creamingo/backend/uploads
chmod -R 755 /var/www/creamingo/backend/images

# Set log directory permissions
chmod -R 755 /var/www/creamingo/backend/logs
```

---

## Nginx Configuration

### 1. Create Nginx Configuration File

```bash
sudo nano /etc/nginx/sites-available/creamingo
```

### 2. Nginx Configuration (Port-Based Access)

```nginx
# Upstream definitions for backend services
upstream frontend {
    server localhost:3000;
}

upstream admin_panel {
    server localhost:3001;
}

upstream backend_api {
    server localhost:5000;
}

# Main server block - Frontend on port 80
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Frontend - Customer Website
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin Panel
    location /admin {
        proxy_pass http://admin_panel;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static file uploads
    location /uploads {
        alias /var/www/creamingo/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/json application/xml;
}
```

### 3. Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/creamingo /etc/nginx/sites-enabled/

# Remove default configuration (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4. Configure Firewall (UFW)

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

---

## Process Management with PM2

### 1. Create PM2 Ecosystem File

Create `ecosystem.config.js` in the root directory:

```bash
cd /var/www/creamingo
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'creamingo-backend',
      cwd: '/var/www/creamingo/backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        TZ: 'Asia/Kolkata' // IST timezone
      },
      error_file: '/var/www/creamingo/logs/backend-error.log',
      out_file: '/var/www/creamingo/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false
    },
    {
      name: 'creamingo-frontend',
      cwd: '/var/www/creamingo/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TZ: 'Asia/Kolkata' // IST timezone
      },
      error_file: '/var/www/creamingo/logs/frontend-error.log',
      out_file: '/var/www/creamingo/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false
    },
    {
      name: 'creamingo-admin',
      cwd: '/var/www/creamingo/admin-panel',
      script: 'serve',
      args: '-s build -l 3001',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        TZ: 'Asia/Kolkata' // IST timezone
      },
      error_file: '/var/www/creamingo/logs/admin-error.log',
      out_file: '/var/www/creamingo/logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false
    }
  ]
};
```

**Note:** For admin panel, you may need to install `serve` globally:
```bash
npm install -g serve
```

### 2. Start Applications with PM2

```bash
# Start all applications
pm2 start ecosystem.config.js

# Or start individually
pm2 start ecosystem.config.js --only creamingo-backend
pm2 start ecosystem.config.js --only creamingo-frontend
pm2 start ecosystem.config.js --only creamingo-admin
```

### 3. PM2 Management Commands

```bash
# View status
pm2 status

# View logs
pm2 logs
pm2 logs creamingo-backend
pm2 logs creamingo-frontend
pm2 logs creamingo-admin

# Restart applications
pm2 restart all
pm2 restart creamingo-backend

# Stop applications
pm2 stop all
pm2 stop creamingo-backend

# Delete applications
pm2 delete all

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command
```

### 4. Monitor Applications

```bash
# Real-time monitoring
pm2 monit

# View detailed information
pm2 show creamingo-backend
```

---

## File Permissions and Security

### 1. Set Proper File Permissions

```bash
# Set ownership
sudo chown -R $USER:$USER /var/www/creamingo

# Set directory permissions
find /var/www/creamingo -type d -exec chmod 755 {} \;

# Set file permissions
find /var/www/creamingo -type f -exec chmod 644 {} \;

# Make scripts executable
chmod +x /var/www/creamingo/backend/src/server.js

# Secure uploads directory
chmod 755 /var/www/creamingo/backend/uploads
chmod 755 /var/www/creamingo/backend/images
```

### 2. Secure Environment Files

```bash
# Restrict access to .env files
chmod 600 /var/www/creamingo/backend/.env
chmod 600 /var/www/creamingo/frontend/.env.production
chmod 600 /var/www/creamingo/admin-panel/.env.production
```

### 3. Configure Firewall Rules

```bash
# Review and configure firewall
sudo ufw status verbose

# Only allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS (for future SSL)
```

---

## Testing and Verification

### 1. Test Backend API

```bash
# Check if backend is running
curl http://localhost:5000/health

# Test API endpoint
curl http://localhost:5000/api/health
```

### 2. Test Frontend

```bash
# Check if frontend is accessible
curl http://localhost:3000
```

### 3. Test Admin Panel

```bash
# Check if admin panel is accessible
curl http://localhost:3001
```

### 4. Test Nginx Configuration

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Test from external IP
curl http://YOUR_VPS_IP
```

### 5. Verify Database Connection

```bash
# Test MySQL connection
mysql -u creamingo_user -p creamingo -e "SELECT COUNT(*) FROM products;"

# Check backend logs
pm2 logs creamingo-backend --lines 50
```

### 6. Verify Timezone Configuration

```bash
# Verify system timezone
timedatectl
date

# Verify MySQL timezone
mysql -u creamingo_user -p -e "SELECT @@global.time_zone, @@session.time_zone, NOW();"

# Verify Node.js timezone in backend
pm2 logs creamingo-backend --lines 20 | grep -i timezone

# Or test via API (if you have a time endpoint)
curl http://localhost:5000/api/health
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 PID
```

#### 2. Database Connection Errors

```bash
# Check MySQL status
sudo systemctl status mysql

# Test MySQL connection
mysql -u creamingo_user -p -e "SELECT 1;"

# Check MySQL error logs
sudo tail -f /var/log/mysql/error.log
```

#### 3. Permission Denied Errors

```bash
# Check file permissions
ls -la /var/www/creamingo/backend/uploads

# Fix permissions
sudo chown -R $USER:$USER /var/www/creamingo
chmod -R 755 /var/www/creamingo/backend/uploads
```

#### 4. Nginx 502 Bad Gateway

```bash
# Check if applications are running
pm2 status

# Check application logs
pm2 logs

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

#### 5. Application Not Starting

```bash
# Check PM2 logs
pm2 logs --lines 100

# Check Node.js version
node --version

# Verify environment variables
cd /var/www/creamingo/backend
cat .env
```

#### 6. Timezone Issues

```bash
# Check system timezone
timedatectl
date

# If timezone is incorrect, set it again
sudo timedatectl set-timezone Asia/Kolkata

# Verify MySQL timezone
mysql -u creamingo_user -p -e "SELECT @@global.time_zone, @@session.time_zone, NOW();"

# If MySQL timezone is incorrect, set it
sudo mysql -u root -p -e "SET GLOBAL time_zone = '+05:30';"

# Restart MySQL to apply permanent changes
sudo systemctl restart mysql

# Check Node.js timezone in PM2
pm2 show creamingo-backend | grep TZ

# Restart PM2 apps to apply timezone changes
pm2 restart all
```

### Useful Commands

```bash
# View all PM2 processes
pm2 list

# View detailed logs
pm2 logs --lines 200

# Restart specific app
pm2 restart creamingo-backend

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check MySQL status
sudo systemctl status mysql

# View MySQL error log
sudo tail -f /var/log/mysql/error.log

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check timezone settings
timedatectl
mysql -u creamingo_user -p -e "SELECT @@global.time_zone, NOW();"
```

---

## Next Steps (Future)

### Domain Configuration (When Ready)

When you're ready to add a domain:

1. Update DNS records to point to your VPS IP
2. Update Nginx configuration with domain name
3. Install SSL certificate (Let's Encrypt)
4. Update CORS_ORIGIN in backend .env
5. Update API URLs in frontend and admin panel

### Cloudflare Setup (When Ready)

1. Add your domain to Cloudflare
2. Update DNS records
3. Configure Cloudflare proxy settings
4. Enable SSL/TLS
5. Configure caching rules
6. Set up firewall rules

---

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
nano /var/www/creamingo/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/www/creamingo/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup MySQL database
mysqldump -u creamingo_user -p'your_password' creamingo > $BACKUP_DIR/creamingo_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/creamingo_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "creamingo_*.sql.gz" -mtime +7 -delete

echo "Backup completed: creamingo_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /var/www/creamingo/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/creamingo/backup-db.sh
```

### 2. Application Files Backup

```bash
# Backup script for application files
nano /var/www/creamingo/backup-files.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/www/creamingo/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/creamingo/backend/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Files backup completed: uploads_$DATE.tar.gz"
```

---

## Summary

Your Creamingo platform should now be running on your VPS:

- **Frontend**: Accessible at `http://YOUR_VPS_IP` (port 80 via Nginx)
- **Admin Panel**: Accessible at `http://YOUR_VPS_IP/admin` (port 80 via Nginx)
- **Backend API**: Accessible at `http://YOUR_VPS_IP/api` (port 80 via Nginx)

All services are managed by PM2 and will automatically restart on server reboot.

For production use, remember to:
- Set strong passwords for MySQL and JWT secrets
- Configure proper firewall rules
- Set up regular backups
- Monitor application logs
- Keep system packages updated
- Configure SSL/HTTPS when domain is ready

---

**Note**: Replace `YOUR_VPS_IP` with your actual VPS IP address throughout this guide.

