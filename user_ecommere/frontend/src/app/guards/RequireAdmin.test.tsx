import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RequireAdmin } from './RequireAdmin';
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

const mockAdminUser: User = {
  id: 'admin-1',
  name: 'Quản trị viên',
  role: 'ADMIN',
  phone: '0901234567',
  email: 'admin@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockCustomerUser: User = {
  id: 'customer-1',
  name: 'Khách hàng',
  role: 'CUSTOMER',
  phone: '0909876543',
  email: 'customer@example.com',
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

function LocationTracker() {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
}

function renderWithProviders(
  ui: React.ReactNode,
  {
    initialEntries = ['/admin'],
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

function AdminChild() {
  const [clickCount, setClickCount] = useState(0);
  return (
    <div>
      <h1>Trang quản trị</h1>
      <button type="button" onClick={() => setClickCount((prev) => prev + 1)}>
        Số lần bấm: {clickCount}
      </button>
    </div>
  );
}

describe('RequireAdmin', () => {
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
      <RequireAdmin>
        <div>Nội dung quản trị</div>
      </RequireAdmin>,
    );

    expect(mockUseAuth).toHaveBeenCalled();
    expect(screen.queryByText('Nội dung quản trị')).not.toBeInTheDocument();
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders loading spinner when isLoading is true even if user data is present', () => {
    setAuthState({ isLoading: true, user: mockAdminUser });

    const { container } = renderWithProviders(
      <RequireAdmin>
        <div>Nội dung quản trị</div>
      </RequireAdmin>,
    );

    expect(screen.queryByText('Nội dung quản trị')).not.toBeInTheDocument();
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects unauthenticated user (user is null) to /login', () => {
    setAuthState({ isLoading: false, user: null });

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <div>Nội dung quản trị</div>
            </RequireAdmin>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>,
      { initialEntries: ['/admin'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung quản trị')).not.toBeInTheDocument();
    expect(screen.queryByText('Trang chủ')).not.toBeInTheDocument();
  });

  it('redirects authenticated non-admin user (CUSTOMER role) to /', () => {
    setAuthState({ isLoading: false, user: mockCustomerUser });

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <div>Nội dung quản trị</div>
            </RequireAdmin>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>,
      { initialEntries: ['/admin'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung quản trị')).not.toBeInTheDocument();
    expect(screen.queryByText('Trang đăng nhập')).not.toBeInTheDocument();
  });

  it('redirects authenticated user with an unexpected non-admin role to /', () => {
    const unknownRoleUser = {
      ...mockCustomerUser,
      role: 'STAFF' as unknown as 'CUSTOMER',
    };
    setAuthState({ isLoading: false, user: unknownRoleUser });

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <div>Nội dung quản trị</div>
            </RequireAdmin>
          }
        />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>,
      { initialEntries: ['/admin'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung quản trị')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated with ADMIN role', () => {
    setAuthState({ isLoading: false, user: mockAdminUser });

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <div>Nội dung quản trị</div>
            </RequireAdmin>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
        <Route path="/" element={<div>Trang chủ</div>} />
      </Routes>,
      { initialEntries: ['/admin'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/admin');
    expect(screen.getByText('Nội dung quản trị')).toBeInTheDocument();
    expect(screen.queryByText('Trang đăng nhập')).not.toBeInTheDocument();
    expect(screen.queryByText('Trang chủ')).not.toBeInTheDocument();
  });

  it('handles user interaction within protected children when authenticated as ADMIN', async () => {
    const user = userEvent.setup();
    setAuthState({ isLoading: false, user: mockAdminUser });

    renderWithProviders(
      <RequireAdmin>
        <AdminChild />
      </RequireAdmin>,
    );

    expect(screen.getByText('Trang quản trị')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Số lần bấm: 0' });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(
      screen.getByRole('button', { name: 'Số lần bấm: 1' }),
    ).toBeInTheDocument();

    await user.click(button);
    expect(
      screen.getByRole('button', { name: 'Số lần bấm: 2' }),
    ).toBeInTheDocument();
  });

  it('transitions from loading spinner to children when auth resolves with ADMIN user', () => {
    setAuthState({ isLoading: true, user: null });
    const queryClient = createTestQueryClient();

    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <RequireAdmin>
            <div>Nội dung quản trị</div>
          </RequireAdmin>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung quản trị')).not.toBeInTheDocument();

    setAuthState({ isLoading: false, user: mockAdminUser });

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <RequireAdmin>
            <div>Nội dung quản trị</div>
          </RequireAdmin>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByText('Nội dung quản trị')).toBeInTheDocument();
  });

  it('transitions from loading spinner to login redirect when auth resolves unauthenticated', () => {
    setAuthState({ isLoading: true, user: null });
    const queryClient = createTestQueryClient();

    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <div>Nội dung quản trị</div>
                </RequireAdmin>
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
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <div>Nội dung quản trị</div>
                </RequireAdmin>
              }
            />
            <Route path="/login" element={<div>Trang đăng nhập</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });

  it('transitions from loading spinner to home redirect when auth resolves with non-admin user', () => {
    setAuthState({ isLoading: true, user: null });
    const queryClient = createTestQueryClient();

    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <div>Nội dung quản trị</div>
                </RequireAdmin>
              }
            />
            <Route path="/" element={<div>Trang chủ</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Trang chủ')).not.toBeInTheDocument();

    setAuthState({ isLoading: false, user: mockCustomerUser });

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <div>Nội dung quản trị</div>
                </RequireAdmin>
              }
            />
            <Route path="/" element={<div>Trang chủ</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
  });
});
