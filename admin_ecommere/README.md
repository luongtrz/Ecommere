# E-Commerce Admin Panel

Backend và Frontend cho Admin Panel của hệ thống Thai Spray E-Commerce.

## 🎯 Mô tả

Repository này chứa toàn bộ code cho admin panel, bao gồm:
- Dashboard & Statistics
- Product Management (CRUD)
- Category Management
- Order Management
- Inventory Management
- Coupon Management
- Review Moderation
- User Management

## 📁 Cấu trúc

```
ecommere-admin/
├── backend/              # NestJS Backend (Port 4001)
│   ├── src/
│   │   ├── admin/       # Admin dashboard & stats
│   │   ├── inventory/   # Inventory management
│   │   ├── products/
│   │   ├── orders/
│   │   ├── coupons/
│   │   └── ...
│   └── prisma/
└── frontend/            # React + Vite Frontend (Port 5174)
    └── src/
        ├── features/admin/
        ├── features/auth/
        └── ...
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

**Backend** (`.env`):
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
PORT=4001
CORS_ORIGIN="http://localhost:5174"
```

**Frontend** (`.env`):
```bash
VITE_API_BASE_URL=http://localhost:4001
```

### Run Development

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Access admin panel: http://localhost:5174

## 📦 Scripts

**Backend:**
- `npm run start:dev` - Start development server  
- `npm run build` - Build production
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio

**Frontend:**
- `npm run dev` - Start dev server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build

## 🔐 Default Login

```
Email: admin@shop.local
Password: Admin@123
```

## 🗄️ Database

Database được share với user repository. Chi tiết xem [Database Notes](#database-notes).

## 📝 License

MIT
