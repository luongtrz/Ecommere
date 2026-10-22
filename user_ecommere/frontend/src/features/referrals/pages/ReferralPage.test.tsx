import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  act,
  within,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReferralPage } from './ReferralPage';

const mockUseReferralInfo = vi.fn();
const mockUseMyReferrals = vi.fn();
const mockUseReferralCoupons = vi.fn();

vi.mock('../hooks/useReferral', () => ({
  useReferralInfo: () => mockUseReferralInfo(),
  useMyReferrals: (page?: number) => mockUseMyReferrals(page),
  useReferralCoupons: () => mockUseReferralCoupons(),
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

vi.mock('@/components/ui/tabs', () => {
  const TabsContext = React.createContext<{
    value: string;
    onValueChange: (v: string) => void;
  }>({
    value: '',
    onValueChange: () => {},
  });

  const Tabs = ({
    defaultValue,
    value,
    onValueChange,
    children,
    ...props
  }: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (v: string) => void;
    children?: React.ReactNode;
    [key: string]: any;
  }) => {
    const [val, setVal] = React.useState(defaultValue || value);
    const activeValue = value !== undefined ? value : val;
    const handleChange = (v: string) => {
      setVal(v);
      onValueChange?.(v);
    };

    return (
      <TabsContext.Provider
        value={{ value: activeValue ?? '', onValueChange: handleChange }}
      >
        <div data-testid="tabs" {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  };

  const TabsList = ({ children, ...props }: any) => (
    <div role="tablist" {...props}>
      {children}
    </div>
  );

  const TabsTrigger = ({
    value,
    children,
    onClick,
    onMouseDown,
    ...props
  }: any) => {
    const { value: activeValue, onValueChange } = React.useContext(TabsContext);
    const isSelected = activeValue === value;
    const handleSelect = (e: any) => {
      onValueChange(value);
      onClick?.(e);
    };
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isSelected}
        data-state={isSelected ? 'active' : 'inactive'}
        onClick={handleSelect}
        onMouseDown={(e) => {
          handleSelect(e);
          onMouseDown?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  };

  const TabsContent = ({ value, children, ...props }: any) => {
    const { value: activeValue } = React.useContext(TabsContext);
    if (activeValue !== value) return null;
    return (
      <div role="tabpanel" data-state="active" {...props}>
        {children}
      </div>
    );
  };

  return { Tabs, TabsList, TabsTrigger, TabsContent };
});

describe('ReferralPage', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;
  let shareMock: ReturnType<typeof vi.fn>;

  const defaultInfo = {
    referralCode: 'THAI2026',
    totalReferrals: 12,
    totalCouponsEarned: 5,
  };

  const defaultCoupons = [
    {
      code: 'GIAM20',
      type: 'PERCENT' as const,
      value: 20,
      minOrder: 100000,
      maxDiscount: 40000,
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2030-12-31T23:59:59Z',
      maxUses: 10,
      usedCount: 2,
      active: true,
    },
    {
      code: 'GIAM50K',
      type: 'FIXED' as const,
      value: 50000,
      minOrder: null,
      maxDiscount: null,
      validFrom: null,
      validUntil: null,
      maxUses: null,
      usedCount: 0,
      active: true,
    },
    {
      code: 'FREESHIP1',
      type: 'FREESHIP' as const,
      value: 0,
      minOrder: null,
      maxDiscount: null,
      validFrom: null,
      validUntil: null,
      maxUses: null,
      usedCount: 0,
      active: true,
    },
  ];

  const defaultReferrals = {
    data: [
      {
        id: 'ref-1',
        refereeName: 'Nguyễn Văn Minh',
        refereeEmail: 'minh@example.com',
        couponCode: 'COUPON_MINH',
        createdAt: '2026-02-15T10:00:00Z',
      },
      {
        id: 'ref-2',
        refereeName: 'Lê Thị Hoa',
        refereeEmail: 'hoa@example.com',
        couponCode: null,
        createdAt: '2026-02-20T11:00:00Z',
      },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
  };

  const renderComponent = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ReferralPage />
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    writeTextMock = vi.fn().mockResolvedValue(undefined);
    shareMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn();
    HTMLTextAreaElement.prototype.select = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Loading State', () => {
    it('renders skeleton pulse loader when info is loading (infoLoading = true)', () => {
      mockUseReferralInfo.mockReturnValue({ data: undefined, isLoading: true });
      mockUseMyReferrals.mockReturnValue({ data: undefined, isLoading: false });
      mockUseReferralCoupons.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      const { container } = renderComponent();

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(
        screen.queryByText('Mời bạn bè - Nhận ưu đãi'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Header and Left Column Info & Stats', () => {
    it('renders SEO title, headers, referral code, referral link, and statistics', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      // SEO
      expect(screen.getByTestId('seo-title')).toHaveAttribute(
        'data-title',
        'Mời bạn bè - Thai Spray',
      );

      // Header
      expect(screen.getByText('Mời bạn bè - Nhận ưu đãi')).toBeInTheDocument();
      expect(
        screen.getByText('Chia sẻ mã giới thiệu để nhận quà cho cả hai'),
      ).toBeInTheDocument();

      // Referral Card
      expect(screen.getByText('Mã giới thiệu của bạn')).toBeInTheDocument();
      expect(screen.getByText('THAI2026')).toBeInTheDocument();
      expect(
        screen.getByText(`${window.location.origin}/register?ref=THAI2026`),
      ).toBeInTheDocument();

      // Stats
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Bạn bè đã mời')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Mã đã nhận')).toBeInTheDocument();
    });

    it('renders fallback values ("---", empty link, and 0 stats) when info is undefined', () => {
      mockUseReferralInfo.mockReturnValue({
        data: undefined,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({ data: undefined, isLoading: false });
      mockUseReferralCoupons.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('---')).toBeInTheDocument();
      const zeroStats = screen.getAllByText('0');
      expect(zeroStats.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Copy and Share Interactions', () => {
    it('copies referral code to clipboard, changes button to "Đã chép", and reverts after 2 seconds', async () => {
      vi.useFakeTimers();

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({ data: [], isLoading: false });

      renderComponent();

      const codeLabel = screen.getByText('Mã giới thiệu của bạn');
      const cardContainer = codeLabel.parentElement as HTMLElement;
      const copyButton = within(cardContainer).getByRole('button', {
        name: /Sao chép/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(writeTextMock).toHaveBeenCalledWith('THAI2026');
      expect(
        within(cardContainer).getByRole('button', { name: /Đã chép/i }),
      ).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(
        within(cardContainer).getByRole('button', { name: /Sao chép/i }),
      ).toBeInTheDocument();
    });

    it('copies empty string when referralCode is undefined', async () => {
      mockUseReferralInfo.mockReturnValue({
        data: { referralCode: '', totalReferrals: 0, totalCouponsEarned: 0 },
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({ data: undefined, isLoading: false });
      mockUseReferralCoupons.mockReturnValue({ data: [], isLoading: false });

      renderComponent();

      const codeLabel = screen.getByText('Mã giới thiệu của bạn');
      const cardContainer = codeLabel.parentElement as HTMLElement;
      const copyButton = within(cardContainer).getByRole('button', {
        name: /Sao chép/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(writeTextMock).toHaveBeenCalledWith('');
    });

    it('copies referral link to clipboard when link copy button is clicked', async () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      const linkLabel = screen.getByText('Link giới thiệu');
      const linkContainer = linkLabel.parentElement as HTMLElement;
      const buttons = linkContainer.querySelectorAll('button');
      const copyLinkButton = buttons[0];

      await act(async () => {
        fireEvent.click(copyLinkButton);
      });

      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/register?ref=THAI2026`,
      );
    });

    it('uses textarea fallback when navigator.clipboard.writeText throws', async () => {
      vi.useFakeTimers();

      writeTextMock.mockRejectedValueOnce(new Error('Permission denied'));
      const execCommandSpy = vi.spyOn(document, 'execCommand');

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({ data: [], isLoading: false });

      renderComponent();

      const codeLabel = screen.getByText('Mã giới thiệu của bạn');
      const cardContainer = codeLabel.parentElement as HTMLElement;
      const copyButton = within(cardContainer).getByRole('button', {
        name: /Sao chép/i,
      });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(execCommandSpy).toHaveBeenCalledWith('copy');
      expect(
        within(cardContainer).getByRole('button', { name: /Đã chép/i }),
      ).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(
        within(cardContainer).getByRole('button', { name: /Sao chép/i }),
      ).toBeInTheDocument();
    });

    it('shares referral details using navigator.share when available', async () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      const linkLabel = screen.getByText('Link giới thiệu');
      const linkContainer = linkLabel.parentElement as HTMLElement;
      const buttons = linkContainer.querySelectorAll('button');
      const shareButton = buttons[1];

      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(shareMock).toHaveBeenCalledWith({
        title: 'Thai Spray - Mời bạn bè',
        text: 'Đăng ký tại Thai Spray và nhận ưu đãi! Dùng mã giới thiệu của tôi: THAI2026',
        url: `${window.location.origin}/register?ref=THAI2026`,
      });
    });

    it('handles navigator.share rejection gracefully when user cancels sharing', async () => {
      shareMock.mockRejectedValueOnce(new Error('User cancelled'));

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      const linkLabel = screen.getByText('Link giới thiệu');
      const linkContainer = linkLabel.parentElement as HTMLElement;
      const buttons = linkContainer.querySelectorAll('button');
      const shareButton = buttons[1];

      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(shareMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to handleCopy when navigator.share is undefined', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      const linkLabel = screen.getByText('Link giới thiệu');
      const linkContainer = linkLabel.parentElement as HTMLElement;
      const buttons = linkContainer.querySelectorAll('button');
      const shareButton = buttons[1];

      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(writeTextMock).toHaveBeenCalledWith(
        `${window.location.origin}/register?ref=THAI2026`,
      );
    });
  });

  describe('Coupons Tab', () => {
    it('renders coupons loading pulse skeleton when couponsLoading is true', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderComponent();

      const activeTabPanel = container.querySelector(
        '[data-state="active"][role="tabpanel"]',
      );
      expect(activeTabPanel?.querySelectorAll('.animate-pulse').length).toBe(2);
    });

    it('renders empty message when coupons array is empty', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({ data: [], isLoading: false });

      renderComponent();

      expect(
        screen.getByText(
          'Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận ưu đãi!',
        ),
      ).toBeInTheDocument();
    });

    it('renders empty message when coupons is null', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({ data: null, isLoading: false });

      renderComponent();

      expect(
        screen.getByText(
          'Chưa có mã giảm giá nào. Hãy mời bạn bè để nhận ưu đãi!',
        ),
      ).toBeInTheDocument();
    });

    it('renders coupons of types PERCENT, FIXED, and FREESHIP with details and allows copying active coupon', async () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      // PERCENT coupon
      expect(screen.getByText('GIAM20')).toBeInTheDocument();
      expect(screen.getByText('Giảm 20%')).toBeInTheDocument();
      expect(screen.getByText(/Tối đa.*40\.000/)).toBeInTheDocument();
      expect(
        screen.getByText(
          new RegExp(`HSD:.*${new Date('2030-12-31T23:59:59Z').getFullYear()}`),
        ),
      ).toBeInTheDocument();

      // FIXED coupon
      expect(screen.getByText('GIAM50K')).toBeInTheDocument();
      expect(screen.getByText(/Giảm.*50\.000/)).toBeInTheDocument();

      // FREESHIP coupon
      expect(screen.getByText('FREESHIP1')).toBeInTheDocument();
      expect(screen.getByText('Miễn phí vận chuyển')).toBeInTheDocument();

      // Copy coupon code
      const couponRow = screen
        .getByText('GIAM20')
        .closest('.justify-between') as HTMLElement;
      const copyBtn = within(couponRow).getByRole('button', {
        name: 'Sao chép',
      });

      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeTextMock).toHaveBeenCalledWith('GIAM20');
    });

    it('renders "Hết hạn" badge and grayscale styling when coupon is expired', () => {
      const expiredCoupon = {
        code: 'EXPIRED10',
        type: 'PERCENT' as const,
        value: 10,
        minOrder: null,
        maxDiscount: null,
        validFrom: null,
        validUntil: '2020-01-01T00:00:00Z',
        maxUses: 10,
        usedCount: 0,
        active: false,
      };

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: [expiredCoupon],
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('EXPIRED10')).toBeInTheDocument();
      expect(screen.getByText('Hết hạn')).toBeInTheDocument();

      const couponRow = screen
        .getByText('EXPIRED10')
        .closest('.justify-between') as HTMLElement;
      expect(couponRow.className).toContain('opacity-50 grayscale');
      expect(
        within(couponRow).queryByRole('button', { name: 'Sao chép' }),
      ).not.toBeInTheDocument();
    });

    it('renders "Đã dùng" badge and grayscale styling when coupon usedCount reaches maxUses', () => {
      const usedCoupon = {
        code: 'USEDFULL',
        type: 'FIXED' as const,
        value: 20000,
        minOrder: null,
        maxDiscount: null,
        validFrom: null,
        validUntil: '2030-01-01T00:00:00Z',
        maxUses: 3,
        usedCount: 3,
        active: true,
      };

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: [usedCoupon],
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('USEDFULL')).toBeInTheDocument();
      expect(screen.getByText('Đã dùng')).toBeInTheDocument();

      const couponRow = screen
        .getByText('USEDFULL')
        .closest('.justify-between') as HTMLElement;
      expect(couponRow.className).toContain('opacity-50 grayscale');
      expect(
        within(couponRow).queryByRole('button', { name: 'Sao chép' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Referrals Tab', () => {
    it('switches to referrals tab and shows loading pulse skeleton when referralsLoading is true', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({ data: undefined, isLoading: true });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      const { container } = renderComponent();

      const referralsTab = screen.getByRole('tab', { name: /Lịch sử mời/i });
      fireEvent.click(referralsTab);

      const activeTabPanel = container.querySelector(
        '[data-state="active"][role="tabpanel"]',
      );
      expect(activeTabPanel?.querySelectorAll('.animate-pulse').length).toBe(3);
    });

    it('renders empty message when referrals data array is empty', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: { data: [], total: 0, page: 1, totalPages: 0 },
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /Lịch sử mời/i }));

      expect(
        screen.getByText('Chưa có bạn bè nào được giới thiệu'),
      ).toBeInTheDocument();
    });

    it('renders empty message when referrals is null', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({ data: null, isLoading: false });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /Lịch sử mời/i }));

      expect(
        screen.getByText('Chưa có bạn bè nào được giới thiệu'),
      ).toBeInTheDocument();
    });

    it('renders referrals table headers, items, avatar initials, formatted dates, and status badges', () => {
      const referralsList = {
        data: [
          {
            id: 'ref-1',
            refereeName: 'Nguyễn Văn Minh',
            refereeEmail: 'minh@example.com',
            couponCode: 'COUPON_MINH',
            createdAt: '2026-02-15T10:00:00Z',
          },
          {
            id: 'ref-2',
            refereeName: '',
            refereeEmail: 'anon@example.com',
            couponCode: null,
            createdAt: '2026-02-20T11:00:00Z',
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      };

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: referralsList,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /Lịch sử mời/i }));

      // Table headers
      expect(screen.getByText('Người được mời')).toBeInTheDocument();
      expect(screen.getByText('Ngày tham gia')).toBeInTheDocument();
      expect(screen.getByText('Trạng thái')).toBeInTheDocument();

      // Item 1
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
      expect(screen.getByText('minh@example.com')).toBeInTheDocument();
      expect(screen.getByText('N')).toBeInTheDocument();
      expect(
        screen.getByText(
          new Date('2026-02-15T10:00:00Z').toLocaleDateString('vi-VN'),
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Đã nhận quà')).toBeInTheDocument();

      // Item 2 (empty refereeName falls back to initial '?')
      expect(screen.getByText('anon@example.com')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
      expect(screen.getByText('Đang chờ')).toBeInTheDocument();
    });

    it('does not render pagination controls when totalPages is 1', () => {
      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseMyReferrals.mockReturnValue({
        data: defaultReferrals,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /Lịch sử mời/i }));

      expect(
        screen.queryByRole('button', { name: 'Trước' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Tiếp' }),
      ).not.toBeInTheDocument();
    });

    it('handles pagination controls and page state changes', () => {
      mockUseMyReferrals.mockImplementation((page = 1) => ({
        data: {
          data: [
            {
              id: `ref-page-${page}`,
              refereeName: `Người bạn ${page}`,
              refereeEmail: `friend${page}@example.com`,
              couponCode: null,
              createdAt: '2026-03-01T00:00:00Z',
            },
          ],
          total: 30,
          page,
          totalPages: 3,
        },
        isLoading: false,
      }));

      mockUseReferralInfo.mockReturnValue({
        data: defaultInfo,
        isLoading: false,
      });
      mockUseReferralCoupons.mockReturnValue({
        data: defaultCoupons,
        isLoading: false,
      });

      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /Lịch sử mời/i }));

      // Page 1 initial state
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      const prevBtn = screen.getByRole('button', { name: 'Trước' });
      const nextBtn = screen.getByRole('button', { name: 'Tiếp' });
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).toBeEnabled();

      // Go to Page 2
      fireEvent.click(nextBtn);
      expect(mockUseMyReferrals).toHaveBeenCalledWith(2);
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      expect(prevBtn).toBeEnabled();
      expect(nextBtn).toBeEnabled();

      // Go to Page 3
      fireEvent.click(nextBtn);
      expect(mockUseMyReferrals).toHaveBeenCalledWith(3);
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      expect(prevBtn).toBeEnabled();
      expect(nextBtn).toBeDisabled();

      // Go back to Page 2
      fireEvent.click(prevBtn);
      expect(mockUseMyReferrals).toHaveBeenCalledWith(2);
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });
  });
});
