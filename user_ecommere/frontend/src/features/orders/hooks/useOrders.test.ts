import { describe, expect, it, vi, beforeEach } from 'vitest';
import React, { type ReactNode } from 'react';
import {
  render,
  screen,
  renderHook,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrders, useOrderDetail, useCancelOrder } from './useOrders';
import { ordersApi } from '../api/orders.api';
import { QUERY_KEYS } from '@/lib/constants';

vi.mock('../api/orders.api', () => ({
  ordersApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    cancel: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockOrdersResponse = {
  orders: [
    {
      id: 'ord-101',
      code: 'ORD-2026-101',
      orderNumber: 'ORD-2026-101',
      status: 'PENDING_PAYMENT',
      total: 350000,
      shippingFee: 30000,
      items: [
        {
          id: 'item-1',
          name: 'Nước hoa Charme King 60ml',
          price: 320000,
          quantity: 1,
          image: 'https://example.com/king.jpg',
          productName: 'Charme King 60ml',
        },
      ],
      paymentMethod: 'COD',
      createdAt: '2026-03-01T08:00:00.000Z',
      shippingAddress: {
        fullName: 'Nguyễn Văn A',
        phone: '0912345678',
        address: '123 Lê Lợi, Quận 1',
        city: 'TP.HCM',
      },
    },
  ],
  total: 1,
  totalPages: 1,
};

const mockOrderDetail = {
  id: 'ord-101',
  code: 'ORD-2026-101',
  orderNumber: 'ORD-2026-101',
  status: 'PENDING_PAYMENT',
  total: 350000,
  shippingFee: 30000,
  items: [
    {
      id: 'item-1',
      name: 'Nước hoa Charme King 60ml',
      price: 320000,
      quantity: 1,
      image: 'https://example.com/king.jpg',
      productName: 'Charme King 60ml',
    },
  ],
  paymentMethod: 'COD',
  createdAt: '2026-03-01T08:00:00.000Z',
  shippingAddress: {
    fullName: 'Nguyễn Văn A',
    phone: '0912345678',
    address: '123 Lê Lợi, Quận 1',
    city: 'TP.HCM',
  },
};

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches orders with default page (1) and limit (10)', async () => {
    vi.mocked(ordersApi.getAll).mockResolvedValueOnce(
      mockOrdersResponse as any,
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ordersApi.getAll).toHaveBeenCalledWith(1, 10);
    expect(result.current.data).toEqual(mockOrdersResponse);

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: [QUERY_KEYS.ORDERS, 1, 10] });
    expect(query).toBeDefined();
    expect(
      (query?.options as { staleTime?: number } | undefined)?.staleTime,
    ).toBe(2 * 60 * 1000);
  });

  it('fetches orders with custom page and limit arguments', async () => {
    vi.mocked(ordersApi.getAll).mockResolvedValueOnce({
      orders: [],
      total: 0,
      totalPages: 0,
    } as any);

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useOrders(3, 25), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ordersApi.getAll).toHaveBeenCalledWith(3, 25);
    expect(result.current.data).toEqual({
      orders: [],
      total: 0,
      totalPages: 0,
    });
  });

  it('handles error state when ordersApi.getAll fails', async () => {
    vi.mocked(ordersApi.getAll).mockRejectedValueOnce(
      new Error('Lỗi máy chủ khi tải đơn hàng'),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Lỗi máy chủ khi tải đơn hàng');
    expect(result.current.data).toBeUndefined();
  });
});

describe('useOrderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches order detail when valid orderId is provided', async () => {
    vi.mocked(ordersApi.getById).mockResolvedValueOnce(mockOrderDetail as any);

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useOrderDetail('ord-101'), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ordersApi.getById).toHaveBeenCalledWith('ord-101');
    expect(result.current.data).toEqual(mockOrderDetail);

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: [QUERY_KEYS.ORDER_DETAIL, 'ord-101'] });
    expect(query).toBeDefined();
    expect(
      (query?.options as { staleTime?: number } | undefined)?.staleTime,
    ).toBe(5 * 60 * 1000);
  });

  it('does not trigger query when orderId is empty string (enabled: false)', () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useOrderDetail(''), {
      wrapper: createWrapper(queryClient),
    });

    expect(ordersApi.getById).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('handles error state when ordersApi.getById fails', async () => {
    vi.mocked(ordersApi.getById).mockRejectedValueOnce(
      new Error('Không tìm thấy đơn hàng #ord-999'),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useOrderDetail('ord-999'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      'Không tìm thấy đơn hàng #ord-999',
    );
    expect(result.current.data).toBeUndefined();
  });
});

