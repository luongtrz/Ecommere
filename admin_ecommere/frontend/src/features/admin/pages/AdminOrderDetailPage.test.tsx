import React from 'react';
import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  mockUseUpdateOrderStatus,
} = vi.hoisted(() => {
  const mockMutateAsync = vi.fn();
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

// Mock useToast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
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
  });

  describe('Loading and Not Found States', () => {
    it('renders loading spinner when isLoading is true', () => {
      mockUseAdminOrder.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderWithProviders();

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy đơn hàng'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('#ORD-123')).not.toBeInTheDocument();
    });

    it('renders not found state when order does not exist', () => {
      mockUseAdminOrder.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderWithProviders();

      expect(
        screen.getByRole('heading', { name: 'Không tìm thấy đơn hàng' }),
      ).toBeInTheDocument();
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

      // Products card
      expect(screen.getByText('Sản phẩm (1)')).toBeInTheDocument();
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute(
        'src',
        'https://example.com/product-image.jpg',
      );
      expect(img).toHaveAttribute('alt', 'Chai xịt thơm phòng Thái Lan');
      expect(
        screen.getByText('Chai xịt thơm phòng Thái Lan'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Phân loại: Bạc hà mát lạnh - 100ml'),
      ).toBeInTheDocument();
      expect(screen.getByText('SKU: SKU-001')).toBeInTheDocument();
      expect(
        screen.getByText(matchText(formatCurrency(250000))),
      ).toBeInTheDocument();
      expect(screen.getByText('x2')).toBeInTheDocument();
      expect(
        screen.getAllByText(matchText(formatCurrency(500000))).length,
      ).toBeGreaterThanOrEqual(1);

      // Customer card
      expect(screen.getByText('Khách hàng')).toBeInTheDocument();
      expect(screen.getByText('Tên:')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('nguyenvana@example.com')).toBeInTheDocument();
      expect(screen.getByText('SĐT:')).toBeInTheDocument();
      expect(screen.getAllByText('Nguyễn Văn A')).toHaveLength(2);
      expect(screen.getAllByText('0987654321')).toHaveLength(2);

      // Shipping address card
      expect(screen.getByText('Giao hàng')).toBeInTheDocument();
      expect(
        screen.getByText(
          /123 Đường Lê Lợi[\s\S]*Tầng 4, Tòa nhà Bitexco[\s\S]*Phường Bến Nghé/,
        ),
      ).toBeInTheDocument();

      // Payment card
      expect(screen.getByText('Thanh toán')).toBeInTheDocument();
      expect(screen.getByText('Phương thức')).toBeInTheDocument();
      expect(screen.getByText('COD')).toBeInTheDocument();
      expect(screen.getByText('Trạng thái')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
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

      // Timeline card
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Đơn hàng được tạo')).toBeInTheDocument();
      expect(
        screen.getByText(formatDateTime(mockSampleOrder.createdAt)),
      ).toBeInTheDocument();
      expect(screen.getByText('Cập nhật gần nhất')).toBeInTheDocument();
      expect(
        screen.getByText(formatDateTime(mockSampleOrder.updatedAt)),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Trạng thái: Chờ thanh toán'),
      ).toBeInTheDocument();
    });

    it('navigates back to /admin/orders when clicking back button in header', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
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
    it('updates status and triggers toast.promise with correct loading, success, and error messages', async () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
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
        '✅ Đơn hàng ORD-123 đã được cập nhật thành "Đã thanh toán"',
      );

      // Verify error callback with an error object containing message
      const errorMessage = options.error(new Error('Mạng không ổn định'));
      expect(errorMessage).toBe(
        '❌ Không thể cập nhật đơn hàng: Mạng không ổn định',
      );

      // Verify error callback fallback when error has no message
      expect(options.error(null)).toBe(
        '❌ Không thể cập nhật đơn hàng: Lỗi không xác định',
      );
      expect(options.error(undefined)).toBe(
        '❌ Không thể cập nhật đơn hàng: Lỗi không xác định',
      );
      expect(options.error({})).toBe(
        '❌ Không thể cập nhật đơn hàng: Lỗi không xác định',
      );
    });

    it('does not trigger status update when clicking disabled current status item', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
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

    it('updates status to CANCELED and exercises success message for CANCELED', () => {
      mockUseAdminOrder.mockReturnValue({
        data: mockSampleOrder,
        isLoading: false,
      });

      renderWithProviders();

      const cancelItem = screen.getByTestId('select-item-CANCELED');
      expect(cancelItem).toHaveTextContent('Đã hủy');

      fireEvent.click(cancelItem);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        orderId: 'ord-123',
        status: 'CANCELED',
      });

      const [, options] = mockToast.promise.mock.calls[0];
      expect(options.success()).toBe(
        '✅ Đơn hàng ORD-123 đã được cập nhật thành "Đã hủy"',
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

    it('renders PACKING status and provides SHIPPED and CANCELED transitions', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'PACKING',
        },
        isLoading: false,
      });

      renderWithProviders();

      expect(
        screen.getAllByText('Đang đóng gói').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('select-item-PACKING')).toBeDisabled();
      expect(screen.getByTestId('select-item-SHIPPED')).toHaveTextContent(
        'Đã giao vận',
      );
      expect(screen.getByTestId('select-item-CANCELED')).toHaveTextContent(
        'Đã hủy',
      );
    });

    it('renders SHIPPED status and provides DELIVERED transition', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'SHIPPED',
        },
        isLoading: false,
      });

      renderWithProviders();

      expect(screen.getAllByText('Đã giao vận').length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getByTestId('select-item-SHIPPED')).toBeDisabled();
      expect(screen.getByTestId('select-item-DELIVERED')).toHaveTextContent(
        'Đã giao',
      );
    });

    it('renders DELIVERED status and provides REFUNDED transition', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'DELIVERED',
        },
        isLoading: false,
      });

      renderWithProviders();

      expect(screen.getAllByText('Đã giao').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('select-item-DELIVERED')).toBeDisabled();
      expect(screen.getByTestId('select-item-REFUNDED')).toHaveTextContent(
        'Đã hoàn tiền',
      );
    });

    it('renders CANCELED status and does not render select dropdown', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          status: 'CANCELED',
        },
        isLoading: false,
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
      });

      renderWithProviders();

      expect(screen.queryByTestId('mock-select')).not.toBeInTheDocument();
    });
  });

  describe('Branches and Edge Cases', () => {
    it('does not render "Cập nhật gần nhất" in timeline when updatedAt equals createdAt', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          createdAt: '2025-01-01T10:00:00.000Z',
          updatedAt: '2025-01-01T10:00:00.000Z',
        },
        isLoading: false,
      });

      renderWithProviders();

      expect(screen.getByText('Đơn hàng được tạo')).toBeInTheDocument();
      expect(screen.queryByText('Cập nhật gần nhất')).not.toBeInTheDocument();
    });

    it('renders shipping address correctly when line2 is omitted', () => {
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
      });

      renderWithProviders();

      expect(screen.getByText('Giao hàng')).toBeInTheDocument();
    });

    it('renders "N/A" for customer details when user object is undefined or null', () => {
      mockUseAdminOrder.mockReturnValue({
        data: {
          ...mockSampleOrder,
          user: null,
        },
        isLoading: false,
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
      });

      renderWithProviders();

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('Chai xịt mini')).toBeInTheDocument();
      expect(
        screen.getByText('Phân loại: Không mùi - 50ml'),
      ).toBeInTheDocument();
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
      });

      renderWithProviders();

      expect(screen.getByText('Sản phẩm (1)')).toBeInTheDocument();
      expect(
        screen.getAllByText(matchText(formatCurrency(150000))).length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('x1')).toBeInTheDocument();
    });
  });
});
