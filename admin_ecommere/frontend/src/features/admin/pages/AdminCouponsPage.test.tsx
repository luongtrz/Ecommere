import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  beforeAll,
  afterEach,
} from 'vitest';
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
import { AdminCouponsPage } from './AdminCouponsPage';
import {
  adminReferralsApi,
  type ReferralConfig,
  type ReferralStats,
} from '../api/adminReferrals.api';

const mockToast = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

vi.mock('../api/adminReferrals.api', () => ({
  adminReferralsApi: {
    getConfig: vi.fn(),
    getStats: vi.fn(),
    getReferrals: vi.fn(),
    updateConfig: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

describe('AdminCouponsPage', () => {
  const mockConfig: ReferralConfig = {
    id: 'cfg-1',
    active: true,
    referrerCouponType: 'FIXED',
    referrerCouponValue: 50000,
    referrerMaxDiscount: 100000,
    refereeCouponType: 'PERCENT',
    refereeCouponValue: 10,
    refereeMaxDiscount: 50000,
    minOrderForCoupon: 200000,
    couponValidDays: 14,
    maxReferralsPerUser: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockStats: ReferralStats = {
    totalReferrals: 42,
    totalCouponsCreated: 15,
    isActive: true,
    topReferrers: [
      {
        user: {
          id: 'u-1',
          name: 'Nguyen Van A',
          email: 'a@example.com',
          referralCode: 'REFA1',
        },
        referralCount: 20,
      },
      {
        user: {
          id: '',
          name: null,
          email: 'b@example.com',
          referralCode: 'REFB2',
        },
        referralCount: 12,
      },
      {
        user: null,
        referralCount: 5,
      },
    ],
  };

  const mockReferralList = {
    data: [
      {
        id: 'ref-1',
        referrerId: 'u-1',
        refereeId: 'u-2',
        referrerCouponCode: 'COUPON_REF_123',
        refereeCouponCode: 'COUPON_NEW_456',
        createdAt: '2026-03-15T10:00:00Z',
        referrer: {
          id: 'u-1',
          name: 'Tran Van B',
          email: 'tran@example.com',
          referralCode: 'TRAN123',
        },
        referee: {
          id: 'u-2',
          name: 'Le Thi C',
          email: 'le@example.com',
          createdAt: '2026-03-15T10:00:00Z',
        },
      },
      {
        id: 'ref-2',
        referrerId: 'u-3',
        refereeId: 'u-4',
        referrerCouponCode: null,
        refereeCouponCode: null,
        createdAt: '2026-03-16T12:00:00Z',
        referrer: {
          id: 'u-3',
          name: null,
          email: 'anon_ref@example.com',
          referralCode: 'ANON999',
        },
        referee: {
          id: 'u-4',
          name: null,
          email: 'anon_referee@example.com',
          createdAt: '2026-03-16T12:00:00Z',
        },
      },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
  };

  const mockGetConfig = vi.mocked(adminReferralsApi.getConfig);
  const mockGetStats = vi.mocked(adminReferralsApi.getStats);
  const mockGetReferrals = vi.mocked(adminReferralsApi.getReferrals);
  const mockUpdateConfig = vi.mocked(adminReferralsApi.updateConfig);

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.pointerEvents = 'auto';
    mockGetConfig.mockResolvedValue(mockConfig);
    mockGetStats.mockResolvedValue(mockStats);
    mockGetReferrals.mockResolvedValue(mockReferralList);
    mockUpdateConfig.mockResolvedValue(mockConfig);
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

    const result = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminCouponsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    return {
      ...result,
      queryClient,
    };
  };

  describe('Header and Coupons tab (default view)', () => {
    it('renders SEO title and header correctly', () => {
      renderComponent();

      const seoElement = screen.getByTestId('seo-title');
      expect(seoElement).toHaveAttribute(
        'data-title',
        'Quản lý mã giảm giá và Referral - Admin',
      );

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Quản lý mã giảm giá và Referral',
        }),
      ).toBeInTheDocument();
    });

    it('renders all three tab triggers and default Coupons content', async () => {
      const user = userEvent.setup();
      renderComponent();

      const couponsTab = screen.getByRole('tab', { name: 'Mã giảm giá' });
      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      const listTab = screen.getByRole('tab', { name: 'Danh sách Referral' });

      expect(couponsTab).toBeInTheDocument();
      expect(configTab).toBeInTheDocument();
      expect(listTab).toBeInTheDocument();
      expect(couponsTab).toHaveAttribute('data-state', 'active');

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Danh sách mã giảm giá',
        }),
      ).toBeInTheDocument();

      const addBtn = screen.getByRole('button', { name: 'Thêm mã' });
      expect(addBtn).toBeInTheDocument();
      await user.click(addBtn);

      expect(screen.getByText('CHAOBANMOI')).toBeInTheDocument();
    });
  });

  describe('Tab switching', () => {
    it('allows switching between tabs', async () => {
      const user = userEvent.setup();
      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);
      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      const listTab = screen.getByRole('tab', { name: 'Danh sách Referral' });
      await user.click(listTab);
      expect(
        await screen.findByText('Danh sách giới thiệu'),
      ).toBeInTheDocument();

      const couponsTab = screen.getByRole('tab', { name: 'Mã giảm giá' });
      await user.click(couponsTab);
      expect(screen.getByText('CHAOBANMOI')).toBeInTheDocument();
    });
  });

  describe('Referral Config Tab', () => {
    it('displays loading skeleton while config is loading', async () => {
      const user = userEvent.setup();
      mockGetConfig.mockReturnValue(new Promise(() => {}));

      const { container } = renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(
        screen.queryByText('Cấu hình chương trình giới thiệu'),
      ).not.toBeInTheDocument();
    });

    it('renders loaded stats and top referrers', async () => {
      const user = userEvent.setup();
      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      // Stats cards
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Tổng lượt giới thiệu')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Coupon đã tạo')).toBeInTheDocument();
      expect(screen.getByText('Bật')).toBeInTheDocument();
      expect(screen.getByText('Trạng thái')).toBeInTheDocument();

      // Top referrers card
      expect(screen.getByText('Top người giới thiệu')).toBeInTheDocument();
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
      expect(screen.getByText('a@example.com')).toBeInTheDocument();
      expect(screen.getByText('20 lượt')).toBeInTheDocument();

      // User without name falls back to email
      expect(
        screen.getAllByText('b@example.com').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('12 lượt')).toBeInTheDocument();

      // User is null
      expect(screen.getByText('5 lượt')).toBeInTheDocument();
    });

    it('renders stats with fallback values when stats is empty or null', async () => {
      const user = userEvent.setup();
      mockGetConfig.mockResolvedValue({
        ...mockConfig,
        active: false,
        referrerCouponValue: 0,
        refereeCouponValue: 0,
        referrerMaxDiscount: null,
        refereeMaxDiscount: null,
        minOrderForCoupon: null,
        maxReferralsPerUser: null,
        couponValidDays: 0,
      });
      mockGetStats.mockResolvedValue(null as any);

      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      // Fallbacks to 0 for missing stats
      const zeroStats = screen.getAllByText('0');
      expect(zeroStats.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Tắt')).toBeInTheDocument();

      // Top referrers section should not be rendered
      expect(
        screen.queryByText('Top người giới thiệu'),
      ).not.toBeInTheDocument();
    });

    it('renders correctly when topReferrers is an empty array', async () => {
      const user = userEvent.setup();
      mockGetStats.mockResolvedValue({
        totalReferrals: 0,
        totalCouponsCreated: 0,
        isActive: false,
        topReferrers: [],
      });

      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      expect(
        screen.queryByText('Top người giới thiệu'),
      ).not.toBeInTheDocument();
    });

    it('updates form fields and saves modified config', async () => {
      const user = userEvent.setup();
      const { queryClient } = renderComponent();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      // 1. Toggle Switch
      const activeSwitch = screen.getByRole('switch');
      expect(activeSwitch).toHaveAttribute('data-state', 'checked');
      await user.click(activeSwitch);
      expect(activeSwitch).toHaveAttribute('data-state', 'unchecked');
      expect(screen.getByText('Tắt')).toBeInTheDocument();

      // 2. Select Referrer Coupon Type
      const comboboxes = screen.getAllByRole('combobox');
      await user.click(comboboxes[0]);
      const fixedOption = await screen.findByRole('option', {
        name: 'Số tiền cố định (VND)',
      });
      await user.click(fixedOption);

      // 3. Number inputs
      const spinbuttons = screen.getAllByRole('spinbutton');
      // Referrer Coupon Value
      fireEvent.change(spinbuttons[0], { target: { value: '75000' } });
      // Referrer Max Discount
      fireEvent.change(spinbuttons[1], { target: { value: '150000' } });

      // 4. Select Referee Coupon Type
      await user.click(comboboxes[1]);
      const freeshipOption = await screen.findByRole('option', {
        name: 'Miễn phí vận chuyển',
      });
      await user.click(freeshipOption);

      // Referee Coupon Value
      fireEvent.change(spinbuttons[2], { target: { value: '25000' } });
      // Referee Max Discount
      fireEvent.change(spinbuttons[3], { target: { value: '80000' } });

      // General config
      // Min Order For Coupon
      fireEvent.change(spinbuttons[4], { target: { value: '300000' } });
      // Coupon Valid Days
      fireEvent.change(spinbuttons[5], { target: { value: '45' } });
      // Max Referrals Per User
      fireEvent.change(spinbuttons[6], { target: { value: '20' } });

      // Save
      const saveButton = screen.getByRole('button', { name: 'Lưu cấu hình' });
      await user.click(saveButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        active: false,
        referrerCouponType: 'FIXED',
        referrerCouponValue: 75000,
        referrerMaxDiscount: 150000,
        refereeCouponType: 'FREESHIP',
        refereeCouponValue: 25000,
        refereeMaxDiscount: 80000,
        minOrderForCoupon: 300000,
        couponValidDays: 45,
        maxReferralsPerUser: 20,
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin-referral-config'],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin-referral-stats'],
        });
        expect(mockToast.success).toHaveBeenCalledWith(
          'Cập nhật cấu hình referral thành công!',
        );
      });
    });

    it('allows clearing nullable fields to null', async () => {
      const user = userEvent.setup();
      mockGetConfig.mockResolvedValue({
        ...mockConfig,
        referrerMaxDiscount: null,
        refereeMaxDiscount: null,
        minOrderForCoupon: null,
        maxReferralsPerUser: null,
      });

      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      const unlimitedInputs = screen.getAllByPlaceholderText('Không giới hạn');
      const minOrderInput = screen.getByPlaceholderText('0');

      // Clear nullable fields
      fireEvent.change(unlimitedInputs[0], { target: { value: '' } });
      fireEvent.change(unlimitedInputs[1], { target: { value: '' } });
      fireEvent.change(minOrderInput, { target: { value: '' } });
      fireEvent.change(unlimitedInputs[2], { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: 'Lưu cấu hình' });
      await user.click(saveButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        active: mockConfig.active,
        referrerCouponType: mockConfig.referrerCouponType,
        referrerCouponValue: mockConfig.referrerCouponValue,
        referrerMaxDiscount: null,
        refereeCouponType: mockConfig.refereeCouponType,
        refereeCouponValue: mockConfig.refereeCouponValue,
        refereeMaxDiscount: null,
        minOrderForCoupon: null,
        couponValidDays: mockConfig.couponValidDays,
        maxReferralsPerUser: null,
      });
    });

    it('saves fallback values when no form changes were made', async () => {
      const user = userEvent.setup();
      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: 'Lưu cấu hình' });
      await user.click(saveButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        active: mockConfig.active,
        referrerCouponType: mockConfig.referrerCouponType,
        referrerCouponValue: mockConfig.referrerCouponValue,
        referrerMaxDiscount: mockConfig.referrerMaxDiscount,
        refereeCouponType: mockConfig.refereeCouponType,
        refereeCouponValue: mockConfig.refereeCouponValue,
        refereeMaxDiscount: mockConfig.refereeMaxDiscount,
        minOrderForCoupon: mockConfig.minOrderForCoupon,
        couponValidDays: mockConfig.couponValidDays,
        maxReferralsPerUser: mockConfig.maxReferralsPerUser,
      });
    });

    it('saves undefined fallbacks when initial config is undefined', async () => {
      const user = userEvent.setup();
      mockGetConfig.mockResolvedValue(undefined as any);

      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: 'Lưu cấu hình' });
      await user.click(saveButton);

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        active: undefined,
        referrerCouponType: undefined,
        referrerCouponValue: undefined,
        referrerMaxDiscount: undefined,
        refereeCouponType: undefined,
        refereeCouponValue: undefined,
        refereeMaxDiscount: undefined,
        minOrderForCoupon: undefined,
        couponValidDays: undefined,
        maxReferralsPerUser: undefined,
      });
    });

    it('shows error toast when saving config fails', async () => {
      const user = userEvent.setup();
      mockUpdateConfig.mockRejectedValueOnce(new Error('Update failed'));

      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: 'Lưu cấu hình' });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Không thể cập nhật cấu hình. Vui lòng thử lại.',
        );
      });
    });

    it('shows loading state on save button while mutation is pending', async () => {
      const user = userEvent.setup();
      let resolveMutation!: (data: any) => void;
      mockUpdateConfig.mockReturnValue(
        new Promise((resolve) => {
          resolveMutation = resolve;
        }),
      );

      renderComponent();

      const configTab = screen.getByRole('tab', { name: 'Cấu hình Referral' });
      await user.click(configTab);

      expect(
        await screen.findByText('Cấu hình chương trình giới thiệu'),
      ).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: 'Lưu cấu hình' });
      await user.click(saveButton);

      expect(screen.getByText('Đang lưu...')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Đang lưu...' }),
      ).toBeDisabled();

      resolveMutation(mockConfig);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Lưu cấu hình' }),
        ).toBeEnabled();
      });
    });
  });

  describe('Referral List Tab', () => {
    it('displays loading skeleton while list is loading', async () => {
      const user = userEvent.setup();
      mockGetReferrals.mockReturnValue(new Promise(() => {}));

      const { container } = renderComponent();

      const listTab = screen.getByRole('tab', { name: 'Danh sách Referral' });
      await user.click(listTab);

      expect(screen.getByText('Danh sách giới thiệu')).toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(screen.queryByText('Người giới thiệu')).not.toBeInTheDocument();
    });

    it('displays empty message when referralList is undefined', async () => {
      const user = userEvent.setup();
      mockGetReferrals.mockResolvedValue(null as any);

      renderComponent();

      const listTab = screen.getByRole('tab', { name: 'Danh sách Referral' });
      await user.click(listTab);

      expect(
        await screen.findByText('Chưa có lượt giới thiệu nào'),
      ).toBeInTheDocument();
    });

    it('displays empty message when referralList.data is empty', async () => {
      const user = userEvent.setup();
      mockGetReferrals.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      renderComponent();

      const listTab = screen.getByRole('tab', { name: 'Danh sách Referral' });
      await user.click(listTab);

      expect(
        await screen.findByText('Chưa có lượt giới thiệu nào'),
      ).toBeInTheDocument();
    });

    it('renders referral table with items and handles fallbacks', async () => {
      const user = userEvent.setup();
      renderComponent();

      const listTab = screen.getByRole('tab', { name: 'Danh sách Referral' });
      await user.click(listTab);

      expect(
        await screen.findByText('Danh sách giới thiệu'),
      ).toBeInTheDocument();

      // Headers
      expect(screen.getByText('Người giới thiệu')).toBeInTheDocument();
      expect(screen.getByText('Người được mời')).toBeInTheDocument();
      expect(screen.getByText('Coupon Referrer')).toBeInTheDocument();
      expect(screen.getByText('Coupon Referee')).toBeInTheDocument();
      expect(screen.getByText('Ngày')).toBeInTheDocument();

      // First item
      expect(screen.getByText('Tran Van B')).toBeInTheDocument();
      expect(screen.getByText('TRAN123')).toBeInTheDocument();
      expect(screen.getByText('Le Thi C')).toBeInTheDocument();
      expect(screen.getByText('le@example.com')).toBeInTheDocument();
      expect(screen.getByText('COUPON_REF_123')).toBeInTheDocument();
      expect(screen.getByText('COUPON_NEW_456')).toBeInTheDocument();
      const date1 = new Date('2026-03-15T10:00:00Z').toLocaleDateString(
        'vi-VN',
      );
      expect(screen.getByText(date1)).toBeInTheDocument();

      // Second item: name fallback to email and null coupon codes
      expect(screen.getByText('anon_ref@example.com')).toBeInTheDocument();
      expect(screen.getByText('ANON999')).toBeInTheDocument();
      expect(screen.getAllByText('anon_referee@example.com').length).toBe(2);
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(2);
      const date2 = new Date('2026-03-16T12:00:00Z').toLocaleDateString(
        'vi-VN',
      );
      expect(screen.getByText(date2)).toBeInTheDocument();
    });
  });
});
