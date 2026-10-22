import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegisterPage } from './RegisterPage';

// Mock API modules to ensure axios and real network never run
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

vi.mock('../api/auth.api', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock SEO
vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo" data-title={title} />
  ),
}));

// Mock useAuth data hook
const mockRegister = vi.fn();
let mockIsRegisterLoading = false;
let mockRegisterError: any = null;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    isRegisterLoading: mockIsRegisterLoading,
    registerError: mockRegisterError,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderRegisterPage(initialRoute = '/register') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRegisterLoading = false;
    mockRegisterError = null;
  });

  it('renders branding header, title, voucher banner, trust guarantees, and links', () => {
    renderRegisterPage('/register');

    expect(screen.getByTestId('seo')).toHaveAttribute(
      'data-title',
      'Đăng ký tài khoản - Thai Spray',
    );

    // Branding header
    expect(screen.getAllByText('TS')[0]).toBeInTheDocument();
    expect(screen.getByText('Thai')).toBeInTheDocument();
    expect(screen.getByText('Spray')).toBeInTheDocument();
    expect(screen.getAllByText('Chính Hãng Thái Lan')[0]).toBeInTheDocument();

    const homeLink = screen.getAllByRole('link', {
      name: /TS Thai Spray Chính Hãng Thái Lan/i,
    })[0];
    expect(homeLink).toHaveAttribute('href', '/');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tạo Tài Khoản Khách Hàng',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Đăng ký thành viên để nhận voucher và ưu đãi độc quyền',
      ),
    ).toBeInTheDocument();

    // Gift Voucher Banner
    expect(screen.getAllByText('Tặng Voucher 20.000đ')[0]).toBeInTheDocument();
    expect(
      screen.getAllByText('Áp dụng cho đơn hàng đầu tiên của bạn')[0],
    ).toBeInTheDocument();

    // Divider & Login link
    expect(screen.getByText('Đã có tài khoản?')).toBeInTheDocument();
    const loginLink = screen.getByRole('link', {
      name: /Đăng nhập tài khoản ngay/i,
    });
    expect(loginLink).toHaveAttribute('href', '/login');

    // Trust guarantees
    expect(screen.getAllByText('Bảo mật 100%')[0]).toBeInTheDocument();
    expect(
      screen.getAllByText('Tích điểm không giới hạn')[0],
    ).toBeInTheDocument();
  });

  describe('Referral code handling', () => {
    it('does not display referral banner when ref query param is absent', () => {
      renderRegisterPage('/register');

      expect(
        screen.queryByText('Bạn được giới thiệu bởi bạn bè'),
      ).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('VD: BANBE2026')).toHaveValue('');
    });

    it('does not display referral banner when ref query param is empty', () => {
      renderRegisterPage('/register?ref=');

      expect(
        screen.queryByText('Bạn được giới thiệu bởi bạn bè'),
      ).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('VD: BANBE2026')).toHaveValue('');
    });

    it('displays referral banner and pre-populates referral code when ref is provided', () => {
      renderRegisterPage('/register?ref=FRIEND888');

      expect(
        screen.getAllByText('Bạn được giới thiệu bởi bạn bè')[0],
      ).toBeInTheDocument();
      expect(screen.getAllByText('Mã giới thiệu:')[0]).toBeInTheDocument();
      expect(screen.getAllByText('FRIEND888')[0]).toBeInTheDocument();

      // Form default referral code should match
      expect(screen.getByPlaceholderText('VD: BANBE2026')).toHaveValue(
        'FRIEND888',
      );
    });
  });

  describe('Form submission and loading states', () => {
    it('submits registration form with entered data and referral code', async () => {
      const user = userEvent.setup();
      renderRegisterPage('/register?ref=REFERRAL123');

      await user.type(
        screen.getByPlaceholderText('Nguyễn Văn A'),
        'Nguyễn Văn A',
      );
      await user.type(
        screen.getByPlaceholderText('0912 345 678'),
        '0912345678',
      );
      await user.type(
        screen.getByPlaceholderText('email@example.com'),
        'vana@example.com',
      );
      await user.type(
        screen.getByPlaceholderText('Ít nhất 6 ký tự'),
        'StrongPass123@',
      );
      await user.type(
        screen.getByPlaceholderText('Nhập lại mật khẩu'),
        'StrongPass123@',
      );

      const submitButton = screen.getByRole('button', {
        name: /Hoàn Tất Đăng Ký/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Nguyễn Văn A',
          phone: '0912345678',
          email: 'vana@example.com',
          password: 'StrongPass123@',
          confirmPassword: 'StrongPass123@',
          referralCode: 'REFERRAL123',
        });
      });
    });

    it('submits registration form without optional email and referral code', async () => {
      const user = userEvent.setup();
      renderRegisterPage('/register');

      await user.type(
        screen.getByPlaceholderText('Nguyễn Văn A'),
        'Lê Thị Hoa',
      );
      await user.type(
        screen.getByPlaceholderText('0912 345 678'),
        '0987654321',
      );
      await user.type(
        screen.getByPlaceholderText('Ít nhất 6 ký tự'),
        'SecurePassword456!',
      );
      await user.type(
        screen.getByPlaceholderText('Nhập lại mật khẩu'),
        'SecurePassword456!',
      );

      const submitButton = screen.getByRole('button', {
        name: /Hoàn Tất Đăng Ký/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Lê Thị Hoa',
          phone: '0987654321',
          email: '',
          password: 'SecurePassword456!',
          confirmPassword: 'SecurePassword456!',
          referralCode: '',
        });
      });
    });

    it('displays loading state and disables submit button when isRegisterLoading is true', () => {
      mockIsRegisterLoading = true;
      renderRegisterPage('/register');

      const submitButton = screen.getByRole('button', {
        name: 'Đang tạo tài khoản...',
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.queryByText('Hoàn Tất Đăng Ký')).not.toBeInTheDocument();
    });

    it('enables submit button when isRegisterLoading is false', () => {
      mockIsRegisterLoading = false;
      renderRegisterPage('/register');

      const submitButton = screen.getByRole('button', {
        name: /Hoàn Tất Đăng Ký/i,
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });
});
