#!/bin/bash

# Thai Spray Shop - Development Startup Script
# Runs both Backend (NestJS) and Frontend (Vite) concurrently

echo "🚀 Starting Thai Spray Shop Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
  cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
  cd frontend && npm install && cd ..
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}⚠️  Backend .env not found. Please copy from .env.example${NC}"
  exit 1
fi

if [ ! -f "frontend/.env" ]; then
  echo -e "${YELLOW}⚠️  Frontend .env not found. Creating from example...${NC}"
  cp frontend/.env.example frontend/.env
fi

echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""
echo -e "${BLUE}📦 Starting Backend on http://localhost:4000${NC}"
echo -e "${BLUE}🎨 Starting Frontend on http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Start both servers using npm-run-all or concurrently
# If not installed, run them in background
if command -v npx &> /dev/null; then
  # Use concurrently package (install if needed)
  npx concurrently \
    -n "BACKEND,FRONTEND" \
    -c "bgBlue.bold,bgMagenta.bold" \
    "cd backend && npm run start:dev" \
    "cd frontend && npm run dev"
else
  # Fallback: run in background
  cd backend && npm run start:dev &
  BACKEND_PID=$!
  cd ../frontend && npm run dev &
  FRONTEND_PID=$!
  
  # Wait for both processes
  wait $BACKEND_PID $FRONTEND_PID
fi
