import React from 'react';
import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminOrderDetailPage } from './AdminOrderDetailPage';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { OrderStatus } from '../api/admin-orders.api';

// Polyfills for Radix UI in jsdom environment
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

// Mock API modules to prevent real network calls
vi.mock('../api/admin-orders.api', () => ({
  getAdminOrders: vi.fn(),
  getAdminOrderById: vi.fn(),
  updateOrderStatus: vi.fn(),
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

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    create: vi.fn().mockReturnThis(),
  },
  AxiosError: class AxiosError extends Error {},
}));

// Hoisted mocks for hooks and toasts
const {
  mockToast,
  mockUseAdminOrder,
  mockMutateAsync,
  mockRefetch,
  mockUseUpdateOrderStatus,
} = vi.hoisted(() => {
  const mockMutateAsync = vi.fn();
  const mockRefetch = vi.fn();
  const mockUpdateStatus = {
    mutateAsync: mockMutateAsync,
    mutate: vi.fn(),
    isLoading: false,
  };
  return {
    mockToast: {
      toast: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      promise: vi.fn(),
      loading: vi.fn(),
      dismiss: vi.fn(),
    },
    mockUseAdminOrder: vi.fn(),
    mockMutateAsync,
    mockRefetch,
    mockUseUpdateOrderStatus: vi.fn(() => mockUpdateStatus),
  };
});

// Mock SEO component
vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title}>
      {title}
    </div>
  ),
}));

// Mock useToast hook and underlying sonner toast
vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

vi.mock('sonner', () => ({
  toast: mockToast,
  default: mockToast,
}));

// Mock data hooks from useAdminOrders
vi.mock('../hooks/useAdminOrders', () => ({
  useAdminOrder: (orderId: string) => mockUseAdminOrder(orderId),
  useUpdateOrderStatus: () => mockUseUpdateOrderStatus(),
}));

// Mock UI Select component for predictable jsdom interaction
vi.mock('@/components/ui/select', async () => {
  const actualReact = await vi.importActual<typeof import('react')>('react');
  const SelectContext = actualReact.createContext<{
    value?: string;
    onValueChange?: (val: string) => void;
  }>({});

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string;
      onValueChange?: (val: string) => void;
      children?: React.ReactNode;
    }) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div data-testid="mock-select" data-value={value}>
          {children}
        </div>
      </SelectContext.Provider>
    ),
    SelectTrigger: ({
      children,
      className,
      ...props
    }: React.HTMLAttributes<HTMLButtonElement>) => (
      <button
        type="button"
        className={className}
        data-testid="select-trigger"
        {...props}
      >
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => {
      const { value } = actualReact.useContext(SelectContext);
      return <span data-testid="select-value">{value || placeholder}</span>;
    },
    SelectContent: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => (
      <div className={className} data-testid="select-content">
        {children}
      </div>
    ),
    SelectItem: ({
      value,
      disabled,
      children,
    }: {
      value: string;
      disabled?: boolean;
      children?: React.ReactNode;
    }) => {
      const { onValueChange } = actualReact.useContext(SelectContext);
      return (
        <button
          type="button"
          role="option"
          aria-selected={false}
          aria-disabled={disabled}
          disabled={disabled}
          data-testid={`select-item-${value}`}
          onClick={() => {
            if (!disabled && onValueChange) {
              onValueChange(value);
            }
          }}
        >
          {children}
        </button>
      );
    },
  };
});

