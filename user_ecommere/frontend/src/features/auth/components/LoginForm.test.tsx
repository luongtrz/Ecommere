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

  it('renders all fields, labels, placeholders, and buttons', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('0912 345 678');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'tel');

    expect(screen.getByText('Mật khẩu')).toBeInTheDocument();
    const forgotPasswordBtn = screen.getByRole('button', {
      name: 'Quên mật khẩu?',
    });
    expect(forgotPasswordBtn).toBeInTheDocument();
    expect(forgotPasswordBtn).toHaveAttribute('type', 'button');

    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');

    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it('toggles password visibility when the eye button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle visibility button is the button inside the password field container
    const toggleButton = passwordInput.parentElement!.querySelector('button')!;
    expect(toggleButton).toBeInTheDocument();

    // First click: reveals password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Second click: hides password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('displays validation errors and prevents submit when fields are empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
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

  it('displays validation error when phone number format is invalid', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText('0912 345 678');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
    });

    await user.type(phoneInput, '012345');
    await user.type(passwordInput, 'ValidPassword123');
    await user.click(submitButton);

    expect(
      await screen.findByText('Số điện thoại không hợp lệ'),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when password is shorter than 6 characters', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText('0912 345 678');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
    });

    await user.type(phoneInput, '0912345678');
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

    const phoneInput = screen.getByPlaceholderText('0912 345 678');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
    });

    await user.type(phoneInput, '0912345678');
    await user.type(passwordInput, 'a'.repeat(51));
    await user.click(submitButton);

    expect(
      await screen.findByText('Mật khẩu không được quá 50 ký tự'),
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid phone starting with 0 and password', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText('0912 345 678');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
    });

    await user.type(phoneInput, '0912345678');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          phone: '0912345678',
          password: 'Password123',
        },
        expect.anything(),
      );
    });
  });

  it('submits valid international phone format (+84) and password', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const phoneInput = screen.getByPlaceholderText('0912 345 678');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu của bạn');
    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
    });

    await user.type(phoneInput, '+84912345678');
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          phone: '+84912345678',
          password: 'Password123',
        },
        expect.anything(),
      );
    });
  });

  it('displays loading state and disables submit button when isLoading is true', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />);

    const loadingButton = screen.getByRole('button', {
      name: 'Đang xử lý đăng nhập...',
    });
    expect(loadingButton).toBeInTheDocument();
    expect(loadingButton).toBeDisabled();
    expect(screen.queryByText('Đăng Nhập Ngay')).not.toBeInTheDocument();
  });

  it('enables submit button when isLoading is false', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />);

    const submitButton = screen.getByRole('button', {
      name: /Đăng Nhập Ngay/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });

  it('does not trigger onSubmit when clicking "Quên mật khẩu?" button', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} />);

    const forgotPasswordBtn = screen.getByRole('button', {
      name: 'Quên mật khẩu?',
    });
    await user.click(forgotPasswordBtn);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
