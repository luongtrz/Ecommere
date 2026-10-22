import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrderDetailPage } from './OrderDetailPage';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';

// Helper to match text across elements even when broken by multiple nodes, newlines, or non-breaking spaces
function matchText(expectedText: string) {
  const normalizedTarget = expectedText.replace(/\s+/g, ' ').trim();
  return (_content: string, element: Element | null): boolean => {
    if (!element) return false;
    const normalized = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!normalized.includes(normalizedTarget)) return false;
    return Array.from(element.children).every(
      (child) =>
        !(child.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .includes(normalizedTarget),
    );
  };
}

// Mock API modules to prevent any network calls
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    create: vi.fn().mockReturnThis(),
  },
}));

// Mock SEO
vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-meta" data-title={title} />
  ),
}));

// Mock hooks
const mockMutateAsync = vi.fn();
let mockIsPending = false;
const mockUseOrderDetail = vi.fn();
const mockUseCancelOrder = vi.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: mockIsPending,
}));

vi.mock('../hooks/useOrders', () => ({
  useOrderDetail: (id: string) => mockUseOrderDetail(id),
  useCancelOrder: () => mockUseCancelOrder(),
}));

function renderOrderDetailPage({
  initialEntry = '/orders/ord-001',
  routePath = '/orders/:orderId',
}: {
  initialEntry?: string;
  routePath?: string;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path={routePath} element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockPendingOrder = {
  id: 'ord-001',
  orderNumber: 'ORD-001',
  status: 'PENDING_PAYMENT',
  total: 250000,
  shippingFee: 30000,
  paymentMethod: 'COD',
  createdAt: '2026-10-20T10:00:00Z',
  shippingAddress: {
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '123 Đường Lê Lợi',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
  },
  items: [
    {
      name: 'Chai xịt đuổi chuột Thái Lan 500ml',
      quantity: 2,
      price: 110000,
    },
  ],
};

const mockPaidOrder = {
  id: 'ord-002',
  orderNumber: 'ORD-002',
  status: 'PAID',
  total: 500000,
  shippingFee: 0,
  paymentMethod: 'VNPay',
  createdAt: '2026-10-19T08:30:00Z',
  shippingAddress: {
    fullName: 'Trần Thị B',
    phone: '0912345678',
    address: '456 Đường Nguyễn Huệ',
    ward: 'Phường 1',
    district: 'Quận 3',
    province: 'TP. Hồ Chí Minh',
  },
  items: [
    {
      name: 'Chai xịt côn trùng thảo mộc',
      quantity: 1,
      price: 250000,
    },
    {
      name: 'Chai xịt phòng quế',
      quantity: 1,
      price: 250000,
    },
  ],
};

const mockPackingOrder = {
  id: 'ord-003',
  orderNumber: 'ORD-003',
  status: 'PACKING',
  total: 150000,
  shippingFee: 20000,
  paymentMethod: 'COD',
  createdAt: '2026-10-18T14:15:00Z',
  shippingAddress: {
    fullName: 'Lê Văn C',
    phone: '0987654321',
    address: '789 Đường Hai Bà Trưng',
    ward: 'Phường Tân Định',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
  },
  items: [
    {
      name: 'Chai xịt khử mùi ô tô',
      quantity: 1,
      price: 130000,
    },
  ],
};

const mockShippedOrder = {
  id: 'ord-004',
  orderNumber: 'ORD-004',
  status: 'SHIPPED',
  total: 300000,
  shippingFee: 30000,
  paymentMethod: 'COD',
  createdAt: '2026-10-17T09:00:00Z',
  shippingAddress: {
    fullName: 'Phạm Văn D',
    phone: '0978123456',
    address: '12 Đường Trần Phú',
    ward: 'Phường 4',
    district: 'Quận 5',
    province: 'TP. Hồ Chí Minh',
  },
  items: [
    {
      name: 'Chai xịt lau kính nano',
      quantity: 3,
      price: 90000,
    },
  ],
};

const mockDeliveredOrder = {
  id: 'ord-005',
  orderNumber: 'ORD-005',
  status: 'DELIVERED',
  total: 100000,
  shippingFee: 0,
  paymentMethod: 'MoMo',
  createdAt: '2026-10-16T12:00:00Z',
  shippingAddress: {
    fullName: 'Hoàng Văn E',
    phone: '0934567890',
    address: '34 Đường Pasteur',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
  },
  items: [
    {
      name: 'Chai xịt diệt muỗi',
      quantity: 1,
      price: 100000,
    },
  ],
};

const mockCanceledOrder = {
  id: 'ord-006',
  orderNumber: 'ORD-006',
  status: 'CANCELED',
  total: 200000,
  shippingFee: 25000,
  paymentMethod: 'COD',
  createdAt: '2026-10-15T15:30:00Z',
  shippingAddress: {
    fullName: 'Vũ Thị F',
    phone: '0945678901',
    address: '56 Đường Nam Kỳ Khởi Nghĩa',
    ward: 'Phường Võ Thị Sáu',
    district: 'Quận 3',
    province: 'TP. Hồ Chí Minh',
  },
  items: [
    {
      name: 'Chai xịt chống ẩm',
      quantity: 1,
      price: 175000,
    },
  ],
};

const mockRefundedOrder = {
  id: 'ord-007',
  orderNumber: 'ORD-007',
  status: 'REFUNDED',
  total: 350000,
  shippingFee: 30000,
  paymentMethod: 'ZaloPay',
  createdAt: '2026-10-14T11:20:00Z',
  shippingAddress: {
    fullName: 'Đặng Văn G',
    phone: '0956789012',
    address: '78 Đường Cách Mạng Tháng 8',
    ward: 'Phường 6',
    district: 'Quận 3',
    province: 'TP. Hồ Chí Minh',
  },
  items: [
    {
      name: 'Chai xịt chống mốc',
      quantity: 2,
      price: 160000,
    },
  ],
};

const mockUnknownOrder = {
  id: 'ord-008',
  orderNumber: 'ORD-008',
  status: 'UNKNOWN_STATUS',
  total: 80000,
  shippingFee: 15000,
  paymentMethod: 'Bank Transfer',
  createdAt: '2026-10-13T07:45:00Z',
  shippingAddress: null,
  items: [
    {
      name: 'Chai xịt đa năng',
      quantity: 1,
      price: 65000,
    },
  ],
};

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    mockMutateAsync.mockResolvedValue({});
    mockUseCancelOrder.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  describe('Loading and Error/Not Found states', () => {
    it('renders loading spinner when order detail is loading', () => {
      mockUseOrderDetail.mockReturnValue({
        data: null,
        isLoading: true,
      });

      renderOrderDetailPage();

      expect(screen.queryByText('Chi tiết đơn hàng')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy đơn hàng'),
      ).not.toBeInTheDocument();
    });

    it('renders not found state when order does not exist and loading is false', () => {
      mockUseOrderDetail.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderOrderDetailPage();

      expect(screen.getByText('Không tìm thấy đơn hàng')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Đơn hàng bạn tìm kiếm có thể không tồn tại hoặc đã bị xóa.',
        ),
      ).toBeInTheDocument();

      const backToOrdersLink = screen.getByRole('link', {
        name: 'Xem tất cả đơn hàng',
      });
      expect(backToOrdersLink).toBeInTheDocument();
      expect(backToOrdersLink).toHaveAttribute('href', '/orders');
    });
  });

  describe('Order details rendering for PENDING_PAYMENT status', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPendingOrder,
        isLoading: false,
      });
    });

    it('sets SEO title correctly', () => {
      renderOrderDetailPage();
      const seoMeta = screen.getByTestId('seo-meta');
      expect(seoMeta).toHaveAttribute('data-title', 'Đơn hàng #ORD-001');
    });

    it('renders header with back link, order number, created date, and status badge', () => {
      renderOrderDetailPage();

      const backLink = screen.getByRole('link', {
        name: /Quay lại danh sách đơn hàng/i,
      });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/orders');

      expect(screen.getByText('Chi tiết đơn hàng')).toBeInTheDocument();
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(
        screen.getAllByText(formatDateTime(mockPendingOrder.createdAt)).length,
      ).toBeGreaterThanOrEqual(1);

      const statusBadge = screen.getByText('Chờ thanh toán');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('div')).toHaveClass(
        'bg-amber-50',
        'text-amber-700',
      );
    });

    it('renders timeline with current step at Đặt hàng', () => {
      renderOrderDetailPage();

      expect(screen.getByText('Đặt hàng')).toBeInTheDocument();
      expect(screen.getByText('Đóng gói')).toBeInTheDocument();
      expect(screen.getByText('Vận chuyển')).toBeInTheDocument();
      expect(screen.getByText('Giao hàng')).toBeInTheDocument();

      expect(screen.getByText('Hiện tại')).toBeInTheDocument();
      expect(screen.getByText('Đặt hàng')).toHaveClass('text-slate-900');
      expect(screen.getByText('Đóng gói')).toHaveClass('text-slate-400');
      expect(screen.getByText('Vận chuyển')).toHaveClass('text-slate-400');
      expect(screen.getByText('Giao hàng')).toHaveClass('text-slate-400');
    });

    it('renders order items list correctly', () => {
      renderOrderDetailPage();

      expect(screen.getByText('Sản phẩm (1)')).toBeInTheDocument();
      expect(
        screen.getByText('Chai xịt đuổi chuột Thái Lan 500ml'),
      ).toBeInTheDocument();
      expect(screen.getByText('Số lượng: 2')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatCurrency(110000))),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(matchText(formatCurrency(220000))).length,
      ).toBe(2);
    });

    it('renders shipping address correctly', () => {
      renderOrderDetailPage();

      expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('0901234567')).toBeInTheDocument();
      expect(
        screen.getByText(
          matchText(
            '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          ),
        ),
      ).toBeInTheDocument();
    });

    it('renders payment info with method and unpaid status', () => {
      renderOrderDetailPage();

      expect(screen.getByText('Thanh toán')).toBeInTheDocument();
      expect(screen.getByText('Phương thức')).toBeInTheDocument();
      expect(screen.getByText('COD')).toBeInTheDocument();

      const paymentBadge = screen.getByText('Chưa thanh toán');
      expect(paymentBadge).toBeInTheDocument();
      expect(paymentBadge).toHaveClass('bg-amber-50', 'text-amber-700');
    });

    it('renders order cost summary sidebar and cancel button', () => {
      renderOrderDetailPage();

      expect(screen.getByText('Tóm tắt chi phí')).toBeInTheDocument();
      expect(screen.getByText('Ngày đặt hàng')).toBeInTheDocument();
      expect(
        screen.getAllByText(formatDateTime(mockPendingOrder.createdAt)).length,
      ).toBe(2);
      expect(screen.getByText('Tạm tính:')).toBeInTheDocument();
      expect(
        screen.getAllByText(matchText(formatCurrency(220000))).length,
      ).toBe(2);
      expect(screen.getByText('Phí vận chuyển:')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatCurrency(30000))),
      ).toBeInTheDocument();
      expect(screen.getByText('Tổng cộng:')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatCurrency(250000))),
      ).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /Hủy đơn hàng/i });
      expect(cancelBtn).toBeInTheDocument();

      expect(
        screen.getByText('Gặp vấn đề với đơn hàng này?'),
      ).toBeInTheDocument();
      const supportLink = screen.getByRole('link', {
        name: 'Gửi yêu cầu hỗ trợ',
      });
      expect(supportLink).toHaveAttribute('href', '/support');
    });
  });

  describe('Order details rendering for PAID status', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPaidOrder,
        isLoading: false,
      });
    });

    it('renders paid status badge, paid payment badge, and free shipping', () => {
      renderOrderDetailPage({ initialEntry: '/orders/ord-002' });

      const paidBadges = screen.getAllByText('Đã thanh toán');
      expect(paidBadges).toHaveLength(2);

      const headerStatusBadge = paidBadges[0];
      expect(headerStatusBadge).toBeDefined();
      expect(headerStatusBadge.closest('div')).toHaveClass(
        'bg-emerald-50',
        'text-emerald-700',
      );

      const paymentBadge = paidBadges[1];
      expect(paymentBadge).toBeDefined();
      expect(paymentBadge).toHaveClass('bg-emerald-50', 'text-emerald-700');

      expect(screen.getByText('Miễn phí')).toBeInTheDocument();

      // Timeline has current step at 0
      expect(screen.getByText('Hiện tại')).toBeInTheDocument();
      expect(screen.getByText('Đặt hàng')).toHaveClass('text-slate-900');

      // Cancel button is available for PAID orders
      expect(
        screen.getByRole('button', { name: /Hủy đơn hàng/i }),
      ).toBeInTheDocument();

      // Items length
      expect(screen.getByText('Sản phẩm (2)')).toBeInTheDocument();
    });
  });

  describe('Order details rendering for PACKING status', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPackingOrder,
        isLoading: false,
      });
    });

    it('renders packing status, timeline at step 1, and no cancel button', () => {
      renderOrderDetailPage({ initialEntry: '/orders/ord-003' });

      const statusBadge = screen.getByText('Đang đóng gói');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('div')).toHaveClass(
        'bg-amber-50',
        'text-amber-700',
      );

      // Timeline step 1 (Đóng gói) is current
      expect(screen.getByText('Đóng gói')).toHaveClass('text-slate-900');
      expect(screen.getByText('Đặt hàng')).toHaveClass('text-slate-900');
      expect(screen.getByText('Vận chuyển')).toHaveClass('text-slate-400');
      expect(screen.getByText('Giao hàng')).toHaveClass('text-slate-400');

      // Payment badge is Chưa thanh toán
      expect(screen.getByText('Chưa thanh toán')).toBeInTheDocument();

      // canCancel is false for PACKING
      expect(
        screen.queryByRole('button', { name: /Hủy đơn hàng/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Order details rendering for SHIPPED status', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockShippedOrder,
        isLoading: false,
      });
    });

    it('renders shipped status, timeline at step 2, and no cancel button', () => {
      renderOrderDetailPage({ initialEntry: '/orders/ord-004' });

      const statusBadge = screen.getByText('Đang giao hàng');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('div')).toHaveClass(
        'bg-teal-50',
        'text-teal-700',
      );

      // Timeline step 2 (Vận chuyển) is current
      expect(screen.getByText('Vận chuyển')).toHaveClass('text-slate-900');
      expect(screen.getByText('Đóng gói')).toHaveClass('text-slate-900');
      expect(screen.getByText('Đặt hàng')).toHaveClass('text-slate-900');
      expect(screen.getByText('Giao hàng')).toHaveClass('text-slate-400');

      expect(screen.getByText('Chưa thanh toán')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Hủy đơn hàng/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Order details rendering for DELIVERED status', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockDeliveredOrder,
        isLoading: false,
      });
    });

    it('renders delivered status, timeline at step 3, paid badge, and no cancel button', () => {
      renderOrderDetailPage({ initialEntry: '/orders/ord-005' });

      const statusBadge = screen.getByText('Giao thành công');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('div')).toHaveClass(
        'bg-emerald-50',
        'text-emerald-700',
      );

      // All timeline steps completed, Giao hàng is current
      expect(screen.getByText('Giao hàng')).toHaveClass('text-slate-900');
      expect(screen.getByText('Vận chuyển')).toHaveClass('text-slate-900');
      expect(screen.getByText('Đóng gói')).toHaveClass('text-slate-900');
      expect(screen.getByText('Đặt hàng')).toHaveClass('text-slate-900');

      const paymentBadge = screen.getByText('Đã thanh toán');
      expect(paymentBadge).toBeInTheDocument();
      expect(paymentBadge).toHaveClass('bg-emerald-50', 'text-emerald-700');

      expect(
        screen.queryByRole('button', { name: /Hủy đơn hàng/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Order details rendering for CANCELED status', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockCanceledOrder,
        isLoading: false,
      });
    });

    it('renders canceled status, red payment badge, hides timeline, and has no cancel button', () => {
      renderOrderDetailPage({ initialEntry: '/orders/ord-006' });

      const canceledBadges = screen.getAllByText('Đã hủy');
      expect(canceledBadges).toHaveLength(2);

      const headerStatusBadge = canceledBadges[0];
      expect(headerStatusBadge).toBeDefined();
      expect(headerStatusBadge.closest('div')).toHaveClass(
        'bg-rose-50',
        'text-rose-600',
      );

      const paymentBadge = canceledBadges[1];
      expect(paymentBadge).toBeDefined();
      expect(paymentBadge).toHaveClass('bg-rose-50', 'text-rose-600');

      expect(
        screen.queryByRole('button', { name: /Hủy đơn hàng/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Order details rendering for REFUNDED status', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockRefundedOrder,
        isLoading: false,
      });
    });

    it('renders refunded status badge, red payment badge, and hides timeline', () => {
      renderOrderDetailPage({ initialEntry: '/orders/ord-007' });

      const statusBadge = screen.getByText('Đã hoàn tiền');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('div')).toHaveClass(
        'bg-slate-50',
        'text-slate-700',
      );

      // Timeline hidden
      expect(screen.queryByText('Đặt hàng')).not.toBeInTheDocument();

      const paymentBadge = screen.getByText('Đã hủy');
      expect(paymentBadge).toBeInTheDocument();
      expect(paymentBadge).toHaveClass('bg-rose-50', 'text-rose-600');
    });
  });

  describe('Order details rendering for unknown status with missing shippingAddress', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockUnknownOrder,
        isLoading: false,
      });
    });

    it('falls back to default status color, icon, label, and safely handles null shippingAddress', () => {
      renderOrderDetailPage({ initialEntry: '/orders/ord-008' });

      const statusBadge = screen.getByText('UNKNOWN_STATUS');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.closest('div')).toHaveClass(
        'bg-slate-50',
        'text-slate-700',
      );

      // Timeline renders with step 0 as default current
      expect(screen.getByText('Đặt hàng')).toBeInTheDocument();
      expect(screen.getByText('Hiện tại')).toBeInTheDocument();

      expect(screen.getByText('Chưa thanh toán')).toBeInTheDocument();

      // Shipping address card is present and does not crash with null address
      expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();
    });
  });

  describe('Cancel order flow and user interactions', () => {
    it('toggles cancel confirmation box open and closed with "Không" button', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPendingOrder,
        isLoading: false,
      });

      renderOrderDetailPage();

      const cancelBtn = screen.getByRole('button', { name: /Hủy đơn hàng/i });
      expect(cancelBtn).toBeInTheDocument();

      fireEvent.click(cancelBtn);

      expect(
        screen.getByText('Bạn chắc chắn muốn hủy đơn hàng này?'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Hành động này không thể hoàn tác. Sản phẩm sẽ được hoàn lại kho.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Hủy đơn hàng/i }),
      ).not.toBeInTheDocument();

      const noBtn = screen.getByRole('button', { name: 'Không' });
      fireEvent.click(noBtn);

      expect(
        screen.queryByText('Bạn chắc chắn muốn hủy đơn hàng này?'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Hủy đơn hàng/i }),
      ).toBeInTheDocument();
    });

    it('successfully cancels order when confirmed and closes confirmation box', async () => {
      mockMutateAsync.mockResolvedValueOnce({});
      mockUseOrderDetail.mockReturnValue({
        data: mockPendingOrder,
        isLoading: false,
      });

      renderOrderDetailPage();

      const cancelBtn = screen.getByRole('button', { name: /Hủy đơn hàng/i });
      fireEvent.click(cancelBtn);

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận hủy' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockMutateAsync).toHaveBeenCalledWith('ord-001');
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Bạn chắc chắn muốn hủy đơn hàng này?'),
        ).not.toBeInTheDocument();
      });
    });

    it('handles cancel order failure by logging error and displaying alert', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Network error');
      mockMutateAsync.mockRejectedValueOnce(error);

      mockUseOrderDetail.mockReturnValue({
        data: mockPendingOrder,
        isLoading: false,
      });

      renderOrderDetailPage();

      const cancelBtn = screen.getByRole('button', { name: /Hủy đơn hàng/i });
      fireEvent.click(cancelBtn);

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận hủy' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('ord-001');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Cancel order failed:',
          error,
        );
        expect(alertSpy).toHaveBeenCalledWith(
          'Hủy đơn hàng thất bại. Vui lòng thử lại.',
        );
      });

      // Dialog should still be open after failure
      expect(
        screen.getByText('Bạn chắc chắn muốn hủy đơn hàng này?'),
      ).toBeInTheDocument();

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('shows "Đang hủy..." and disables action buttons when cancelOrder.isPending is true', () => {
      mockUseCancelOrder.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      mockUseOrderDetail.mockReturnValue({
        data: mockPendingOrder,
        isLoading: false,
      });

      renderOrderDetailPage();

      const cancelBtn = screen.getByRole('button', { name: /Hủy đơn hàng/i });
      fireEvent.click(cancelBtn);

      const pendingBtn = screen.getByRole('button', { name: 'Đang hủy...' });
      expect(pendingBtn).toBeInTheDocument();
      expect(pendingBtn).toBeDisabled();

      const noBtn = screen.getByRole('button', { name: 'Không' });
      expect(noBtn).toBeDisabled();
    });

    it('does not mutate cancelOrder if orderId is missing from route params', async () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPendingOrder,
        isLoading: false,
      });

      // Render route without :orderId parameter so orderId is undefined
      renderOrderDetailPage({
        initialEntry: '/orders',
        routePath: '/orders',
      });

      const cancelBtn = screen.getByRole('button', { name: /Hủy đơn hàng/i });
      fireEvent.click(cancelBtn);

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận hủy' });
      fireEvent.click(confirmBtn);

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(
        screen.getByText('Bạn chắc chắn muốn hủy đơn hàng này?'),
      ).toBeInTheDocument();
    });
  });
});
