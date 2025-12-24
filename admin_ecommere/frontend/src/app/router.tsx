import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { AdminLayout } from './layout/AdminLayout';
import { AuthLayout } from './layout/AuthLayout';

// Guards
import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';

// Auth Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { AccountPage } from '@/features/auth/pages/AccountPage';

// Admin Pages
import { DashboardPage } from '@/features/admin/pages/DashboardPage';
import { AdminProductsPage } from '@/features/admin/pages/AdminProductsPage';
import { AdminProductFormPage } from '@/features/admin/pages/AdminProductFormPage';
import { AdminOrdersPage } from '@/features/admin/pages/AdminOrdersPage';
import { AdminOrderDetailPage } from '@/features/admin/pages/AdminOrderDetailPage';
import { AdminCouponsPage } from '@/features/admin/pages/AdminCouponsPage';
import { AdminInventoryPage } from '@/features/admin/pages/AdminInventoryPage';


// Error Pages
import { ErrorPage } from '@/pages/ErrorPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [{ index: true, element: <RegisterPage /> }],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      </RequireAuth>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:id/edit', element: <AdminProductFormPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
      { path: 'coupons', element: <AdminCouponsPage /> },
      { path: 'inventory', element: <AdminInventoryPage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
