# Thai Spray E-Commerce Platform

Repository chứa 2 applications riêng biệt: Admin Panel và User Shop.

## 📁 Structure

```
ecommere/
├── admin_ecommere/      # Admin Panel (Independent)
│   ├── backend/         # Port 4001
│   ├── frontend/        # Port 5174
│   └── README.md
└── user_ecommere/       # User Shop (Independent)
    ├── backend/         # Port 4000
    ├── frontend/        # Port 5173
    └── README.md (coming soon)
```

## 🚀 Quick Start

### Admin Panel

```bash
cd admin_ecommere/backend
npm install
npm run start:dev

cd admin_ecommere/frontend
npm install
npm run dev
```

Access: http://localhost:5174

### User Shop

```bash
cd user_ecommere/backend
npm install
npm run start:dev

cd user_ecommere/frontend
npm install
npm run dev
```

Access: http://localhost:5173

## 📝 Notes

- Each application is **completely independent**
- No shared package.json
- Shared database only
- See individual README files for details
