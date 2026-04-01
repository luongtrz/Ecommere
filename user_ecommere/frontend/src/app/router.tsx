import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
          <Route path="account" element={<AccountPage />} />
          <Route path="addresses" element={<AddressesPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="referral" element={<ReferralPage />} />
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
