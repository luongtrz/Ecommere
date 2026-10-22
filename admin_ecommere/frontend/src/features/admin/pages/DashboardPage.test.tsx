import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { DashboardPage } from './DashboardPage';
import { formatCurrency, formatDateTime, getImageUrl } from '@/lib/utils';
import type { DashboardStats } from '../api/admin.types';

// Mocks
const mockUseDashboardStats = vi.fn();
vi.mock('../hooks/useDashboardStats', () => ({
  useDashboardStats: () => mockUseDashboardStats(),
}));

const mockToastError = vi.fn();
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    error: mockToastError,
    success: vi.fn(),
    toast: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data?: any[];
  }) => (
    <div data-testid="area-chart" data-count={data?.length}>
      {children}
    </div>
  ),
  Area: (props: any) => (
    <div data-testid="chart-area" data-key={props.dataKey} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: (props: any) => <div data-testid="x-axis" data-key={props.dataKey} />,
  YAxis: ({ tickFormatter }: { tickFormatter?: (value: any) => string }) => {
    // Invoke tickFormatter with a sample value so formatCompactCurrency is exercised
    const sample = tickFormatter ? tickFormatter(1200000) : undefined;
    return <div data-testid="y-axis" data-sample={sample} />;
  },
  Tooltip: ({ formatter }: { formatter?: (value: any) => string }) => {
    // Invoke formatter with both defined value and undefined to cover nullish coalescing branch (value ?? 0)
    const val1 = formatter ? formatter(250000) : undefined;
    const val2 = formatter ? formatter(undefined) : undefined;
    return (
      <div data-testid="chart-tooltip" data-val1={val1} data-val2={val2} />
    );
  },
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../api/admin.api', () => ({
  getDashboardStats: vi.fn(),
}));

const normalizeCurrency = (amount: number) =>
  formatCurrency(amount).replace(/\u00a0/g, ' ');

const mockStatsPositive: DashboardStats = {
  revenue: {
    totalRevenue: 500000000,
    monthlyRevenue: 125000000,
    monthlyChange: 15.4,
  },
  orders: {
    totalOrders: 1200,
    monthlyOrders: 320,
    monthlyChange: 8.2,
    pendingOrders: 14,
    shippingOrders: 28,
  },
  products: {
    totalProducts: 85,
    activeProducts: 72,
    newProductsThisMonth: 6,
    lowStockProducts: 5,
  },
  customers: {
    totalCustomers: 850,
    newCustomersThisMonth: 64,
    monthlyChange: 12.0,
  },
  recentOrders: [
    {
      id: 'order-1',
      orderNumber: 'ORD-1001',
      customerName: 'Nguyễn Văn A',
      totalAmount: 450000,
      status: 'PENDING_PAYMENT',
      createdAt: new Date('2026-10-20T10:30:00Z'),
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-1002',
      customerName: 'Trần Thị B',
      totalAmount: 890000,
      status: 'PAID',
      createdAt: new Date('2026-10-20T11:15:00Z'),
    },
    {
      id: 'order-3',
      orderNumber: 'ORD-1003',
      customerName: 'Lê C',
      totalAmount: 1200000,
      status: 'PACKING',
      createdAt: new Date('2026-10-20T12:00:00Z'),
    },
    {
      id: 'order-4',
      orderNumber: 'ORD-1004',
      customerName: 'Phạm D',
      totalAmount: 350000,
      status: 'SHIPPED',
      createdAt: new Date('2026-10-20T13:00:00Z'),
    },
    {
      id: 'order-5',
      orderNumber: 'ORD-1005',
      customerName: 'Hoàng E',
      totalAmount: 760000,
      status: 'DELIVERED',
      createdAt: new Date('2026-10-20T14:00:00Z'),
    },
    {
      id: 'order-6',
      orderNumber: 'ORD-1006',
      customerName: 'Vũ F',
      totalAmount: 510000,
      status: 'CANCELED',
      createdAt: new Date('2026-10-20T15:00:00Z'),
    },
    {
      id: 'order-7',
      orderNumber: 'ORD-1007',
      customerName: 'Đặng G',
      totalAmount: 640000,
      status: 'REFUNDED',
      createdAt: new Date('2026-10-20T16:00:00Z'),
    },
    {
      id: 'order-8',
      orderNumber: 'ORD-1008',
      customerName: '', // Test empty customerName to verify 'KH' initials fallback
      totalAmount: 920000,
      status: 'CUSTOM_UNKNOWN' as any, // Test unknown status fallback branch
      createdAt: new Date('2026-10-20T17:00:00Z'),
    },
  ],
  topProducts: [
    {
      id: 'prod-1',
      name: 'Chai xịt ARS Chuột 300ml',
      imageUrl: 'https://example.com/images/ars-rat.jpg',
      soldQuantity: 150,
      revenue: 22500000,
    },
    {
      id: 'prod-2',
      name: 'Chai xịt đuổi muỗi Thái Lan',
      imageUrl: null, // Test null image url fallback
      soldQuantity: 95,
      revenue: 14250000,
    },
  ],
  revenueHistory: [
    { name: 'T1', total: 80000000 },
    { name: 'T2', total: 95000000 },
    { name: 'T3', total: 110000000 },
    { name: 'T4', total: 105000000 },
    { name: 'T5', total: 120000000 },
    { name: 'T6', total: 115000000 },
    { name: 'T7', total: 125000000 },
  ],
};

