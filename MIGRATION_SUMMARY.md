# Migration Summary: SQLite to MySQL & Single .env File

## ✅ Completed Changes

### 1. Single .env File Configuration
- ✅ Created `.env.example` at project root with all environment variables
- ✅ Updated backend to load from root `.env` file
- ✅ Updated frontend (Next.js) to load from root `.env` file
- ✅ Updated admin-panel (React) to load from root `.env` file using dotenv-cli

### 2. MySQL Migration
- ✅ Replaced SQLite with MySQL in `backend/src/config/db.js`
- ✅ Updated `backend/src/utils/initDatabase.js` for MySQL
- ✅ Updated `backend/package.json` to use `mysql2` instead of `sqlite3`
- ✅ Updated server startup message to show MySQL connection info

### 3. Files Modified

#### Backend
- `backend/src/config/db.js` - Complete MySQL migration
- `backend/src/app.js` - Load env from root
- `backend/src/server.js` - Updated database info message
- `backend/src/utils/initDatabase.js` - MySQL initialization
- `backend/package.json` - Replaced sqlite3 with mysql2

#### Frontend
- `frontend/next.config.js` - Load env from root
- `frontend/package.json` - Added dotenv dependency

#### Admin Panel
- `admin-panel/package.json` - Added dotenv-cli and updated scripts

#### Root
- `.env.example` - Single source of truth for all environment variables
- `MYSQL_SETUP.md` - MySQL setup guide
- `MIGRATION_SUMMARY.md` - This file

## 📋 Next Steps

### 1. Install Dependencies

```bash
# Install MySQL driver for backend
cd backend
pnpm install mysql2

# Install dotenv for frontend
cd ../frontend
pnpm install dotenv

# Install dotenv-cli for admin-panel
cd ../admin-panel
pnpm install dotenv-cli
```

### 2. Set Up MySQL Database

Follow the instructions in `MYSQL_SETUP.md` to:
1. Install MySQL server
2. Create database and user
3. Configure remote access (if needed for VPS)

### 3. Create .env File

```bash
# Copy example file
cp .env.example .env

# Edit .env and update with your actual values:
# - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (use a strong secret in production)
# - Other configuration as needed
```

### 4. Initialize Database

The database will be automatically initialized when you start the backend, or manually:

```bash
cd backend
node src/utils/initDatabase.js
```

### 5. Test Connection

Start the backend server:

```bash
cd backend
pnpm run dev
```

You should see:
```
✅ Connected to MySQL database (IST timezone)
```

## 🔧 Configuration Details

### Environment Variables

All environment variables are now in the root `.env` file:

- **Database**: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_ALLOWED_HOSTS`
- **JWT**: `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Server**: `PORT`, `NODE_ENV`
- **Uploads**: `UPLOAD_PATH`, `MAX_FILE_SIZE`
- **CORS**: `CORS_ORIGIN`
- **Frontend**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ENVIRONMENT`
- **Admin Panel**: `REACT_APP_API_URL`, `REACT_APP_ENVIRONMENT`
- **Email (Optional)**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `FRONTEND_URL`

### VPS Deployment

For VPS deployment, update `.env`:

```env
DB_HOST=your_vps_ip_or_domain
DB_ALLOWED_HOSTS=%,your_vps_ip
NEXT_PUBLIC_API_URL=http://your_vps_ip:5000/api
REACT_APP_API_URL=http://your_vps_ip:5000/api
```

## ⚠️ Breaking Changes

1. **SQLite removed**: All SQLite dependencies and code removed
2. **Database location**: Database is now MySQL, not a local file
3. **Environment files**: All `.env` files should be consolidated to root `.env`

## 🔍 Verification Checklist

- [ ] MySQL server installed and running
- [ ] Database and user created
- [ ] `.env` file created from `.env.example`
- [ ] All dependencies installed (`mysql2`, `dotenv`, `dotenv-cli`)
- [ ] Backend connects to MySQL successfully
- [ ] Database initialized with schema
- [ ] Frontend loads environment variables correctly
- [ ] Admin panel loads environment variables correctly

## 📚 Additional Resources

- `MYSQL_SETUP.md` - Detailed MySQL setup instructions
- `VPS_DEPLOYMENT_GUIDE.md` - VPS deployment guide (includes migration steps)
- `.env.example` - Template for environment variables

## 🐛 Troubleshooting

### Backend won't connect to MySQL
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env`
- Check user privileges: `SHOW GRANTS FOR 'creamingo_user'@'localhost';`

### Environment variables not loading
- Ensure `.env` file exists at project root
- Check file paths in `dotenv.config()` calls
- Verify variable names match (case-sensitive)

### Admin panel can't find env vars
- Ensure `dotenv-cli` is installed
- Check script uses `dotenv -e ../.env --`
- Verify `.env` file is at project root

