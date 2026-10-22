import { cloneElement, isValidElement } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './Header';

// Mock API client to prevent network or axios usage
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  authToken: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), decode: vi.fn() },
}));

const mockLogout = vi.fn();

type MockUser = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
} | null;

let mockUser: MockUser = null;

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isLoading: false,
  }),
}));

// Mock child components to isolate Header unit tests
vi.mock('./SearchBox', () => ({
  SearchBox: () => <div data-testid="search-box">SearchBox Mock</div>,
}));

vi.mock('./CartBadge', () => ({
  CartBadge: () => <div data-testid="cart-badge">CartBadge Mock</div>,
}));

vi.mock('./CategoryNav', () => ({
  CategoryNav: () => <div data-testid="category-nav">CategoryNav Mock</div>,
}));

// Mock DropdownMenu primitives so all dropdown contents are reliably accessible in jsdom
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div data-testid="dropdown-menu-content" className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    className,
    asChild,
  }: {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    asChild?: boolean;
  }) => {
    if (asChild && isValidElement(children)) {
      return cloneElement(
        children as ReactElement<{ className?: string; onClick?: () => void }>,
        {
          onClick,
          className: [children.props.className, className]
            .filter(Boolean)
            .join(' '),
        },
      );
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
  DropdownMenuSeparator: () => <hr data-testid="dropdown-menu-separator" />,
}));

function renderHeader() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Header', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUser = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Thai Spray brand link, search box, cart link with badge, and category nav', () => {
    renderHeader();

    const brandLink = screen.getByRole('link', { name: 'Thai Spray' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');

    expect(screen.getByTestId('search-box')).toBeInTheDocument();

    const cartBadge = screen.getByTestId('cart-badge');
    expect(cartBadge).toBeInTheDocument();
    const cartLink = cartBadge.closest('a');
    expect(cartLink).toHaveAttribute('href', '/cart');

    expect(screen.getByTestId('category-nav')).toBeInTheDocument();
  });

  it('renders guest state with login button when user is not authenticated', () => {
    mockUser = null;
    renderHeader();

    const loginLink = screen.getByRole('link', { name: 'Đăng nhập' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');

    expect(screen.queryByTestId('dropdown-menu')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Tài khoản' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Đơn hàng' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Quản trị' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
  });

  it('renders authenticated customer dropdown menu when user is logged in with non-admin role', () => {
    mockUser = {
      id: 'user-1',
      name: 'Nguyễn Văn A',
      email: 'user@example.com',
      role: 'CUSTOMER',
    };
    renderHeader();

    expect(
      screen.queryByRole('link', { name: 'Đăng nhập' }),
    ).not.toBeInTheDocument();

    const accountLink = screen.getByRole('link', { name: 'Tài khoản' });
    expect(accountLink).toBeInTheDocument();
    expect(accountLink).toHaveAttribute('href', '/account');

    const ordersLink = screen.getByRole('link', { name: 'Đơn hàng' });
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute('href', '/orders');

    expect(
      screen.queryByRole('link', { name: 'Quản trị' }),
    ).not.toBeInTheDocument();

    const logoutItem = screen.getByRole('menuitem', { name: 'Đăng xuất' });
    expect(logoutItem).toBeInTheDocument();

    expect(screen.getAllByTestId('dropdown-menu-separator')).toHaveLength(1);
  });

  it('renders admin dropdown menu items including admin link when user role is ADMIN', () => {
    mockUser = {
      id: 'admin-1',
      name: 'Quản trị viên',
      email: 'admin@example.com',
      role: 'ADMIN',
    };
    renderHeader();

    expect(
      screen.queryByRole('link', { name: 'Đăng nhập' }),
    ).not.toBeInTheDocument();

    const accountLink = screen.getByRole('link', { name: 'Tài khoản' });
    expect(accountLink).toBeInTheDocument();
    expect(accountLink).toHaveAttribute('href', '/account');

    const ordersLink = screen.getByRole('link', { name: 'Đơn hàng' });
    expect(ordersLink).toBeInTheDocument();
    expect(ordersLink).toHaveAttribute('href', '/orders');

    const adminLink = screen.getByRole('link', { name: 'Quản trị' });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');

    const logoutItem = screen.getByRole('menuitem', { name: 'Đăng xuất' });
    expect(logoutItem).toBeInTheDocument();

    expect(screen.getAllByTestId('dropdown-menu-separator')).toHaveLength(2);
  });

  it('calls logout when the logout menu item is clicked', () => {
    mockUser = {
      id: 'user-1',
      name: 'Nguyễn Văn A',
      role: 'CUSTOMER',
    };
    renderHeader();

    const logoutItem = screen.getByRole('menuitem', { name: 'Đăng xuất' });
    fireEvent.click(logoutItem);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('does not render admin link when user role is undefined or other string', () => {
    mockUser = {
      id: 'user-2',
      name: 'Khách hàng',
      role: undefined,
    };
    renderHeader();

    expect(screen.getByRole('link', { name: 'Tài khoản' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đơn hàng' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Quản trị' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Đăng xuất' }),
    ).toBeInTheDocument();
  });
});