describe('useCancelOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels order and invalidates both ORDERS and ORDER_DETAIL queries on success (mutateAsync)', async () => {
    vi.mocked(ordersApi.cancel).mockResolvedValueOnce({
      id: 'ord-101',
      status: 'CANCELED',
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCancelOrder(), {
      wrapper: createWrapper(queryClient),
    });

    let mutateResult: any;
    await act(async () => {
      mutateResult = await result.current.mutateAsync('ord-101');
    });

    expect(ordersApi.cancel).toHaveBeenCalledWith('ord-101');
    expect(mutateResult).toEqual({
      id: 'ord-101',
      status: 'CANCELED',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.ORDERS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.ORDER_DETAIL, 'ord-101'],
    });
  });

  it('cancels order using mutate callback style', async () => {
    vi.mocked(ordersApi.cancel).mockResolvedValueOnce({
      id: 'ord-202',
      status: 'CANCELED',
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCancelOrder(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate('ord-202');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(ordersApi.cancel).toHaveBeenCalledWith('ord-202');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.ORDERS],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.ORDER_DETAIL, 'ord-202'],
    });
  });

  it('handles error state and does not invalidate queries when cancel fails', async () => {
    vi.mocked(ordersApi.cancel).mockRejectedValueOnce(
      new Error('Đơn hàng không thể hủy ở trạng thái hiện tại'),
    );

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCancelOrder(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync('ord-303')).rejects.toThrow(
        'Đơn hàng không thể hủy ở trạng thái hiện tại',
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe(
      'Đơn hàng không thể hủy ở trạng thái hiện tại',
    );
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useOrders hooks in component lifecycle and interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TestOrdersHarness({ orderId }: { orderId?: string }) {
    const {
      data: ordersData,
      isLoading: isOrdersLoading,
      isError: isOrdersError,
    } = useOrders(1, 10);

    const { data: detailData, isLoading: isDetailLoading } = useOrderDetail(
      orderId || '',
    );

    const cancelMutation = useCancelOrder();

    if (isOrdersLoading || isDetailLoading) {
      return React.createElement('div', null, 'Đang tải đơn hàng...');
    }

    if (isOrdersError) {
      return React.createElement(
        'div',
        null,
        'Không thể tải danh sách đơn hàng',
      );
    }

    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { 'data-testid': 'orders-summary' },
        `${ordersData?.orders.length ?? 0} đơn hàng`,
      ),
      detailData &&
        React.createElement(
          'div',
          { 'data-testid': 'order-code' },
          detailData.orderNumber,
        ),
      React.createElement(
        'button',
        {
          onClick: () => cancelMutation.mutate('ord-101'),
          disabled: cancelMutation.isPending,
        },
        'Hủy đơn hàng',
      ),
      cancelMutation.isSuccess &&
        React.createElement(
          'div',
          { 'data-testid': 'cancel-status' },
          'Hủy đơn hàng thành công!',
        ),
      cancelMutation.isError &&
        React.createElement(
          'div',
          { 'data-testid': 'cancel-error' },
          'Hủy đơn hàng thất bại!',
        ),
    );
  }

  it('renders loading state initially and then renders orders and handles cancel interaction', async () => {
    const user = userEvent.setup();
    vi.mocked(ordersApi.getAll).mockResolvedValue(mockOrdersResponse as any);
    vi.mocked(ordersApi.getById).mockResolvedValue(mockOrderDetail as any);
    vi.mocked(ordersApi.cancel).mockResolvedValueOnce({
      id: 'ord-101',
      status: 'CANCELED',
    });

    const queryClient = createTestQueryClient();

    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestOrdersHarness, { orderId: 'ord-101' }),
      ),
    );

    expect(screen.getByText('Đang tải đơn hàng...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('orders-summary')).toHaveTextContent(
        '1 đơn hàng',
      );
    });

    expect(screen.getByTestId('order-code')).toHaveTextContent('ORD-2026-101');

    const cancelButton = screen.getByRole('button', { name: 'Hủy đơn hàng' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-status')).toHaveTextContent(
        'Hủy đơn hàng thành công!',
      );
    });

    expect(ordersApi.cancel).toHaveBeenCalledWith('ord-101');
  });

  it('renders error state when fetching orders in component fails', async () => {
    vi.mocked(ordersApi.getAll).mockRejectedValueOnce(
      new Error('Lỗi kết nối máy chủ'),
    );

    const queryClient = createTestQueryClient();

    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestOrdersHarness, { orderId: '' }),
      ),
    );

    await waitFor(() => {
      expect(
        screen.getByText('Không thể tải danh sách đơn hàng'),
      ).toBeInTheDocument();
    });
  });

  it('renders mutation error message when cancel fails in component', async () => {
    const user = userEvent.setup();
    vi.mocked(ordersApi.getAll).mockResolvedValue(mockOrdersResponse as any);
    vi.mocked(ordersApi.cancel).mockRejectedValueOnce(
      new Error('Lỗi hủy đơn hàng'),
    );

    const queryClient = createTestQueryClient();

    render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(TestOrdersHarness, { orderId: '' }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('orders-summary')).toHaveTextContent(
        '1 đơn hàng',
      );
    });

    const cancelButton = screen.getByRole('button', { name: 'Hủy đơn hàng' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByTestId('cancel-error')).toHaveTextContent(
        'Hủy đơn hàng thất bại!',
      );
    });
  });
});
