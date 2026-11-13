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
    asChild,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    asChild?: boolean;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick,
        className: [className, (children.props as any)?.className]
          .filter(Boolean)
          .join(' '),
        role: 'menuitem',
      });
    }
    return (
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className={className}
      >
        {children}
      </button>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  document.body.style.overflow = '';
});

beforeEach(() => {
  mockLogout.mockClear();
  mockUser = {
    id: 'adm-01',
    name: 'Nguyễn Quản Trị',
    email: 'admin@thaispray.com',
    role: 'ADMIN',
  };
  document.body.style.overflow = '';
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
          <Route
            path="/admin/account"
            element={<div>Trang Hồ Sơ Cá Nhân</div>}
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
      const brandLink = screen.getAllByRole('link', {
        name: /Thai Spray Admin/i,
      })[0];
      expect(brandLink).toHaveAttribute('href', '/admin');
      expect(screen.getAllByText('TS')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Thai Spray Admin')[0]).toBeInTheDocument();
      expect(
        screen.getAllByText('Điều phối nội dung, đơn hàng và doanh thu.')[0],
      ).toBeInTheDocument();

      // Session card in sidebar
      expect(screen.getAllByText('Phiên quản trị')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Đang hoạt động')[0]).toBeInTheDocument();
      expect(
        screen.queryByText(
          'Theo dõi chỉ số quan trọng và xử lý công việc trong một luồng gọn.',
        ),
      ).not.toBeInTheDocument();

      // Header dynamic texts & breadcrumbs
      expect(screen.getAllByText('Quản trị')[0]).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Bảng điều khiển',
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Dữ liệu đồng bộ theo phiên gần nhất'),
      ).not.toBeInTheDocument();
      expect(screen.getAllByText('Quyền quản trị viên')[0]).toBeInTheDocument();

      // Dropdown menu texts
      expect(
        screen.getAllByRole('menuitem', { name: /Hồ sơ cá nhân/i })[0],
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('menuitem', { name: /Đăng xuất/i })[0],
      ).toBeInTheDocument();

      // Main element
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1');
      expect(screen.getByText('Trang Tổng Quan Dashboard')).toBeInTheDocument();
    });

    it('renders all 7 navigation items with exact names, descriptions, and hrefs', () => {
      const { container } = renderAdminLayout('/admin');
      const aside = container.querySelector('aside');
      const scope = aside || container;

      const expectedNavigation = [
        {
          name: 'Bảng điều khiển',
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
          name: 'Mã giảm giá & Referral',
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
        expect(within(scope).getAllByText(item.name)[0]).toBeInTheDocument();
        expect(
          within(scope).getAllByText(item.description)[0],
        ).toBeInTheDocument();

        const links = within(scope).getAllByRole('link', {
          name: new RegExp(`${item.name}.*${item.description}`, 'i'),
        });
        expect(links[0]).toHaveAttribute('href', item.href);
      }
    });

    it('renders customer store quick link with correct attributes and closes mobile drawer on click', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;

      // Open drawer
      fireEvent.click(openMenuBtn);
      expect(aside).toHaveClass('translate-x-0');

      const storeLinks = screen.getAllByRole('link', {
        name: /Xem Cửa Hàng/i,
      });
      const storeLink = storeLinks[0];
      expect(storeLink).toHaveAttribute('href', STORE_URL);
      expect(storeLink).toHaveAttribute('target', '_blank');
      expect(storeLink).toHaveAttribute('rel', 'noreferrer');
      expect(screen.queryByText('Live')).not.toBeInTheDocument();

      // Clicking store link should close mobile drawer
      fireEvent.click(storeLink);
      expect(aside).toHaveClass('-translate-x-full');
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

      expect(screen.getAllByText('Phiên quản trị')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Quyền quản trị viên')[0]).toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle, Mobile Responsiveness & Keyboard/Scroll Lock', () => {
    it('is initially closed with -translate-x-full and no backdrop', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('-translate-x-full');
      expect(aside).not.toHaveClass('translate-x-0');

      const backdrop = container.querySelector('button.fixed.inset-0');
      expect(backdrop).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
    });

    it('opens sidebar with translate-x-0, renders backdrop and locks scroll', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;

      fireEvent.click(openMenuBtn);

      expect(aside).toHaveClass('translate-x-0');
      expect(aside).not.toHaveClass('-translate-x-full');

      const backdrop = container.querySelector('button.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('closes sidebar and restores scroll when clicking on the backdrop button', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;

      // Open sidebar
      fireEvent.click(openMenuBtn);
      const backdrop = container.querySelector('button.fixed.inset-0')!;
      expect(backdrop).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');

      // Click backdrop to close
      fireEvent.click(backdrop);
      expect(aside).toHaveClass('-translate-x-full');
      expect(aside).not.toHaveClass('translate-x-0');
      expect(
        container.querySelector('button.fixed.inset-0'),
      ).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
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
      expect(document.body.style.overflow).toBe('');
    });

    it('closes sidebar when pressing Escape key', () => {
      const { container } = renderAdminLayout('/admin');

      const aside = container.querySelector('aside')!;
      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;

      fireEvent.click(openMenuBtn);
      expect(aside).toHaveClass('translate-x-0');
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(aside).toHaveClass('-translate-x-full');
      expect(document.body.style.overflow).toBe('');
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
      const productsLinks = screen.getAllByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      });
      fireEvent.click(productsLinks[0]);

      expect(aside).toHaveClass('-translate-x-full');
      expect(document.body.style.overflow).toBe('');
    });

    it('ensures interactive controls have at least 44px touch targets', () => {
      const { container } = renderAdminLayout('/admin');

      const header = container.querySelector('header')!;
      const openMenuBtn = header.querySelector('button.lg\\:hidden')!;
      expect(openMenuBtn).toHaveClass('h-11', 'w-11');

      const aside = container.querySelector('aside')!;
      const closeBtn = aside.querySelector('button.lg\\:hidden')!;
      expect(closeBtn).toHaveClass('h-11', 'w-11');

      const sidebarLogoutBtn = within(aside).getAllByRole('button', {
        name: 'Đăng xuất',
      })[0];
      expect(sidebarLogoutBtn).toHaveClass('h-11', 'w-11');
    });
  });

  describe('Active Route Styling (isActive)', () => {
    it('marks Bảng điều khiển as active when location is /admin and others as inactive', () => {
      renderAdminLayout('/admin');

      const dashboardLink = screen.getAllByRole('link', {
        name: /Bảng điều khiển.*Tổng quan hiệu suất/i,
      })[0];
      const productsLink = screen.getAllByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      })[0];

      // Dashboard should have active styles
      expect(dashboardLink).toHaveClass('bg-teal-50');
      expect(dashboardLink).not.toHaveClass('text-slate-600');

      // Products should have inactive styles
      expect(productsLink).toHaveClass('text-slate-600');
      expect(productsLink).not.toHaveClass('bg-teal-50');
    });

    it('marks Products as active and Dashboard as inactive when location is /admin/products', () => {
      renderAdminLayout('/admin/products');

      const dashboardLink = screen.getAllByRole('link', {
        name: /Bảng điều khiển.*Tổng quan hiệu suất/i,
      })[0];
      const productsLink = screen.getAllByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      })[0];

      // Dashboard should NOT be active on /admin/products
      expect(dashboardLink).toHaveClass('text-slate-600');
      expect(dashboardLink).not.toHaveClass('bg-teal-50');

      // Products should be active
      expect(productsLink).toHaveClass('bg-teal-50');
      expect(productsLink).not.toHaveClass('text-slate-600');
    });

    it('marks parent nav as active on nested subroutes via startsWith', () => {
      renderAdminLayout('/admin/products/new');

      const dashboardLink = screen.getAllByRole('link', {
        name: /Bảng điều khiển.*Tổng quan hiệu suất/i,
      })[0];
      const productsLink = screen.getAllByRole('link', {
        name: /Sản phẩm.*Danh mục và nội dung bán hàng/i,
      })[0];

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

        const activeLink = within(nav).getAllByRole('link', { name })[0];
        expect(activeLink).toHaveClass('bg-teal-50');

        const dashboardLink = within(nav).getAllByRole('link', {
          name: /^Bảng điều khiển/i,
        })[0];
        expect(dashboardLink).toHaveClass('text-slate-600');
      }
    });
  });

  describe('Dynamic Header Title & Breadcrumbs', () => {
    it('displays dynamic header title and breadcrumbs for each route', () => {
      const routeTitlePairs = [
        {
          path: '/admin',
          expectedTitle: 'Bảng điều khiển',
          expectedBreadcrumb: 'Bảng điều khiển',
        },
        {
          path: '/admin/chatbot',
          expectedTitle: 'Trợ lý AI',
          expectedBreadcrumb: 'Trợ lý AI',
        },
        {
          path: '/admin/products',
          expectedTitle: 'Quản lý sản phẩm',
          expectedBreadcrumb: 'Sản phẩm',
        },
        {
          path: '/admin/products/new',
          expectedTitle: 'Thêm sản phẩm mới',
          expectedBreadcrumb: 'Thêm mới',
        },
        {
          path: '/admin/orders',
          expectedTitle: 'Quản lý đơn hàng',
          expectedBreadcrumb: 'Đơn hàng',
        },
        {
          path: '/admin/coupons',
          expectedTitle: 'Mã giảm giá & Referral',
          expectedBreadcrumb: 'Mã giảm giá & Referral',
        },
        {
          path: '/admin/inventory',
          expectedTitle: 'Quản lý kho hàng',
          expectedBreadcrumb: 'Kho hàng',
        },
        {
          path: '/admin/categories',
          expectedTitle: 'Quản lý danh mục',
          expectedBreadcrumb: 'Danh mục',
        },
        {
          path: '/admin/account',
          expectedTitle: 'Hồ sơ cá nhân',
          expectedBreadcrumb: 'Hồ sơ cá nhân',
        },
      ];

      for (const {
        path,
        expectedTitle,
        expectedBreadcrumb,
      } of routeTitlePairs) {
        cleanup();
        renderAdminLayout(path);

        expect(
          screen.getByRole('heading', { level: 2, name: expectedTitle }),
        ).toBeInTheDocument();
        expect(screen.getByText('Quản trị')).toBeInTheDocument();
        expect(
          screen.getAllByText(expectedBreadcrumb).length,
        ).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Route Navigation & Account Links', () => {
    it('navigates between routes when navigation links are clicked', async () => {
      const user = userEvent.setup();
      const { container } = renderAdminLayout('/admin');
      const nav = container.querySelector('nav')!;

      expect(screen.getByText('Trang Tổng Quan Dashboard')).toBeInTheDocument();

      // Navigate to Chatbot
      await user.click(
        within(nav).getAllByRole('link', { name: /^Trợ lý AI/i })[0],
      );
      expect(screen.getByText('Trang Trợ Lý AI Chatbot')).toBeInTheDocument();

      // Navigate to Products
      await user.click(
        within(nav).getAllByRole('link', { name: /^Sản phẩm/i })[0],
      );
      expect(screen.getByText('Trang Quản Lý Sản Phẩm')).toBeInTheDocument();

      // Navigate to Orders
      await user.click(
        within(nav).getAllByRole('link', { name: /^Đơn hàng/i })[0],
      );
      expect(screen.getByText('Trang Quản Lý Đơn Hàng')).toBeInTheDocument();

      // Navigate to Coupons
      await user.click(
        within(nav).getAllByRole('link', { name: /^Mã giảm giá/i })[0],
      );
      expect(screen.getByText('Trang Quản Lý Mã Giảm Giá')).toBeInTheDocument();

      // Navigate to Inventory
      await user.click(
        within(nav).getAllByRole('link', { name: /^Kho hàng/i })[0],
      );
      expect(screen.getByText('Trang Quản Lý Kho Hàng')).toBeInTheDocument();

      // Navigate to Categories
      await user.click(
        within(nav).getAllByRole('link', { name: /^Danh mục/i })[0],
      );
      expect(screen.getByText('Trang Quản Lý Danh Mục')).toBeInTheDocument();

      // Navigate back to Dashboard via Brand link
      const brandLinks = screen.getAllByRole('link', {
        name: /Thai Spray Admin/i,
      });
      await user.click(brandLinks[0]);
      expect(screen.getByText('Trang Tổng Quan Dashboard')).toBeInTheDocument();
    });

    it('navigates to account page from sidebar user block and dropdown item', async () => {
      const user = userEvent.setup();
      renderAdminLayout('/admin');

      // Click dropdown item
      const accountDropdownItems = screen.getAllByRole('menuitem', {
        name: /Hồ sơ cá nhân/i,
      });
      const accountDropdownItem = accountDropdownItems[0];
      expect(accountDropdownItem).toHaveAttribute('href', '/admin/account');

      await user.click(accountDropdownItem);
      expect(screen.getByText('Trang Hồ Sơ Cá Nhân')).toBeInTheDocument();
    });
  });

  describe('Logout User Action with In-Page Confirmation Dialog', () => {
    it('opens confirmation dialog and calls logout when confirmed from menu item', async () => {
      const user = userEvent.setup();
      renderAdminLayout('/admin');

      const logoutItems = screen.getAllByRole('menuitem', {
        name: /Đăng xuất/i,
      });
      const logoutItem = logoutItems[0];
      expect(logoutItem).toBeInTheDocument();

      await user.click(logoutItem);
      expect(mockLogout).not.toHaveBeenCalled();

      // Confirmation dialog should appear
      expect(
        screen.getByRole('heading', { name: 'Xác nhận đăng xuất' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc quản trị/i,
        ),
      ).toBeInTheDocument();

      // Click confirm
      const confirmButton = screen.getByRole('button', { name: 'Đăng xuất' });
      await user.click(confirmButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('cancels logout when clicking cancel in confirmation dialog', async () => {
      const user = userEvent.setup();
      renderAdminLayout('/admin');

      const logoutItems = screen.getAllByRole('menuitem', {
        name: /Đăng xuất/i,
      });
      const logoutItem = logoutItems[0];
      await user.click(logoutItem);

      expect(
        screen.getByRole('heading', { name: 'Xác nhận đăng xuất' }),
      ).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: 'Hủy' });
      await user.click(cancelButton);

      expect(mockLogout).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('heading', { name: 'Xác nhận đăng xuất' }),
      ).not.toBeInTheDocument();
    });

    it('opens confirmation dialog when clicking sidebar logout button', async () => {
      const user = userEvent.setup();
      const { container } = renderAdminLayout('/admin');
      const aside = container.querySelector('aside');
      const scope = aside || container;

      const sidebarLogoutBtns = within(scope).getAllByRole('button', {
        name: 'Đăng xuất',
      });
      const sidebarLogoutBtn = sidebarLogoutBtns[0];
      await user.click(sidebarLogoutBtn);

      expect(mockLogout).not.toHaveBeenCalled();
      expect(
        screen.getByRole('heading', { name: 'Xác nhận đăng xuất' }),
      ).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: 'Đăng xuất' });
      await user.click(confirmButton);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Suspense Fallback', () => {
    it('renders fallback loading spinner with Vietnamese text while child route suspends, then shows loaded content', async () => {
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

      // Fallback spinner and text should be displayed
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
      expect(screen.getByText('Đang tải trang...')).toBeInTheDocument();

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
      expect(screen.queryByText('Đang tải trang...')).not.toBeInTheDocument();
    });
  });
});
