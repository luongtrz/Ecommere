import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';

const mockLogin = vi.fn();
let mockIsLoginLoading = false;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoginLoading: mockIsLoginLoading,
  }),
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockIsLoginLoading = false;
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
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
            <LoginPage />
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  };

  it('renders SEO title and brand showcase in left column', () => {
    renderComponent();

    // SEO
    const seoElement = screen.getByTestId('seo-title');
    expect(seoElement).toHaveAttribute(
      'data-title',
      'Đăng nhập tài khoản - Thai Spray Chính Hãng Thái Lan',
    );

    // Left Column Brand Bar
    expect(screen.getAllByText('TS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Thai/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Spray/i).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText('Hàng Thái Lan Chính Hãng').length,
    ).toBeGreaterThanOrEqual(1);

    const backHomeLink = screen.getByRole('link', { name: /Về Trang Chủ/i });
    expect(backHomeLink).toHaveAttribute('href', '/');

    // Left Column Center Showcase
    expect(
      screen.getByText('Tổng Kho Tiện Ích & Vệ Sinh Nhà Cửa Thái Lan'),
    ).toBeInTheDocument();
    expect(screen.getByText('Mua Sắm Tiết Kiệm,')).toBeInTheDocument();
    expect(screen.getByText('An Tâm Chuẩn Hàng Thái')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Đăng nhập để nhận ngay ưu đãi thành viên, tích lũy điểm thưởng khi mua chai xịt đuổi chuột ARS/i,
      ),
    ).toBeInTheDocument();

    // Benefit badges
    expect(screen.getByText('100% Nội Địa Thái')).toBeInTheDocument();
    expect(screen.getByText('Đền 200% nếu hàng giả')).toBeInTheDocument();
    expect(screen.getByText('Giao Hỏa Tốc COD')).toBeInTheDocument();
    expect(screen.getByText('Kiểm tra hàng trước khi trả')).toBeInTheDocument();

    // Bottom trust footer
    expect(
      screen.getByText('Bảo mật thông tin khách hàng tuyệt đối'),
    ).toBeInTheDocument();
    expect(screen.getByText('Hotline: 0901.234.567')).toBeInTheDocument();
  });

  it('renders right column form card headers, inputs, and links', () => {
    renderComponent();

    // Mobile Brand Links
    const mobileHomeLink = screen.getByRole('link', { name: /Trang chủ →/i });
    expect(mobileHomeLink).toHaveAttribute('href', '/');

    // Form Header
    expect(screen.getByText('Đăng Nhập Tài Khoản')).toBeInTheDocument();
    expect(
      screen.getByText('Chào mừng bạn quay lại với Thai Spray Shop'),
    ).toBeInTheDocument();

    // Form Labels and Inputs
    expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('0912345678');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveValue('');

    expect(screen.getByText('Mật khẩu')).toBeInTheDocument();
    const passwordInput = screen.getByPlaceholderText(
      '••••••••',
    ) as HTMLInputElement;
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');
    expect(passwordInput).toHaveValue('');

    // Forgot password link
    const forgotPasswordLink = screen.getByRole('link', {
      name: /Quên mật khẩu\?/i,
    });
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');

    // Submit Button
    const submitButton = screen.getByRole('button', { name: 'Đăng Nhập Ngay' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    // Register Link
    expect(screen.getByText(/Chưa có tài khoản\?/i)).toBeInTheDocument();
    const registerLink = screen.getByRole('link', {
      name: /Đăng ký thành viên mới/i,
    });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('toggles password visibility between password and text types when eye toggle button is clicked', () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText(
      '••••••••',
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    expect(toggleButton).toBeTruthy();

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Click again to hide password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('displays validation error messages when submitting an empty form', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: 'Đăng Nhập Ngay' });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Số điện thoại không hợp lệ'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 6 ký tự'),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('displays validation error when phone number format is invalid', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0912345678');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Đăng Nhập Ngay' });

    fireEvent.change(phoneInput, { target: { value: '12345' } });
    fireEvent.change(passwordInput, { target: { value: 'validPassword123' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Số điện thoại không hợp lệ'),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('displays validation error when password is less than 6 characters', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0912345678');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Đăng Nhập Ngay' });

    fireEvent.change(phoneInput, { target: { value: '0912345678' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 6 ký tự'),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('displays validation error when password exceeds 50 characters', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0912345678');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Đăng Nhập Ngay' });

    fireEvent.change(phoneInput, { target: { value: '0912345678' } });
    fireEvent.change(passwordInput, { target: { value: 'a'.repeat(51) } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Mật khẩu không được quá 50 ký tự'),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login function with credentials when form input values are valid', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0912345678');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Đăng Nhập Ngay' });

    fireEvent.change(phoneInput, { target: { value: '0912345678' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith({
        phone: '0912345678',
        password: 'password123',
      });
    });
  });

  it('allows filling input fields using userEvent', async () => {
    const user = userEvent.setup();
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0912345678');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    await user.type(phoneInput, '0987654321');
    await user.type(passwordInput, 'mypassword123');

    expect(phoneInput).toHaveValue('0987654321');
    expect(passwordInput).toHaveValue('mypassword123');
  });

  it('renders loading spinner and disabled button when isLoginLoading is true', () => {
    mockIsLoginLoading = true;
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: /Đang xử lý đăng nhập\.\.\./i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(screen.queryByText('Đăng Nhập Ngay')).not.toBeInTheDocument();
  });
});
