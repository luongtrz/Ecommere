import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { AuthLayout } from './layout/AuthLayout';
import { RequireAuth } from './guards/RequireAuth';

// Auth Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { AccountPage } from '@/features/auth/pages/AccountPage';

// User Pages
import { AddressesPage } from '@/features/users/pages/AddressesPage';

// Catalog Pages
import { HomePage } from '@/features/catalog/pages/HomePage';
import { CatalogPage } from '@/features/catalog/pages/CatalogPage';
import { CategoryPage } from '@/features/catalog/pages/CategoryPage';
import { ProductDetailPage } from '@/features/catalog/pages/ProductDetailPage';
import { SearchPage } from '@/features/catalog/pages/SearchPage';

// Cart & Checkout
import { CartPage } from '@/features/cart/pages/CartPage';
import { CheckoutPage } from '@/features/checkout/pages/CheckoutPage';

// Orders
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { OrderDetailPage } from '@/features/orders/pages/OrderDetailPage';

// Error Pages
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ErrorPage } from '@/pages/ErrorPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="c/:categorySlug" element={<CategoryPage />} />
          <Route path="p/:productSlug" element={<ProductDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="cart" element={<CartPage />} />
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
        </Route>

        {/* Error Routes */}
        <Route path="error" element={<ErrorPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
