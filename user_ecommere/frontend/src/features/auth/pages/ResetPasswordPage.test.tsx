import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DefaultResetPasswordPage, {
  ResetPasswordPage,
} from './ResetPasswordPage';

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
    resetPassword: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
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
const mockResetPassword = vi.fn();
let mockIsResetPasswordLoading = false;
let mockResetPasswordError: any = null;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    resetPassword: mockResetPassword,
    isResetPasswordLoading: mockIsResetPasswordLoading,
    resetPasswordError: mockResetPasswordError,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderResetPasswordPage(initialRoute = '/reset-password') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <ResetPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsResetPasswordLoading = false;
    mockResetPasswordError = null;
  });

  it('exports default component matching named export', () => {
    expect(DefaultResetPasswordPage).toBe(ResetPasswordPage);
  });

  describe('When token is missing or invalid', () => {
    it('renders invalid token message when no token parameter is present', () => {
      renderResetPasswordPage('/reset-password');

      expect(screen.getByTestId('seo')).toHaveAttribute(
        'data-title',
        'Đặt lại mật khẩu',
      );
      expect(
        screen.getByRole('heading', { level: 1, name: 'Đặt lại mật khẩu' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Liên kết đặt lại mật khẩu')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.',
        ),
      ).toBeInTheDocument();

      const requestLink = screen.getByRole('link', {
        name: 'Yêu cầu liên kết mới',
      });
      expect(requestLink).toHaveAttribute('href', '/forgot-password');

      expect(screen.getByText('hoặc')).toBeInTheDocument();

      const backLink = screen.getByRole('link', {
        name: 'Quay lại đăng nhập',
      });
      expect(backLink).toHaveAttribute('href', '/login');

      // The reset form should not be rendered
      expect(
        screen.queryByRole('button', { name: 'Đặt lại mật khẩu' }),
      ).not.toBeInTheDocument();
    });

    it('renders invalid token message when token is an empty string', () => {
      renderResetPasswordPage('/reset-password?token=');

      expect(
        screen.getByText(
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Liên kết đặt lại mật khẩu')).toBeInTheDocument();
    });

    it('renders invalid token message when token is only whitespace', () => {
      renderResetPasswordPage('/reset-password?token=%20%20%20');

      expect(
        screen.getByText(
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Liên kết đặt lại mật khẩu')).toBeInTheDocument();
    });
  });

  describe('When valid token is provided', () => {
    it('renders the form with subtitle and remember password link', () => {
      renderResetPasswordPage('/reset-password?token=valid-token-123');

      expect(
        screen.getByText('Nhập mật khẩu mới cho tài khoản của bạn'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu mã xác thực.',
        ),
      ).not.toBeInTheDocument();

      expect(screen.getByLabelText('Mật khẩu mới')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Xác nhận mật khẩu mới'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Đặt lại mật khẩu' }),
      ).toBeInTheDocument();

      expect(screen.getByText('Nhớ lại mật khẩu?')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Quay lại đăng nhập' }),
      ).toHaveAttribute('href', '/login');
    });

    it('submits form with valid matching passwords and trims whitespace from token', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage('/reset-password?token=%20secret-token-xyz%20');

      const newPasswordInput = screen.getByLabelText('Mật khẩu mới');
      const confirmPasswordInput = screen.getByLabelText(
        'Xác nhận mật khẩu mới',
      );

      await user.type(newPasswordInput, 'ValidPass123@');
      await user.type(confirmPasswordInput, 'ValidPass123@');

      const submitButton = screen.getByRole('button', {
        name: 'Đặt lại mật khẩu',
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: 'secret-token-xyz',
          newPassword: 'ValidPass123@',
        });
      });
    });

    it('displays loading state while reset password mutation is pending', () => {
      mockIsResetPasswordLoading = true;
      renderResetPasswordPage('/reset-password?token=valid-token-123');

      const loadingButton = screen.getByRole('button', {
        name: 'Đang đặt lại mật khẩu...',
      });
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    });

    it('displays error alert when resetPasswordError contains an array message', () => {
      mockResetPasswordError = {
        response: {
          data: {
            message: [
              'Mật khẩu phải có ít nhất 8 ký tự',
              'Chứa ký tự đặc biệt',
            ],
          },
        },
      };

      renderResetPasswordPage('/reset-password?token=valid-token-123');

      expect(
        screen.getByText(
          'Mật khẩu phải có ít nhất 8 ký tự, Chứa ký tự đặc biệt',
        ),
      ).toBeInTheDocument();
    });

    it('displays error alert when resetPasswordError contains a string message', () => {
      mockResetPasswordError = {
        response: {
          data: {
            message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
          },
        },
      };

      renderResetPasswordPage('/reset-password?token=valid-token-123');

      expect(
        screen.getByText('Mã xác thực không hợp lệ hoặc đã hết hạn.'),
      ).toBeInTheDocument();
    });

    it('displays fallback error message when resetPasswordError response data has no message', () => {
      mockResetPasswordError = {
        response: {
          data: {},
        },
      };

      renderResetPasswordPage('/reset-password?token=valid-token-123');

      expect(
        screen.getByText('Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.'),
      ).toBeInTheDocument();
    });

    it('displays fallback error message when resetPasswordError has no response object', () => {
      mockResetPasswordError = new Error('Network error');

      renderResetPasswordPage('/reset-password?token=valid-token-123');

      expect(
        screen.getByText('Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.'),
      ).toBeInTheDocument();
    });

    it('does not render error alert when resetPasswordError is null', () => {
      mockResetPasswordError = null;

      renderResetPasswordPage('/reset-password?token=valid-token-123');

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
