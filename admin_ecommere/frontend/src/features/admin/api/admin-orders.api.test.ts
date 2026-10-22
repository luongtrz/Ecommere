import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api';
import {
  orderStatusEnum,
  orderItemSchema,
  adminOrderSchema,
  adminOrdersResponseSchema,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  type OrderStatus,
} from './admin-orders.api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('admin-orders.api', () => {
  const mockedApiClient = vi.mocked(apiClient);

  const mockRawOrderItem = {
    id: 'item-001',
    productId: 'prod-001',
    variantId: 'var-001',
    nameSnapshot: 'Nước hoa Nam Cao Cấp',
    scentSnapshot: 'Hương Gỗ Trầm',
    volumeSnapshot: 50,
    quantity: 2,
    unitPrice: 450000,
    lineTotal: 900000,
    variant: {
      id: 'var-001',
      sku: 'SKU-NAM-50',
      scent: 'Hương Gỗ Trầm',
      volumeMl: 50,
      product: {
        id: 'prod-001',
        name: 'Nước hoa Nam Cao Cấp',
        images: ['https://example.com/p1.jpg'],
      },
    },
  };

  const mockRawOrder = {
    id: 'order-001',
    code: 'ORD-2026-001',
    userId: 'user-001',
    status: 'PENDING_PAYMENT' as const,
    paymentStatus: 'PENDING' as const,
    paymentMethod: 'COD',
    subtotal: 900000,
    discount: 50000,
    shippingFee: 30000,
    total: 880000,
    addressJson: JSON.stringify({
      street: '123 Đường Nguyễn Huệ',
      city: 'TP Hồ Chí Minh',
    }),
    couponCode: 'SALE50',
    notes: 'Giao hàng trong giờ hành chính',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T09:30:00.000Z',
    user: {
      id: 'user-001',
      email: 'customer@example.com',
      name: 'Nguyễn Văn A',
      phone: '0901234567',
    },
    items: [mockRawOrderItem],
  };

  const mockRawOrdersResponse = {
    data: [mockRawOrder],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Schemas', () => {
    describe('orderStatusEnum', () => {
      const validStatuses: OrderStatus[] = [
        'PENDING_PAYMENT',
        'PAID',
        'PACKING',
        'SHIPPED',
        'DELIVERED',
        'CANCELED',
        'REFUNDED',
      ];

      it.each(validStatuses)('parses valid status "%s"', (status) => {
        expect(orderStatusEnum.parse(status)).toBe(status);
      });

      it('rejects invalid order status string', () => {
        const result = orderStatusEnum.safeParse('INVALID_STATUS');
        expect(result.success).toBe(false);
      });
    });

    describe('orderItemSchema', () => {
      it('parses valid order item with full variant and product details', () => {
        const parsed = orderItemSchema.parse(mockRawOrderItem);
        expect(parsed.id).toBe('item-001');
        expect(parsed.nameSnapshot).toBe('Nước hoa Nam Cao Cấp');
        expect(parsed.variant?.product?.images).toEqual([
          'https://example.com/p1.jpg',
        ]);
      });

      it('parses order item without optional variant', () => {
        const { variant, ...itemWithoutVariant } = mockRawOrderItem;
        const parsed = orderItemSchema.parse(itemWithoutVariant);
        expect(parsed.variant).toBeUndefined();
        expect(parsed.quantity).toBe(2);
      });

      it('parses order item with variant lacking optional product', () => {
        const itemWithVariantNoProduct = {
          ...mockRawOrderItem,
          variant: {
            id: 'var-002',
            sku: 'SKU-002',
            scent: 'Hoa hồng',
            volumeMl: 100,
          },
        };
        const parsed = orderItemSchema.parse(itemWithVariantNoProduct);
        expect(parsed.variant?.product).toBeUndefined();
      });

      it('parses order item with product lacking optional images', () => {
        const itemWithoutImages = {
          ...mockRawOrderItem,
          variant: {
            id: 'var-003',
            sku: 'SKU-003',
            scent: 'Vani',
            volumeMl: 30,
            product: {
              id: 'prod-003',
              name: 'Nước hoa Vani',
            },
          },
        };
        const parsed = orderItemSchema.parse(itemWithoutImages);
        expect(parsed.variant?.product?.images).toBeUndefined();
      });

      it('fails validation when required fields are missing or wrong type', () => {
        expect(orderItemSchema.safeParse({}).success).toBe(false);
        expect(
          orderItemSchema.safeParse({
            ...mockRawOrderItem,
            quantity: 'not-a-number',
          }).success,
        ).toBe(false);
      });
    });

    describe('adminOrderSchema', () => {
      it('parses order and transforms createdAt and updatedAt strings into Date instances', () => {
        const parsed = adminOrderSchema.parse(mockRawOrder);
        expect(parsed.id).toBe('order-001');
        expect(parsed.createdAt).toBeInstanceOf(Date);
        expect(parsed.updatedAt).toBeInstanceOf(Date);
        expect(parsed.createdAt.toISOString()).toBe('2026-03-01T08:00:00.000Z');
        expect(parsed.updatedAt.toISOString()).toBe('2026-03-01T09:30:00.000Z');
      });

      it('parses order with null couponCode and notes', () => {
        const orderWithNulls = {
          ...mockRawOrder,
          couponCode: null,
          notes: null,
        };
        const parsed = adminOrderSchema.parse(orderWithNulls);
        expect(parsed.couponCode).toBeNull();
        expect(parsed.notes).toBeNull();
      });

      it('parses order without optional user and items', () => {
        const { user, items, ...orderWithoutUserAndItems } = mockRawOrder;
        const parsed = adminOrderSchema.parse(orderWithoutUserAndItems);
        expect(parsed.user).toBeUndefined();
        expect(parsed.items).toBeUndefined();
      });

      it('parses order with user having nullable/optional fields', () => {
        const orderWithNullableUser = {
          ...mockRawOrder,
          user: {
            id: 'user-002',
            email: null,
            name: null,
            phone: null,
          },
        };
        const parsed = adminOrderSchema.parse(orderWithNullableUser);
        expect(parsed.user?.email).toBeNull();
        expect(parsed.user?.name).toBeNull();
        expect(parsed.user?.phone).toBeNull();
      });

      it('parses order with user having undefined fields', () => {
        const orderWithEmptyUser = {
          ...mockRawOrder,
          user: {
            id: 'user-003',
          },
        };
        const parsed = adminOrderSchema.parse(orderWithEmptyUser);
        expect(parsed.user?.email).toBeUndefined();
        expect(parsed.user?.name).toBeUndefined();
        expect(parsed.user?.phone).toBeUndefined();
      });

      it.each(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const)(
        'parses paymentStatus "%s"',
        (paymentStatus) => {
          const parsed = adminOrderSchema.parse({
            ...mockRawOrder,
            paymentStatus,
          });
          expect(parsed.paymentStatus).toBe(paymentStatus);
        },
      );

      it('fails validation on invalid paymentStatus or status', () => {
        expect(
          adminOrderSchema.safeParse({
            ...mockRawOrder,
            paymentStatus: 'UNKNOWN_STATUS',
          }).success,
        ).toBe(false);

        expect(
          adminOrderSchema.safeParse({
            ...mockRawOrder,
            status: 'UNKNOWN_STATUS',
          }).success,
        ).toBe(false);
      });
    });

    describe('adminOrdersResponseSchema', () => {
      it('parses response and preserves passthrough properties', () => {
        const parsed = adminOrdersResponseSchema.parse({
          ...mockRawOrdersResponse,
          extraMetric: 1234,
        });

        expect(parsed.total).toBe(1);
        expect(parsed.page).toBe(1);
        expect(parsed.limit).toBe(10);
        expect(parsed.totalPages).toBe(1);
        expect(parsed.data).toHaveLength(1);
        expect((parsed as Record<string, unknown>).extraMetric).toBe(1234);
        expect((parsed as Record<string, unknown>).hasNextPage).toBe(false);
      });

      it('fails validation when required fields like total or totalPages are missing', () => {
        expect(
          adminOrdersResponseSchema.safeParse({
            data: [],
            page: 1,
          }).success,
        ).toBe(false);
      });
    });
  });

  describe('getAdminOrders', () => {
    it('fetches admin orders with default empty filter and parses response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockRawOrdersResponse,
        },
      });

      const result = await getAdminOrders();

      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders', {
        params: {},
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('order-001');
      expect(result.data[0].createdAt).toBeInstanceOf(Date);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('fetches admin orders with custom filter parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            ...mockRawOrdersResponse,
            page: 2,
            limit: 20,
            totalPages: 5,
          },
        },
      });

      const filter = {
        page: 2,
        limit: 20,
        status: 'PAID' as const,
        search: 'ORD-2026',
      };

      const result = await getAdminOrders(filter);

      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders', {
        params: filter,
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(5);
    });

    it('propagates error when apiClient.get fails', async () => {
      const networkError = new Error('Lỗi kết nối máy chủ');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      await expect(getAdminOrders()).rejects.toThrow('Lỗi kết nối máy chủ');
      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders', {
        params: {},
      });
    });

    it('throws validation error when backend returns invalid response shape', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: 'not-an-array',
            total: 'invalid',
          },
        },
      });

      await expect(getAdminOrders()).rejects.toThrow();
    });
  });

  describe('getAdminOrderById', () => {
    it('fetches single admin order by ID and returns parsed order', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockRawOrder,
        },
      });

      const result = await getAdminOrderById('order-001');

      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/orders/order-001');
      expect(result.id).toBe('order-001');
      expect(result.code).toBe('ORD-2026-001');
      expect(result.status).toBe('PENDING_PAYMENT');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.user?.name).toBe('Nguyễn Văn A');
    });

    it('propagates error when apiClient.get fails for getAdminOrderById', async () => {
      const notFoundError = new Error('Đơn hàng không tồn tại');
      vi.mocked(apiClient.get).mockRejectedValueOnce(notFoundError);

      await expect(getAdminOrderById('order-nonexistent')).rejects.toThrow(
        'Đơn hàng không tồn tại',
      );
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/orders/order-nonexistent',
      );
    });

    it('throws validation error when backend returns invalid order payload', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            id: 'order-001',
            // missing required fields: code, userId, status, total, etc.
          },
        },
      });

      await expect(getAdminOrderById('order-001')).rejects.toThrow();
    });
  });

  describe('updateOrderStatus', () => {
    it('updates order status via patch and returns parsed order', async () => {
      const updatedRawOrder = {
        ...mockRawOrder,
        status: 'SHIPPED' as const,
        updatedAt: '2026-03-01T15:00:00.000Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          data: updatedRawOrder,
        },
      });

      const result = await updateOrderStatus('order-001', 'SHIPPED');

      expect(mockedApiClient.patch).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/orders/order-001/status',
        { status: 'SHIPPED' },
      );
      expect(result.status).toBe('SHIPPED');
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt.toISOString()).toBe('2026-03-01T15:00:00.000Z');
    });

    it('propagates error when apiClient.patch fails', async () => {
      const patchError = new Error('Không thể cập nhật trạng thái đơn hàng');
      vi.mocked(apiClient.patch).mockRejectedValueOnce(patchError);

      await expect(updateOrderStatus('order-001', 'CANCELED')).rejects.toThrow(
        'Không thể cập nhật trạng thái đơn hàng',
      );

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/orders/order-001/status',
        { status: 'CANCELED' },
      );
    });

    it('throws validation error when backend returns unexpected data on status update', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: {
          data: {
            status: 'INVALID_STATUS',
          },
        },
      });

      await expect(
        updateOrderStatus('order-001', 'DELIVERED'),
      ).rejects.toThrow();
    });
  });
});
