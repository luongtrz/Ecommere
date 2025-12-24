#!/bin/bash

# Setup Thai Spray Shop on Azure VM
# Run this script on the Azure VM after deploying files

set -e

echo "🔧 Setting up Thai Spray Shop on Azure VM..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js 20.x if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo "✅ PostgreSQL installed"

# Create database and user
echo "🗄️  Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE thai_spray_shop;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER thai_user WITH PASSWORD 'Thai@2024';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE thai_spray_shop TO thai_user;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER DATABASE thai_spray_shop OWNER TO thai_user;" 2>/dev/null || true

# Setup .env files
echo "⚙️  Setting up environment variables..."

# Backend .env
cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL="postgresql://thai_user:Thai@2024@localhost:5432/thai_spray_shop?schema=public"

# JWT Secrets (change these in production!)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production-123456
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-654321
JWT_ACCESS_EXPIRES_IN=3m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000,http://20.2.66.240:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DEST=./uploads
EOF

# Frontend .env
cat > frontend/.env << 'EOF'
VITE_API_BASE_URL=http://20.2.66.240:4000/api
EOF

echo "✅ Environment files created"

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Run Prisma migrations
echo "🗄️  Running database migrations..."
cd ../backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Build frontend
echo "🏗️  Building frontend..."
cd ../frontend
npm run build

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

echo "✅ PM2 installed"

# Create PM2 ecosystem file
cd ..
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'thai-spray-backend',
      cwd: './backend',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'thai-spray-frontend',
      cwd: './frontend',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Build backend
echo "🏗️  Building backend..."
cd backend
npm run build

# Start services with PM2
echo "🚀 Starting services with PM2..."
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Services running:"
echo "   Backend:  http://20.2.66.240:4000"
echo "   Frontend: http://20.2.66.240:3000"
echo "   Swagger:  http://20.2.66.240:4000/api"
echo ""
echo "📝 Useful commands:"
echo "   pm2 status          - Check service status"
echo "   pm2 logs            - View logs"
echo "   pm2 restart all     - Restart all services"
echo "   pm2 stop all        - Stop all services"
echo ""
echo "🔐 Default accounts:"
echo "   Admin:    admin@shop.local / Admin@123"
echo "   Customer: user@shop.local / User@123"
echo ""
