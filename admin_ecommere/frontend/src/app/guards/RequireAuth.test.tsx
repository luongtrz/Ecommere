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
    logout: vi.fn(),
    refreshUser: vi.fn(),
    isLoginLoading: false,
    loginError: null,
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

function ProtectedChild() {
  const [counter, setCounter] = useState(0);
  return (
    <div>
      <h1>Trang bảo vệ</h1>
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
          path="/admin/products"
          element={
            <RequireAuth>
              <div>Nội dung sản phẩm</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
      </Routes>,
      { initialEntries: ['/admin/products?page=2#top'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.getByTestId('from-path')).toHaveTextContent(
      '/admin/products',
    );
    expect(screen.getByTestId('from-search')).toHaveTextContent('?page=2');
    expect(screen.getByTestId('from-hash')).toHaveTextContent('#top');
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung sản phẩm')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated with CUSTOMER role', () => {
    setAuthState({ isLoading: false, user: mockCustomerUser });

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <div>Nội dung xác thực</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
      </Routes>,
      { initialEntries: ['/admin'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/admin');
    expect(screen.getByText('Nội dung xác thực')).toBeInTheDocument();
    expect(screen.queryByText('Trang đăng nhập')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated with ADMIN role', () => {
    setAuthState({ isLoading: false, user: mockAdminUser });

    renderWithProviders(
      <Routes>
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <div>Nội dung xác thực</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Trang đăng nhập</div>} />
      </Routes>,
      { initialEntries: ['/admin'] },
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/admin');
    expect(screen.getByText('Nội dung xác thực')).toBeInTheDocument();
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

    expect(screen.getByText('Trang bảo vệ')).toBeInTheDocument();
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
        <MemoryRouter initialEntries={['/admin']}>
          <RequireAuth>
            <div>Nội dung xác thực</div>
          </RequireAuth>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung xác thực')).not.toBeInTheDocument();

    setAuthState({ isLoading: false, user: mockCustomerUser });

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <RequireAuth>
            <div>Nội dung xác thực</div>
          </RequireAuth>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(screen.getByText('Nội dung xác thực')).toBeInTheDocument();
  });

  it('transitions from loading spinner to login redirect when authentication resolves with null user', () => {
    setAuthState({ isLoading: true, user: null });
    const queryClient = createTestQueryClient();

    const { rerender, container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <LocationTracker />
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <div>Nội dung xác thực</div>
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
        <MemoryRouter initialEntries={['/admin']}>
          <LocationTracker />
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <div>Nội dung xác thực</div>
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
    expect(screen.getByTestId('from-path')).toHaveTextContent('/admin');
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });

  it('transitions from authenticated to login redirect when user logs out', () => {
    setAuthState({ isLoading: false, user: mockCustomerUser });
    const queryClient = createTestQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <LocationTracker />
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <div>Nội dung xác thực</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Trang đăng nhập</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Nội dung xác thực')).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/admin');

    setAuthState({ isLoading: false, user: null });

    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin']}>
          <LocationTracker />
          <Routes>
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <div>Nội dung xác thực</div>
                </RequireAuth>
              }
            />
            <Route path="/login" element={<div>Trang đăng nhập</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.queryByText('Nội dung xác thực')).not.toBeInTheDocument();
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.getByTestId('from-path')).toHaveTextContent('/admin');
  });

  it('renders complex multiple child elements when authenticated', () => {
    setAuthState({ isLoading: false, user: mockCustomerUser });

    renderWithProviders(
      <RequireAuth>
        <header>Header Xác thực</header>
        <main>Main Content</main>
        <footer>Footer Xác thực</footer>
      </RequireAuth>,
    );

    expect(screen.getByText('Header Xác thực')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Footer Xác thực')).toBeInTheDocument();
  });
});
