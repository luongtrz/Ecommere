import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileFormDialog } from './ProfileFormDialog';
import { usersApi } from '../api/users.api';
import { toast } from 'sonner';

const mockRefreshUser = vi.fn();
let mockAuthUser: any = {
  id: 'usr-123',
  name: 'Nguyễn Văn A',
  phone: '0912345678',
  email: 'nguyenvana@example.com',
  role: 'CUSTOMER',
};

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockAuthUser,
    refreshUser: mockRefreshUser,
  })),
}));

vi.mock('../api/users.api', () => ({
  usersApi: {
    updateProfile: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithQueryClient(ui: React.ReactElement, client?: QueryClient) {
  const queryClient =
    client ||
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false },
      },
    });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
    queryClient,
  };
}

describe('ProfileFormDialog', () => {
  const mockOnOpenChange = vi.fn();
  const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
    e.preventDefault();
  };
  const noop = () => {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = {
      id: 'usr-123',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      email: 'nguyenvana@example.com',
      role: 'CUSTOMER',
    };
    mockRefreshUser.mockResolvedValue(undefined);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    process.on('unhandledRejection', noop);
  });

  afterEach(() => {
    cleanup();
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    process.off('unhandledRejection', noop);
  });

  describe('render and visibility', () => {
    it('does not render dialog content when open is false', () => {
      renderWithQueryClient(
        <ProfileFormDialog open={false} onOpenChange={mockOnOpenChange} />,
      );

      expect(
        screen.queryByText('Chỉnh sửa thông tin cá nhân'),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/họ và tên/i)).not.toBeInTheDocument();
    });

    it('renders dialog title, inputs, placeholders, and buttons when open is true', () => {
      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      expect(
        screen.getByRole('heading', { name: 'Chỉnh sửa thông tin cá nhân' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Họ và tên *')).toBeInTheDocument();
      expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0912345678')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cập nhật' }),
      ).toBeInTheDocument();
    });
  });

  describe('formData initialization from user and edge cases', () => {
    it('pre-fills name and phone when user object has both values', () => {
      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const nameInput = screen.getByLabelText(/họ và tên/i);
      const phoneInput = screen.getByLabelText(/số điện thoại/i);

      expect(nameInput).toHaveValue('Nguyễn Văn A');
      expect(phoneInput).toHaveValue('0912345678');
    });

    it('falls back to empty strings when user name and phone are null or undefined', () => {
      mockAuthUser = {
        id: 'usr-456',
        name: null,
        phone: null,
        email: 'empty@example.com',
        role: 'CUSTOMER',
      };

      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const nameInput = screen.getByLabelText(/họ và tên/i);
      const phoneInput = screen.getByLabelText(/số điện thoại/i);

      expect(nameInput).toHaveValue('');
      expect(phoneInput).toHaveValue('');
    });

    it('falls back to empty strings when user fields are empty or undefined', () => {
      mockAuthUser = {
        id: 'usr-789',
        email: 'undef@example.com',
        role: 'CUSTOMER',
      };

      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const nameInput = screen.getByLabelText(/họ và tên/i);
      const phoneInput = screen.getByLabelText(/số điện thoại/i);

      expect(nameInput).toHaveValue('');
      expect(phoneInput).toHaveValue('');
    });

    it('renders without crashing when user is null', () => {
      mockAuthUser = null;

      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const nameInput = screen.getByLabelText(/họ và tên/i);
      const phoneInput = screen.getByLabelText(/số điện thoại/i);

      expect(nameInput).toHaveValue('');
      expect(phoneInput).toHaveValue('');
    });

    it('syncs formData when dialog transitions from open=false to open=true', () => {
      const { rerender, queryClient } = renderWithQueryClient(
        <ProfileFormDialog open={false} onOpenChange={mockOnOpenChange} />,
      );

      expect(
        screen.queryByText('Chỉnh sửa thông tin cá nhân'),
      ).not.toBeInTheDocument();

      rerender(
        <QueryClientProvider client={queryClient}>
          <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />
        </QueryClientProvider>,
      );

      expect(screen.getByLabelText(/họ và tên/i)).toHaveValue('Nguyễn Văn A');
      expect(screen.getByLabelText(/số điện thoại/i)).toHaveValue('0912345678');
    });
  });

  describe('user interactions', () => {
    it('allows typing and updating name and phone input values', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const nameInput = screen.getByLabelText(/họ và tên/i);
      const phoneInput = screen.getByLabelText(/số điện thoại/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Trần Thị Mai');
      expect(nameInput).toHaveValue('Trần Thị Mai');

      await user.clear(phoneInput);
      await user.type(phoneInput, '0977112233');
      expect(phoneInput).toHaveValue('0977112233');
    });

    it('calls onOpenChange(false) when clicking the cancel button', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const cancelButton = screen.getByRole('button', { name: 'Hủy' });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledTimes(1);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('form submission', () => {
    it('submits updated profile data, refreshes user, notifies success, and closes dialog', async () => {
      const updatedUser = {
        ...mockAuthUser,
        name: 'Nguyễn Văn Mới',
        phone: '0988999888',
      };
      vi.mocked(usersApi.updateProfile).mockResolvedValueOnce(updatedUser);

      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const nameInput = screen.getByLabelText(/họ và tên/i);
      const phoneInput = screen.getByLabelText(/số điện thoại/i);

      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Mới' } });
      fireEvent.change(phoneInput, { target: { value: '0988999888' } });

      const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(usersApi.updateProfile).toHaveBeenCalledWith({
          name: 'Nguyễn Văn Mới',
          phone: '0988999888',
        });
      });

      await waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith(
          'Cập nhật thông tin thành công',
        );
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('submits form via fireEvent.submit and prevents default form submission', async () => {
      vi.mocked(usersApi.updateProfile).mockResolvedValueOnce(mockAuthUser);

      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const form = screen
        .getByRole('button', { name: 'Cập nhật' })
        .closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(usersApi.updateProfile).toHaveBeenCalledWith({
          name: 'Nguyễn Văn A',
          phone: '0912345678',
        });
      });

      await waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalledWith(
          'Cập nhật thông tin thành công',
        );
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles update failure, displays error toast, and does not close dialog or refresh user', async () => {
      const updateError = new Error('Lỗi cập nhật');
      vi.mocked(usersApi.updateProfile).mockRejectedValueOnce(updateError);

      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const form = screen
        .getByRole('button', { name: 'Cập nhật' })
        .closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(usersApi.updateProfile).toHaveBeenCalledWith({
          name: 'Nguyễn Văn A',
          phone: '0912345678',
        });
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Cập nhật thông tin thất bại');
      });

      expect(mockRefreshUser).not.toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('disables submit button while update profile mutation is pending', async () => {
      let resolvePromise!: (val: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(usersApi.updateProfile).mockReturnValueOnce(
        pendingPromise as any,
      );

      renderWithQueryClient(
        <ProfileFormDialog open={true} onOpenChange={mockOnOpenChange} />,
      );

      const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
      expect(submitButton).not.toBeDisabled();

      const form = submitButton.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolvePromise(mockAuthUser);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Cập nhật thông tin thành công',
        );
      });
    });
  });
});
