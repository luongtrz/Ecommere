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
  const adminUser = {
    id: 'admin-1',
    name: 'Nguyễn Văn Quản Trị',
    email: 'admin@thaispray.com',
    phone: '0901234567',
    role: 'ADMIN' as const,
    createdAt: '2024-01-15T00:00:00.000Z',
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

  it('renders full ADMIN account page with initials, red role badge, and details', () => {
    mockUseAuth.mockReturnValue({
      user: adminUser,
      logout: mockLogout,
    });

    renderAccountPage();

    // SEO title
    expect(screen.getByTestId('seo-title')).toHaveTextContent('Tài khoản');

    // Page Heading
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tài khoản của tôi' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Quản lý thông tin cá nhân và hoạt động mua sắm'),
    ).toBeInTheDocument();

    // Initials: 'Nguyễn Văn Quản Trị' -> 'NV'
    expect(screen.getByText('NV')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Nguyễn Văn Quản Trị' }),
    ).toBeInTheDocument();

    // ADMIN role badge
    const badge = screen.getByText('Quản trị viên');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');

    // Edit profile button
    expect(
      screen.getByRole('button', { name: /Chỉnh sửa hồ sơ/i }),
    ).toBeInTheDocument();

    // Personal details card
    expect(screen.getByText('Thông tin cá nhân')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('admin@thaispray.com')).toBeInTheDocument();
    expect(screen.getByText('Số điện thoại')).toBeInTheDocument();
    expect(screen.getByText('0901234567')).toBeInTheDocument();
    expect(screen.getByText('Ngày tham gia')).toBeInTheDocument();
    expect(
      screen.getByText(formatDate(adminUser.createdAt)),
    ).toBeInTheDocument();

    // Quick actions card
    expect(screen.getByText('Hoạt động nhanh')).toBeInTheDocument();
    expect(screen.getByText('Đơn hàng của tôi')).toBeInTheDocument();
    expect(screen.getByText('Xem lịch sử mua hàng')).toBeInTheDocument();
    expect(screen.getByText('Danh sách yêu thích')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm đã lưu')).toBeInTheDocument();
    expect(screen.getByText('Bảo mật tài khoản')).toBeInTheDocument();
    expect(screen.getByText('Đổi mật khẩu')).toBeInTheDocument();

    // Account actions card
    expect(screen.getByText('Hành động tài khoản')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Đăng xuất/i }),
    ).toBeInTheDocument();
  });

  it('renders CUSTOMER role badge with blue styling and single-word initial', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'cust-1',
        name: 'Hoàng',
        email: 'hoang@customer.vn',
        phone: '0912345678',
        role: 'CUSTOMER' as const,
        createdAt: '2024-05-20T10:00:00.000Z',
      },
      logout: mockLogout,
    });

    renderAccountPage();

    // Initials: 'Hoàng' -> 'H'
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Hoàng' }),
    ).toBeInTheDocument();

    // CUSTOMER role badge
    const badge = screen.getByText('Khách hàng');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders fallback values when phone is empty and createdAt is undefined', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'cust-2',
        name: 'Trần Bình',
        email: 'tranbinh@example.com',
        phone: '',
        role: 'CUSTOMER' as const,
        createdAt: undefined,
      },
      logout: mockLogout,
    });

    renderAccountPage();

    // Initials: 'Trần Bình' -> 'TB'
    expect(screen.getByText('TB')).toBeInTheDocument();

    // Fallback for phone
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument();

    // Fallback for createdAt
    expect(screen.getByText('Không rõ')).toBeInTheDocument();
  });

  it('navigates to /admin/orders when clicking "Đơn hàng của tôi"', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: adminUser,
      logout: mockLogout,
    });

    renderAccountPage();

    const ordersBtn = screen.getByRole('button', { name: /Đơn hàng của tôi/i });
    await user.click(ordersBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/orders');
  });

  it('does not trigger navigation when clicking quick actions without path ("Danh sách yêu thích", "Bảo mật tài khoản")', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: adminUser,
      logout: mockLogout,
    });

    renderAccountPage();

    const wishlistBtn = screen.getByRole('button', {
      name: /Danh sách yêu thích/i,
    });
    await user.click(wishlistBtn);

    const securityBtn = screen.getByRole('button', {
      name: /Bảo mật tài khoản/i,
    });
    await user.click(securityBtn);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls logout when clicking the "Đăng xuất" button', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: adminUser,
      logout: mockLogout,
    });

    renderAccountPage();

    const logoutBtn = screen.getByRole('button', { name: /Đăng xuất/i });
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('opens and closes ProfileFormDialog when clicking "Chỉnh sửa hồ sơ" and closing it', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: adminUser,
      logout: mockLogout,
    });

    renderAccountPage();

    expect(screen.queryByTestId('profile-form-dialog')).not.toBeInTheDocument();

    const editProfileBtn = screen.getByRole('button', {
      name: /Chỉnh sửa hồ sơ/i,
    });
    await user.click(editProfileBtn);

    expect(screen.getByTestId('profile-form-dialog')).toBeInTheDocument();
    expect(screen.getByText('Thông tin cá nhân Dialog')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-profile-dialog');
    await user.click(closeBtn);

    expect(screen.queryByTestId('profile-form-dialog')).not.toBeInTheDocument();
  });
});
