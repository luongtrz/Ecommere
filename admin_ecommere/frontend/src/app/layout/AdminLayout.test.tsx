import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { STORE_URL } from '@/lib/constants';

// Prevent any network / API call
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  authToken: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

const mockLogout = vi.fn();
let mockUser: any = {
  id: 'adm-01',
  name: 'Nguyễn Quản Trị',
  email: 'admin@thaispray.com',
  role: 'ADMIN',
};

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isLoading: false,
    login: vi.fn(),
    refreshUser: vi.fn(),
    isLoginLoading: false,
    loginError: null,
  }),
}));

// Mock DropdownMenu primitives so content is deterministically accessible in DOM
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-trigger">{children}</div>
  ),
  DropdownMenuContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="dropdown-menu-content" className={className}>
      {children}
    </div>
  ),
  DropdownMenuLabel: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="dropdown-menu-label" className={className}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-menu-separator" />,
  DropdownMenuItem: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockLogout.mockClear();
  mockUser = {
    id: 'adm-01',
    name: 'Nguyễn Quản Trị',
    email: 'admin@thaispray.com',
    role: 'ADMIN',
  };
});

function renderAdminLayout(initialRoute = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<div>Trang Tổng Quan Dashboard</div>} />
          <Route
            path="/admin/chatbot"
            element={<div>Trang Trợ Lý AI Chatbot</div>}
          />
          <Route
            path="/admin/products"
            element={<div>Trang Quản Lý Sản Phẩm</div>}
          />
          <Route
            path="/admin/products/new"
            element={<div>Trang Thêm Sản Phẩm Mới</div>}
          />
          <Route
            path="/admin/orders"
            element={<div>Trang Quản Lý Đơn Hàng</div>}
          />
          <Route
            path="/admin/coupons"
            element={<div>Trang Quản Lý Mã Giảm Giá</div>}
          />
          <Route
            path="/admin/inventory"
            element={<div>Trang Quản Lý Kho Hàng</div>}
          />
          <Route
            path="/admin/categories"
            element={<div>Trang Quản Lý Danh Mục</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminLayout', () => {
  describe('Layout Structure & Vietnamese Static Text', () => {
    it('renders root layout container, sidebar branding, session card, and header info', () => {
      const { container } = renderAdminLayout('/admin');

      // Root container classes
      const rootDiv = container.firstElementChild;
      expect(rootDiv).toHaveClass(
        'min-h-screen',
        'bg-slate-50',
        'font-sans',
        'text-slate-900',
        'lg:flex',
      );

      // Sidebar brand link
      const brandLink = screen.getByRole('link', {
        name: /Thai Spray Admin/i,
      });
      expect(brandLink).toHaveAttribute('href', '/admin');
      expect(screen.getByText('TS')).toBeInTheDocument();
      expect(screen.getByText('Thai Spray Admin')).toBeInTheDocument();
      expect(
        screen.getByText('Điều phối nội dung, đơn hàng và doanh thu.'),
      ).toBeInTheDocument();

      // Session card in sidebar
      expect(screen.getByText('Phiên quản trị')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Theo dõi chỉ số quan trọng và xử lý công việc trong một luồng gọn.',
        ),
      ).toBeInTheDocument();

      // Header static texts
      expect(screen.getByText('Không gian vận hành')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Bảng điều khiển Thai Spray',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Dữ liệu đồng bộ theo phiên gần nhất'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('Quyền quản trị viên')[0]).toBeInTheDocument();

      // Dropdown menu texts
      expect(screen.getByText('Tài khoản')).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: /Đăng xuất/i }),
      ).toBeInTheDocument();

      // Main element
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1');
      expect(screen.getByText('Trang Tổng Quan Dashboard')).toBeInTheDocument();
    });

    it('renders all 7 navigation items with exact names, descriptions, and hrefs', () => {
      renderAdminLayout('/admin');

      const expectedNavigation = [
        {
          name: 'Dashboard',
          description: 'Tổng quan hiệu suất',
          href: '/admin',
        },
        {
          name: 'Trợ lý AI',
          description: 'Điều hành cửa hàng bằng hội thoại',
          href: '/admin/chatbot',
        },
        {
          name: 'Sản phẩm',
          description: 'Danh mục và nội dung bán hàng',
          href: '/admin/products',
        },
        {
          name: 'Đơn hàng',
          description: 'Theo dõi và xử lý đơn',
          href: '/admin/orders',
        },
        {
          name: 'Mã giảm giá',
          description: 'Chiến dịch và ưu đãi',
          href: '/admin/coupons',
        },
        {
          name: 'Kho hàng',
          description: 'Tồn kho và cảnh báo',
          href: '/admin/inventory',
        },
        {
          name: 'Danh mục',
          description: 'Cấu trúc sản phẩm',
          href: '/admin/categories',
        },
      ];

      for (const item of expectedNavigation) {
        expect(screen.getByText(item.name)).toBeInTheDocument();
        expect(screen.getByText(item.description)).toBeInTheDocument();

        const link = screen.getByRole('link', {
          name: new RegExp(`${item.name}.*${item.description}`, 'i'),
        });
        expect(link).toHaveAttribute('href', item.href);
      }
    });

    it('renders customer store quick link with correct attributes', () => {
      renderAdminLayout('/admin');

      const storeLink = screen.getByRole('link', {
        name: /Xem Cửa Hàng/i,
      });
      expect(storeLink).toHaveAttribute('href', STORE_URL);
      expect(storeLink).toHaveAttribute('target', '_blank');
      expect(storeLink).toHaveAttribute('rel', 'noreferrer');
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  describe('User Display Branches (user?.name || user?.email)', () => {
    it('renders user name in both sidebar and header when name is provided', () => {
      mockUser = {
        name: 'Nguyễn Quản Trị',
        email: 'admin@thaispray.com',
      };
      renderAdminLayout('/admin');

      const nameElements = screen.getAllByText('Nguyễn Quản Trị');
      expect(nameElements.length).toBeGreaterThanOrEqual(2);
    });

    it('falls back to user email in both sidebar and header when name is missing or empty', () => {
      mockUser = {
        name: '',
        email: 'admin-only-email@thaispray.com',
      };
      renderAdminLayout('/admin');

      const emailElements = screen.getAllByText(
        'admin-only-email@thaispray.com',
      );
      expect(emailElements.length).toBeGreaterThanOrEqual(2);
    });

    it('renders gracefully when user is null', () => {
      mockUser = null;
      expect(() => renderAdminLayout('/admin')).not.toThrow();

      expect(screen.getByText('Phiên quản trị')).toBeInTheDocument();
      expect(screen.getAllByText('Quyền quản trị viên')[0]).toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle & Mobile Responsiveness (isSidebarOpen)', () => {
    it('is initially closed with -translate-x-full and no backdrop', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('-translate-x-full');
      expect(aside).not.toHaveClass('translate-x-0');

      const backdrop = container.querySelector('button.fixed.inset-0');
      expect(backdrop).not.toBeInTheDocument();
    });

    it('opens sidebar with translate-x-0 and renders backdrop when header menu button is clicked', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;

      fireEvent.click(openMenuBtn);

      expect(aside).toHaveClass('translate-x-0');
      expect(aside).not.toHaveClass('-translate-x-full');

      const backdrop = container.querySelector('button.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
    });

    it('closes sidebar when clicking on the backdrop button', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;

      // Open sidebar
      fireEvent.click(openMenuBtn);
      const backdrop = container.querySelector('button.fixed.inset-0')!;
      expect(backdrop).toBeInTheDocument();

      // Click backdrop to close
      fireEvent.click(backdrop);
      expect(aside).toHaveClass('-translate-x-full');
      expect(aside).not.toHaveClass('translate-x-0');
      expect(
        container.querySelector('button.fixed.inset-0'),
      ).not.toBeInTheDocument();
    });

    it('closes sidebar when clicking the mobile close button (X) inside aside', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;
      const closeBtn = aside.querySelector('button.lg\\:hidden')!;

      // Open sidebar
      fireEvent.click(openMenuBtn);
      expect(aside).toHaveClass('translate-x-0');

      // Click close button
      fireEvent.click(closeBtn);
      expect(aside).toHaveClass('-translate-x-full');
    });

    it('closes sidebar when clicking any navigation link', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;

      // Open sidebar
      fireEvent.click(openMenuBtn);
      expect(aside).toHaveClass('translate-x-0');

      // Click a nav link
      const productsLink = screen.getByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      });
      fireEvent.click(productsLink);

      expect(aside).toHaveClass('-translate-x-full');
    });
  });

  describe('Active Route Styling (isActive)', () => {
    it('marks Dashboard as active when location is /admin and others as inactive', () => {
      renderAdminLayout('/admin');

      const dashboardLink = screen.getByRole('link', {
        name: /Dashboard.*Tổng quan hiệu suất/i,
      });
      const productsLink = screen.getByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      });

      // Dashboard should have active styles
      expect(dashboardLink).toHaveClass('bg-teal-50');
      expect(dashboardLink).not.toHaveClass('text-slate-600');

      // Products should have inactive styles
      expect(productsLink).toHaveClass('text-slate-600');
      expect(productsLink).not.toHaveClass('bg-teal-50');
    });

    it('marks Products as active and Dashboard as inactive when location is /admin/products', () => {
      renderAdminLayout('/admin/products');

      const dashboardLink = screen.getByRole('link', {
        name: /Dashboard.*Tổng quan hiệu suất/i,
      });
      const productsLink = screen.getByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      });

      // Dashboard should NOT be active on /admin/products (checks exact match for /admin)
      expect(dashboardLink).toHaveClass('text-slate-600');
      expect(dashboardLink).not.toHaveClass('bg-teal-50');

      // Products should be active
      expect(productsLink).toHaveClass('bg-teal-50');
      expect(productsLink).not.toHaveClass('text-slate-600');
    });

    it('marks parent nav as active on nested subroutes via startsWith', () => {
      renderAdminLayout('/admin/products/new');

      const dashboardLink = screen.getByRole('link', {
        name: /Dashboard.*Tổng quan hiệu suất/i,
      });
      const productsLink = screen.getByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      });

      expect(dashboardLink).toHaveClass('text-slate-600');
      expect(productsLink).toHaveClass('bg-teal-50');
      expect(screen.getByText('Trang Thêm Sản Phẩm Mới')).toBeInTheDocument();
    });

    it('marks each respective nav item as active when on its route', () => {
      const routes = [
        { path: '/admin/chatbot', name: /^Trợ lý AI/i },
        { path: '/admin/orders', name: /^Đơn hàng/i },
        { path: '/admin/coupons', name: /^Mã giảm giá/i },
        { path: '/admin/inventory', name: /^Kho hàng/i },
        { path: '/admin/categories', name: /^Danh mục/i },
      ];

      for (const { path, name } of routes) {
        cleanup();
        const { container } = renderAdminLayout(path);
        const nav = container.querySelector('nav')!;

        const activeLink = within(nav).getByRole('link', { name });
        expect(activeLink).toHaveClass('bg-teal-50');

        const dashboardLink = within(nav).getByRole('link', {
          name: /^Dashboard/i,
        });
        expect(dashboardLink).toHaveClass('text-slate-600');
      }
    });
  });

  describe('Route Navigation', () => {
    it('navigates between routes when navigation links are clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderAdminLayout('/admin');
      const nav = container.querySelector('nav')!;

      expect(screen.getByText('Trang Tổng Quan Dashboard')).toBeInTheDocument();

      // Navigate to Chatbot
      await user.click(within(nav).getByRole('link', { name: /^Trợ lý AI/i }));
      expect(screen.getByText('Trang Trợ Lý AI Chatbot')).toBeInTheDocument();

      // Navigate to Products
      await user.click(within(nav).getByRole('link', { name: /^Sản phẩm/i }));
      expect(screen.getByText('Trang Quản Lý Sản Phẩm')).toBeInTheDocument();

      // Navigate to Orders
      await user.click(within(nav).getByRole('link', { name: /^Đơn hàng/i }));
      expect(screen.getByText('Trang Quản Lý Đơn Hàng')).toBeInTheDocument();

      // Navigate to Coupons
      await user.click(
        within(nav).getByRole('link', { name: /^Mã giảm giá/i }),
      );
      expect(screen.getByText('Trang Quản Lý Mã Giảm Giá')).toBeInTheDocument();

      // Navigate to Inventory
      await user.click(within(nav).getByRole('link', { name: /^Kho hàng/i }));
      expect(screen.getByText('Trang Quản Lý Kho Hàng')).toBeInTheDocument();

      // Navigate to Categories
      await user.click(within(nav).getByRole('link', { name: /^Danh mục/i }));
      expect(screen.getByText('Trang Quản Lý Danh Mục')).toBeInTheDocument();

      // Navigate back to Dashboard via Brand link
      await user.click(screen.getByRole('link', { name: /Thai Spray Admin/i }));
      expect(screen.getByText('Trang Tổng Quan Dashboard')).toBeInTheDocument();
    });
  });

  describe('Logout User Action', () => {
    it('calls logout callback when clicking the Đăng xuất menu item', async () => {
      const user = userEvent.setup();
      renderAdminLayout('/admin');

      const logoutItem = screen.getByRole('menuitem', { name: /Đăng xuất/i });
      expect(logoutItem).toBeInTheDocument();

      await user.click(logoutItem);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Suspense Fallback', () => {
    it('renders fallback loading spinner while child route suspends, then shows loaded content', async () => {
      let resolveLazyRoute: (component: {
        default: React.ComponentType;
      }) => void;
      const LazyComponent = React.lazy(
        () =>
          new Promise<{ default: React.ComponentType }>((resolve) => {
            resolveLazyRoute = resolve;
          }),
      );

      const { container } = render(
        <MemoryRouter initialEntries={['/admin/lazy']}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route path="/admin/lazy" element={<LazyComponent />} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      // Fallback spinner should be displayed
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass(
        'h-7',
        'w-7',
        'animate-spin',
        'rounded-full',
        'border-2',
        'border-teal-600',
        'border-t-transparent',
      );

      // Resolve the lazy component
      await act(async () => {
        resolveLazyRoute!({
          default: () => <div>Nội dung tải chậm đã sẵn sàng</div>,
        });
      });

      expect(
        await screen.findByText('Nội dung tải chậm đã sẵn sàng'),
      ).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });
});