// Helper to render component with QueryClient and MemoryRouter
function renderWithProviders(
  initialEntries = ['/admin/orders/ord-123'],
  routePath = '/admin/orders/:id',
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={routePath} element={<AdminOrderDetailPage />} />
          <Route path="/admin/orders" element={<div>Orders List Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Sample order fixtures
const mockSampleOrder = {
  id: 'ord-123',
  code: 'ORD-123',
  status: 'PENDING_PAYMENT' as OrderStatus,
  paymentMethod: 'COD',
  paymentStatus: 'PENDING',
  subtotal: 500000,
  shippingFee: 30000,
  discount: 50000,
  total: 480000,
  couponCode: null,
  notes: null,
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-01-01T12:30:00.000Z',
  addressJson: JSON.stringify({
    fullName: 'Nguyễn Văn A',
    phone: '0987654321',
    line1: '123 Đường Lê Lợi',
    line2: 'Tầng 4, Tòa nhà Bitexco',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP Hồ Chí Minh',
  }),
  user: {
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0987654321',
  },
  items: [
    {
      unitPrice: 250000,
      quantity: 2,
      lineTotal: 500000,
      variant: {
        sku: 'SKU-001',
        scent: 'Bạc hà mát lạnh',
        volumeMl: 100,
        product: {
          name: 'Chai xịt thơm phòng Thái Lan',
          images: ['https://example.com/product-image.jpg'],
        },
      },
    },
  ],
};

describe('AdminOrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
    mockRefetch.mockResolvedValue({});
    window.print = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('Loading and Not Found States', () => {
    it('renders loading spinner when isLoading is true', () => {
      mockUseAdminOrder.mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: mockRefetch,
      });

      const { container } = renderWithProviders();

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy đơn hàng'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('#ORD-123')).not.toBeInTheDocument();
    });

    it('renders not found state when order does not exist with icon, diagnostic info and retry button', () => {
      mockUseAdminOrder.mockReturnValue({
        data: null,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders(['/admin/orders/ord-999'], '/admin/orders/:id');

      expect(
        screen.getByRole('heading', { name: 'Không tìm thấy đơn hàng' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Mã tra cứu: #ord-999')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(mockRefetch).toHaveBeenCalledTimes(1);

      const backLink = screen.getByRole('link', {
        name: 'Quay lại danh sách',
      });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/admin/orders');
    });

    it('navigates back to orders list when clicking "Quay lại danh sách" on not found state', () => {
      mockUseAdminOrder.mockReturnValue({
        data: null,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const backLink = screen.getByRole('link', {
        name: 'Quay lại danh sách',
      });
      fireEvent.click(backLink);

      expect(screen.getByText('Orders List Page')).toBeInTheDocument();
    });

    it('handles route when id parameter is undefined, calling useAdminOrder with empty string', () => {
      mockUseAdminOrder.mockReturnValue({
        data: null,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders(['/admin/orders'], '/admin/orders');

      expect(mockUseAdminOrder).toHaveBeenCalledWith('');
    });
  });

  describe('Full Order Details Rendering', () => {
    it('renders full order information with all cards, formatting, and exact Vietnamese labels', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(mockUseAdminOrder).toHaveBeenCalledWith('ord-123');

      // SEO title
      const seo = screen.getByTestId('seo-title');
      expect(seo).toHaveAttribute('data-title', 'Đơn hàng ORD-123');

      // Header information
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        '#ORD-123',
      );
      expect(
        screen.getByText(`(${formatDateTime(mockSampleOrder.createdAt)})`),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText('Chờ thanh toán').length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByTestId('select-item-PENDING_PAYMENT'),
      ).toHaveTextContent('Chờ thanh toán');

      // Print button in header
      expect(
        screen.getByRole('button', { name: /In đơn hàng/ }),
      ).toBeInTheDocument();

      // Products card
      expect(screen.getByText('Sản phẩm (1)')).toBeInTheDocument();
      const imgs = screen.getAllByRole('img');
      expect(imgs.length).toBeGreaterThanOrEqual(1);
      expect(imgs[0]).toHaveAttribute(
        'src',
        'https://example.com/product-image.jpg',
      );
      expect(imgs[0]).toHaveAttribute('alt', 'Chai xịt thơm phòng Thái Lan');
      expect(
        screen.getAllByText('Chai xịt thơm phòng Thái Lan').length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText('Phân loại: Bạc hà mát lạnh - 100ml').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('SKU: SKU-001').length).toBeGreaterThanOrEqual(
        1,
      );
      expect(
        screen.getAllByText(matchText(formatCurrency(250000))).length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText(matchText(formatCurrency(500000))).length,
      ).toBeGreaterThanOrEqual(1);

      // Customer card (dedicated card)
      expect(screen.getByText('Khách hàng')).toBeInTheDocument();
      expect(screen.getByText('Tên:')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      const emailLink = screen.getByRole('link', {
        name: 'nguyenvana@example.com',
      });
      expect(emailLink).toHaveAttribute(
        'href',
        'mailto:nguyenvana@example.com',
      );
      expect(screen.getByText('SĐT:')).toBeInTheDocument();
      expect(screen.getAllByText('Nguyễn Văn A')).toHaveLength(2);

      // Shipping address card (dedicated card)
      expect(screen.getByText('Giao hàng')).toBeInTheDocument();
      expect(
        screen.getByText(
          /123 Đường Lê Lợi[\s\S]*Tầng 4, Tòa nhà Bitexco[\s\S]*Phường Bến Nghé/,
        ),
      ).toBeInTheDocument();
      const phoneLinks = screen.getAllByRole('link', { name: '0987654321' });
      expect(phoneLinks.length).toBeGreaterThanOrEqual(1);
      expect(phoneLinks[0]).toHaveAttribute('href', 'tel:0987654321');

      // Notes section in shipping card
      expect(screen.getByText('Ghi chú đơn hàng')).toBeInTheDocument();
      expect(screen.getByText('Không có ghi chú')).toBeInTheDocument();

      // Payment card (dedicated card)
      expect(screen.getByText('Thanh toán')).toBeInTheDocument();
      expect(screen.getByText('Phương thức')).toBeInTheDocument();
      expect(screen.getByText('COD')).toBeInTheDocument();
      expect(screen.getByText('Trạng thái')).toBeInTheDocument();
      expect(
        screen.getAllByText('Chờ thanh toán').length,
      ).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Tạm tính')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatCurrency(30000))),
      ).toBeInTheDocument();
      expect(screen.getByText('Giảm giá')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(`-${formatCurrency(50000)}`)),
      ).toBeInTheDocument();
      expect(screen.getByText('Tổng cộng')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatCurrency(480000))),
      ).toBeInTheDocument();

      // Timeline / Order history card
      expect(screen.getByText('Lịch sử đơn hàng')).toBeInTheDocument();
      expect(screen.getByText('Đơn hàng được tạo')).toBeInTheDocument();
      expect(
        screen.getByText(formatDateTime(mockSampleOrder.createdAt)),
      ).toBeInTheDocument();
      expect(screen.getByText('Cập nhật gần nhất')).toBeInTheDocument();
      expect(
        screen.getByText(formatDateTime(mockSampleOrder.updatedAt)),
      ).toBeInTheDocument();
      expect(screen.getByText('Trạng thái:').closest('p')).toHaveTextContent(
        'Trạng thái: Chờ thanh toán',
      );
    });

    it('navigates back to /admin/orders when clicking back button in header', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const backButtons = screen.getAllByRole('link');
      const headerBackBtn = backButtons.find(
        (btn) => btn.getAttribute('href') === '/admin/orders',
      );
      expect(headerBackBtn).toBeDefined();

      fireEvent.click(headerBackBtn!);
      expect(screen.getByText('Orders List Page')).toBeInTheDocument();
    });
  });

  describe('Status Transitions and Status Update Interactions', () => {
    it('updates status directly for non-terminal status and triggers toast.promise', async () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      // Click on available transition item "PAID"
      const paidItem = screen.getByTestId('select-item-PAID');
      expect(paidItem).toHaveTextContent('Đã thanh toán');

      fireEvent.click(paidItem);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: 'ord-123',
        status: 'PAID',
      });

      expect(mockToast.promise).toHaveBeenCalledTimes(1);
      const [promiseArg, options] = mockToast.promise.mock.calls[0];
      expect(promiseArg).toBeDefined();

      // Verify loading text
      expect(options.loading).toBe(
        'Đang cập nhật trạng thái đơn hàng ORD-123...',
      );

      // Verify success callback return value
      const successMessage = options.success();
      expect(successMessage).toBe(
        'Đơn hàng ORD-123 đã được cập nhật thành "Đã thanh toán"',
      );

      // Verify error callback with an error object containing message
      const errorMessage = options.error(new Error('Mạng không ổn định'));
      expect(errorMessage).toBe(
        'Không thể cập nhật đơn hàng: Mạng không ổn định',
      );

      // Verify error callback fallback when error has no message
      expect(options.error(null)).toBe(
        'Không thể cập nhật đơn hàng: Lỗi không xác định',
      );
      expect(options.error(undefined)).toBe(
        'Không thể cập nhật đơn hàng: Lỗi không xác định',
      );
      expect(options.error({})).toBe(
        'Không thể cập nhật đơn hàng: Lỗi không xác định',
      );
    });

    it('does not trigger status update when clicking disabled current status item', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const currentStatusItem = screen.getByTestId(
        'select-item-PENDING_PAYMENT',
      );
      expect(currentStatusItem).toBeDisabled();

      fireEvent.click(currentStatusItem);

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockToast.promise).not.toHaveBeenCalled();
    });

    it('opens confirmation dialog when selecting terminal state CANCELED and updates only on confirmation', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const cancelItem = screen.getByTestId('select-item-CANCELED');
      expect(cancelItem).toHaveTextContent('Đã hủy');

      // Click CANCELED option
      fireEvent.click(cancelItem);

      // Mutation must not execute immediately
      expect(mockMutateAsync).not.toHaveBeenCalled();

      // Confirmation dialog should be displayed
      expect(
        screen.getByText('Xác nhận chuyển trạng thái đơn hàng'),
      ).toBeInTheDocument();

      // Operator can cancel dialog
      const cancelBtn = screen.getByRole('button', { name: 'Hủy bỏ' });
      fireEvent.click(cancelBtn);
      expect(mockMutateAsync).not.toHaveBeenCalled();

      // Selecting again and clicking confirm executes mutation
      fireEvent.click(cancelItem);
      const confirmBtn = screen.getByRole('button', {
        name: 'Xác nhận thay đổi',
      });
      fireEvent.click(confirmBtn);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: 'ord-123',
        status: 'CANCELED',
      });

      const [, options] = mockToast.promise.mock.calls[0];
      expect(options.success()).toBe(
        'Đơn hàng ORD-123 đã được cập nhật thành "Đã hủy"',
      );
    });
  });

  describe('All Order Statuses and Transitions Coverage', () => {
    it('renders PAID status and provides PACKING and CANCELED transitions', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'PAID',
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(
        screen.getAllByText('Đã thanh toán').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('select-item-PAID')).toBeDisabled();
      expect(screen.getByTestId('select-item-PACKING')).toHaveTextContent(
        'Đang đóng gói',
      );
      expect(screen.getByTestId('select-item-CANCELED')).toHaveTextContent(
        'Đã hủy',
      );
    });

    it('renders PACKING status and provides SHIPPED and CANCELED transitions with aligned wording', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'PACKING',
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(
        screen.getAllByText('Đang đóng gói').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('select-item-PACKING')).toBeDisabled();
      expect(screen.getByTestId('select-item-SHIPPED')).toHaveTextContent(
        'Đang giao hàng',
      );
      expect(screen.getByTestId('select-item-CANCELED')).toHaveTextContent(
        'Đã hủy',
      );
    });

    it('renders SHIPPED status and provides DELIVERED transition with aligned wording', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'SHIPPED',
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(
        screen.getAllByText('Đang giao hàng').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('select-item-SHIPPED')).toBeDisabled();
      expect(screen.getByTestId('select-item-DELIVERED')).toHaveTextContent(
        'Giao thành công',
      );
    });

    it('renders DELIVERED status and requires confirmation dialog before transitioning to REFUNDED', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'DELIVERED',
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(
        screen.getAllByText('Giao thành công').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('select-item-DELIVERED')).toBeDisabled();

      const refundedItem = screen.getByTestId('select-item-REFUNDED');
      expect(refundedItem).toHaveTextContent('Đã hoàn tiền');

      fireEvent.click(refundedItem);
      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(
        screen.getByText('Xác nhận chuyển trạng thái đơn hàng'),
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', {
        name: 'Xác nhận thay đổi',
      });
      fireEvent.click(confirmBtn);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: 'ord-123',
        status: 'REFUNDED',
      });
    });

    it('renders CANCELED status and does not render select dropdown', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'CANCELED',
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.getAllByText('Đã hủy').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByTestId('mock-select')).not.toBeInTheDocument();
    });

    it('renders REFUNDED status and does not render select dropdown', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'REFUNDED',
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.getAllByText('Đã hoàn tiền').length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.queryByTestId('mock-select')).not.toBeInTheDocument();
    });

    it('handles unknown order status with Clock fallback icon and empty transitions', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'UNKNOWN_STATUS' as unknown as OrderStatus,
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.queryByTestId('mock-select')).not.toBeInTheDocument();
    });
  });

  describe('Snapshots, Coupon, Notes and Payment Map', () => {
    it('prioritizes item historical snapshots over catalog relations', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          items: [
            {
              unitPrice: 300000,
              quantity: 1,
              lineTotal: 300000,
              nameSnapshot: 'Xịt phòng cao cấp snapshot',
              scentSnapshot: 'Oải hương Pháp',
              volumeSnapshot: 250,
              variant: {
                sku: 'SKU-SNAP-888',
                scent: 'Catalog Scent Old',
                volumeMl: 100,
                product: {
                  name: 'Catalog Product Old',
                  images: ['https://example.com/item.jpg'],
                },
              },
            },
          ],
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(
        screen.getAllByText('Xịt phòng cao cấp snapshot').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Catalog Product Old')).not.toBeInTheDocument();
      expect(
        screen.getAllByText('Phân loại: Oải hương Pháp - 250ml').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Catalog Scent Old')).not.toBeInTheDocument();
      expect(
        screen.getAllByText('SKU: SKU-SNAP-888').length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('renders coupon code badge and order notes correctly', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          couponCode: 'GIAM10PT',
          notes: 'Gọi trước khi giao hàng 15 phút',
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.getByText('GIAM10PT')).toBeInTheDocument();
      expect(
        screen.getByText('Gọi trước khi giao hàng 15 phút'),
      ).toBeInTheDocument();
    });

    it.each([
      ['PENDING', 'Chờ thanh toán'],
      ['COMPLETED', 'Đã thanh toán'],
      ['FAILED', 'Thất bại'],
      ['REFUNDED', 'Đã hoàn tiền'],
    ])(
      'maps payment status %s to Vietnamese label %s',
      (status, expectedLabel) => {
        mockUseAdminOrder.mockReturnValue({
          data: {
            ...mockSampleOrder,
            paymentStatus: status as any,
          },
          isLoading: false,
          refetch: mockRefetch,
        });

        renderWithProviders();

        expect(
          screen.getAllByText(expectedLabel).length,
        ).toBeGreaterThanOrEqual(1);
      },
    );
  });

  describe('Actions: Print and Copy to Clipboard', () => {
    it('invokes window.print when "In đơn hàng" button is clicked', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const printButton = screen.getByRole('button', { name: /In đơn hàng/ });
      fireEvent.click(printButton);

      expect(window.print).toHaveBeenCalledTimes(1);
    });

    it('copies order code to clipboard and triggers toast notification', async () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const copyBtn = screen.getByRole('button', {
        name: 'Sao chép mã đơn hàng',
      });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ORD-123');
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Đã sao chép mã đơn hàng',
        );
      });
    });

    it('copies shipping address to clipboard and triggers toast notification', async () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const copyAddressBtn = screen.getByRole('button', {
        name: 'Sao chép địa chỉ',
      });
      fireEvent.click(copyAddressBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          'Đã sao chép địa chỉ giao hàng',
        );
      });
    });
  });

  describe('Branches and Edge Cases', () => {
    it('does not render "Cập nhật gần nhất" in timeline when updatedAt equals createdAt by timestamp', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          createdAt: new Date('2025-01-01T10:00:00.000Z'),
          updatedAt: new Date('2025-01-01T10:00:00.000Z'),
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.getByText('Đơn hàng được tạo')).toBeInTheDocument();
      expect(screen.queryByText('Cập nhật gần nhất')).not.toBeInTheDocument();
    });

    it('renders shipping address cleanly when line2 is omitted without dangling commas', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          addressJson: JSON.stringify({
            fullName: 'Trần Thị B',
            phone: '0912345678',
            line1: '456 Đường Nguyễn Huệ',
            ward: 'Phường 1',
            district: 'Quận 3',
            province: 'TP Hồ Chí Minh',
          }),
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
      expect(screen.getByText('0912345678')).toBeInTheDocument();
      expect(
        screen.getByText(
          /456 Đường Nguyễn Huệ[\s\S]*Phường 1[\s\S]*Quận 3[\s\S]*TP Hồ Chí Minh/,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Tầng 4/)).not.toBeInTheDocument();
    });

    it('handles null addressJson safely without throwing error', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          addressJson: null,
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.getByText('Giao hàng')).toBeInTheDocument();
      expect(screen.getByText('Chưa có thông tin địa chỉ')).toBeInTheDocument();
    });

    it('renders "N/A" for customer details when user object is undefined or null', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          user: null,
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThanOrEqual(3);
    });

    it('renders "N/A" when user properties are empty strings', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          user: {
            name: '',
            email: '',
            phone: '',
          },
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThanOrEqual(3);
    });

    it('renders 0 items count when order items list is empty', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          items: [],
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();
      expect(screen.getByText('Sản phẩm (0)')).toBeInTheDocument();
    });

    it('renders 0 items count when order items is undefined', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          items: undefined,
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();
      expect(screen.getByText('Sản phẩm (0)')).toBeInTheDocument();
    });

    it('does not render product image tag when product images array is empty or undefined', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          items: [
            {
              unitPrice: 100000,
              quantity: 1,
              lineTotal: 100000,
              variant: {
                sku: 'SKU-NO-IMG',
                scent: 'Không mùi',
                volumeMl: 50,
                product: {
                  name: 'Chai xịt mini',
                  images: [],
                },
              },
            },
          ],
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(
        screen.getAllByText('Chai xịt mini').length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText('Phân loại: Không mùi - 50ml').length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('handles item with missing variant and product properties safely', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          items: [
            {
              unitPrice: 150000,
              quantity: 1,
              lineTotal: 150000,
              variant: null,
            },
          ],
        },
        isLoading: false,
        refetch: mockRefetch,
      });

      renderWithProviders();

      expect(screen.getByText('Sản phẩm (1)')).toBeInTheDocument();
      expect(
        screen.getAllByText(matchText(formatCurrency(150000))).length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('SKU: N/A').length).toBeGreaterThanOrEqual(1);
    });
  });
});
