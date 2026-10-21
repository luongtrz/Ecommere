import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OrdersPage } from './OrdersPage';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';

// Helper to match text across elements even when broken by multiple nodes or non-breaking spaces
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

// Hoisted mocks to ensure availability when vi.mock is hoisted
const { mockToast, mockUseOrders, mockUseCancelOrder } = vi.hoisted(() => ({
  mockToast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  mockUseOrders: vi.fn(),
  mockUseCancelOrder: vi.fn(),
}));

// Mock API client to prevent any real network requests
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../api/orders.api', () => ({
  ordersApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    cancel: vi.fn(),
  },
}));

// Mock SEO
vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title">{title}</div>
  ),
}));

// Mock Sonner Toast
vi.mock('sonner', () => ({
  toast: mockToast,
  default: mockToast,
}));

// Mock data hooks
vi.mock('../hooks/useOrders', () => ({
  useOrders: (page?: number) => mockUseOrders(page),
  useCancelOrder: () => mockUseCancelOrder(),
}));

function renderOrdersPage() {
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
        <OrdersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sampleOrders = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-001',
    status: 'PENDING_PAYMENT',
    total: 100000,
    createdAt: '2025-01-01T10:00:00.000Z',
    items: [
      {
        productName: 'Chai xịt khử mùi cao cấp',
        name: 'Chai xịt A',
        quantity: 2,
        image: 'https://example.com/img1.jpg',
      },
    ],
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-002',
    status: 'PAID',
    total: 200000,
    createdAt: '2025-01-02T11:00:00.000Z',
    items: [
      {
        productName: '',
        name: 'Chai xịt dự phòng',
        quantity: 1,
        image: null,
      },
    ],
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-003',
    status: 'PACKING',
    total: 150000,
    createdAt: '2025-01-03T12:00:00.000Z',
    items: [
      {
        productName: 'Chai xịt thơm phòng',
        name: 'Chai xịt C',
        quantity: 3,
        image: 'https://example.com/img3.jpg',
      },
    ],
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-004',
    status: 'SHIPPED',
    total: 250000,
    createdAt: '2025-01-04T13:00:00.000Z',
    items: [
      {
        name: 'Chai xịt khử khuẩn',
        quantity: 1,
        image: 'https://example.com/img4.jpg',
      },
    ],
  },
  {
    id: 'ord-5',
    orderNumber: 'ORD-005',
    status: 'DELIVERED',
    total: 300000,
    createdAt: '2025-01-05T14:00:00.000Z',
    items: [
      {
        productName: 'Chai xịt lau kính',
        name: 'Chai xịt lau kính',
        quantity: 1,
        image: 'https://example.com/img5.jpg',
      },
    ],
  },
  {
    id: 'ord-6',
    orderNumber: 'ORD-006',
    status: 'CANCELED',
    total: 80000,
    createdAt: '2025-01-06T15:00:00.000Z',
    items: [
      {
        name: 'Chai xịt bị hủy',
        quantity: 1,
        image: null,
      },
    ],
  },
  {
    id: 'ord-7',
    orderNumber: 'ORD-007',
    status: 'REFUNDED',
    total: 120000,
    createdAt: '2025-01-07T16:00:00.000Z',
    items: [
      {
        name: 'Chai xịt hoàn tiền',
        quantity: 2,
        image: null,
      },
    ],
  },
  {
    id: 'ord-8',
    orderNumber: 'ORD-008',
    status: 'UNKNOWN_STATUS',
    total: 50000,
    createdAt: '2025-01-08T17:00:00.000Z',
    items: [
      {
        name: 'Chai xịt trạng thái lạ',
        quantity: 1,
        image: null,
      },
    ],
  },
];

