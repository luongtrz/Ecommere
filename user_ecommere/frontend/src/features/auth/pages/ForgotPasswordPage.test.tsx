import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ForgotPasswordPage,
  default as DefaultForgotPasswordPage,
} from './ForgotPasswordPage';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  const mockForgotPassword = vi.fn();

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ForgotPasswordPage />
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockForgotPassword.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      forgotPassword: mockForgotPassword,
      isForgotPasswordLoading: false,
      forgotPasswordError: null,
    } as any);
  });

  it('exports ForgotPasswordPage as both named and default export', () => {
    expect(ForgotPasswordPage).toBeDefined();
    expect(DefaultForgotPasswordPage).toBe(ForgotPasswordPage);
  });

  it('renders all static UI elements correctly', () => {
    renderPage();

    expect(screen.getAllByText('TS')[0]).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Quên mật khẩu' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nhập email để nhận liên kết đặt lại mật khẩu'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Gửi yêu cầu' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nhớ lại mật khẩu?')).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: 'Quay lại đăng nhập' });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/login');
  });

  it('submits the form and displays success alert when forgotPassword succeeds', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation(
      (_email: string, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    renderPage();

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('user@example.com', {
        onSuccess: expect.any(Function),
      });
    });

    expect(
      screen.getByText(
        'Nếu email tồn tại, liên kết đặt lại mật khẩu sẽ được gửi',
      ),
    ).toBeInTheDocument();
  });

  it('clears existing success message on a subsequent submit attempt', async () => {
    const user = userEvent.setup();
    let triggerSuccess: (() => void) | undefined;
    mockForgotPassword.mockImplementation(
      (_email: string, options?: { onSuccess?: () => void }) => {
        triggerSuccess = options?.onSuccess;
      },
    );

    renderPage();

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('user@example.com', {
        onSuccess: expect.any(Function),
      });
    });

    act(() => {
      triggerSuccess?.();
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'Nếu email tồn tại, liên kết đặt lại mật khẩu sẽ được gửi',
        ),
      ).toBeInTheDocument();
    });

    // Second submit without triggering onSuccess
    await user.clear(emailInput);
    await user.type(emailInput, 'other@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    await waitFor(() => {
      expect(
        screen.queryByText(
          'Nếu email tồn tại, liên kết đặt lại mật khẩu sẽ được gửi',
        ),
      ).not.toBeInTheDocument();
    });
  });

  it('renders loading state when isForgotPasswordLoading is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      forgotPassword: mockForgotPassword,
      isForgotPasswordLoading: true,
      forgotPasswordError: null,
    } as any);

    renderPage();

    const button = screen.getByRole('button', { name: 'Đang gửi...' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('displays joined error message when forgotPasswordError message is an array', () => {
    vi.mocked(useAuth).mockReturnValue({
      forgotPassword: mockForgotPassword,
      isForgotPasswordLoading: false,
      forgotPasswordError: {
        response: {
          data: {
            message: [
              'Email không đúng định dạng',
              'Email chưa được kích hoạt',
            ],
          },
        },
      },
    } as any);

    renderPage();

    expect(
      screen.getByText('Email không đúng định dạng, Email chưa được kích hoạt'),
    ).toBeInTheDocument();
  });

  it('displays single string error message when forgotPasswordError message is a string', () => {
    vi.mocked(useAuth).mockReturnValue({
      forgotPassword: mockForgotPassword,
      isForgotPasswordLoading: false,
      forgotPasswordError: {
        response: {
          data: {
            message: 'Email không tồn tại trong hệ thống',
          },
        },
      },
    } as any);

    renderPage();

    expect(
      screen.getByText('Email không tồn tại trong hệ thống'),
    ).toBeInTheDocument();
  });

  it('displays default fallback error message when response message is falsy or missing', () => {
    vi.mocked(useAuth).mockReturnValue({
      forgotPassword: mockForgotPassword,
      isForgotPasswordLoading: false,
      forgotPasswordError: {
        response: {
          data: {},
        },
      },
    } as any);

    renderPage();

    expect(
      screen.getByText('Đã có lỗi xảy ra. Vui lòng thử lại sau.'),
    ).toBeInTheDocument();
  });

  it('displays default fallback error message when forgotPasswordError has no response', () => {
    vi.mocked(useAuth).mockReturnValue({
      forgotPassword: mockForgotPassword,
      isForgotPasswordLoading: false,
      forgotPasswordError: new Error('Network failure') as any,
    } as any);

    renderPage();

    expect(
      screen.getByText('Đã có lỗi xảy ra. Vui lòng thử lại sau.'),
    ).toBeInTheDocument();
  });
});
