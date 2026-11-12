import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';
import { STORE_URL } from '@/lib/constants';

const mockLogin = vi.fn();
let mockIsLoginLoading = false;
let mockLoginError: any = null;
let mockUser: any = null;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoginLoading: mockIsLoginLoading,
    loginError: mockLoginError,
    user: mockUser,
  }),
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title}>
      {title}
    </div>
  ),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockIsLoginLoading = false;
    mockLoginError = null;
    mockUser = null;
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  const renderComponent = (initialEntries: any[] = ['/login']) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<div>Bảng điều khiển Admin</div>} />
            <Route
              path="/admin/orders/:id"
              element={<div>Chi tiết đơn hàng</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders SEO title and left column showcase information', () => {
    renderComponent();

    const seoElement = screen.getByTestId('seo-title');
    expect(seoElement).toHaveAttribute(
      'data-title',
      'Đăng nhập Quản trị - Thai Spray Operations Platform',
    );
    expect(seoElement).toHaveTextContent(
      'Đăng nhập Quản trị - Thai Spray Operations Platform',
    );

    // Left Column Header & Content
    expect(screen.getAllByText('TS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Thai Spray/i).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText('Hệ thống Quản trị Trung tâm').length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('Phiên Bản Quản Trị Vận Hành 2026'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Kiểm Soát Toàn Diện Kho Vận & Đơn Hàng Chai Xịt Thái Lan/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Tối ưu hóa quy trình xuất nhập kho các dòng chai xịt đuổi chuột ARS/i,
      ),
    ).toBeInTheDocument();

    // Bottom Security Footer
    const currentYear = new Date().getFullYear().toString();
    expect(
      screen.getByText(
        new RegExp(`${currentYear} Thai Spray Việt Nam • Nền tảng Quản trị`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Bảo mật SSL / TLS')).toBeInTheDocument();
  });

  it('renders right column form layout, headers, inputs, labels, and store link', () => {
    renderComponent();

    // Unified Brand Subtitle (A02-10 & A02-8)
    const brandSubtitles = screen.getAllByText('Hệ thống Quản trị Trung tâm');
    expect(brandSubtitles.length).toBe(2);

    // Form Header badge without technical jargon (A02-6)
    expect(
      screen.getByText('Cổng Đăng Nhập Quản Trị Viên'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Role: ADMIN/i),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Đăng Nhập Quản Trị' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Vui lòng nhập số điện thoại quản trị viên và mật khẩu bảo mật để truy cập bảng điều khiển.',
      ),
    ).toBeInTheDocument();

    // Form Fields and Labels with standard casing (A02-8)
    expect(screen.getByText('Số điện thoại quản trị')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('0901234567');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).toHaveAttribute('autoComplete', 'tel username');
    expect(phoneInput).toHaveValue('');

    expect(screen.getByText('Mật khẩu truy cập')).toBeInTheDocument();
    const forgotBtn = screen.getByRole('button', { name: 'Quên mật khẩu?' });
    expect(forgotBtn).toBeInTheDocument();

    const passwordInput = screen.getByPlaceholderText(
      'Nhập mật khẩu quản trị',
    ) as HTMLInputElement;
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    expect(passwordInput).toHaveValue('');

    // Accessible password toggle button (A02-9)
    const toggleButton = screen.getByRole('button', { name: 'Hiện mật khẩu' });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('w-11', 'h-11');

    // Remember me checkbox (A02-7)
    const rememberCheckbox = screen.getByLabelText(
      'Ghi nhớ phiên đăng nhập này',
    );
    expect(rememberCheckbox).toBeInTheDocument();
    expect(rememberCheckbox).toBeChecked();

    // Submit button
    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    // Calm trust indicators without ping animation (A02-11)
    expect(screen.getByText('Cổng kết nối an toàn')).toBeInTheDocument();
    expect(screen.getByText('Mã hóa 256-bit')).toBeInTheDocument();

    // Customer storefront link with 44px tap target & proper casing (A02-12)
    const storeLink = screen.getByRole('link', {
      name: /Chuyển sang giao diện cửa hàng khách hàng/i,
    });
    expect(storeLink).toBeInTheDocument();
    expect(storeLink).toHaveAttribute('href', STORE_URL);
    expect(storeLink).toHaveAttribute('target', '_blank');
    expect(storeLink).toHaveAttribute('rel', 'noreferrer');
    expect(storeLink).toHaveClass('min-h-[44px]');
  });

  it('toggles password visibility between password and text types when eye toggle button is clicked', () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText(
      'Nhập mật khẩu quản trị',
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: 'Hiện mật khẩu' });
    expect(toggleButton).toBeTruthy();

    // Click to reveal password (showPassword = true)
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    expect(
      screen.getByRole('button', { name: 'Ẩn mật khẩu' }),
    ).toBeInTheDocument();

    // Click again to hide password (showPassword = false)
    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(passwordInput.type).toBe('password');
    expect(
      screen.getByRole('button', { name: 'Hiện mật khẩu' }),
    ).toBeInTheDocument();
  });

  it('displays validation error messages when submitting an empty form', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });
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

    const phoneInput = screen.getByPlaceholderText('0901234567');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu quản trị');
    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });

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

    const phoneInput = screen.getByPlaceholderText('0901234567');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu quản trị');
    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });

    fireEvent.change(phoneInput, { target: { value: '0901234567' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 6 ký tự'),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('displays validation error when password exceeds 50 characters', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0901234567');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu quản trị');
    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });

    fireEvent.change(phoneInput, { target: { value: '0901234567' } });
    fireEvent.change(passwordInput, { target: { value: 'a'.repeat(51) } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Mật khẩu không được quá 50 ký tự'),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login function with credentials when form input values are valid', async () => {
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0901234567');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu quản trị');
    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });

    fireEvent.change(phoneInput, { target: { value: '0901234567' } });
    fireEvent.change(passwordInput, { target: { value: 'adminSecret123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith(
        {
          phone: '0901234567',
          password: 'adminSecret123',
        },
        expect.any(Object),
      );
    });
  });

  it('allows filling input fields using userEvent', async () => {
    const user = userEvent.setup();
    renderComponent();

    const phoneInput = screen.getByPlaceholderText('0901234567');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu quản trị');

    await user.type(phoneInput, '0987654321');
    await user.type(passwordInput, 'adminPass123');

    expect(phoneInput).toHaveValue('0987654321');
    expect(passwordInput).toHaveValue('adminPass123');
  });

  it('renders loading button in disabled state when isLoginLoading is true', () => {
    mockIsLoginLoading = true;
    renderComponent();

    const submitButton = screen.getByRole('button', {
      name: 'Đang xác thực thông tin...',
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(
      screen.queryByText('Truy Cập Bảng Điều Khiển'),
    ).not.toBeInTheDocument();
  });

  it('displays persistent inline error alert when loginError is present (A02-5)', () => {
    mockLoginError = {
      response: {
        data: {
          message: 'Số điện thoại hoặc mật khẩu không chính xác.',
        },
      },
    };
    renderComponent();

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByText('Số điện thoại hoặc mật khẩu không chính xác.'),
    ).toBeInTheDocument();
  });

  it('opens support dialog when "Quên mật khẩu?" is clicked and closes on "Đã hiểu" (A02-3)', async () => {
    renderComponent();

    const forgotBtn = screen.getByRole('button', { name: 'Quên mật khẩu?' });
    fireEvent.click(forgotBtn);

    expect(
      await screen.findByRole('heading', {
        name: 'Khôi phục mật khẩu quản trị',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Hệ thống quản trị Thai Spray không hỗ trợ tự cấp lại mật khẩu trực tuyến/i,
      ),
    ).toBeInTheDocument();

    const understandBtn = screen.getByRole('button', { name: 'Đã hiểu' });
    fireEvent.click(understandBtn);

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Khôi phục mật khẩu quản trị' }),
      ).not.toBeInTheDocument();
    });
  });

  it('handles redirect to destination from location.state.from on login success (A02-1)', async () => {
    let capturedOptions: any;
    mockLogin.mockImplementation((_data, options) => {
      capturedOptions = options;
    });

    renderComponent([
      {
        pathname: '/login',
        state: { from: { pathname: '/admin/orders/123' } },
      },
    ]);

    const phoneInput = screen.getByPlaceholderText('0901234567');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu quản trị');
    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });

    fireEvent.change(phoneInput, { target: { value: '0901234567' } });
    fireEvent.change(passwordInput, { target: { value: 'adminSecret123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    expect(capturedOptions).toBeDefined();
    expect(typeof capturedOptions.onSuccess).toBe('function');

    // Trigger onSuccess and verify navigation to deep link
    capturedOptions.onSuccess();
    await waitFor(() => {
      expect(screen.getByText('Chi tiết đơn hàng')).toBeInTheDocument();
    });
  });

  it('allows toggling remember me checkbox and saves/removes phone in localStorage (A02-7)', async () => {
    renderComponent();

    const rememberCheckbox = screen.getByLabelText(
      'Ghi nhớ phiên đăng nhập này',
    ) as HTMLInputElement;
    expect(rememberCheckbox.checked).toBe(true);

    const phoneInput = screen.getByPlaceholderText('0901234567');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu quản trị');
    const submitButton = screen.getByRole('button', {
      name: /Truy Cập Bảng Điều Khiển/i,
    });

    fireEvent.change(phoneInput, { target: { value: '0901234567' } });
    fireEvent.change(passwordInput, { target: { value: 'adminSecret123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('admin_remembered_phone')).toBe('0901234567');
    });

    // Toggle off and submit again with another phone
    fireEvent.click(rememberCheckbox);
    expect(rememberCheckbox.checked).toBe(false);

    fireEvent.change(phoneInput, { target: { value: '0987654321' } });
    fireEvent.change(passwordInput, { target: { value: 'adminSecret123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('admin_remembered_phone')).toBeNull();
    });
  });
});
