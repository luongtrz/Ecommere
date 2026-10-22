import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminOrdersPage } from './AdminOrdersPage';
import type { AdminOrder } from '../api/admin-orders.api';

// Mocks
const mockUseAdminOrders = vi.fn();
const mockMutate = vi.fn();
const mockUseUpdateOrderStatus = vi.fn();

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToast = vi.fn();

vi.mock('../hooks/useAdminOrders', () => ({
  useAdminOrders: (params: any) => mockUseAdminOrders(params),
  useUpdateOrderStatus: () => mockUseUpdateOrderStatus(),
}));

vi.mock('../api/admin-orders.api', () => ({
  getAdminOrders: vi.fn(),
  getAdminOrderById: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
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
    patch: vi.fn(),
    delete: vi.fn(),
    create: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
    success: mockToastSuccess,
    error: mockToastError,
    warning: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('@/components/ui/select', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  const SelectContext = React.createContext<{
    value?: string;
    onValueChange?: (val: string) => void;
  }>({});

  const Select = ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (val: string) => void;
    children?: React.ReactNode;
  }) => {
    return (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div data-testid="mock-select" data-value={value}>
          {children}
        </div>
      </SelectContext.Provider>
    );
  };

  const SelectTrigger = ({
    children,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    className?: string;
    [key: string]: any;
  }) => {
    return (
      <div
        role="button"
        tabIndex={0}
        data-testid="select-trigger"
        className={className}
        {...props}
      >
        {children}
      </div>
    );
  };

  const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const { value } = React.useContext(SelectContext);
    return <span data-testid="select-value">{value || placeholder}</span>;
  };

  const SelectContent = ({ children }: { children?: React.ReactNode }) => {
    return <div data-testid="select-content">{children}</div>;
  };

  const SelectItem = ({
    value,
    children,
    className,
  }: {
    value: string;
    children?: React.ReactNode;
    className?: string;
  }) => {
    const { onValueChange, value: selectedValue } =
      React.useContext(SelectContext);
    return (
      <button
        type="button"
        role="option"
        aria-selected={selectedValue === value}
        data-testid={`select-item-${value}`}
        data-value={value}
        className={className}
        onClick={() => onValueChange?.(value)}
      >
        {children}
      </button>
    );
  };

  const SelectGroup = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  const SelectLabel = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  const SelectSeparator = () => <hr />;
  const SelectScrollUpButton = () => null;
  const SelectScrollDownButton = () => null;

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
  };
});

