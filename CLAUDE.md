# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thai Spray Shop - an e-commerce platform with two **independent** applications sharing one PostgreSQL database:

| App | Backend (NestJS) | Frontend (Vite+React) |
|-----|------|----------|
| **User Shop** (`user_ecommere/`) | Port 4000 | Port 5173 |
| **Admin Panel** (`admin_ecommere/`) | Port 4001 | Port 5174 |

No shared package.json or monorepo tooling. Each app has its own `node_modules`.

## Common Commands

All commands must be run from within the specific app directory (e.g., `user_ecommere/backend/`).

### Backend (NestJS)
```bash
npm run start:dev          # Dev server with watch
npm run build              # Production build
npm run lint               # ESLint with --fix
npm run test               # Jest unit tests
npm run test:e2e           # E2E tests (jest-e2e.json config)
npm run prisma:migrate     # Run Prisma migrations (dev)
npm run prisma:generate    # Regenerate Prisma client
npm run prisma:studio      # Open Prisma Studio GUI
npm run prisma:seed        # Seed database (ts-node prisma/seed.ts)
```

### Frontend (Vite + React)
```bash
npm run dev                # Vite dev server
npm run build              # tsc && vite build
npm run lint               # ESLint
```

## Architecture

### Backend
- **Framework:** NestJS 10 with global prefix `/api`
- **ORM:** Prisma 5 with PostgreSQL
- **Auth:** JWT access tokens (Bearer header) + refresh tokens (httpOnly cookies). Token refresh with rotation and family tracking. CSRF protection via `X-CSRF-Token` header.
- **Validation:** Global `ValidationPipe` with whitelist + forbidNonWhitelisted
- **Response format:** Wrapped by `TransformInterceptor` (all responses have consistent shape)
- **Error handling:** Global `HttpExceptionFilter`
- **Image uploads:** Cloudinary via multer + `multer-storage-cloudinary`
- **Swagger docs:** Available at `/api/docs` (both backends)
- **Module aliases:** `@` maps to `dist/` (configured via `module-alias`)

User backend modules: auth, users, categories, products, cart, orders, payments, shipping, coupons, reviews, uploads, referrals

Admin backend modules: auth, users, categories, products, inventory (stock movements), coupons, orders, reviews, uploads, admin (dashboard), referrals

### Frontend
- **React 18** with TypeScript, **Vite** (SWC plugin), **TailwindCSS**
- **UI components:** shadcn/ui pattern (Radix primitives in `components/ui/`, CVA for variants)
- **State management:** Zustand for client state, TanStack Query v5 for server state
- **Routing:** React Router v6 with layout-based route nesting
- **Forms:** react-hook-form + zod validation (@hookform/resolvers)
- **API client:** Axios with interceptors for auto token refresh (queue-based to prevent race conditions) in `lib/api.ts`
- **Feature-based structure:** `features/{domain}/` contains pages, components, hooks, and API calls per domain
- **Environment:** `VITE_API_BASE_URL` in `.env`

### Database Schema (Prisma)
Key models: User (roles: ADMIN/CUSTOMER), Product -> ProductVariant (scent, volumeMl, price, stock), Category (self-referential tree), Cart/CartItem, Order/OrderItem (with snapshots), Review, Coupon (PERCENT/FIXED/FREESHIP), StockMovement, Referral/ReferralConfig, RefreshToken.

Prices are stored as integers (VND, no decimals). Product variants hold the actual purchasable SKUs with stock tracking.

### Deployment
- Azure VM at `20.2.66.240`, managed with PM2
- Deploy via `./deploy-to-azure.sh` (rsync)
- Setup via `./setup-azure.sh` on the VM
