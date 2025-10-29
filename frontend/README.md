# Thai Spray Shop - Frontend

Dự án Frontend cho website bán chai xịt Thái Lan, được xây dựng với React, TypeScript, Vite và TailwindCSS.

## 🚀 Công nghệ sử dụng

- **React 18** - Thư viện UI
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling framework
- **shadcn/ui** - UI component library (Radix UI)
- **React Router v6** - Routing
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management (cho cart)
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Helmet Async** - SEO management

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd frontend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 4. Chạy development server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## 🏗️ Cấu trúc dự án

```
frontend/
├── public/              # Static files
├── src/
│   ├── app/            # App setup (router, providers, layouts, guards)
│   ├── components/
│   │   ├── ui/         # shadcn/ui components
│   │   └── common/     # Shared components
│   ├── features/       # Feature modules
│   │   ├── auth/       # Authentication
│   │   ├── catalog/    # Product catalog
│   │   ├── cart/       # Shopping cart
│   │   ├── checkout/   # Checkout flow
│   │   ├── orders/     # Order management
│   │   └── admin/      # Admin panel
│   ├── lib/            # Utilities & config
│   ├── hooks/          # Custom hooks
│   ├── styles/         # Global styles
│   └── pages/          # Error pages (404, 500)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Tính năng chính

### Khách hàng
- ✅ Trang chủ với sản phẩm mới nhất & bán chạy
- ✅ Catalog với filter & sort
- ✅ Tìm kiếm sản phẩm
- ✅ Chi tiết sản phẩm với biến thể (mùi hương, dung tích)
- ✅ Giỏ hàng
- ✅ Checkout (3 bước: địa chỉ, thanh toán, xác nhận)
- ✅ Quản lý đơn hàng
- ✅ Đăng nhập / Đăng ký
- ✅ Trang tài khoản

### Admin
- ✅ Dashboard với KPI
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý đơn hàng
- ✅ Quản lý mã giảm giá
- ✅ Quản lý kho hàng

## 📝 Scripts

```bash
# Development
npm run dev          # Chạy dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code quality
npm run lint         # Chạy ESLint
```

## 🔧 API Integration

Frontend gọi API thông qua `VITE_API_BASE_URL`. Tất cả API calls được xử lý qua:

- **Axios client** (`src/lib/api.ts`) - với interceptors cho auth token
- **API services** (`src/features/*/api/*.api.ts`) - typed API functions
- **TanStack Query hooks** (`src/features/*/hooks/*.ts`) - data fetching với caching

### Ví dụ API call:

```typescript
// API service
export const productsApi = {
  async getAll(filters: ProductFilters) {
    const { data } = await apiClient.get('/products', { params: filters });
    return productsResponseSchema.parse(data);
  }
};

// React Query hook
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, filters],
    queryFn: () => productsApi.getAll(filters),
  });
}

// Component usage
const { data, isLoading } = useProducts({ sortBy: 'newest' });
```

## 🎨 Styling

- **TailwindCSS** cho utility-first CSS
- **shadcn/ui** cho pre-built components với Radix UI
- **CSS Variables** cho theming (light/dark mode ready)

## 🔐 Authentication

- JWT token stored in localStorage
- Axios interceptor tự động thêm token vào headers
- Protected routes với `RequireAuth` & `RequireAdmin` guards
- Auto redirect khi token expire (401)

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1400px)
- Tất cả trang đều responsive

## 🚦 Routing

```
/                    - Trang chủ
/catalog             - Danh sách sản phẩm
/c/:categorySlug     - Sản phẩm theo danh mục
/p/:productSlug      - Chi tiết sản phẩm
/search?q=...        - Tìm kiếm
/cart                - Giỏ hàng
/checkout            - Thanh toán (protected)
/orders              - Đơn hàng của tôi (protected)
/orders/:id          - Chi tiết đơn hàng (protected)
/account             - Tài khoản (protected)
/login               - Đăng nhập
/register            - Đăng ký
/admin               - Admin dashboard (admin only)
/admin/products      - Quản lý sản phẩm (admin only)
/admin/orders        - Quản lý đơn hàng (admin only)
/admin/coupons       - Quản lý mã giảm giá (admin only)
/admin/inventory     - Quản lý kho (admin only)
```

## 🛠️ Development Tips

### Thêm component mới từ shadcn/ui

```bash
npx shadcn-ui@latest add [component-name]
```

### Type safety

- Tất cả API responses được validate bằng Zod schemas
- Form validation dùng react-hook-form + zod
- TypeScript strict mode enabled

### State Management

- **Server state**: TanStack Query
- **Client state**: Zustand (cart) và React Context
- **Form state**: React Hook Form

## 📄 License

MIT

## 👨‍💻 Author

Thai Spray Shop Team

---

**Note**: Đây là frontend application cần kết nối với backend API. Đảm bảo backend đã chạy và `VITE_API_BASE_URL` được cấu hình đúng.
