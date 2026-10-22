import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api';
import { getDashboardStats } from './admin.api';
import { ZodError } from 'zod';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRawStatsData = {
    revenue: {
      totalRevenue: 150000000,
      monthlyRevenue: 25000000,
      monthlyChange: 12.5,
    },
    orders: {
      totalOrders: 1250,
      monthlyOrders: 180,
      monthlyChange: 5.2,
      pendingOrders: 14,
      shippingOrders: 28,
    },
    products: {
      totalProducts: 45,
      activeProducts: 40,
      newProductsThisMonth: 6,
      lowStockProducts: 3,
    },
    customers: {
      totalCustomers: 890,
      newCustomersThisMonth: 65,
      monthlyChange: 8.1,
    },
    recentOrders: [
      {
        id: 'ord-1',
        orderNumber: 'ORD-2026-001',
        customerName: 'Nguyễn Văn A',
        totalAmount: 350000,
        status: 'PAID',
        createdAt: '2026-03-15T08:30:00.000Z',
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-2026-002',
        customerName: 'Trần Thị B',
        totalAmount: 520000,
        status: 'SHIPPED',
        createdAt: '2026-03-15T09:15:00.000Z',
      },
    ],
    topProducts: [
      {
        id: 'prod-1',
        name: 'Chai xịt đuổi chuột Thái Lan 500ml',
        imageUrl: '/images/rat-repellent.jpg',
        soldQuantity: 340,
        revenue: 40800000,
      },
      {
        id: 'prod-2',
        name: 'Chai xịt phòng hương Bạc Hà',
        imageUrl: null,
        soldQuantity: 210,
        revenue: 25200000,
      },
    ],
    revenueHistory: [
      { name: 'T1', total: 18000000 },
      { name: 'T2', total: 22000000 },
      { name: 'T3', total: 25000000 },
    ],
  };

  describe('getDashboardStats', () => {
    it('fetches dashboard stats from /admin/dashboard/stats and parses response data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockRawStatsData },
      });

      const stats = await getDashboardStats();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard/stats');

      expect(stats.revenue).toEqual(mockRawStatsData.revenue);
      expect(stats.orders).toEqual(mockRawStatsData.orders);
      expect(stats.products).toEqual(mockRawStatsData.products);
      expect(stats.customers).toEqual(mockRawStatsData.customers);
      expect(stats.topProducts).toEqual(mockRawStatsData.topProducts);
      expect(stats.revenueHistory).toEqual(mockRawStatsData.revenueHistory);

      expect(stats.recentOrders).toHaveLength(2);
      expect(stats.recentOrders[0].id).toBe('ord-1');
      expect(stats.recentOrders[0].orderNumber).toBe('ORD-2026-001');
      expect(stats.recentOrders[0].customerName).toBe('Nguyễn Văn A');
      expect(stats.recentOrders[0].totalAmount).toBe(350000);
      expect(stats.recentOrders[0].status).toBe('PAID');
      expect(stats.recentOrders[0].createdAt).toBeInstanceOf(Date);
      expect(stats.recentOrders[0].createdAt.toISOString()).toBe(
        '2026-03-15T08:30:00.000Z',
      );

      expect(stats.recentOrders[1].createdAt).toBeInstanceOf(Date);
      expect(stats.recentOrders[1].createdAt.toISOString()).toBe(
        '2026-03-15T09:15:00.000Z',
      );
    });

    it('parses all allowed recent order statuses correctly', async () => {
      const allowedStatuses = [
        'PENDING_PAYMENT',
        'PAID',
        'PACKING',
        'SHIPPED',
        'DELIVERED',
        'CANCELED',
        'REFUNDED',
      ] as const;

      const dataWithAllStatuses = {
        ...mockRawStatsData,
        recentOrders: allowedStatuses.map((status, index) => ({
          id: `ord-status-${index}`,
          orderNumber: `ORD-${index}`,
          customerName: `Khách hàng ${index}`,
          totalAmount: 100000 * (index + 1),
          status,
          createdAt: '2026-03-01T00:00:00.000Z',
        })),
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: dataWithAllStatuses },
      });

      const stats = await getDashboardStats();

      expect(stats.recentOrders.map((o) => o.status)).toEqual(allowedStatuses);
    });

    it('handles empty arrays for recentOrders, topProducts, and revenueHistory', async () => {
      const dataWithEmptyArrays = {
        ...mockRawStatsData,
        recentOrders: [],
        topProducts: [],
        revenueHistory: [],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: dataWithEmptyArrays },
      });

      const stats = await getDashboardStats();

      expect(stats.recentOrders).toEqual([]);
      expect(stats.topProducts).toEqual([]);
      expect(stats.revenueHistory).toEqual([]);
    });

    it('rejects when apiClient.get encounters a network error', async () => {
      const networkError = new Error('Network failure');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      await expect(getDashboardStats()).rejects.toThrow('Network failure');
      expect(apiClient.get).toHaveBeenCalledWith('/admin/dashboard/stats');
    });

    it('rejects when apiClient.get returns an HTTP error status', async () => {
      const httpError = {
        response: {
          status: 500,
          data: { message: 'Lỗi máy chủ nội bộ' },
        },
      };
      vi.mocked(apiClient.get).mockRejectedValueOnce(httpError);

      await expect(getDashboardStats()).rejects.toEqual(httpError);
    });

    it('throws ZodError when response data fails schema validation due to missing fields', async () => {
      const incompleteData = {
        revenue: {
          totalRevenue: 100000,
          // monthlyRevenue and monthlyChange missing
        },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: incompleteData },
      });

      await expect(getDashboardStats()).rejects.toThrow(ZodError);
    });

    it('throws ZodError when order status is invalid', async () => {
      const invalidStatusData = {
        ...mockRawStatsData,
        recentOrders: [
          {
            ...mockRawStatsData.recentOrders[0],
            status: 'INVALID_STATUS',
          },
        ],
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: invalidStatusData },
      });

      await expect(getDashboardStats()).rejects.toThrow(ZodError);
    });

    it('throws ZodError when response.data.data is undefined or null', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {},
      });

      await expect(getDashboardStats()).rejects.toThrow(ZodError);
    });
  });
});
