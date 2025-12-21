#!/bin/bash

echo "🚀 Starting Creamingo Development Environment..."
echo "=============================================="

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check ports
echo "🔍 Checking ports..."
if ! check_port 3000; then
    echo "❌ Port 3000 (Frontend) is already in use"
    exit 1
fi

if ! check_port 3001; then
    echo "❌ Port 3001 (Admin Panel) is already in use"
    exit 1
fi

if ! check_port 5000; then
    echo "❌ Port 5000 (Backend API) is already in use"
    exit 1
fi

echo "✅ All ports are available"

# Start backend
echo ""
echo "📡 Starting Backend API on port 5000..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    pnpm install
fi
pnpm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start admin panel
echo ""
echo "👨‍💼 Starting Admin Panel on port 3001..."
cd admin-panel
if [ ! -d "node_modules" ]; then
    echo "📦 Installing admin panel dependencies..."
    pnpm install
fi
pnpm start &
ADMIN_PID=$!
cd ..

# Wait a moment for admin panel to start
sleep 3

# Start frontend
echo ""
echo "🌐 Starting Customer Website on port 3000..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    pnpm install
fi
pnpm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started successfully!"
echo "=============================================="
echo "🌐 Customer Website: http://localhost:3000"
echo "👨‍💼 Admin Panel:     http://localhost:3001"
echo "📡 Backend API:      http://localhost:5000"
echo ""
echo "📋 Default Admin Credentials:"
echo "   Email:    admin@creamingo.com"
echo "   Password: Creamingo@2427"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=============================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $ADMIN_PID $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on interrupt
trap cleanup INT

# Wait for all background processes
wait
