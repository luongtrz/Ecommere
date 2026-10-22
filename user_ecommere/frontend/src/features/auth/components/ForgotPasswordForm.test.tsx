import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordFormDefault, {
  ForgotPasswordForm,
} from './ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  it('renders form fields with correct labels, placeholders, and default button state', () => {
    const handleSubmit = vi.fn();
    render(<ForgotPasswordForm onSubmit={handleSubmit} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('email@example.com');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');

    const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
  });

  it('displays validation error when submitting with empty email', async () => {
    const handleSubmit = vi.fn();
    render(<ForgotPasswordForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    const form = submitButton.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('displays validation error when submitting with an invalid email format', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ForgotPasswordForm onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText('email@example.com');
    await user.type(input, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    const form = submitButton.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits successfully and calls onSubmit with email when valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ForgotPasswordForm onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText('email@example.com');
    await user.type(input, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(handleSubmit).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      expect.anything(),
    );
    expect(screen.queryByText('Email không hợp lệ')).not.toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ForgotPasswordForm onSubmit={handleSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: 'Đang gửi...' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Gửi yêu cầu' }),
    ).not.toBeInTheDocument();

    await user.click(submitButton);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('renders normal submit button when isLoading is false', () => {
    const handleSubmit = vi.fn();
    render(<ForgotPasswordForm onSubmit={handleSubmit} isLoading={false} />);

    const submitButton = screen.getByRole('button', { name: 'Gửi yêu cầu' });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Đang gửi...' }),
    ).not.toBeInTheDocument();
  });

  it('exports ForgotPasswordForm as default export', () => {
    expect(ForgotPasswordFormDefault).toBe(ForgotPasswordForm);
  });
});
