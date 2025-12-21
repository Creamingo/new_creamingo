# Setup and Deployment Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Version 8.0.0 or higher (install with: `npm install -g pnpm`)
- **Git**: For version control
- **Database**: PostgreSQL (production) or SQLite (development)

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-username/creamingo-web.git
cd creamingo-web
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm run install:all

# Or install individually
pnpm install
cd frontend && pnpm install
cd ../admin-panel && pnpm install
cd ../backend && pnpm install
```

### 3. Environment Configuration

#### Backend Environment
Create `backend/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=creamingo
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

#### Frontend Environment
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ENVIRONMENT=development
```

#### Admin Panel Environment
Create `admin-panel/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

### 4. Database Setup

#### PostgreSQL (Production)
```bash
# Create database
createdb creamingo

# Run schema
psql -d creamingo -f backend/database/schema.sql
```

#### SQLite (Development)
```bash
# Database will be created automatically
# Run migrations if needed
cd backend
node src/utils/initDatabase.js
```

### 5. Start Development Servers
```bash
# Start all services
pnpm run dev

# Or start individually
pnpm run dev:frontend  # Port 3000
pnpm run dev:admin     # Port 3001
pnpm run dev:backend   # Port 5000
```

## 🏗️ Development Setup

### Project Structure
```
creamingo-web/
├── frontend/          # Customer-facing website
├── admin-panel/       # Administrative interface
├── backend/           # API server
├── doc/              # Documentation
└── package.json      # Monorepo configuration
```

### Development Workflow

#### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Test locally
pnpm run dev

# Commit changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

#### 2. Code Quality
```bash
# Run linting
pnpm run lint

# Run tests
pnpm run test

# Type checking (TypeScript projects)
pnpm run type-check
```

#### 3. Build Process
```bash
# Build all projects
pnpm run build

# Build individually
pnpm run build:frontend
pnpm run build:admin
pnpm run build:backend
```

## 🌐 Deployment Options

### Option 1: Different Ports (Development)

#### Configuration
- **Frontend**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3001`
- **Backend API**: `http://localhost:5000`

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option 2: Subpath (Same Domain)

#### Configuration
- **Frontend**: `https://yourdomain.com/`
- **Admin Panel**: `https://yourdomain.com/admin`
- **Backend API**: `https://yourdomain.com/api`

#### Environment Variables
```env
# Frontend
NEXT_PUBLIC_BASE_PATH=/
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Admin Panel
REACT_APP_BASE_PATH=/admin
REACT_APP_API_URL=https://yourdomain.com/api

# Backend
CORS_ORIGIN=https://yourdomain.com
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        root /var/www/creamingo/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Admin Panel
    location /admin {
        alias /var/www/creamingo/admin-panel/build;
        try_files $uri $uri/ /admin/index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static {
        alias /var/www/creamingo/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 3: Subdomain (Production)

#### Configuration
- **Frontend**: `https://creamingo.com`
- **Admin Panel**: `https://admin.creamingo.com`
- **Backend API**: `https://api.creamingo.com`

#### Environment Variables
```env
# Frontend
NEXT_PUBLIC_API_URL=https://api.creamingo.com/api

# Admin Panel
REACT_APP_API_URL=https://api.creamingo.com/api

# Backend
CORS_ORIGIN=https://creamingo.com,https://admin.creamingo.com
```

#### Nginx Configuration
```nginx
# Frontend
server {
    listen 443 ssl;
    server_name creamingo.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    root /var/www/creamingo/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Admin Panel
server {
    listen 443 ssl;
    server_name admin.creamingo.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    root /var/www/creamingo/admin-panel/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 443 ssl;
    server_name api.creamingo.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## ☁️ Cloud Deployment

### Vercel (Frontend & Admin Panel)

#### 1. Install Vercel CLI
```bash
pnpm install -g vercel
```

#### 2. Deploy Frontend
```bash
cd frontend
vercel --prod
```

#### 3. Deploy Admin Panel
```bash
cd admin-panel
vercel --prod
```

#### 4. Environment Variables
Set in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `REACT_APP_API_URL`

### Netlify (Frontend & Admin Panel)

#### 1. Build Configuration
Create `netlify.toml`:
```toml
[build]
  publish = "build"
  command = "pnpm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 2. Deploy
