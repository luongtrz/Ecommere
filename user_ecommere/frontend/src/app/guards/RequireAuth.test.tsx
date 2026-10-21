import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RequireAuth } from './RequireAuth';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { User } from '@/features/auth/api/auth.api';

// Ensure no network or axios calls can run
vi.mock('axios');
vi.mock('@/lib/api');
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

const mockCustomerUser: User = {
  id: 'customer-1',
  name: 'Khách hàng',
  role: 'CUSTOMER',
  phone: '0909876543',
  email: 'customer@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockAdminUser: User = {
  id: 'admin-1',
  name: 'Quản trị viên',
  role: 'ADMIN',
  phone: '0901234567',
  email: 'admin@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function setAuthState({
  user = null,
  isLoading = false,
}: {
  user?: User | null;
  isLoading?: boolean;
}) {
  mockUseAuth.mockReturnValue({
    user,
    isLoading,
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
}

type RouterLocation = ReturnType<typeof useLocation>;

function LocationTracker() {
  const location = useLocation();
  const from = (location.state as { from?: RouterLocation } | null)?.from;
  return (
    <div>
      <div data-testid="current-path">{location.pathname}</div>
      <div data-testid="from-path">{from?.pathname ?? ''}</div>
      <div data-testid="from-search">{from?.search ?? ''}</div>
      <div data-testid="from-hash">{from?.hash ?? ''}</div>
    </div>
  );
}

function renderWithProviders(
  ui: React.ReactNode,
  {
    initialEntries = ['/checkout'],
    queryClient = createTestQueryClient(),
  }: {
    initialEntries?: string[];
    queryClient?: QueryClient;
  } = {},
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationTracker />
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function ProtectedChild() {
  const [counter, setCounter] = useState(0);
  return (
    <div>
      <h1>Trang thanh toán</h1>
      <button type="button" onClick={() => setCounter((c) => c + 1)}>
        Số lượng: {counter}
      </button>
    </div>
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders loading spinner and hides children when isLoading is true', () => {
    setAuthState({ isLoading: true, user: null });

    const { container } = renderWithProviders(
      <RequireAuth>
        <div>Nội dung được bảo vệ</div>
      </RequireAuth>,
    );

    expect(mockUseAuth).toHaveBeenCalled();
    expect(screen.queryByText('Nội dung được bảo vệ')).not.toBeInTheDocument();
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders loading spinner when isLoading is true even if user data is present', () => {
    setAuthState({ isLoading: true, user: mockCustomerUser });

    const { container } = renderWithProviders(
      <RequireAuth>
        <div>Nội dung được bảo vệ</div>
      </RequireAuth>,
    );

    expect(screen.queryByText('Nội dung được bảo vệ')).not.toBeInTheDocument();
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /login preserving current location in state when user is null', () => {
    setAuthState({ isLoading: false, user: null });

    renderWithProviders(
      <Routes>
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <div>Nội dung thanh toán</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
      </Routes>,
      { initialEntries: ['/checkout?coupon=SUMMER#payment'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.getByTestId('from-path')).toHaveTextContent('/checkout');
    expect(screen.getByTestId('from-search')).toHaveTextContent(
      '?coupon=SUMMER',
    );
    expect(screen.getByTestId('from-hash')).toHaveTextContent('#payment');
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung thanh toán')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated with CUSTOMER role', () => {
    setAuthState({ isLoading: false, user: mockCustomerUser });

    renderWithProviders(
      <Routes>
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <div>Nội dung thanh toán</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
      </Routes>,
      { initialEntries: ['/checkout'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/checkout');
    expect(screen.getByText('Nội dung thanh toán')).toBeInTheDocument();
    expect(screen.queryByText('Trang đăng nhập')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated with ADMIN role', () => {
    setAuthState({ isLoading: false, user: mockAdminUser });

    renderWithProviders(
      <Routes>
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <div>Nội dung thanh toán</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
      </Routes>,
      { initialEntries: ['/checkout'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/checkout');
    expect(screen.getByText('Nội dung thanh toán')).toBeInTheDocument();
    expect(screen.queryByText('Trang đăng nhập')).not.toBeInTheDocument();
  });

  it('handles user interaction within protected children when authenticated', async () => {
    const user = userEvent.setup();
    setAuthState({ isLoading: false, user: mockCustomerUser });

    renderWithProviders(
      <RequireAuth>
        <ProtectedChild />
      </RequireAuth>,
    );

    expect(screen.getByText('Trang thanh toán')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Số lượng: 0' });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(
      screen.getByRole('button', { name: 'Số lượng: 1' }),
    ).toBeInTheDocument();

    await user.click(button);
    expect(
      screen.getByRole('button', { name: 'Số lượng: 2' }),
    ).toBeInTheDocument();
  });

  it('transitions from loading spinner to children when authentication resolves successfully', () => {
    setAuthState({ isLoading: true, user: null });
    const queryClient = createTestQueryClient();

    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/checkout']}>
          <RequireAuth>
            <div>Nội dung thanh toán</div>
          </RequireAuth>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung thanh toán')).not.toBeInTheDocument();

    setAuthState({ isLoading: false, user: mockCustomerUser });

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/checkout']}>
          <RequireAuth>
            <div>Nội dung thanh toán</div>
          </RequireAuth>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByText('Nội dung thanh toán')).toBeInTheDocument();
  });

  it('transitions from loading spinner to login redirect when authentication resolves with null user', () => {
    setAuthState({ isLoading: true, user: null });
    const queryClient = createTestQueryClient();

    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/checkout']}>
          <LocationTracker />
          <Routes>
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <div>Nội dung thanh toán</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Trang đăng nhập</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Trang đăng nhập')).not.toBeInTheDocument();

    setAuthState({ isLoading: false, user: null });

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/checkout']}>
          <LocationTracker />
          <Routes>
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <div>Nội dung thanh toán</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Trang đăng nhập</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.getByTestId('from-path')).toHaveTextContent('/checkout');
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });
});