const mockStatsNegativeAndEmpty: DashboardStats = {
  revenue: {
    totalRevenue: 10000000,
    monthlyRevenue: 2000000,
    monthlyChange: -5.5,
  },
  orders: {
    totalOrders: 50,
    monthlyOrders: 10,
    monthlyChange: -12.3,
    pendingOrders: 0,
    shippingOrders: 0,
  },
  products: {
    totalProducts: 10,
    activeProducts: 8,
    newProductsThisMonth: 1,
    lowStockProducts: 0,
  },
  customers: {
    totalCustomers: 20,
    newCustomersThisMonth: 2,
    monthlyChange: 0, // change === 0 to verify card.change >= 0 branch with zero
  },
  recentOrders: [], // Empty recent orders branch
  topProducts: [],
  revenueHistory: [],
};

describe('DashboardPage', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  const renderDashboardPage = () => {
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
            <DashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      </HelmetProvider>,
    );
  };

  it('renders skeleton loading view when isLoading is true', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderDashboardPage();

    // Check loading skeleton container
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(7);

    // Verify error and content elements are not displayed
    expect(mockToastError).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Không thể tải dashboard'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Doanh thu toàn hệ thống'),
    ).not.toBeInTheDocument();
  });

  it('renders error view, shows toast error notification, and reloads window when clicking retry button', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderDashboardPage();

    // Toast is triggered on isError
    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith(
      'Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.',
    );

    // Error UI elements rendered
    expect(screen.getByText('Không thể tải dashboard')).toBeInTheDocument();
    expect(
      screen.getByText(
        'API thống kê hiện không phản hồi hoặc dữ liệu chưa sẵn sàng.',
      ),
    ).toBeInTheDocument();

    const reloadButton = screen.getByRole('button', { name: 'Tải lại' });
    expect(reloadButton).toBeInTheDocument();

    // Clicking reload calls window.location.reload()
    fireEvent.click(reloadButton);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('renders error view when stats data is undefined even without isError (toast not called)', () => {
    mockUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    renderDashboardPage();

    // In this branch, isError is false so toast should not be called
    expect(mockToastError).not.toHaveBeenCalled();
    expect(screen.getByText('Không thể tải dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeInTheDocument();
  });

  it('renders full dashboard with positive statistics, quick links, cards, charts, and all order status badges', () => {
    mockUseDashboardStats.mockReturnValue({
      data: mockStatsPositive,
      isLoading: false,
      isError: false,
    });

    renderDashboardPage();

    // Toast error should not be called
    expect(mockToastError).not.toHaveBeenCalled();

    // SEO title rendered
    const seoElement = screen.getByTestId('seo-title');
    expect(seoElement).toHaveAttribute('data-title', 'Dashboard - Admin');

    // Hero section
    expect(screen.getByText('Tổng quan vận hành')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Doanh thu, đơn hàng và hàng bán chạy đang nằm trên cùng một màn hình gọn hơn.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Theo dõi thay đổi theo tháng, đơn hàng cần chú ý và nhóm sản phẩm kéo doanh thu tốt nhất để quyết định nhanh hơn.',
      ),
    ).toBeInTheDocument();

    // Quick action links
    const ordersLink = screen.getByRole('link', { name: /Xử lý đơn hàng/i });
    expect(ordersLink).toHaveAttribute('href', '/admin/orders');

    const productsLink = screen.getByRole('link', {
      name: /Cập nhật sản phẩm/i,
    });
    expect(productsLink).toHaveAttribute('href', '/admin/products');

    // Hero overview metrics
    expect(screen.getByText('Doanh thu toàn hệ thống')).toBeInTheDocument();
    expect(
      screen.getByText(
        normalizeCurrency(mockStatsPositive.revenue.totalRevenue),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tổng doanh thu đã ghi nhận từ trước đến nay trên hệ thống.',
      ),
    ).toBeInTheDocument();

    expect(screen.getByText('Tốc độ giao dịch gần nhất')).toBeInTheDocument();
    expect(
      screen.getByText(`${mockStatsPositive.orders.shippingOrders} đơn`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tổng số đơn hàng đang trong trạng thái giao vận thực tế.',
      ),
    ).toBeInTheDocument();

    // 4 Key Stat Cards
    // Card 1: Doanh thu tháng
    expect(screen.getByText('Doanh thu tháng')).toBeInTheDocument();
    expect(
      screen.getByText(
        normalizeCurrency(mockStatsPositive.revenue.monthlyRevenue),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('15.4%')).toBeInTheDocument();
    expect(screen.getByText('so với tháng trước')).toBeInTheDocument();

    // Card 2: Đơn hàng mới
    expect(screen.getByText('Đơn hàng mới')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('8.2%')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${mockStatsPositive.orders.pendingOrders} đơn đang chờ xử lý`,
      ),
    ).toBeInTheDocument();

    // Card 3: Sản phẩm hoạt động (change is undefined)
    expect(screen.getByText('Sản phẩm hoạt động')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${mockStatsPositive.products.lowStockProducts} sản phẩm sắp hết hàng`,
      ),
    ).toBeInTheDocument();

    // Card 4: Khách hàng mới
    expect(screen.getByText('Khách hàng mới')).toBeInTheDocument();
    expect(screen.getAllByText('64')).toHaveLength(2);
    expect(screen.getByText('12.0%')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${mockStatsPositive.customers.totalCustomers} tài khoản toàn hệ thống`,
      ),
    ).toBeInTheDocument();

    // Revenue signal chart
    expect(screen.getByText('Tín hiệu doanh thu')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Xu hướng doanh thu 7 kỳ gần nhất dựa trên dữ liệu hệ thống.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toHaveAttribute('data-count', '7');
    expect(screen.getByTestId('y-axis')).toHaveAttribute('data-sample');
    expect(screen.getByTestId('chart-tooltip')).toHaveAttribute('data-val1');
    expect(screen.getByTestId('chart-tooltip')).toHaveAttribute('data-val2');

    // Recent orders section
    expect(screen.getByText('Đơn gần đây')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${mockStatsPositive.recentOrders.length} đơn mới nhất cần theo dõi.`,
      ),
    ).toBeInTheDocument();

    // Verify all 8 orders and their status badges
    expect(screen.getByText('ORD-1001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('NV')).toBeInTheDocument();
    expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument();
    expect(
      screen.getByText(
        formatDateTime(mockStatsPositive.recentOrders[0].createdAt),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        normalizeCurrency(mockStatsPositive.recentOrders[0].totalAmount),
      ),
    ).toBeInTheDocument();

    expect(screen.getByText('ORD-1002')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByText('TT')).toBeInTheDocument();
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();

    expect(screen.getByText('ORD-1003')).toBeInTheDocument();
    expect(screen.getByText('Lê C')).toBeInTheDocument();
    expect(screen.getByText('LC')).toBeInTheDocument();
    expect(screen.getByText('Đang đóng gói')).toBeInTheDocument();

    expect(screen.getByText('ORD-1004')).toBeInTheDocument();
    expect(screen.getByText('Phạm D')).toBeInTheDocument();
    expect(screen.getByText('PD')).toBeInTheDocument();
    expect(screen.getByText('Đang giao')).toBeInTheDocument();

    expect(screen.getByText('ORD-1005')).toBeInTheDocument();
    expect(screen.getByText('Hoàng E')).toBeInTheDocument();
    expect(screen.getByText('HE')).toBeInTheDocument();
    expect(screen.getByText('Đã giao')).toBeInTheDocument();

    expect(screen.getByText('ORD-1006')).toBeInTheDocument();
    expect(screen.getByText('Vũ F')).toBeInTheDocument();
    expect(screen.getByText('VF')).toBeInTheDocument();
    expect(screen.getByText('Đã hủy')).toBeInTheDocument();

    expect(screen.getByText('ORD-1007')).toBeInTheDocument();
    expect(screen.getByText('Đặng G')).toBeInTheDocument();
    expect(screen.getByText('ĐG')).toBeInTheDocument();
    expect(screen.getByText('Hoàn tiền')).toBeInTheDocument();

    // Order 8 with empty name fallback 'KH' and custom unknown status fallback
    expect(screen.getByText('ORD-1008')).toBeInTheDocument();
    expect(screen.getByText('KH')).toBeInTheDocument();
    expect(screen.getByText('CUSTOM_UNKNOWN')).toBeInTheDocument();

    // Top products section
    expect(screen.getByText('Sản phẩm kéo doanh thu')).toBeInTheDocument();
    expect(
      screen.getByText('Nhóm có doanh thu cao nhất trong kỳ hiện tại.'),
    ).toBeInTheDocument();

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Chai xịt ARS Chuột 300ml')).toBeInTheDocument();
    expect(screen.getByText('Đã bán 150 sản phẩm')).toBeInTheDocument();
    expect(
      screen.getByText(
        normalizeCurrency(mockStatsPositive.topProducts[0].revenue),
      ),
    ).toBeInTheDocument();

    const img1 = screen.getByAltText('Chai xịt ARS Chuột 300ml');
    expect(img1).toHaveAttribute(
      'src',
      getImageUrl('https://example.com/images/ars-rat.jpg', { width: 160 }),
    );

    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('Chai xịt đuổi muỗi Thái Lan')).toBeInTheDocument();
    expect(screen.getByText('Đã bán 95 sản phẩm')).toBeInTheDocument();
    expect(
      screen.getByText(
        normalizeCurrency(mockStatsPositive.topProducts[1].revenue),
      ),
    ).toBeInTheDocument();

    const img2 = screen.getByAltText('Chai xịt đuổi muỗi Thái Lan');
    expect(img2).toHaveAttribute('src', getImageUrl(null, { width: 160 }));

    // Operations pace today
    expect(screen.getByText('Nhịp vận hành hôm nay')).toBeInTheDocument();
    expect(
      screen.getByText('Các tín hiệu cần quan tâm khi theo dõi shop.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Đơn đang chờ xử lý')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(
      screen.getByText('Nên ưu tiên xác nhận và đẩy sang đóng gói sớm.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Sản phẩm sắp hết hàng')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(
      screen.getByText('Theo dõi để tránh out-of-stock ở nhóm bán tốt.'),
    ).toBeInTheDocument();

    expect(screen.getByText('Khách hàng mới trong tháng')).toBeInTheDocument();
    expect(screen.getAllByText('64')).toHaveLength(2);
    expect(
      screen.getByText('Có thể tận dụng để chạy cross-sell hoặc referral.'),
    ).toBeInTheDocument();
  });

  it('renders negative changes, zero change, and empty recent orders list', () => {
    mockUseDashboardStats.mockReturnValue({
      data: mockStatsNegativeAndEmpty,
      isLoading: false,
      isError: false,
    });

    renderDashboardPage();

    // Negative trend indicators rendered with Math.abs and percentage
    expect(screen.getByText('5.5%')).toBeInTheDocument();
    expect(screen.getByText('12.3%')).toBeInTheDocument();
    // Zero change rendered as 0.0%
    expect(screen.getByText('0.0%')).toBeInTheDocument();

    // Empty recent orders message
    expect(screen.getByText('Chưa có đơn hàng nào.')).toBeInTheDocument();
    expect(
      screen.getByText('0 đơn mới nhất cần theo dõi.'),
    ).toBeInTheDocument();
  });
});
