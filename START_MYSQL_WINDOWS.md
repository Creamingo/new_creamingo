# Starting MySQL on Windows

## Check if MySQL is Installed

1. **Check Services:**
   - Press `Win + R`
   - Type `services.msc` and press Enter
   - Look for "MySQL" or "MySQL80" service

2. **Check Program Files:**
   - Look in `C:\Program Files\MySQL\` or `C:\Program Files (x86)\MySQL\`

## Start MySQL Service

### Method 1: Using Services (GUI)
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "MySQL" or "MySQL80" service
4. Right-click → Start
5. Set it to "Automatic" (right-click → Properties → Startup type: Automatic)

### Method 2: Using Command Prompt (as Administrator)
```cmd
net start MySQL80
```
or
```cmd
net start MySQL
```

### Method 3: Using PowerShell (as Administrator)
```powershell
Start-Service MySQL80
```
or
```powershell
Start-Service MySQL
```

## Install MySQL (if not installed)

1. **Download MySQL:**
   - Go to: https://dev.mysql.com/downloads/installer/
   - Download "MySQL Installer for Windows"

2. **Install MySQL:**
   - Run the installer
   - Choose "Developer Default" or "Server only"
   - During setup:
     - Set root password (remember this!)
     - Create a Windows service (check the box)
     - Set service to start automatically

3. **After Installation:**
   - MySQL should start automatically
   - Verify in Services (`services.msc`)

## Verify MySQL is Running

Run this command:
```bash
cd backend
node test-mysql-connection.js
```

You should see:
```
✅ Successfully connected to MySQL server!
```

## Alternative: Use XAMPP/WAMP

If you prefer a simpler setup:

1. **Install XAMPP:**
   - Download from: https://www.apachefriends.org/
   - Install and start MySQL from XAMPP Control Panel

2. **Default XAMPP MySQL:**
   - Host: `localhost`
   - Port: `3306`
   - User: `root`
   - Password: (empty by default, or what you set)

3. **Update .env:**
   ```env
   DB_USER=root
   DB_PASSWORD=your_xampp_password
   ```