const mockOrders: AdminOrder[] = [
  {
    id: 'ord-1',
    code: 'ORD-001',
    userId: 'user-1',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    subtotal: 300000,
    discount: 0,
    shippingFee: 30000,
    total: 330000,
    addressJson: JSON.stringify({
      line1: '123 Lê Lợi',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP Hồ Chí Minh',
    }),
    couponCode: null,
    notes: 'Giao giờ hành chính',
    createdAt: new Date('2026-03-15T10:30:00Z'),
    updatedAt: new Date('2026-03-15T10:30:00Z'),
    user: {
      id: 'u1',
      name: 'Nguyễn Văn A',
      email: 'vana@example.com',
      phone: '0912345678',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: 'var-1',
        nameSnapshot: 'Xịt Thơm Classic',
        scentSnapshot: 'Chanh Sả',
        volumeSnapshot: 100,
        quantity: 2,
        unitPrice: 100000,
        lineTotal: 200000,
        variant: {
          id: 'v1',
          sku: 'SKU-001',
          scent: 'Chanh Sả',
          volumeMl: 100,
          product: {
            id: 'p1',
            name: 'Xịt Thơm Classic',
            images: ['https://example.com/classic.png'],
          },
        },
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        variantId: 'var-2',
        nameSnapshot: 'Xịt Thơm Midnight',
        scentSnapshot: 'Gỗ Đàn Hương',
        volumeSnapshot: 50,
        quantity: 1,
        unitPrice: 100000,
        lineTotal: 100000,
        variant: {
          id: 'v2',
          sku: 'SKU-002',
          scent: 'Gỗ Đàn Hương',
          volumeMl: 50,
          product: {
            id: 'p2',
            name: 'Xịt Thơm Midnight',
            images: [],
          },
        },
      },
      {
        id: 'item-3',
        productId: 'prod-3',
        variantId: 'var-3',
        nameSnapshot: 'Xịt Thơm Relax',
        scentSnapshot: 'Oải Hương',
        volumeSnapshot: 50,
        quantity: 1,
        unitPrice: 30000,
        lineTotal: 30000,
      },
    ],
  },
  {
    id: 'ord-2',
    code: 'ORD-002',
    userId: 'user-2',
    status: 'PAID',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'VNPAY',
    subtotal: 150000,
    discount: 10000,
    shippingFee: 20000,
    total: 160000,
    addressJson: JSON.stringify({
      address: '456 Phố Huế, Hà Nội',
    }),
    couponCode: 'SALE10',
    notes: null,
    createdAt: new Date('2026-03-16T14:20:00Z'),
    updatedAt: new Date('2026-03-16T14:20:00Z'),
    user: {
      id: 'u2',
      name: null,
      email: 'user2@example.com',
      phone: null,
    },
    items: [
      {
        id: 'item-2-1',
        productId: 'prod-4',
        variantId: 'var-4',
        nameSnapshot: 'Xịt Thơm Mini',
        scentSnapshot: '',
        volumeSnapshot: 20,
        quantity: 1,
        unitPrice: 150000,
        lineTotal: 150000,
      },
    ],
  },
  {
    id: 'ord-3',
    code: 'ORD-003',
    userId: 'user-3',
    status: 'PACKING',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'MOMO',
    subtotal: 500000,
    discount: 0,
    shippingFee: 0,
    total: 500000,
    addressJson: '',
    couponCode: null,
    notes: null,
    createdAt: new Date('2026-03-17T09:00:00Z'),
    updatedAt: new Date('2026-03-17T09:00:00Z'),
    user: undefined,
    items: undefined,
  },
  {
    id: 'ord-4',
    code: 'ORD-004',
    userId: 'user-4',
    status: 'SHIPPED',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'COD',
    subtotal: 200000,
    discount: 0,
    shippingFee: 20000,
    total: 220000,
    addressJson: JSON.stringify({}),
    couponCode: null,
    notes: null,
    createdAt: new Date('2026-03-18T09:00:00Z'),
    updatedAt: new Date('2026-03-18T09:00:00Z'),
    user: {
      id: 'u4',
      name: 'Trần Văn B',
      phone: '0988776655',
    },
    items: [],
  },
  {
    id: 'ord-5',
    code: 'ORD-005',
    userId: 'user-5',
    status: 'UNKNOWN_STATUS' as any,
    paymentStatus: 'COMPLETED',
    paymentMethod: 'COD',
    subtotal: 100000,
    discount: 0,
    shippingFee: 0,
    total: 100000,
    addressJson: '{invalid-json',
    couponCode: null,
    notes: null,
    createdAt: new Date('2026-03-19T09:00:00Z'),
    updatedAt: new Date('2026-03-19T09:00:00Z'),
    user: {
      id: 'u5',
      name: 'Lê C',
      phone: '0977112233',
    },
    items: [],
  },
];

