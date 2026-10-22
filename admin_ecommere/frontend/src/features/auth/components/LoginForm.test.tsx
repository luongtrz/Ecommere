import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

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

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields, labels, placeholders, and the submit button in default state', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Tài khoản / Số điện thoại')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText(
      'Nhập số điện thoại hoặc email admin',
    );
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'text');

    expect(screen.getByText('Mật khẩu bảo mật')).toBeInTheDocument();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');

    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it('toggles password visibility when clicking the eye button', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    expect(toggleButton).toBeInTheDocument();

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('displays validation errors and prevents submit when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });
    await user.click(submitButton);

    expect(
      await screen.findByText('Số điện thoại không hợp lệ'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 6 ký tự'),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when phone format is invalid', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText(
      'Nhập số điện thoại hoặc email admin',
    );
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });

    await user.type(phoneInput, '12345');
    await user.type(passwordInput, 'adminPassword123');
    await user.click(submitButton);

    expect(
      await screen.findByText('Số điện thoại không hợp lệ'),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when password is less than 6 characters', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText(
      'Nhập số điện thoại hoặc email admin',
    );
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });

    await user.type(phoneInput, '0987654321');
    await user.type(passwordInput, '12345');
    await user.click(submitButton);

    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 6 ký tự'),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when password exceeds 50 characters', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText(
      'Nhập số điện thoại hoặc email admin',
    );
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });

    await user.type(phoneInput, '0987654321');
    await user.type(passwordInput, 'a'.repeat(51));
    await user.click(submitButton);

    expect(
      await screen.findByText('Mật khẩu không được quá 50 ký tự'),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid Vietnamese standard phone starting with 0 and password', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText(
      'Nhập số điện thoại hoặc email admin',
    );
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });

    await user.type(phoneInput, '0987654321');
    await user.type(passwordInput, 'AdminSecurePass!123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          phone: '0987654321',
          password: 'AdminSecurePass!123',
        },
        expect.anything(),
      );
    });
  });

  it('submits valid international phone format starting with +84 and password', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText(
      'Nhập số điện thoại hoặc email admin',
    );
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });

    await user.type(phoneInput, '+84987654321');
    await user.type(passwordInput, 'AdminSecurePass!123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          phone: '+84987654321',
          password: 'AdminSecurePass!123',
        },
        expect.anything(),
      );
    });
  });

  it('displays loading state and disables submit button when isLoading is true', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />);

    const loadingButton = screen.getByRole('button', {
      name: 'Đang xác thực bảo mật...',
    });
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toBeDisabled();
    expect(screen.queryByText('Đăng Nhập Quản Trị')).not.toBeInTheDocument();
  });

  it('enables submit button and shows submit label when isLoading is false', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />);

    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Quản Trị/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
    expect(
      screen.queryByText('Đang xác thực bảo mật...'),
    ).not.toBeInTheDocument();
  });
});
