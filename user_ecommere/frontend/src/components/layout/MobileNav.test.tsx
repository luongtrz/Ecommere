import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MobileNav } from './MobileNav';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAuth } from '@/features/auth/hooks/useAuth';

vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('MobileNav', () => {
  const mockOpenCart = vi.fn();

  function renderMobileNav(initialRoute = '/') {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <MobileNav />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    vi.mocked(useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalPrice: 0,
      totalItems: 0,
      isOpen: false,
      openCart: mockOpenCart,
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      replaceItems: vi.fn(),
    });

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoginLoading: false,
      isRegisterLoading: false,
      isForgotPasswordLoading: false,
      isResetPasswordLoading: false,
      isForgotPasswordSuccess: false,
      isResetPasswordSuccess: false,
      loginError: null,
      registerError: null,
      forgotPasswordError: null,
      resetPasswordError: null,
    });
  });

  it('renders all navigation items with Vietnamese labels', () => {
    renderMobileNav();

    expect(screen.getByRole('link', { name: 'Trang chủ' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /giỏ hàng/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tài khoản' })).toBeInTheDocument();
  });

  it('links "Tài khoản" to /login when user is unauthenticated', () => {
    renderMobileNav();

    const accountLink = screen.getByRole('link', { name: 'Tài khoản' });
    expect(accountLink).toHaveAttribute('href', '/login');
  });

  it('links "Tài khoản" to /account when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'u-1',
        name: 'Nguyen Van A',
        phone: '0987654321',
        role: 'customer',
      } as any,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoginLoading: false,
      isRegisterLoading: false,
      isForgotPasswordLoading: false,
      isResetPasswordLoading: false,
      isForgotPasswordSuccess: false,
      isResetPasswordSuccess: false,
      loginError: null,
      registerError: null,
      forgotPasswordError: null,
      resetPasswordError: null,
    });

    renderMobileNav();

    const accountLink = screen.getByRole('link', { name: 'Tài khoản' });
    expect(accountLink).toHaveAttribute('href', '/account');
  });

  it('applies active styles to the home item when route is /', () => {
    renderMobileNav('/');

    const homeLink = screen.getByRole('link', { name: 'Trang chủ' });
    const catalogLink = screen.getByRole('link', { name: 'Khám phá' });

    expect(homeLink).toHaveClass('text-teal-600');
    expect(homeLink.querySelector('svg')).toHaveClass('scale-110');
    expect(homeLink.querySelector('span')).toHaveClass('font-bold');

    expect(catalogLink).toHaveClass('text-slate-500');
    expect(catalogLink.querySelector('svg')).not.toHaveClass('scale-110');
    expect(catalogLink.querySelector('span')).not.toHaveClass('font-bold');
  });

  it('applies active styles to the catalog item when route is /catalog', () => {
    renderMobileNav('/catalog');

    const homeLink = screen.getByRole('link', { name: 'Trang chủ' });
    const catalogLink = screen.getByRole('link', { name: 'Khám phá' });

    expect(catalogLink).toHaveClass('text-teal-600');
    expect(catalogLink.querySelector('svg')).toHaveClass('scale-110');
    expect(catalogLink.querySelector('span')).toHaveClass('font-bold');

    expect(homeLink).toHaveClass('text-slate-500');
    expect(homeLink.querySelector('svg')).not.toHaveClass('scale-110');
    expect(homeLink.querySelector('span')).not.toHaveClass('font-bold');
  });

  it('applies active styles to the account item when route matches /account for logged in user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'u-1',
        name: 'Nguyen Van A',
        phone: '0987654321',
        role: 'customer',
      } as any,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoginLoading: false,
      isRegisterLoading: false,
      isForgotPasswordLoading: false,
      isResetPasswordLoading: false,
      isForgotPasswordSuccess: false,
      isResetPasswordSuccess: false,
      loginError: null,
      registerError: null,
      forgotPasswordError: null,
      resetPasswordError: null,
    });

    renderMobileNav('/account');

    const accountLink = screen.getByRole('link', { name: 'Tài khoản' });
    expect(accountLink).toHaveClass('text-teal-600');
    expect(accountLink.querySelector('svg')).toHaveClass('scale-110');
    expect(accountLink.querySelector('span')).toHaveClass('font-bold');
  });

  it('applies active styles to the account item when route matches /login for guest user', () => {
    renderMobileNav('/login');

    const accountLink = screen.getByRole('link', { name: 'Tài khoản' });
    expect(accountLink).toHaveClass('text-teal-600');
    expect(accountLink.querySelector('svg')).toHaveClass('scale-110');
    expect(accountLink.querySelector('span')).toHaveClass('font-bold');
  });

  it('calls openCart when clicking the "Giỏ hàng" button', async () => {
    const user = userEvent.setup();
    renderMobileNav();

    const cartButton = screen.getByRole('button', { name: /giỏ hàng/i });
    await user.click(cartButton);

    expect(mockOpenCart).toHaveBeenCalledTimes(1);
  });

  it('does not render cart badge when totalItems is 0', () => {
    vi.mocked(useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalPrice: 0,
      totalItems: 0,
      isOpen: false,
      openCart: mockOpenCart,
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      replaceItems: vi.fn(),
    });

    renderMobileNav();

    const cartButton = screen.getByRole('button', { name: /giỏ hàng/i });
    expect(
      cartButton.querySelector('span.rounded-full'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('does not render cart badge when totalItems is negative or undefined', () => {
    vi.mocked(useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalPrice: 0,
      totalItems: -2,
      isOpen: false,
      openCart: mockOpenCart,
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      replaceItems: vi.fn(),
    });

    renderMobileNav();

    const cartButton = screen.getByRole('button', { name: /giỏ hàng/i });
    expect(
      cartButton.querySelector('span.rounded-full'),
    ).not.toBeInTheDocument();
  });

  it('does not render cart badge when totalItems is undefined', () => {
    vi.mocked(useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalPrice: 0,
      totalItems: undefined as any,
      isOpen: false,
      openCart: mockOpenCart,
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      replaceItems: vi.fn(),
    });

    renderMobileNav();

    const cartButton = screen.getByRole('button', { name: /giỏ hàng/i });
    expect(
      cartButton.querySelector('span.rounded-full'),
    ).not.toBeInTheDocument();
  });

  it('renders exact badge number when totalItems is between 1 and 99', () => {
    vi.mocked(useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalPrice: 0,
      totalItems: 5,
      isOpen: false,
      openCart: mockOpenCart,
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      replaceItems: vi.fn(),
    });

    renderMobileNav();

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('5')).toHaveClass('bg-rose-600');
  });

  it('renders exact badge number when totalItems is 99', () => {
    vi.mocked(useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalPrice: 0,
      totalItems: 99,
      isOpen: false,
      openCart: mockOpenCart,
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      replaceItems: vi.fn(),
    });

    renderMobileNav();

    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('renders "99+" badge when totalItems exceeds 99', () => {
    vi.mocked(useCart).mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      clearCart: vi.fn(),
      totalPrice: 0,
      totalItems: 100,
      isOpen: false,
      openCart: mockOpenCart,
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      replaceItems: vi.fn(),
    });

    renderMobileNav();

    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
