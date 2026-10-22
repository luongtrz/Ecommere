import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileFormDialog } from './ProfileFormDialog';
import { usersApi } from '../api/users.api';
import { toast } from 'sonner';

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = MockResizeObserver as any;
}
if (
  typeof window !== 'undefined' &&
  typeof window.ResizeObserver === 'undefined'
) {
  window.ResizeObserver = MockResizeObserver as any;
}

const mockRefreshUser = vi.fn();
let mockUser: any = {
  id: 'user-001',
  name: 'Nguyễn Văn Quản Trị',
  phone: '0912345678',
  role: 'ADMIN',
};

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshUser: mockRefreshUser,
  }),
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
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ProfileFormDialog', () => {
  beforeEach(() => {
    if (typeof globalThis.ResizeObserver === 'undefined') {
      globalThis.ResizeObserver = MockResizeObserver as any;
    }
    if (
      typeof window !== 'undefined' &&
      typeof window.ResizeObserver === 'undefined'
    ) {
      window.ResizeObserver = MockResizeObserver as any;
    }
    cleanup();
    vi.clearAllMocks();
    mockUser = {
      id: 'user-001',
      name: 'Nguyễn Văn Quản Trị',
      phone: '0912345678',
      role: 'ADMIN',
    };
    mockRefreshUser.mockResolvedValue(mockUser);
    vi.mocked(usersApi.updateProfile).mockResolvedValue({
      id: 'user-001',
      name: 'Nguyễn Văn Quản Trị',
      phone: '0912345678',
      role: 'ADMIN',
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ProfileFormDialog {...props} />
      </QueryClientProvider>,
    );
  };

  it('does not render dialog content when open is false', () => {
    renderComponent({
      open: false,
      onOpenChange: vi.fn(),
    });

    expect(
      screen.queryByText('Chỉnh sửa thông tin cá nhân'),
    ).not.toBeInTheDocument();
  });

  it('renders dialog with user data synced into form inputs when open is true', () => {
    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Chỉnh sửa thông tin cá nhân',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên *')).toHaveValue(
      'Nguyễn Văn Quản Trị',
    );
    expect(screen.getByLabelText('Số điện thoại')).toHaveValue('0912345678');
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cập nhật' }),
    ).toBeInTheDocument();
  });

  it('handles fallback to empty string when user name and phone are null or undefined', () => {
    mockUser = {
      id: 'user-empty',
      name: null,
      phone: undefined,
      role: 'ADMIN',
    };

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(screen.getByLabelText('Họ và tên *')).toHaveValue('');
    expect(screen.getByLabelText('Số điện thoại')).toHaveValue('');
  });

  it('does not crash or sync when user is null', () => {
    mockUser = null;

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(screen.getByLabelText('Họ và tên *')).toHaveValue('');
    expect(screen.getByLabelText('Số điện thoại')).toHaveValue('');
  });

  it('calls onOpenChange(false) when cancel button "Hủy" is clicked', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    renderComponent({
      open: true,
      onOpenChange: handleOpenChange,
    });

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    await user.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledTimes(1);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(usersApi.updateProfile).not.toHaveBeenCalled();
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it('updates input values and submits form successfully', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    vi.mocked(usersApi.updateProfile).mockResolvedValueOnce({
      id: 'user-001',
      name: 'Nguyễn Văn B',
      phone: '0988776655',
      role: 'ADMIN',
    });

    renderComponent({
      open: true,
      onOpenChange: handleOpenChange,
    });

    const nameInput = screen.getByLabelText('Họ và tên *');
    const phoneInput = screen.getByLabelText('Số điện thoại');

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn B' } });
    fireEvent.change(phoneInput, { target: { value: '0988776655' } });

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(usersApi.updateProfile).toHaveBeenCalledWith({
        name: 'Nguyễn Văn B',
        phone: '0988776655',
      });
    });

    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        'Cập nhật thông tin thành công',
      );
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('displays error toast when updateProfile API fails', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
    };
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    vi.mocked(usersApi.updateProfile).mockRejectedValueOnce(
      new Error('Update failed'),
    );

    renderComponent({
      open: true,
      onOpenChange: handleOpenChange,
    });

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Cập nhật thông tin thất bại');
    });

    expect(mockRefreshUser).not.toHaveBeenCalled();
    expect(handleOpenChange).not.toHaveBeenCalledWith(false);

    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  });

  it('disables submit button while mutation is pending', async () => {
    let resolvePromise: (val: any) => void = () => {};
    vi.mocked(usersApi.updateProfile).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const user = userEvent.setup();

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
    });

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolvePromise({
      id: 'user-001',
      name: 'Nguyễn Văn Quản Trị',
      phone: '0912345678',
      role: 'ADMIN',
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
