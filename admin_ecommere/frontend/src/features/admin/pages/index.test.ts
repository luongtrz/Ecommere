import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the page modules without referencing top-level variables in factories
vi.mock('./DashboardPage', () => ({
  DashboardPage: vi.fn(),
}));

vi.mock('./AdminProductsPage', () => ({
  AdminProductsPage: vi.fn(),
}));

vi.mock('./AdminProductFormPage', () => ({
  AdminProductFormPage: vi.fn(),
}));

vi.mock('./AdminOrdersPage', () => ({
  AdminOrdersPage: vi.fn(),
}));

vi.mock('./AdminCouponsPage', () => ({
  AdminCouponsPage: vi.fn(),
}));

vi.mock('./AdminInventoryPage', () => ({
  AdminInventoryPage: vi.fn(),
}));

// Barrel file under test
import * as pages from './index';
import {
  DashboardPage,
  AdminProductsPage,
  AdminProductFormPage,
  AdminOrdersPage,
  AdminCouponsPage,
  AdminInventoryPage,
} from './index';

// Direct module imports to test reference equality
import { DashboardPage as SourceDashboardPage } from './DashboardPage';
import { AdminProductsPage as SourceAdminProductsPage } from './AdminProductsPage';
import { AdminProductFormPage as SourceAdminProductFormPage } from './AdminProductFormPage';
import { AdminOrdersPage as SourceAdminOrdersPage } from './AdminOrdersPage';
import { AdminCouponsPage as SourceAdminCouponsPage } from './AdminCouponsPage';
import { AdminInventoryPage as SourceAdminInventoryPage } from './AdminInventoryPage';

const mockDashboardAction = vi.fn();
const mockProductsAction = vi.fn();
const mockProductFormAction = vi.fn();
const mockOrdersAction = vi.fn();
const mockCouponsAction = vi.fn();
const mockInventoryAction = vi.fn();

interface MockPageProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  onAction?: () => void;
  title?: string;
  testId?: string;
}

function createMockComponent(
  defaultTitle: string,
  testId: string,
  actionSpy: ReturnType<typeof vi.fn>,
  buttonText: string,
) {
  return (props?: MockPageProps) => {
    if (props?.isLoading) {
      return React.createElement(
        'div',
        { 'data-testid': `${testId}-loading` },
        'Đang tải dữ liệu...',
      );
    }
    if (props?.isError) {
      return React.createElement(
        'div',
        { 'data-testid': `${testId}-error` },
        'Có lỗi xảy ra khi tải dữ liệu',
      );
    }
    if (props?.isEmpty) {
      return React.createElement(
        'div',
        { 'data-testid': `${testId}-empty` },
        'Không có dữ liệu',
      );
    }
    return React.createElement(
      'div',
      { 'data-testid': testId },
      React.createElement('h1', null, props?.title || defaultTitle),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            actionSpy();
            props?.onAction?.();
          },
        },
        buttonText,
      ),
    );
  };
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, ui),
    ),
  );
}

