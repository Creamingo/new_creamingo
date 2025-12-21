@echo off
title Creamingo Development Environment

echo 🚀 Starting Creamingo Development Environment...
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pnpm is not installed. Please install pnpm first.
    echo    Install with: npm install -g pnpm
    pause
    exit /b 1
)

echo ✅ Node.js and pnpm are available

REM Start backend
echo.
echo 📡 Starting Backend API on port 5000...
start "Creamingo Backend" cmd /k "cd backend && if not exist node_modules pnpm install && pnpm run dev"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start admin panel
echo.
echo 👨‍💼 Starting Admin Panel on port 3001...
start "Creamingo Admin Panel" cmd /k "cd admin-panel && if not exist node_modules pnpm install && pnpm start"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start frontend
echo.
echo 🌐 Starting Customer Website on port 3000...
start "Creamingo Frontend" cmd /k "cd frontend && if not exist node_modules pnpm install && pnpm run dev"

echo.
echo ✅ All services started successfully!
echo ==============================================
echo 🌐 Customer Website: http://localhost:3000
echo 👨‍💼 Admin Panel:     http://localhost:3001
echo 📡 Backend API:      http://localhost:5000
echo.
echo 📋 Default Admin Credentials:
echo    Email:    admin@creamingo.com
echo    Password: Creamingo@2427
echo.
echo 🎉 Development environment is ready!
echo Close this window to continue, or press any key to exit.
echo ==============================================

pause >nul