const mockOrdersOtherStatuses: AdminOrder[] = [
  {
    id: 'ord-6',
    code: 'ORD-006',
    userId: 'user-6',
    status: 'DELIVERED',
    paymentStatus: 'COMPLETED',
    paymentMethod: 'COD',
    subtotal: 250000,
    discount: 0,
    shippingFee: 0,
    total: 250000,
    addressJson: '',
    couponCode: null,
    notes: null,
    createdAt: new Date('2026-03-20T10:00:00Z'),
    updatedAt: new Date('2026-03-20T10:00:00Z'),
    user: { id: 'u6', name: 'Hoàng D', phone: '0911222333' },
    items: [],
  },
  {
    id: 'ord-7',
    code: 'ORD-007',
    userId: 'user-7',
    status: 'CANCELED',
    paymentStatus: 'FAILED',
    paymentMethod: 'COD',
    subtotal: 120000,
    discount: 0,
    shippingFee: 0,
    total: 120000,
    addressJson: '',
    couponCode: null,
    notes: null,
    createdAt: new Date('2026-03-21T10:00:00Z'),
    updatedAt: new Date('2026-03-21T10:00:00Z'),
    user: { id: 'u7', name: 'Phạm E', phone: '0933444555' },
    items: [],
  },
  {
    id: 'ord-8',
    code: 'ORD-008',
    userId: 'user-8',
    status: 'REFUNDED',
    paymentStatus: 'REFUNDED',
    paymentMethod: 'MOMO',
    subtotal: 180000,
    discount: 0,
    shippingFee: 0,
    total: 180000,
    addressJson: '',
    couponCode: null,
    notes: null,
    createdAt: new Date('2026-03-22T10:00:00Z'),
    updatedAt: new Date('2026-03-22T10:00:00Z'),
    user: { id: 'u8', name: 'Vũ F', phone: '0944555666' },
    items: [],
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateOrderStatus.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders loading state with skeleton placeholders', () => {
    mockUseAdminOrders.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderPage();

    // Check loading skeleton items are rendered
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Table header should not be visible while loading
    expect(screen.queryByText('Mã đơn')).not.toBeInTheDocument();
  });

  it('renders error state and reloads window when clicking retry button', () => {
    mockUseAdminOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const reloadMock = vi.fn();
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { ...originalLocation, reload: reloadMock };

    try {
      renderPage();

      expect(
        screen.getByText('Không thể tải danh sách đơn hàng'),
      ).toBeInTheDocument();
      const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(reloadMock).toHaveBeenCalledTimes(1);
    } finally {
      (window as any).location = originalLocation;
    }
  });

  it('renders empty state when no orders exist', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('Không tìm thấy đơn hàng nào')).toBeInTheDocument();
    expect(screen.getByText('Tổng đơn hàng tháng này')).toBeInTheDocument();
    expect(screen.getByText('Đang chờ xử lý')).toBeInTheDocument();
    expect(screen.getByText('Doanh thu hôm nay')).toBeInTheDocument();

    // Total should display 0
    expect(screen.getAllByText('0')[0]).toBeInTheDocument();

    // Pagination not rendered
    expect(screen.queryByText(/Trang \d+ \//)).not.toBeInTheDocument();
  });

  it('renders orders table with complete order info, formatting, and action elements', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: mockOrders.slice(0, 4),
        total: 4,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    // Header and action elements
    expect(screen.getByText('Quản lý đơn hàng')).toBeInTheDocument();
    expect(
      screen.getByText('Theo dõi và xử lý các đơn hàng của cửa hàng.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hôm nay:/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+ Tạo đơn hàng' }),
    ).toBeInTheDocument();

    // Stats
    expect(screen.getAllByText('4')[0]).toBeInTheDocument();

    // Table Headers
    expect(screen.getByText('Mã đơn')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Khách hàng')).toBeInTheDocument();
    expect(screen.getByText('Tổng tiền')).toBeInTheDocument();
    expect(screen.getByText('Trạng thái')).toBeInTheDocument();
    expect(screen.getByText('Thao tác')).toBeInTheDocument();

    // Order 1 checks
    const code1Link = screen.getByRole('link', { name: 'ORD-001' });
    expect(code1Link).toHaveAttribute('href', '/admin/orders/ord-1');
    expect(screen.getByText('Xịt Thơm Classic')).toBeInTheDocument();
    expect(screen.getByText(/• Chanh Sả/)).toBeInTheDocument();
    expect(screen.getByText('+1 sản phẩm khác')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('0912345678')).toBeInTheDocument();
    expect(
      screen.getByText('123 Lê Lợi, Phường Bến Nghé, Quận 1, TP Hồ Chí Minh'),
    ).toBeInTheDocument();

    const row1 = screen.getByText('ORD-001').closest('tr')!;
    expect(row1.querySelectorAll('td')[4]).toHaveTextContent('Chờ thanh toán');
    expect(screen.getAllByText('Chờ thanh toán').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(within(row1).getByText('COD')).toBeInTheDocument();

    const productImg = screen.getByRole('img', { name: 'Product' });
    expect(productImg).toHaveAttribute(
      'src',
      'https://example.com/classic.png',
    );

    // Order 2 checks (fallback email, fallback phone, simple address, empty scent)
    const code2Link = screen.getByRole('link', { name: 'ORD-002' });
    expect(code2Link).toHaveAttribute('href', '/admin/orders/ord-2');
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('456 Phố Huế, Hà Nội')).toBeInTheDocument();

    const row2 = screen.getByText('ORD-002').closest('tr')!;
    expect(row2.querySelectorAll('td')[4]).toHaveTextContent('Đã thanh toán');
    expect(screen.getAllByText('Đã thanh toán').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(within(row2).getByText('VNPAY')).toBeInTheDocument();

    // Order 3 checks (undefined user, empty address, undefined items)
    expect(screen.getByText('ORD-003')).toBeInTheDocument();

    const row3 = screen.getByText('ORD-003').closest('tr')!;
    expect(row3.querySelectorAll('td')[4]).toHaveTextContent('Đang đóng gói');
    expect(screen.getAllByText('Đang đóng gói').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(within(row3).getByText('MOMO')).toBeInTheDocument();

    // Fallback phone count: ord-2 and ord-3 both display 'Chưa cập nhật SĐT'
    const fallbackPhones = screen.getAllByText('Chưa cập nhật SĐT');
    expect(fallbackPhones.length).toBeGreaterThanOrEqual(2);

    // Order 4 checks (empty address object, user name without email)
    expect(screen.getByText('ORD-004')).toBeInTheDocument();
    expect(screen.getByText('Trần Văn B')).toBeInTheDocument();

    const row4 = screen.getByText('ORD-004').closest('tr')!;
    expect(row4.querySelectorAll('td')[4]).toHaveTextContent('Đang giao hàng');
    expect(screen.getAllByText('Đang giao hàng').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(within(row4).getByText('COD')).toBeInTheDocument();

    // Detail action eye buttons
    const viewLink = within(row1).getByRole('link', {
      name: 'Xem chi tiết đơn hàng ORD-001',
    });
    expect(viewLink).toHaveAttribute('href', '/admin/orders/ord-1');
  });

  it('renders order with unknown status and invalid addressJson, exercising fallbacks', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [mockOrders[4]], // ORD-005 with UNKNOWN_STATUS and '{invalid-json'
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('ORD-005')).toBeInTheDocument();

    const row = screen.getByText('ORD-005').closest('tr')!;
    // StatusBadge in cell 4 renders unknown status label fallback
    expect(row.querySelectorAll('td')[4]).toHaveTextContent('UNKNOWN_STATUS');
    expect(screen.getAllByText('UNKNOWN_STATUS').length).toBeGreaterThanOrEqual(
      1,
    );

    // Quick status update select renders fallback option
    expect(
      within(row).getByTestId('select-item-UNKNOWN_STATUS'),
    ).toBeInTheDocument();
  });

  it('renders orders with DELIVERED, CANCELED, and REFUNDED statuses and allowed transitions', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: mockOrdersOtherStatuses,
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByText('ORD-006')).toBeInTheDocument();
    const row6 = screen.getByText('ORD-006').closest('tr')!;
    expect(row6.querySelectorAll('td')[4]).toHaveTextContent('Giao thành công');
    expect(
      screen.getAllByText('Giao thành công').length,
    ).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('ORD-007')).toBeInTheDocument();
    const row7 = screen.getByText('ORD-007').closest('tr')!;
    expect(row7.querySelectorAll('td')[4]).toHaveTextContent('Đã hủy');
    expect(screen.getAllByText('Đã hủy').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('ORD-008')).toBeInTheDocument();
    const row8 = screen.getByText('ORD-008').closest('tr')!;
    expect(row8.querySelectorAll('td')[4]).toHaveTextContent('Đã hoàn tiền');
    expect(screen.getAllByText('Đã hoàn tiền').length).toBeGreaterThanOrEqual(
      1,
    );

    // DELIVERED has allowed next status REFUNDED
    expect(
      within(row6).getByTestId('select-item-REFUNDED'),
    ).toBeInTheDocument();

    // CANCELED has empty allowed next statuses
    expect(
      within(row7).getByTestId('select-item-CANCELED'),
    ).toBeInTheDocument();
  });

  it('filters orders by status and resets page to 1', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    // Initial call has status: undefined because filter is 'ALL'
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: undefined, page: 1 }),
    );

    // Select 'PAID' from the status filter options
    const filterPaidOption = screen.getAllByTestId('select-item-PAID')[0];
    fireEvent.click(filterPaidOption);

    // useAdminOrders should be called with status: 'PAID' and page: 1
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'PAID', page: 1 }),
    );

    // Select 'ALL' again
    const allOption = screen.getByTestId('select-item-ALL');
    fireEvent.click(allOption);

    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: undefined, page: 1 }),
    );
  });

  it('debounces search input and triggers useAdminOrders with debounced search query', () => {
    vi.useFakeTimers();

    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoading: false,
      isError: false,
    });

    try {
      renderPage();

      const searchInput = screen.getByPlaceholderText(
        'Tìm kiếm theo mã đơn, khách hàng...',
      );

      expect(mockUseAdminOrders).toHaveBeenCalledWith(
        expect.objectContaining({ search: '' }),
      );

      fireEvent.change(searchInput, { target: { value: 'ORD-999' } });

      // Before 500ms debounce
      expect(mockUseAdminOrders).not.toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'ORD-999' }),
      );

      // Advance by 500ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'ORD-999', page: 1 }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears previous debounce timer when search input changes repeatedly within 500ms', () => {
    vi.useFakeTimers();

    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoading: false,
      isError: false,
    });

    try {
      renderPage();

      const searchInput = screen.getByPlaceholderText(
        'Tìm kiếm theo mã đơn, khách hàng...',
      );

      fireEvent.change(searchInput, { target: { value: 'A' } });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Change before 500ms passes
      fireEvent.change(searchInput, { target: { value: 'AB' } });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockUseAdminOrders).not.toHaveBeenCalledWith(
        expect.objectContaining({ search: 'A' }),
      );

      // Advance remaining 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'AB', page: 1 }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('triggers updateStatusMutation on row status select and handles onSuccess toast', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [mockOrders[0]], // ORD-001 with status PENDING_PAYMENT
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    const row = screen.getByText('ORD-001').closest('tr')!;
    const paidOption = within(row).getByTestId('select-item-PAID');

    fireEvent.click(paidOption);

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      { orderId: 'ord-1', status: 'PAID' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );

    const { onSuccess } = mockMutate.mock.calls[0][1];

    act(() => {
      onSuccess();
    });

    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    const toastNode = mockToastSuccess.mock.calls[0][0];
    const { getByText } = render(toastNode);
    expect(getByText('Cập nhật trạng thái thành công!')).toBeInTheDocument();
    expect(
      getByText('Đơn hàng #ORD-001 đã chuyển sang Đã thanh toán'),
    ).toBeInTheDocument();
  });

  it('handles onError callback in updateStatusMutation when error response message is a string', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [mockOrders[0]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    const row = screen.getByText('ORD-001').closest('tr')!;
    const canceledOption = within(row).getByTestId('select-item-CANCELED');

    fireEvent.click(canceledOption);

    const { onError } = mockMutate.mock.calls[0][1];

    act(() => {
      onError({
        response: {
          data: {
            message: 'Đơn hàng không thể hủy ở trạng thái này.',
          },
        },
      });
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'Đơn hàng không thể hủy ở trạng thái này.',
    );
  });

  it('handles onError callback in updateStatusMutation with default message when error response message is not a string', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: [mockOrders[0]],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    const row = screen.getByText('ORD-001').closest('tr')!;
    const canceledOption = within(row).getByTestId('select-item-CANCELED');

    fireEvent.click(canceledOption);

    const { onError } = mockMutate.mock.calls[0][1];

    // Non-string message (e.g. object, number)
    act(() => {
      onError({
        response: {
          data: {
            message: { detail: 'Unknown error' },
          },
        },
      });
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'Cập nhật thất bại. Vui lòng thử lại.',
    );

    // Undefined error argument
    act(() => {
      onError(undefined);
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'Cập nhật thất bại. Vui lòng thử lại.',
    );
  });

  it('handles pagination controls: previous, next, and boundary states', () => {
    mockUseAdminOrders.mockReturnValue({
      data: {
        data: mockOrders,
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, ' ').trim() === 'Trang 1 / 3',
      ),
    ).toBeInTheDocument();
    const prevButton = screen.getByRole('button', { name: /Trước/ });
    const nextButton = screen.getByRole('button', { name: /Sau/ });

    // Page 1: Prev is disabled, Next is enabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Clicking disabled Prev button exercises Math.max(1, p - 1) boundary
    fireEvent.click(prevButton);
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 }),
    );

    // Click Next button to go to page 2
    fireEvent.click(nextButton);
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );

    // Click Next button again to go to page 3
    fireEvent.click(nextButton);
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 }),
    );

    // Clicking Next when on last page exercises Math.min(totalPages, p + 1) boundary
    fireEvent.click(nextButton);
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 }),
    );

    // Click Prev button to go back to page 2
    fireEvent.click(prevButton);
    expect(mockUseAdminOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });
});