describe('features/admin/pages barrel index', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (DashboardPage as any).mockImplementation(
      createMockComponent(
        'Tổng quan vận hành',
        'dashboard-page',
        mockDashboardAction,
        'Làm mới dữ liệu',
      ),
    );
    (AdminProductsPage as any).mockImplementation(
      createMockComponent(
        'Quản lý sản phẩm',
        'admin-products-page',
        mockProductsAction,
        'Thêm sản phẩm',
      ),
    );
    (AdminProductFormPage as any).mockImplementation(
      createMockComponent(
        'Thông tin sản phẩm',
        'admin-product-form-page',
        mockProductFormAction,
        'Lưu sản phẩm',
      ),
    );
    (AdminOrdersPage as any).mockImplementation(
      createMockComponent(
        'Quản lý đơn hàng',
        'admin-orders-page',
        mockOrdersAction,
        'Lọc đơn hàng',
      ),
    );
    (AdminCouponsPage as any).mockImplementation(
      createMockComponent(
        'Quản lý mã giảm giá và Referral',
        'admin-coupons-page',
        mockCouponsAction,
        'Tạo mã mới',
      ),
    );
    (AdminInventoryPage as any).mockImplementation(
      createMockComponent(
        'Quản lý kho hàng',
        'admin-inventory-page',
        mockInventoryAction,
        'Kiểm kho',
      ),
    );
  });

  describe('re-exports verification', () => {
    it('exports all 6 expected page components and no unexpected properties', () => {
      const exportedKeys = Object.keys(pages).sort();
      expect(exportedKeys).toEqual([
        'AdminCouponsPage',
        'AdminInventoryPage',
        'AdminOrdersPage',
        'AdminProductFormPage',
        'AdminProductsPage',
        'DashboardPage',
      ]);
    });

    it('does not have a default export', () => {
      expect((pages as Record<string, unknown>).default).toBeUndefined();
    });

    it('does not export unlisted page components', () => {
      expect(
        (pages as Record<string, unknown>).AdminOrderDetailPage,
      ).toBeUndefined();
      expect(
        (pages as Record<string, unknown>).AdminCategoriesPage,
      ).toBeUndefined();
    });

    it('re-exports DashboardPage matching its module source', () => {
      expect(DashboardPage).toBeDefined();
      expect(typeof DashboardPage).toBe('function');
      expect(DashboardPage).toBe(SourceDashboardPage);
      expect(pages.DashboardPage).toBe(DashboardPage);
    });

    it('re-exports AdminProductsPage matching its module source', () => {
      expect(AdminProductsPage).toBeDefined();
      expect(typeof AdminProductsPage).toBe('function');
      expect(AdminProductsPage).toBe(SourceAdminProductsPage);
      expect(pages.AdminProductsPage).toBe(AdminProductsPage);
    });

    it('re-exports AdminProductFormPage matching its module source', () => {
      expect(AdminProductFormPage).toBeDefined();
      expect(typeof AdminProductFormPage).toBe('function');
      expect(AdminProductFormPage).toBe(SourceAdminProductFormPage);
      expect(pages.AdminProductFormPage).toBe(AdminProductFormPage);
    });

    it('re-exports AdminOrdersPage matching its module source', () => {
      expect(AdminOrdersPage).toBeDefined();
      expect(typeof AdminOrdersPage).toBe('function');
      expect(AdminOrdersPage).toBe(SourceAdminOrdersPage);
      expect(pages.AdminOrdersPage).toBe(AdminOrdersPage);
    });

    it('re-exports AdminCouponsPage matching its module source', () => {
      expect(AdminCouponsPage).toBeDefined();
      expect(typeof AdminCouponsPage).toBe('function');
      expect(AdminCouponsPage).toBe(SourceAdminCouponsPage);
      expect(pages.AdminCouponsPage).toBe(AdminCouponsPage);
    });

    it('re-exports AdminInventoryPage matching its module source', () => {
      expect(AdminInventoryPage).toBeDefined();
      expect(typeof AdminInventoryPage).toBe('function');
      expect(AdminInventoryPage).toBe(SourceAdminInventoryPage);
      expect(pages.AdminInventoryPage).toBe(AdminInventoryPage);
    });
  });

  describe('DashboardPage rendering and interactions', () => {
    it('renders DashboardPage in success state and handles user interaction', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderWithProviders(React.createElement(DashboardPage, { onAction }));

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.getByText('Tổng quan vận hành')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Làm mới dữ liệu' });
      await user.click(button);

      expect(mockDashboardAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(DashboardPage).toHaveBeenCalledWith(
        expect.objectContaining({ onAction }),
        expect.anything(),
      );
    });

    it('renders DashboardPage in loading state', () => {
      renderWithProviders(
        React.createElement(DashboardPage, { isLoading: true }),
      );
      expect(screen.getByTestId('dashboard-page-loading')).toBeInTheDocument();
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });

    it('renders DashboardPage in error state', () => {
      renderWithProviders(
        React.createElement(DashboardPage, { isError: true }),
      );
      expect(screen.getByTestId('dashboard-page-error')).toBeInTheDocument();
      expect(
        screen.getByText('Có lỗi xảy ra khi tải dữ liệu'),
      ).toBeInTheDocument();
    });

    it('renders DashboardPage in empty state', () => {
      renderWithProviders(
        React.createElement(DashboardPage, { isEmpty: true }),
      );
      expect(screen.getByTestId('dashboard-page-empty')).toBeInTheDocument();
      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    });
  });

  describe('AdminProductsPage rendering and interactions', () => {
    it('renders AdminProductsPage in success state and handles user interaction', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderWithProviders(React.createElement(AdminProductsPage, { onAction }));

      expect(screen.getByTestId('admin-products-page')).toBeInTheDocument();
      expect(screen.getByText('Quản lý sản phẩm')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Thêm sản phẩm' });
      await user.click(button);

      expect(mockProductsAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(AdminProductsPage).toHaveBeenCalledWith(
        expect.objectContaining({ onAction }),
        expect.anything(),
      );
    });

    it('renders AdminProductsPage in loading state', () => {
      renderWithProviders(
        React.createElement(AdminProductsPage, { isLoading: true }),
      );
      expect(
        screen.getByTestId('admin-products-page-loading'),
      ).toBeInTheDocument();
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });

    it('renders AdminProductsPage in error state', () => {
      renderWithProviders(
        React.createElement(AdminProductsPage, { isError: true }),
      );
      expect(
        screen.getByTestId('admin-products-page-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Có lỗi xảy ra khi tải dữ liệu'),
      ).toBeInTheDocument();
    });

    it('renders AdminProductsPage in empty state', () => {
      renderWithProviders(
        React.createElement(AdminProductsPage, { isEmpty: true }),
      );
      expect(
        screen.getByTestId('admin-products-page-empty'),
      ).toBeInTheDocument();
      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    });
  });

  describe('AdminProductFormPage rendering and interactions', () => {
    it('renders AdminProductFormPage in success state and handles user interaction', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderWithProviders(
        React.createElement(AdminProductFormPage, { onAction }),
      );

      expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
      expect(screen.getByText('Thông tin sản phẩm')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Lưu sản phẩm' });
      await user.click(button);

      expect(mockProductFormAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(AdminProductFormPage).toHaveBeenCalledWith(
        expect.objectContaining({ onAction }),
        expect.anything(),
      );
    });

    it('renders AdminProductFormPage in loading state', () => {
      renderWithProviders(
        React.createElement(AdminProductFormPage, { isLoading: true }),
      );
      expect(
        screen.getByTestId('admin-product-form-page-loading'),
      ).toBeInTheDocument();
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });

    it('renders AdminProductFormPage in error state', () => {
      renderWithProviders(
        React.createElement(AdminProductFormPage, { isError: true }),
      );
      expect(
        screen.getByTestId('admin-product-form-page-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Có lỗi xảy ra khi tải dữ liệu'),
      ).toBeInTheDocument();
    });

    it('renders AdminProductFormPage in empty state', () => {
      renderWithProviders(
        React.createElement(AdminProductFormPage, { isEmpty: true }),
      );
      expect(
        screen.getByTestId('admin-product-form-page-empty'),
      ).toBeInTheDocument();
      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    });
  });

  describe('AdminOrdersPage rendering and interactions', () => {
    it('renders AdminOrdersPage in success state and handles user interaction', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderWithProviders(React.createElement(AdminOrdersPage, { onAction }));

      expect(screen.getByTestId('admin-orders-page')).toBeInTheDocument();
      expect(screen.getByText('Quản lý đơn hàng')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Lọc đơn hàng' });
      await user.click(button);

      expect(mockOrdersAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(AdminOrdersPage).toHaveBeenCalledWith(
        expect.objectContaining({ onAction }),
        expect.anything(),
      );
    });

    it('renders AdminOrdersPage in loading state', () => {
      renderWithProviders(
        React.createElement(AdminOrdersPage, { isLoading: true }),
      );
      expect(
        screen.getByTestId('admin-orders-page-loading'),
      ).toBeInTheDocument();
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });

    it('renders AdminOrdersPage in error state', () => {
      renderWithProviders(
        React.createElement(AdminOrdersPage, { isError: true }),
      );
      expect(screen.getByTestId('admin-orders-page-error')).toBeInTheDocument();
      expect(
        screen.getByText('Có lỗi xảy ra khi tải dữ liệu'),
      ).toBeInTheDocument();
    });

    it('renders AdminOrdersPage in empty state', () => {
      renderWithProviders(
        React.createElement(AdminOrdersPage, { isEmpty: true }),
      );
      expect(screen.getByTestId('admin-orders-page-empty')).toBeInTheDocument();
      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    });
  });

  describe('AdminCouponsPage rendering and interactions', () => {
    it('renders AdminCouponsPage in success state and handles user interaction', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderWithProviders(React.createElement(AdminCouponsPage, { onAction }));

      expect(screen.getByTestId('admin-coupons-page')).toBeInTheDocument();
      expect(
        screen.getByText('Quản lý mã giảm giá và Referral'),
      ).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Tạo mã mới' });
      await user.click(button);

      expect(mockCouponsAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(AdminCouponsPage).toHaveBeenCalledWith(
        expect.objectContaining({ onAction }),
        expect.anything(),
      );
    });

    it('renders AdminCouponsPage in loading state', () => {
      renderWithProviders(
        React.createElement(AdminCouponsPage, { isLoading: true }),
      );
      expect(
        screen.getByTestId('admin-coupons-page-loading'),
      ).toBeInTheDocument();
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });

    it('renders AdminCouponsPage in error state', () => {
      renderWithProviders(
        React.createElement(AdminCouponsPage, { isError: true }),
      );
      expect(
        screen.getByTestId('admin-coupons-page-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Có lỗi xảy ra khi tải dữ liệu'),
      ).toBeInTheDocument();
    });

    it('renders AdminCouponsPage in empty state', () => {
      renderWithProviders(
        React.createElement(AdminCouponsPage, { isEmpty: true }),
      );
      expect(
        screen.getByTestId('admin-coupons-page-empty'),
      ).toBeInTheDocument();
      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    });
  });

  describe('AdminInventoryPage rendering and interactions', () => {
    it('renders AdminInventoryPage in success state and handles user interaction', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      renderWithProviders(
        React.createElement(AdminInventoryPage, { onAction }),
      );

      expect(screen.getByTestId('admin-inventory-page')).toBeInTheDocument();
      expect(screen.getByText('Quản lý kho hàng')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Kiểm kho' });
      await user.click(button);

      expect(mockInventoryAction).toHaveBeenCalledTimes(1);
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(AdminInventoryPage).toHaveBeenCalledWith(
        expect.objectContaining({ onAction }),
        expect.anything(),
      );
    });

    it('renders AdminInventoryPage in loading state', () => {
      renderWithProviders(
        React.createElement(AdminInventoryPage, { isLoading: true }),
      );
      expect(
        screen.getByTestId('admin-inventory-page-loading'),
      ).toBeInTheDocument();
      expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });

    it('renders AdminInventoryPage in error state', () => {
      renderWithProviders(
        React.createElement(AdminInventoryPage, { isError: true }),
      );
      expect(
        screen.getByTestId('admin-inventory-page-error'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Có lỗi xảy ra khi tải dữ liệu'),
      ).toBeInTheDocument();
    });

    it('renders AdminInventoryPage in empty state', () => {
      renderWithProviders(
        React.createElement(AdminInventoryPage, { isEmpty: true }),
      );
      expect(
        screen.getByTestId('admin-inventory-page-empty'),
      ).toBeInTheDocument();
      expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    });
  });
});
