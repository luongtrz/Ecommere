import React, { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAdminOrders,
  useAdminOrder,
  useUpdateOrderStatus,
} from './useAdminOrders';
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  type AdminOrder,
  type AdminOrdersResponse,
  type AdminOrdersFilter,
  type OrderStatus,
} from '../api/admin-orders.api';

vi.mock('../api/admin-orders.api', () => ({
  getAdminOrders: vi.fn(),
  getAdminOrderById: vi.fn(),
  updateOrderStatus: vi.fn(),
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
  return function TestWrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('useAdminOrders hooks', () => {
  const mockedGetAdminOrders = vi.mocked(getAdminOrders);
  const mockedGetAdminOrderById = vi.mocked(getAdminOrderById);
  const mockedUpdateOrderStatus = vi.mocked(updateOrderStatus);

  const mockAdminOrder: AdminOrder = {
    id: 'order-101',
    code: 'ORD-101',
    userId: 'user-001',
    status: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    paymentMethod: 'COD',
    subtotal: 500000,
    discount: 50000,
    shippingFee: 30000,
    total: 480000,
    addressJson: JSON.stringify({ street: '123 Nguyễn Trãi', city: 'Hà Nội' }),
    couponCode: 'GIAM50K',
    notes: 'Giao giờ hành chính',
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    user: {
      id: 'user-001',
      email: 'khachhang@example.com',
      name: 'Nguyễn Văn B',
      phone: '0912345678',
    },
    items: [
      {
        id: 'item-1',
        productId: 'prod-001',
        variantId: 'var-001',
        nameSnapshot: 'Nước hoa Charme King 100ml',
        scentSnapshot: 'Hương Gỗ',
        volumeSnapshot: 100,
        quantity: 1,
        unitPrice: 500000,
        lineTotal: 500000,
      },
    ],
  };

  const mockOrdersResponse: AdminOrdersResponse = {
    data: [mockAdminOrder],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminOrders', () => {
    it('fetches orders using default empty filter when no arguments are provided', async () => {
      mockedGetAdminOrders.mockResolvedValueOnce(mockOrdersResponse);
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminOrders(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedGetAdminOrders).toHaveBeenCalledWith({});
      expect(result.current.data).toEqual(mockOrdersResponse);
    });

    it('fetches orders using custom filter parameters', async () => {
      const customFilter: AdminOrdersFilter = {
        page: 2,
        limit: 10,
        status: 'PAID' as OrderStatus,
        search: 'ORD-101',
      };
      const filteredResponse: AdminOrdersResponse = {
        ...mockOrdersResponse,
        page: 2,
        limit: 10,
      };
      mockedGetAdminOrders.mockResolvedValueOnce(filteredResponse);
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminOrders(customFilter), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedGetAdminOrders).toHaveBeenCalledWith(customFilter);
      expect(result.current.data).toEqual(filteredResponse);
    });

    it('handles query error when fetching orders list fails', async () => {
      const error = new Error('Lỗi lấy danh sách đơn hàng');
      mockedGetAdminOrders.mockRejectedValueOnce(error);
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminOrders(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect((result.current.error as Error).message).toBe(
        'Lỗi lấy danh sách đơn hàng',
      );
    });
  });

  describe('useAdminOrder', () => {
    it('fetches order details when a valid orderId is given', async () => {
      mockedGetAdminOrderById.mockResolvedValueOnce(mockAdminOrder);
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminOrder('order-101'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedGetAdminOrderById).toHaveBeenCalledWith('order-101');
      expect(result.current.data).toEqual(mockAdminOrder);
    });

    it('does not trigger fetch when orderId is empty string', () => {
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminOrder(''), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(mockedGetAdminOrderById).not.toHaveBeenCalled();
    });

    it('handles query error when fetching order detail fails', async () => {
      const error = new Error('Không tìm thấy chi tiết đơn hàng');
      mockedGetAdminOrderById.mockRejectedValueOnce(error);
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminOrder('order-invalid'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect((result.current.error as Error).message).toBe(
        'Không tìm thấy chi tiết đơn hàng',
      );
    });
  });

  describe('useUpdateOrderStatus', () => {
    const updatePayload: { orderId: string; status: OrderStatus } = {
      orderId: 'order-101',
      status: 'SHIPPED',
    };

    it('updates order status and invalidates orders and dashboard-stats queries on success', async () => {
      const updatedOrder: AdminOrder = {
        ...mockAdminOrder,
        status: 'SHIPPED',
      };
      mockedUpdateOrderStatus.mockResolvedValueOnce(updatedOrder);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateOrderStatus(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(updatePayload);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedUpdateOrderStatus).toHaveBeenCalledWith(
        updatePayload.orderId,
        updatePayload.status,
      );
      expect(result.current.data).toEqual(updatedOrder);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'orders'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'dashboard-stats'],
      });
    });

    it('handles mutation error and does not invalidate queries on failure', async () => {
      const error = new Error('Cập nhật trạng thái đơn hàng thất bại');
      mockedUpdateOrderStatus.mockRejectedValueOnce(error);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateOrderStatus(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(updatePayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });
});
