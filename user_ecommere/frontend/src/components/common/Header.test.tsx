import React from 'react';
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
  authToken: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

const mockLogout = vi.fn();
const mockOpenCart = vi.fn();
let mockUser: any = null;

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isLoading: false,
  }),
}));

vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    items: [],
    openCart: mockOpenCart,
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

vi.mock('@/features/cart/components/CartDrawer', () => ({
  CartDrawer: () => <div data-testid="cart-drawer">CartDrawer Mock</div>,
}));

// Mock Sheet and DropdownMenu primitives so all sheet and dropdown contents are stably accessible
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet">{children}</div>
  ),
  SheetTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SheetContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="sheet-content" className={className}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SheetClose: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
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

  it('renders top bar text, brand logos, tagline, and subcomponents', () => {
    renderHeader();

    // Top announcement bar
    expect(
      screen.getByText('Hương thơm cho nhà ở, xe hơi và quà tặng mỗi ngày.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Giao nhanh nội thành')).toBeInTheDocument();
    expect(screen.getByText('Đổi trả 7 ngày')).toBeInTheDocument();

    // Brand and taglines
    const brandTitles = screen.getAllByText('Thai Spray');
    expect(brandTitles.length).toBe(2);
    expect(
      screen.getByText('Không gian có gu, hương thơm có dấu ấn.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mùi hương tinh gọn, hiện đại, dễ sống cùng.'),
    ).toBeInTheDocument();

    // Bestseller link
    const bestSellingLink = screen.getByRole('link', { name: 'Bán chạy' });
    expect(bestSellingLink).toHaveAttribute(
      'href',
      '/catalog?sort=best_selling',
    );

    // Child component mocks
    expect(screen.getAllByTestId('search-box')).toHaveLength(2);
    expect(screen.getByTestId('cart-badge')).toBeInTheDocument();
    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('category-nav')).toBeInTheDocument();
  });

  it('renders all mobile navigation links in the sheet', () => {
    renderHeader();

    expect(screen.getByText('Điều hướng nhanh')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      screen.getByRole('link', { name: 'Tất cả sản phẩm' }),
    ).toHaveAttribute('href', '/catalog');
    expect(screen.getByRole('link', { name: 'Bán chạy nhất' })).toHaveAttribute(
      'href',
      '/catalog?sort=best_selling',
    );
    expect(
      screen.getByRole('link', { name: 'Xịt phòng nổi bật' }),
    ).toHaveAttribute('href', '/search?q=x%E1%BB%8Bt%20ph%C3%B2ng');
  });

  it('renders guest state when user is not logged in', () => {
    mockUser = null;
    renderHeader();

    // Desktop nav shows "Đăng nhập" button linking to /login
    const desktopLoginLink = screen.getByRole('link', { name: 'Đăng nhập' });
    expect(desktopLoginLink).toHaveAttribute('href', '/login');

    // Mobile sheet shows "Đăng nhập / Đăng ký" link
    const mobileLoginLink = screen.getByRole('link', {
      name: 'Đăng nhập / Đăng ký',
    });
    expect(mobileLoginLink).toHaveAttribute('href', '/login');

    // Authenticated links should not be present
    expect(screen.queryByText('Thông tin cá nhân')).not.toBeInTheDocument();
    expect(screen.queryByText('Theo dõi đơn hàng')).not.toBeInTheDocument();
    expect(screen.queryByText('Đăng xuất')).not.toBeInTheDocument();
  });

  it('renders authenticated state when user is logged in with a name', () => {
    mockUser = {
      id: 'usr-1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      role: 'CUSTOMER',
      phone: '0901234567',
    };
    renderHeader();

    // Desktop dropdown trigger shows user's name and email
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('nguyenvana@example.com')).toBeInTheDocument();

    // Desktop dropdown menu items
    expect(screen.getByRole('link', { name: 'Tài khoản' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.getByRole('link', { name: 'Đơn hàng' })).toHaveAttribute(
      'href',
      '/orders',
    );

    // Mobile sheet links
    expect(
      screen.getByRole('link', { name: 'Thông tin cá nhân' }),
    ).toHaveAttribute('href', '/account');
    expect(
      screen.getByRole('link', { name: 'Theo dõi đơn hàng' }),
    ).toHaveAttribute('href', '/orders');

    // "Mời bạn bè" is present in both mobile sheet and desktop dropdown
    const referralLinks = screen.getAllByRole('link', { name: 'Mời bạn bè' });
    expect(referralLinks).toHaveLength(2);
    referralLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/referral');
    });

    // "Đăng xuất" is present in both mobile sheet and desktop dropdown
    const logoutElements = screen.getAllByText('Đăng xuất');
    expect(logoutElements).toHaveLength(2);

    // Guest login links should not be present
    expect(
      screen.queryByRole('link', { name: 'Đăng nhập' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Đăng nhập / Đăng ký' }),
    ).not.toBeInTheDocument();
  });

  it('falls back to "Tài khoản" when logged-in user has an empty name', () => {
    mockUser = {
      id: 'usr-2',
      name: '',
      email: 'noname@example.com',
      role: 'CUSTOMER',
      phone: '0909999999',
    };
    renderHeader();

    // In desktop dropdown trigger: {user.name || 'Tài khoản'}
    // In mobile sheet heading: <p>Tài khoản</p>
    const accountTexts = screen.getAllByText('Tài khoản');
    expect(accountTexts.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('noname@example.com')).toBeInTheDocument();
  });

  it('calls openCart when cart button is clicked', () => {
    renderHeader();

    const cartBadge = screen.getByTestId('cart-badge');
    const cartButton = cartBadge.closest('button')!;
    fireEvent.click(cartButton);

    expect(mockOpenCart).toHaveBeenCalledTimes(1);
  });

  it('calls logout when mobile logout button is clicked', () => {
    mockUser = {
      id: 'usr-1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      role: 'CUSTOMER',
      phone: '0901234567',
    };
    renderHeader();

    const mobileLogoutButton = screen.getByRole('button', {
      name: 'Đăng xuất',
    });
    fireEvent.click(mobileLogoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('calls logout when desktop dropdown logout menuitem is clicked', () => {
    mockUser = {
      id: 'usr-1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      role: 'CUSTOMER',
      phone: '0901234567',
    };
    renderHeader();

    const desktopLogoutItem = screen.getByRole('menuitem', {
      name: 'Đăng xuất',
    });
    fireEvent.click(desktopLogoutItem);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
