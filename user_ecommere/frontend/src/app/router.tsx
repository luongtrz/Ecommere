import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, matchRoutes, type RouteObject } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { AuthLayout } from './layout/AuthLayout';
import { RequireAuth } from './guards/RequireAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load all pages
const HomePage = lazy(() => import('@/features/catalog/pages/HomePage').then(m => ({ default: m.HomePage })));
const CatalogPage = lazy(() => import('@/features/catalog/pages/CatalogPage').then(m => ({ default: m.CatalogPage })));
const CategoryPage = lazy(() => import('@/features/catalog/pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductDetailPage = lazy(() => import('@/features/catalog/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const SearchPage = lazy(() => import('@/features/catalog/pages/SearchPage').then(m => ({ default: m.SearchPage })));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AccountPage = lazy(() => import('@/features/auth/pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AddressesPage = lazy(() => import('@/features/users/pages/AddressesPage').then(m => ({ default: m.AddressesPage })));
const CartPage = lazy(() => import('@/features/cart/pages/CartPage').then(m => ({ default: m.CartPage })));
const WishlistPage = lazy(() => import('@/features/catalog/pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrdersPage = lazy(() => import('@/features/orders/pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/features/orders/pages/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));
const ReferralPage = lazy(() => import('@/features/referrals/pages/ReferralPage').then(m => ({ default: m.ReferralPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ErrorPage = lazy(() => import('@/pages/ErrorPage').then(m => ({ default: m.ErrorPage })));

export const protectedRoutes: RouteObject[] = [
  { path: 'account', element: <AccountPage /> },
  { path: 'addresses', element: <AddressesPage /> },
  { path: 'checkout', element: <CheckoutPage /> },
  { path: 'orders', element: <OrdersPage /> },
  { path: 'orders/:orderId', element: <OrderDetailPage /> },
  { path: 'referral', element: <ReferralPage /> },
];

export function isProtectedRoute(pathname: string): boolean {
  if (!pathname || pathname === '/login') return false;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const cleanPath = path.split('?')[0].split('#')[0];
  return matchRoutes(protectedRoutes, cleanPath) !== null;
}

export function AppRouter() {
  const fallback = <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <BrowserRouter>
      <Suspense fallback={fallback}>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="c/:categorySlug" element={<CategoryPage />} />
          <Route path="p/:productSlug" element={<ProductDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Protected User Routes */}
        <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
          {protectedRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        {/* Error Routes */}
        <Route path="error" element={<ErrorPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