describe('OrdersPage', () => {
  let mockMutateAsync = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync = vi.fn().mockResolvedValue({});
    mockUseCancelOrder.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  describe('Loading and Error/Empty States', () => {
    it('renders loading spinner when isLoading is true', () => {
      mockUseOrders.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderOrdersPage();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Đơn hàng của tôi')).not.toBeInTheDocument();
    });

    it('renders empty state when orders list is empty and total is 0', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: [],
          total: 0,
        },
        isLoading: false,
      });

      renderOrdersPage();

      expect(screen.getByTestId('seo-title')).toHaveTextContent(
        'Đơn hàng của tôi',
      );
      expect(
        screen.getByRole('heading', { level: 1, name: 'Đơn hàng của tôi' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Quản lý và theo dõi đơn hàng'),
      ).toBeInTheDocument();

      // Tabs and stats should NOT be rendered when totalOrders is 0
      expect(
        screen.queryByRole('button', { name: 'Tất cả' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Tổng đơn')).not.toBeInTheDocument();

      // Empty state content
      expect(
        screen.getByRole('heading', { level: 3, name: 'Chưa có đơn hàng' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Hãy đặt hàng ngay hôm nay!'),
      ).toBeInTheDocument();
      const exploreBtn = screen.getByRole('link', { name: 'Khám phá ngay' });
      expect(exploreBtn).toBeInTheDocument();
      expect(exploreBtn).toHaveAttribute('href', '/catalog');
    });

    it('handles undefined data gracefully with default fallbacks', () => {
      mockUseOrders.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderOrdersPage();

      expect(
        screen.getByRole('heading', { level: 3, name: 'Chưa có đơn hàng' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Tất cả' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Header and Stats Overview', () => {
    it('renders tabs and stats overview when totalOrders > 0', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: sampleOrders,
          total: sampleOrders.length,
        },
        isLoading: false,
      });

      renderOrdersPage();

      // Header title and subtext
      expect(
        screen.getByRole('heading', { level: 1, name: 'Đơn hàng của tôi' }),
      ).toBeInTheDocument();

      // Tab buttons
      expect(
        screen.getByRole('button', { name: 'Tất cả' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Đang xử lý' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Hoàn thành' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Đã hủy' }),
      ).toBeInTheDocument();

      // Stats:
      // Tổng đơn = 8
      expect(screen.getByText('Tổng đơn')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();

      // Đang xử lý = 4 (PENDING_PAYMENT, PAID, PACKING, SHIPPED)
      // Note: "Đang xử lý" appears in both tab button and stats card
      expect(screen.getAllByText('Đang xử lý')).toHaveLength(2);
      expect(screen.getByText('4')).toBeInTheDocument();

      // Hoàn thành = 1 (DELIVERED)
      // Note: "Hoàn thành" appears in both tab button and stats card
      expect(screen.getAllByText('Hoàn thành')).toHaveLength(2);
      expect(screen.getByText('1')).toBeInTheDocument();

      // Chi tiêu = sum of orders excluding CANCELED:
      // 100k + 200k + 150k + 250k + 300k + 120k + 50k = 1,170,000 VND
      expect(screen.getByText('Chi tiêu')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatCurrency(1170000))),
      ).toBeInTheDocument();
    });

    it('toggles active styling on tabs when clicked', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: sampleOrders,
          total: sampleOrders.length,
        },
        isLoading: false,
      });

      renderOrdersPage();

      const allTab = screen.getByRole('button', { name: 'Tất cả' });
      const processingTab = screen.getByRole('button', { name: 'Đang xử lý' });

      expect(allTab).toHaveClass('bg-white');
      expect(processingTab).not.toHaveClass('bg-white');

      fireEvent.click(processingTab);

      expect(processingTab).toHaveClass('bg-white');
      expect(allTab).not.toHaveClass('bg-white');
    });
  });

  describe('Tab Filtering', () => {
    it('filters orders correctly across all tabs', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: sampleOrders,
          total: sampleOrders.length,
        },
        isLoading: false,
      });

      renderOrdersPage();

      // Initial tab: ALL
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.getByText('#ORD-005')).toBeInTheDocument();
      expect(screen.getByText('#ORD-006')).toBeInTheDocument();

      // Filter: PROCESSING (PENDING_PAYMENT, PAID, PACKING, SHIPPED)
      fireEvent.click(screen.getByRole('button', { name: 'Đang xử lý' }));
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.getByText('#ORD-002')).toBeInTheDocument();
      expect(screen.getByText('#ORD-003')).toBeInTheDocument();
      expect(screen.getByText('#ORD-004')).toBeInTheDocument();
      expect(screen.queryByText('#ORD-005')).not.toBeInTheDocument();
      expect(screen.queryByText('#ORD-006')).not.toBeInTheDocument();

      // Filter: COMPLETED (DELIVERED)
      fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));
      expect(screen.getByText('#ORD-005')).toBeInTheDocument();
      expect(screen.queryByText('#ORD-001')).not.toBeInTheDocument();
      expect(screen.queryByText('#ORD-006')).not.toBeInTheDocument();

      // Filter: CANCELLED (CANCELED, REFUNDED)
      fireEvent.click(screen.getByRole('button', { name: 'Đã hủy' }));
      expect(screen.getByText('#ORD-006')).toBeInTheDocument();
      expect(screen.getByText('#ORD-007')).toBeInTheDocument();
      expect(screen.queryByText('#ORD-001')).not.toBeInTheDocument();
      expect(screen.queryByText('#ORD-005')).not.toBeInTheDocument();

      // Back to ALL
      fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
      expect(screen.getByText('#ORD-001')).toBeInTheDocument();
      expect(screen.getByText('#ORD-005')).toBeInTheDocument();
    });

    it('renders empty state when active tab has no matching orders', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]], // only PENDING_PAYMENT
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      // Switch to COMPLETED tab which has no orders
      fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));

      expect(
        screen.getByRole('heading', { level: 3, name: 'Không có đơn hàng' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Không tìm thấy đơn hàng trong mục này.'),
      ).toBeInTheDocument();
      // "Khám phá ngay" button should NOT be rendered when activeTab !== 'ALL'
      expect(
        screen.queryByRole('link', { name: 'Khám phá ngay' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Order Card Rendering and Status Configurations', () => {
    it('renders all order statuses and their labels correctly', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: sampleOrders,
          total: sampleOrders.length,
        },
        isLoading: false,
      });

      renderOrdersPage();

      // All 8 status labels from getStatusConfig
      expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument();
      expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
      expect(screen.getByText('Đang đóng gói')).toBeInTheDocument();
      expect(screen.getByText('Đang giao hàng')).toBeInTheDocument();
      expect(screen.getByText('Giao thành công')).toBeInTheDocument();
      // "Đã hủy" is in both the tab button and the CANCELED order's badge
      expect(screen.getAllByText('Đã hủy')).toHaveLength(2);
      expect(screen.getByText('Đã hoàn tiền')).toBeInTheDocument();
      expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
    });

    it('renders item details with image and without image correctly', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0], sampleOrders[1]],
          total: 2,
        },
        isLoading: false,
      });

      renderOrdersPage();

      // Order 1 item has image and productName
      const imageItem = screen.getByAltText('Chai xịt A');
      expect(imageItem).toBeInTheDocument();
      expect(imageItem).toHaveAttribute('src', 'https://example.com/img1.jpg');
      expect(screen.getByTitle('Chai xịt khử mùi cao cấp')).toBeInTheDocument();
      expect(screen.getByText('x2')).toBeInTheDocument();

      // Order 2 item has no image and empty productName (falls back to item.name)
      expect(
        screen.queryByAltText('Chai xịt dự phòng'),
      ).not.toBeInTheDocument();
      expect(screen.getByTitle('Chai xịt dự phòng')).toBeInTheDocument();
      expect(screen.getByText('x1')).toBeInTheDocument();

      // Currency and dates matched cleanly across non-breaking spaces
      expect(
        screen.getByText(matchText(formatCurrency(sampleOrders[0].total))),
      ).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatDateTime(sampleOrders[0].createdAt))),
      ).toBeInTheDocument();

      // Detail links
      const detailLinks = screen.getAllByRole('link', { name: /Chi tiết/i });
      expect(detailLinks[0]).toHaveAttribute(
        'href',
        `/orders/${sampleOrders[0].id}`,
      );
      expect(detailLinks[1]).toHaveAttribute(
        'href',
        `/orders/${sampleOrders[1].id}`,
      );
    });
  });

  describe('Order Cancellation Workflow', () => {
    it('shows cancel button only for cancellable orders (PENDING_PAYMENT, PAID)', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: sampleOrders,
          total: sampleOrders.length,
        },
        isLoading: false,
      });

      renderOrdersPage();

      // Only ORD-001 and ORD-002 have canCancel = true
      const cancelButtons = screen.getAllByRole('button', { name: 'Hủy đơn' });
      expect(cancelButtons).toHaveLength(2);
    });

    it('enters confirmation state and allows dismissing cancellation via "Hủy"', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      const cancelBtn = screen.getByRole('button', { name: 'Hủy đơn' });
      fireEvent.click(cancelBtn);

      // Confirmation buttons appear
      const dismissBtn = screen.getByRole('button', { name: 'Hủy' });
      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận' });
      expect(dismissBtn).toBeInTheDocument();
      expect(confirmBtn).toBeInTheDocument();

      // Click "Hủy" to dismiss confirmation
      fireEvent.click(dismissBtn);

      expect(
        screen.queryByRole('button', { name: 'Xác nhận' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Hủy đơn' }),
      ).toBeInTheDocument();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('successfully cancels order when user confirms', async () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('ord-1');
      });

      // Confirm dialog dismisses on success
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: 'Xác nhận' }),
        ).not.toBeInTheDocument();
      });
    });

    it('disables buttons and shows "..." when cancellation is pending', () => {
      mockUseCancelOrder.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));

      const dismissBtn = screen.getByRole('button', { name: 'Hủy' });
      const pendingBtn = screen.getByRole('button', { name: '...' });

      expect(dismissBtn).toBeDisabled();
      expect(pendingBtn).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: 'Xác nhận' }),
      ).not.toBeInTheDocument();
    });

    it('handles cancellation failure with array of error messages', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutateAsync.mockRejectedValue({
        response: {
          data: {
            message: ['Đơn hàng đã được xuất kho', 'Không thể hủy lúc này'],
          },
        },
      });

      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Đơn hàng đã được xuất kho, Không thể hủy lúc này',
        );
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cancel order failed:',
        expect.anything(),
      );
      consoleSpy.mockRestore();
    });

    it('handles cancellation failure with array containing non-strings and empty values', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutateAsync.mockRejectedValue({
        response: {
          data: {
            message: ['Mã lỗi', 400, ''],
          },
        },
      });

      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Mã lỗi, 400');
      });
      consoleSpy.mockRestore();
    });

    it('handles cancellation failure with an empty array of messages (falls back to default)', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutateAsync.mockRejectedValue({
        response: {
          data: {
            message: [],
          },
        },
      });

      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Hủy đơn hàng thất bại. Vui lòng thử lại.',
        );
      });
      consoleSpy.mockRestore();
    });

    it('handles cancellation failure with a string error message', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutateAsync.mockRejectedValue({
        response: {
          data: {
            message: 'Đơn hàng không tồn tại',
          },
        },
      });

      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Đơn hàng không tồn tại');
      });
      consoleSpy.mockRestore();
    });

    it('handles cancellation failure with whitespace string (falls back to default)', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutateAsync.mockRejectedValue({
        response: {
          data: {
            message: '    ',
          },
        },
      });

      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Hủy đơn hàng thất bại. Vui lòng thử lại.',
        );
      });
      consoleSpy.mockRestore();
    });

    it('handles cancellation failure with generic Error or missing response (falls back to default)', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMutateAsync.mockRejectedValue(new Error('Network error'));

      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Hủy đơn hàng thất bại. Vui lòng thử lại.',
        );
      });
      consoleSpy.mockRestore();
    });
  });

  describe('Pagination', () => {
    it('renders pagination when totalPages > 1 and changes page', async () => {
      const user = userEvent.setup();
      mockUseOrders.mockImplementation(() => ({
        data: {
          orders: [sampleOrders[0]],
          total: 30,
          totalPages: 3,
        },
        isLoading: false,
      }));

      renderOrdersPage();

      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      const page2Button = screen.getByRole('button', { name: '2' });
      expect(page2Button).toBeInTheDocument();

      await user.click(page2Button);

      expect(mockUseOrders).toHaveBeenCalledWith(2);
    });

    it('calculates totalPages using Math.ceil(totalOrders / limit) when data.totalPages is missing', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 25,
          totalPages: undefined,
        },
        isLoading: false,
      });

      renderOrdersPage();

      // Math.ceil(25 / 10) = 3 pages
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    });

    it('does not render pagination when totalPages <= 1', () => {
      mockUseOrders.mockReturnValue({
        data: {
          orders: [sampleOrders[0]],
          total: 1,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderOrdersPage();

      expect(
        screen.queryByRole('button', { name: '2' }),
      ).not.toBeInTheDocument();
    });
  });
});
