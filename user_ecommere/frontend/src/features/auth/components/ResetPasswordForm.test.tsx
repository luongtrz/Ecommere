import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ResetPasswordForm,
  default as DefaultResetPasswordForm,
} from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports ResetPasswordForm as both named and default export', () => {
    expect(ResetPasswordForm).toBeDefined();
    expect(DefaultResetPasswordForm).toBe(ResetPasswordForm);
  });

  it('renders input fields with labels and submit button in default state', () => {
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText('Mật khẩu mới')).toBeInTheDocument();
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: 'Đặt lại mật khẩu' });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeEnabled();
  });

  it('renders loading state when isLoading is true', () => {
    render(<ResetPasswordForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitBtn = screen.getByRole('button', {
      name: 'Đang đặt lại mật khẩu...',
    });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  it('renders enabled submit button when isLoading is false', () => {
    render(<ResetPasswordForm onSubmit={mockOnSubmit} isLoading={false} />);

    const submitBtn = screen.getByRole('button', { name: 'Đặt lại mật khẩu' });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeEnabled();
  });

  it('displays validation error when submitting with empty fields', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    await waitFor(() => {
      expect(
        screen.getByText('Mật khẩu phải có ít nhất 6 ký tự'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when password has less than 8 characters', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Mật khẩu mới'), 'Short1@');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'Short1@');
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    await waitFor(() => {
      expect(
        screen.getByText('Mật khẩu phải có ít nhất 8 ký tự'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when password lacks character complexity', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

    // Missing special character
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'SimplePass123');
    await user.type(
      screen.getByLabelText('Xác nhận mật khẩu mới'),
      'SimplePass123',
    );
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
        ),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when confirm password does not match new password', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Mật khẩu mới'), 'StrongPass1@');
    await user.type(
      screen.getByLabelText('Xác nhận mật khẩu mới'),
      'DifferentPass1@',
    );
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    await waitFor(() => {
      expect(
        screen.getByText('Mật khẩu xác nhận không khớp'),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data when all inputs satisfy validation criteria', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText('Mật khẩu mới'), 'StrongPass1@');
    await user.type(
      screen.getByLabelText('Xác nhận mật khẩu mới'),
      'StrongPass1@',
    );
    await user.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(
      {
        newPassword: 'StrongPass1@',
        confirmPassword: 'StrongPass1@',
      },
      expect.anything(),
    );
  });
});
