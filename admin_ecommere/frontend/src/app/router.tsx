import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts & guards stay eagerly loaded (needed immediately)
import { AdminLayout } from './layout/AdminLayout';
import { AuthLayout } from './layout/AuthLayout';
import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';

// Lazy load all pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AccountPage = lazy(() => import('@/features/auth/pages/AccountPage').then(m => ({ default: m.AccountPage })));
const DashboardPage = lazy(() => import('@/features/admin/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminProductsPage = lazy(() => import('@/features/admin/pages/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })));
const AdminProductFormPage = lazy(() => import('@/features/admin/pages/AdminProductFormPage').then(m => ({ default: m.AdminProductFormPage })));
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('@/features/admin/pages/AdminOrderDetailPage').then(m => ({ default: m.AdminOrderDetailPage })));
const AdminCouponsPage = lazy(() => import('@/features/admin/pages/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })));
const AdminInventoryPage = lazy(() => import('@/features/admin/pages/AdminInventoryPage').then(m => ({ default: m.AdminInventoryPage })));
const AdminCategoriesPage = lazy(() => import('@/features/admin/pages/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })));
const ErrorPage = lazy(() => import('@/pages/ErrorPage').then(m => ({ default: m.ErrorPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

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
      { path: 'categories', element: <AdminCategoriesPage /> },
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
