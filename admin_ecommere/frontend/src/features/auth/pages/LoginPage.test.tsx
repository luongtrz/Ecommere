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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './LoginPage';
import { STORE_URL } from '@/lib/constants';

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
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
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
    expect(screen.getByText('Hệ Thống Quản Trị Trung Tâm')).toBeInTheDocument();
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
        new RegExp(`${currentYear} Thai Spray Việt Nam • Control Platform`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Bảo mật SSL / TLS')).toBeInTheDocument();
  });

  it('renders right column form layout, headers, inputs, labels, and store link', () => {
    renderComponent();

    // Mobile Brand Header
    expect(screen.getByText('Cổng Quản Trị Hệ Thống')).toBeInTheDocument();

    // Form Header
    expect(
      screen.getByText('Xác Thực Quyền Quản Trị (Role: ADMIN)'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Đăng Nhập Quản Trị' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Vui lòng nhập số điện thoại quản trị viên và mật khẩu bảo mật để truy cập bảng điều khiển.',
      ),
    ).toBeInTheDocument();

    // Form Fields and Labels
    expect(screen.getByText('Số điện thoại Quản trị')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('0901234567');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).toHaveValue('');

    expect(screen.getByText('Mật khẩu truy cập')).toBeInTheDocument();
    expect(screen.getByText('Quên mật khẩu?')).toBeInTheDocument();
    const passwordInput = screen.getByPlaceholderText(
      'Nhập mật khẩu quản trị',
    ) as HTMLInputElement;
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');
    expect(passwordInput).toHaveValue('');

    // Remember me checkbox
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

    // Trust indicators
    expect(screen.getByText('Cổng kết nối an toàn')).toBeInTheDocument();
    expect(screen.getByText('Mã hóa 256-bit')).toBeInTheDocument();

    // Customer storefront link
    const storeLink = screen.getByRole('link', {
      name: /Chuyển sang Giao diện Cửa hàng Khách Hàng/i,
    });
    expect(storeLink).toBeInTheDocument();
    expect(storeLink).toHaveAttribute('href', STORE_URL);
    expect(storeLink).toHaveAttribute('target', '_blank');
    expect(storeLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('toggles password visibility between password and text types when eye toggle button is clicked', () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText(
      'Nhập mật khẩu quản trị',
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    expect(toggleButton).toBeTruthy();

    // Click to reveal password (showPassword = true)
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Click again to hide password (showPassword = false)
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
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
      expect(mockLogin).toHaveBeenCalledWith({
        phone: '0901234567',
        password: 'adminSecret123',
      });
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
});
