# Connecting to VPS MySQL from Local Development

## Configuration

Update your `.env` file to point to your VPS MySQL server:

```env
# VPS MySQL Configuration
DB_HOST=your_vps_ip_or_domain
DB_PORT=3306
DB_USER=creamingo_user
DB_PASSWORD=your_secure_password
DB_NAME=creamingo_db
DB_ALLOWED_HOSTS=%
```

## VPS MySQL Setup

### 1. Install MySQL on VPS (if not already installed)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### 2. Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

### 3. Create Database and User

Login to MySQL as root:
```bash
sudo mysql -u root -p
```

Then run:
```sql
-- Create database
CREATE DATABASE creamingo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_secure_password' with actual password)
CREATE USER 'creamingo_user'@'%' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON creamingo_db.* TO 'creamingo_user'@'%';

-- Also allow localhost connections
CREATE USER 'creamingo_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON creamingo_db.* TO 'creamingo_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### 4. Configure MySQL for Remote Connections

Edit MySQL configuration:
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Find and comment out or change:
```ini
# bind-address = 127.0.0.1
bind-address = 0.0.0.0
```

Or add:
```ini
bind-address = 0.0.0.0
```

Save and restart MySQL:
```bash
sudo systemctl restart mysql
```

### 5. Configure Firewall

Allow MySQL port (3306) through firewall:

**UFW (Ubuntu):**
```bash
sudo ufw allow 3306/tcp
sudo ufw reload
```

**firewalld (CentOS/RHEL):**
```bash
sudo firewall-cmd --permanent --add-service=mysql
sudo firewall-cmd --reload
```

**iptables:**
```bash
sudo iptables -A INPUT -p tcp --dport 3306 -j ACCEPT
```

### 6. Test Connection from Local Machine

Update your `.env` file:
```env
DB_HOST=your_vps_ip_address
DB_PORT=3306
DB_USER=creamingo_user
DB_PASSWORD=your_secure_password
DB_NAME=creamingo_db
```

Then test:
```bash
cd backend
node test-mysql-connection.js
```

## Security Best Practices

1. **Use Strong Passwords**: Always use strong, unique passwords
2. **Limit Access**: Only allow specific IPs if possible:
   ```sql
   CREATE USER 'creamingo_user'@'your_local_ip' IDENTIFIED BY 'password';
   ```
3. **Use SSL/TLS**: Enable SSL for remote connections
4. **Firewall Rules**: Only allow connections from trusted IPs
5. **Regular Updates**: Keep MySQL updated

## Troubleshooting

### Connection Refused
- Check MySQL is running: `sudo systemctl status mysql`
- Verify bind-address is 0.0.0.0
- Check firewall allows port 3306
- Verify MySQL user has '%' host access

### Access Denied
- Check username and password
- Verify user exists: `SELECT User, Host FROM mysql.user;`
- Check privileges: `SHOW GRANTS FOR 'creamingo_user'@'%';`

### Timeout
- Check network connectivity: `ping your_vps_ip`
- Verify firewall rules
- Check if MySQL port is open: `telnet your_vps_ip 3306`

## Testing Connection

Run the test script:
```bash
cd backend
node test-mysql-connection.js
```

This will:
- Test connection to VPS MySQL
- Create database if missing
- Create user if missing
- Grant privileges
- Verify everything works

