import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { AccountPage } from './AccountPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title">{title}</div>
  ),
}));

vi.mock('@/features/users/components/ProfileFormDialog', () => ({
  ProfileFormDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="profile-form-dialog">
        <span>Thông tin cá nhân Dialog</span>
        <button
          type="button"
          data-testid="close-profile-dialog"
          onClick={() => onOpenChange(false)}
        >
          Đóng
        </button>
      </div>
    ) : null,
}));

function renderAccountPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AccountPage', () => {
  const baseCustomerUser = {
    id: 'user-cust-1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0912345678',
    role: 'CUSTOMER' as const,
    createdAt: '2024-03-15T08:00:00.000Z',
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders null when there is no authenticated user (!user)', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    });

    const { container } = renderAccountPage();

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Tài khoản của tôi')).not.toBeInTheDocument();
  });

  it('renders full customer account page with initials, role badge, and details', () => {
    mockUseAuth.mockReturnValue({
      user: baseCustomerUser,
      logout: mockLogout,
    });

    renderAccountPage();

    expect(screen.getByTestId('seo-title')).toHaveTextContent('Tài khoản');
    expect(screen.getByText('Tài khoản của tôi')).toBeInTheDocument();
    expect(
      screen.getByText('Quản lý thông tin và hoạt động của bạn'),
    ).toBeInTheDocument();

    // Initials: 'Nguyễn Văn A' -> 'NV'
    expect(screen.getByText('NV')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Nguyễn Văn A' }),
    ).toBeInTheDocument();

    // CUSTOMER role badge
    const badge = screen.getByText('Khách hàng thân thiết');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-teal-50', 'text-teal-700', 'border-teal-200');

    // Category section
    expect(screen.getByText('Danh mục')).toBeInTheDocument();
    expect(screen.getByText('Đơn hàng của tôi')).toBeInTheDocument();
    expect(screen.getByText('Sổ địa chỉ')).toBeInTheDocument();
    expect(screen.getByText('Danh sách yêu thích')).toBeInTheDocument();
    expect(screen.getByText('Bảo mật tài khoản')).toBeInTheDocument();

    // Personal details
    expect(screen.getByText('Thông tin cá nhân')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('nguyenvana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
    expect(screen.getByText('0912345678')).toBeInTheDocument();
    expect(screen.getByText('Ngày tham gia')).toBeInTheDocument();
    expect(
      screen.getByText(formatDate(baseCustomerUser.createdAt)),
    ).toBeInTheDocument();
    expect(screen.getByText('Trạng thái')).toBeInTheDocument();
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();

    // Activity stats
    expect(screen.getByText('Thống kê hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Đơn hàng')).toBeInTheDocument();
    expect(screen.getByText('Đánh giá')).toBeInTheDocument();
  });

  it('renders ADMIN role badge and initials correctly', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'admin-1',
        name: 'Trần Quản Trị',
        email: 'admin@example.com',
        phone: '0988888888',
        role: 'ADMIN',
        createdAt: '2023-01-10T00:00:00.000Z',
      },
      logout: mockLogout,
    });

    renderAccountPage();

    // Initials: 'Trần Quản Trị' -> 'TQ'
    expect(screen.getByText('TQ')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Trần Quản Trị' }),
    ).toBeInTheDocument();

    const badge = screen.getByText('Quản trị viên');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-rose-50', 'text-rose-700', 'border-rose-200');
  });

  it('renders fallback values when email or createdAt is not provided', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user-cust-2',
        name: 'Hoàng',
        email: '',
        phone: '0900000000',
        role: 'CUSTOMER',
        createdAt: undefined,
      },
      logout: mockLogout,
    });

    renderAccountPage();

    // Initials for single name 'Hoàng' -> 'H'
    expect(screen.getByText('H')).toBeInTheDocument();
    // Fallback email
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument();
    // Fallback createdAt
    expect(screen.getByText('Không rõ')).toBeInTheDocument();
  });

  it('calls logout when the logout button is clicked', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: baseCustomerUser,
      logout: mockLogout,
    });

    renderAccountPage();

    const logoutButton = screen.getByRole('button', { name: /đăng xuất/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('navigates to the appropriate route when menu items with paths are clicked', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: baseCustomerUser,
      logout: mockLogout,
    });

    renderAccountPage();

    const ordersBtn = screen.getByRole('button', { name: /đơn hàng của tôi/i });
    await user.click(ordersBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/orders');

    const addressBtn = screen.getByRole('button', { name: /sổ địa chỉ/i });
    await user.click(addressBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/addresses');

    const wishlistBtn = screen.getByRole('button', {
      name: /danh sách yêu thích/i,
    });
    await user.click(wishlistBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/wishlist');
  });

  it('does not navigate when clicking the "Bảo mật tài khoản" menu item with path "#"', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: baseCustomerUser,
      logout: mockLogout,
    });

    renderAccountPage();

    const securityBtn = screen.getByRole('button', {
      name: /bảo mật tài khoản/i,
    });
    await user.click(securityBtn);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('opens and closes the ProfileFormDialog when clicking settings button and closing dialog', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: baseCustomerUser,
      logout: mockLogout,
    });

    const { container } = renderAccountPage();

    expect(screen.queryByTestId('profile-form-dialog')).not.toBeInTheDocument();

    const settingsButton = container
      .querySelector('svg.lucide-settings')
      ?.closest('button');
    expect(settingsButton).toBeInTheDocument();

    await user.click(settingsButton!);
    expect(screen.getByTestId('profile-form-dialog')).toBeInTheDocument();

    const closeDialogButton = screen.getByTestId('close-profile-dialog');
    await user.click(closeDialogButton);
    expect(screen.queryByTestId('profile-form-dialog')).not.toBeInTheDocument();
  });
});
