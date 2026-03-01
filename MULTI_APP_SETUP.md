# 🚀 Creamingo Multi-App Setup Guide

This guide helps you run both the customer-facing website and admin panel simultaneously without port conflicts.

## 📋 Current Setup

- **Customer Website**: `frontend/` (Next.js) - Port 3000
- **Admin Panel**: `admin-panel/` (React) - Port 3001
- **Backend API**: `backend/` (Node.js/Express) - Port 5000

---

## 🎯 Option A: Different Ports (Development) - RECOMMENDED

### ✅ Benefits
- ✅ Easy setup
- ✅ No configuration conflicts
- ✅ Independent development
- ✅ Works on all platforms

### 🔧 Setup Instructions

#### 1. Admin Panel Configuration
The admin panel is already configured to run on port 3001:

```bash
# Navigate to admin panel
cd admin-panel

# Install dependencies (if not done)
pnpm install

# Start admin panel on port 3001
pnpm start
# or
pnpm run dev
```

#### 2. Customer Website
```bash
# Navigate to frontend
cd frontend

# Start customer website on port 3000
pnpm run dev
```

#### 3. Backend API
```bash
# Navigate to backend
cd backend

# Install dependencies (if not done)
pnpm install

# Start backend API on port 5000
pnpm run dev
```

### 🌐 Access URLs
- **Customer Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **Backend API**: http://localhost:5000

### 🚀 Quick Start Commands

Create a `start-all.sh` (Linux/Mac) or `start-all.bat` (Windows) script:

**start-all.sh** (Linux/Mac):
```bash
#!/bin/bash
echo "🚀 Starting Creamingo Development Environment..."

# Start backend
echo "📡 Starting Backend API..."
cd backend && pnpm run dev &
BACKEND_PID=$!

# Start admin panel
echo "👨‍💼 Starting Admin Panel..."
cd ../admin-panel && pnpm start &
ADMIN_PID=$!

# Start frontend
echo "🌐 Starting Customer Website..."
cd ../frontend && pnpm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "🌐 Customer Website: http://localhost:3000"
echo "👨‍💼 Admin Panel: http://localhost:3001"
echo "📡 Backend API: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $BACKEND_PID $ADMIN_PID $FRONTEND_PID; exit" INT
wait
```

**start-all.bat** (Windows):
```batch
@echo off
echo 🚀 Starting Creamingo Development Environment...

echo 📡 Starting Backend API...
start "Backend" cmd /k "cd backend && pnpm run dev"

echo 👨‍💼 Starting Admin Panel...
start "Admin Panel" cmd /k "cd admin-panel && pnpm start"

echo 🌐 Starting Customer Website...
start "Frontend" cmd /k "cd frontend && pnpm run dev"

echo ✅ All services started!
echo 🌐 Customer Website: http://localhost:3000
echo 👨‍💼 Admin Panel: http://localhost:3001
echo 📡 Backend API: http://localhost:5000
pause
```

---

## 🎯 Option B: Subpath Setup (Same Domain)

### ✅ Benefits
- ✅ Single domain
- ✅ Shared authentication
- ✅ Easier deployment
- ✅ Better for production

### 🔧 Setup Instructions

#### 1. Admin Panel Configuration

**For Development:**
```bash
cd admin-panel

# Copy subpath configuration
cp package.subpath.json package.json

# Install dependencies
pnpm install

# Start with subpath
pnpm run start:subpath
```

**For Production Build:**
```bash
# Build admin panel for subpath
pnpm run build:subpath
```

#### 2. Frontend Configuration

Update your Next.js frontend to serve admin panel:

**next.config.js** (in frontend directory):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:3001/admin/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

