import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all form fields with initial default values and enabled submit button', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    // Labels & Placeholders
    expect(screen.getByText('Họ và tên')).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText('Nguyễn Văn A');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('');

    expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
    const phoneInput = screen.getByPlaceholderText('0912 345 678');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveValue('');

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('(không bắt buộc)')).toBeInTheDocument();
    const emailInput = screen.getByPlaceholderText('email@example.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue('');

    expect(screen.getByText('Mật khẩu')).toBeInTheDocument();
    const passwordInput = screen.getByPlaceholderText('Ít nhất 6 ký tự');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveValue('');
    expect(passwordInput).toHaveAttribute('type', 'password');

    expect(screen.getByText('Xác nhận')).toBeInTheDocument();
    const confirmPasswordInput =
      screen.getByPlaceholderText('Nhập lại mật khẩu');
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveValue('');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    expect(screen.getByText('Mã giới thiệu')).toBeInTheDocument();
    expect(screen.getByText('(nếu có)')).toBeInTheDocument();
    const referralInput = screen.getByPlaceholderText('VD: BANBE2026');
    expect(referralInput).toBeInTheDocument();
    expect(referralInput).toHaveValue('');

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  it('initializes referralCode with defaultReferralCode prop when provided', () => {
    render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        defaultReferralCode="DISCOUNT2026"
      />,
    );

    const referralInput = screen.getByPlaceholderText('VD: BANBE2026');
    expect(referralInput).toHaveValue('DISCOUNT2026');
  });

  it('toggles password visibility between password and text types', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    const passwordInput = screen.getByPlaceholderText('Ít nhất 6 ký tự');
    const toggleButton = passwordInput.parentElement!.querySelector('button')!;

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton.querySelector('svg.lucide-eye')).toBeInTheDocument();
    expect(
      toggleButton.querySelector('svg.lucide-eye-off'),
    ).not.toBeInTheDocument();

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(
      toggleButton.querySelector('svg.lucide-eye-off'),
    ).toBeInTheDocument();
    expect(
      toggleButton.querySelector('svg.lucide-eye'),
    ).not.toBeInTheDocument();

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton.querySelector('svg.lucide-eye')).toBeInTheDocument();
    expect(
      toggleButton.querySelector('svg.lucide-eye-off'),
    ).not.toBeInTheDocument();
  });

  it('toggles confirmPassword visibility between password and text types', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    const confirmPasswordInput =
      screen.getByPlaceholderText('Nhập lại mật khẩu');
    const toggleButton =
      confirmPasswordInput.parentElement!.querySelector('button')!;

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(toggleButton.querySelector('svg.lucide-eye')).toBeInTheDocument();
    expect(
      toggleButton.querySelector('svg.lucide-eye-off'),
    ).not.toBeInTheDocument();

    await user.click(toggleButton);
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    expect(
      toggleButton.querySelector('svg.lucide-eye-off'),
    ).toBeInTheDocument();
    expect(
      toggleButton.querySelector('svg.lucide-eye'),
    ).not.toBeInTheDocument();

    await user.click(toggleButton);
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(toggleButton.querySelector('svg.lucide-eye')).toBeInTheDocument();
    expect(
      toggleButton.querySelector('svg.lucide-eye-off'),
    ).not.toBeInTheDocument();
  });

  it('renders loading state and disables submit button when isLoading is true', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', {
      name: 'Đang tạo tài khoản...',
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await user.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation errors when submitting an empty form', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Tên là bắt buộc')).toBeInTheDocument();
      expect(
        screen.getByText('Số điện thoại không hợp lệ'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Mật khẩu phải có ít nhất 6 ký tự'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when phone number format is invalid', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912 345 678'), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'Password123!' },
    });

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(
        screen.getByText('Số điện thoại không hợp lệ'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when email format is invalid', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912 345 678'), {
      target: { value: '0912345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'Password123!' },
    });

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when password is less than 8 characters', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912 345 678'), {
      target: { value: '0912345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'Pass1!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'Pass1!' },
    });

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(
        screen.getByText('Mật khẩu phải có ít nhất 8 ký tự'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when password is missing complex characters', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912 345 678'), {
      target: { value: '0912345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'simplepassword' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'simplepassword' },
    });

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
        ),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when confirmPassword does not match password', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912 345 678'), {
      target: { value: '0912345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'DifferentPass123!' },
    });

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(
        screen.getByText('Mật khẩu xác nhận không khớp'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data with all fields filled including email and referralCode', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912 345 678'), {
      target: { value: '0912345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
      target: { value: 'nguyenvana@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('VD: BANBE2026'), {
      target: { value: 'REF2026' },
    });

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    expect(mockOnSubmit.mock.calls[0][0]).toEqual({
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      email: 'nguyenvana@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      referralCode: 'REF2026',
    });
    expect(mockOnSubmit).toHaveBeenCalledWith(
      {
        name: 'Nguyễn Văn A',
        phone: '0912345678',
        email: 'nguyenvana@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        referralCode: 'REF2026',
      },
      expect.anything(),
    );
  });

  it('submits valid data when optional fields (email and referralCode) are omitted', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Lê Thị B' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912 345 678'), {
      target: { value: '+84987654321' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'StrongPass123@' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'StrongPass123@' },
    });

    const submitButton = screen.getByRole('button', {
      name: /hoàn tất đăng ký/i,
    });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    expect(mockOnSubmit.mock.calls[0][0]).toEqual({
      name: 'Lê Thị B',
      phone: '+84987654321',
      email: '',
      password: 'StrongPass123@',
      confirmPassword: 'StrongPass123@',
      referralCode: '',
    });
    expect(mockOnSubmit).toHaveBeenCalledWith(
      {
        name: 'Lê Thị B',
        phone: '+84987654321',
        email: '',
        password: 'StrongPass123@',
        confirmPassword: 'StrongPass123@',
        referralCode: '',
      },
      expect.anything(),
    );
  });
});