```bash
# Connect to Netlify
netlify init

# Deploy
netlify deploy --prod
```

### Railway (Backend)

#### 1. Railway Configuration
Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/health"
  }
}
```

#### 2. Environment Variables
Set in Railway dashboard:
- `DB_HOST`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGIN`

### Heroku (Backend)

#### 1. Heroku Configuration
Create `Procfile`:
```
web: pnpm start
```

#### 2. Deploy
```bash
# Login to Heroku
heroku login

# Create app
heroku create creamingo-api

# Set environment variables
heroku config:set DB_HOST=your-db-host
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

## 🐳 Docker Deployment

### Docker Compose Setup

#### 1. Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
    depends_on:
      - backend

  admin:
    build: ./admin-panel
    ports:
      - "3001:3001"
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=postgres
      - DB_NAME=creamingo
      - DB_USER=postgres
      - DB_PASSWORD=password
      - JWT_SECRET=your-secret
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=creamingo
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### 2. Create Dockerfiles

**Frontend Dockerfile**:
```dockerfile
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "start"]
```

**Admin Panel Dockerfile**:
```dockerfile
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3001
CMD ["pnpm", "start"]
```

**Backend Dockerfile**:
```dockerfile
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 5000
CMD ["pnpm", "start"]
```

#### 3. Deploy with Docker
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Production Configuration

### Security Hardening

#### 1. Environment Variables
```env
# Production settings
NODE_ENV=production
JWT_SECRET=super-secure-random-string
DB_PASSWORD=strong-database-password

# Security headers
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
```

#### 2. SSL/TLS Configuration
```nginx
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

### Performance Optimization

#### 1. Caching
```nginx
# Static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API responses
location /api {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
}
```

#### 2. Compression
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### Monitoring and Logging

#### 1. Application Monitoring
```javascript
// Backend monitoring
const express = require('express');
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error tracking
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Send to monitoring service
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Send to monitoring service
});
```

#### 2. Log Management
```javascript
// Structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions

#### 1. Create `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      # Build and deploy frontend
      - name: Deploy Frontend
        run: |
          cd frontend
          pnpm install
          pnpm run build
          # Deploy to Vercel/Netlify
      
      # Build and deploy admin panel
      - name: Deploy Admin Panel
        run: |
          cd admin-panel
          pnpm install
          pnpm run build
          # Deploy to Vercel/Netlify
      
      # Deploy backend
      - name: Deploy Backend
        run: |
          cd backend
          pnpm install
          pnpm run build
          # Deploy to Railway/Heroku
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### 2. Database Connection Issues
```bash
# Check database status
systemctl status postgresql

# Test connection
psql -h localhost -U username -d creamingo
```

#### 3. Build Failures
```bash
# Clear cache
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check Node.js version
node --version
pnpm --version
```

#### 4. Environment Variable Issues
```bash
# Check environment variables
echo $NODE_ENV
echo $DB_HOST

# Verify .env files exist
ls -la .env*
```

### Performance Issues

#### 1. Slow API Responses
- Check database query performance
- Enable query logging
- Optimize database indexes
- Implement caching

#### 2. Frontend Loading Issues
- Check bundle size
- Enable code splitting
- Optimize images
- Implement lazy loading

#### 3. Memory Issues
- Monitor memory usage
- Check for memory leaks
- Optimize data structures
- Implement garbage collection

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Deployment Platforms
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Heroku Documentation](https://devcenter.heroku.com/)

### Monitoring Tools
- [Sentry](https://sentry.io/) - Error tracking
- [New Relic](https://newrelic.com/) - Performance monitoring
- [DataDog](https://www.datadoghq.com/) - Infrastructure monitoring

This comprehensive setup and deployment guide provides everything needed to get the Creamingo platform running in any environment, from local development to production deployment.