#### 3. Nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name creamingo.com;

    # Customer website
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin panel
    location /admin {
        alias /var/www/creamingo/admin-panel/build;
        try_files $uri $uri/ /admin/index.html;
        add_header X-Robots-Tag "noindex, nofollow" always;
        
        # Handle static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Robots-Tag "noindex, nofollow" always;
        }
    }
}
```

### 🌐 Access URLs
- **Customer Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

---

## 🎯 Option C: Subdomain Setup (Production)

### ✅ Benefits
- ✅ Complete separation
- ✅ Independent scaling
- ✅ Better security
- ✅ Professional setup

### 🔧 Setup Instructions

#### 1. DNS Configuration
```
creamingo.com          A    YOUR_SERVER_IP
admin.creamingo.com    A    YOUR_SERVER_IP
api.creamingo.com      A    YOUR_SERVER_IP
```

#### 2. Nginx Configuration

**Main Configuration** (`/etc/nginx/sites-available/creamingo`):
```nginx
# Customer Website
server {
    listen 80;
    server_name creamingo.com www.creamingo.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Panel
server {
    listen 80;
    server_name admin.creamingo.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        add_header X-Robots-Tag "noindex, nofollow" always;
    }
}

# Backend API
server {
    listen 80;
    server_name api.creamingo.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 3. SSL Configuration (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d creamingo.com -d www.creamingo.com
sudo certbot --nginx -d admin.creamingo.com
sudo certbot --nginx -d api.creamingo.com
```

### 🌐 Access URLs
- **Customer Website**: https://creamingo.com
- **Admin Panel**: https://admin.creamingo.com
- **Backend API**: https://api.creamingo.com

---

## 🚀 Deployment Options

### Netlify Deployment

#### 1. Customer Website
```bash
cd frontend
pnpm run build
# Deploy build folder to Netlify
```

#### 2. Admin Panel
```bash
cd admin-panel
pnpm run build
# Deploy build folder to Netlify
```

**Netlify Configuration** (`netlify.toml`):
```toml
[build]
  publish = "build"
  command = "pnpm run build"

[[redirects]]
  from = "/admin/*"
  to = "/admin/index.html"
  status = 200
```

### Vercel Deployment

#### 1. Customer Website
```bash
cd frontend
vercel --prod
```

#### 2. Admin Panel
```bash
cd admin-panel
vercel --prod
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/admin/(.*)",
      "destination": "/admin/index.html"
    }
  ]
}
```

### Hostinger Deployment

#### 1. Upload Files
- Upload `frontend/build` to `public_html/`
- Upload `admin-panel/build` to `public_html/admin/`

#### 2. Configure .htaccess
```apache
# public_html/.htaccess
RewriteEngine On
<IfModule mod_headers.c>
Header set X-Robots-Tag "noindex, nofollow" "expr=%{REQUEST_URI} =~ m#^/admin/#"
</IfModule>

# Admin panel routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} ^/admin/
RewriteRule ^admin/(.*)$ /admin/index.html [L]

# Frontend routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/admin/
RewriteRule ^(.*)$ /index.html [L]
```

---

## 🔧 Environment Configuration

### Backend API Configuration

Update backend environment variables for different setups:

**Option A (Different Ports)**:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

**Option B (Subpath)**:
```env
CORS_ORIGIN=http://localhost:3000
```

**Option C (Subdomain)**:
```env
CORS_ORIGIN=https://creamingo.com,https://admin.creamingo.com
```

### Frontend Configuration

Update API endpoints in your frontend applications:

**Option A**:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**Option B**:
```javascript
const API_BASE_URL = '/api'; // Same domain
```

**Option C**:
```javascript
const API_BASE_URL = 'https://api.creamingo.com/api';
```

---

## 🎯 Recommended Setup

### For Development
**Use Option A (Different Ports)** - It's the simplest and most flexible.

### For Production
**Use Option C (Subdomain)** - It provides the best separation and scalability.

### For Simple Deployment
**Use Option B (Subpath)** - It's easier to deploy and manage.

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 PID  # Linux/Mac
taskkill /PID PID /F  # Windows
```

### CORS Issues
Make sure your backend CORS configuration includes all frontend URLs.

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### Routing Issues
Ensure React Router basename is correctly configured for subpath deployments.

---

## 📞 Support

If you encounter any issues, check:
1. All services are running on correct ports
2. Environment variables are properly set
3. CORS configuration includes all frontend URLs
4. DNS configuration (for subdomain setup)
5. SSL certificates (for production)

Happy coding! 🍰✨
