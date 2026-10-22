import { describe, expect, it } from 'vitest';
import {
  revenueStatsSchema,
  orderStatsSchema,
  productStatsSchema,
  customerStatsSchema,
  recentOrderSchema,
  topProductSchema,
  revenueHistorySchema,
  dashboardStatsSchema,
  type RevenueStats,
  type OrderStats,
  type ProductStats,
  type CustomerStats,
  type RecentOrder,
  type TopProduct,
  type RevenueHistory,
  type DashboardStats,
} from './admin.types';

describe('admin.types schemas', () => {
  describe('revenueStatsSchema', () => {
    it('parses valid revenue stats data', () => {
      const validData: RevenueStats = {
        totalRevenue: 150000000,
        monthlyRevenue: 35000000,
        monthlyChange: 12.5,
      };

      const result = revenueStatsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('rejects missing or invalid types in revenue stats', () => {
      expect(revenueStatsSchema.safeParse({}).success).toBe(false);
      expect(
        revenueStatsSchema.safeParse({
          totalRevenue: '150000000',
          monthlyRevenue: 35000000,
          monthlyChange: 12.5,
        }).success,
      ).toBe(false);
    });
  });

  describe('orderStatsSchema', () => {
    it('parses valid order stats data', () => {
      const validData: OrderStats = {
        totalOrders: 540,
        monthlyOrders: 110,
        monthlyChange: -3.2,
        pendingOrders: 18,
        shippingOrders: 25,
      };

      const result = orderStatsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('rejects invalid order stats data', () => {
      expect(orderStatsSchema.safeParse(null).success).toBe(false);
      expect(
        orderStatsSchema.safeParse({
          totalOrders: 540,
          monthlyOrders: 110,
          monthlyChange: -3.2,
          // pendingOrders missing
          shippingOrders: 25,
        }).success,
      ).toBe(false);
    });
  });

  describe('productStatsSchema', () => {
    it('parses valid product stats data', () => {
      const validData: ProductStats = {
        totalProducts: 95,
        activeProducts: 90,
        newProductsThisMonth: 12,
        lowStockProducts: 4,
      };

      const result = productStatsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('rejects invalid product stats data', () => {
      expect(
        productStatsSchema.safeParse({
          totalProducts: 95,
          activeProducts: '90',
          newProductsThisMonth: 12,
          lowStockProducts: 4,
        }).success,
      ).toBe(false);
    });
  });

  describe('customerStatsSchema', () => {
    it('parses valid customer stats data', () => {
      const validData: CustomerStats = {
        totalCustomers: 1250,
        newCustomersThisMonth: 85,
        monthlyChange: 18.4,
      };

      const result = customerStatsSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('rejects invalid customer stats data', () => {
      expect(
        customerStatsSchema.safeParse({
          totalCustomers: 1250,
        }).success,
      ).toBe(false);
    });
  });

  describe('recentOrderSchema', () => {
    const rawOrder = {
      id: 'ord-101',
      orderNumber: 'ORD-2026-101',
      customerName: 'Nguyễn Văn Nam',
      totalAmount: 1250000,
      status: 'PENDING_PAYMENT' as const,
      createdAt: '2026-03-01T14:30:00.000Z',
    };

    it('parses valid recent order and transforms createdAt to a Date instance', () => {
      const result: RecentOrder = recentOrderSchema.parse(rawOrder);

      expect(result.id).toBe('ord-101');
      expect(result.orderNumber).toBe('ORD-2026-101');
      expect(result.customerName).toBe('Nguyễn Văn Nam');
      expect(result.totalAmount).toBe(1250000);
      expect(result.status).toBe('PENDING_PAYMENT');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.toISOString()).toBe('2026-03-01T14:30:00.000Z');
    });

    const allStatuses = [
      'PENDING_PAYMENT',
      'PAID',
      'PACKING',
      'SHIPPED',
      'DELIVERED',
      'CANCELED',
      'REFUNDED',
    ] as const;

    it.each(allStatuses)('accepts status "%s"', (status) => {
      const parsed = recentOrderSchema.parse({
        ...rawOrder,
        status,
      });
      expect(parsed.status).toBe(status);
    });

    it('rejects invalid order status', () => {
      expect(
        recentOrderSchema.safeParse({
          ...rawOrder,
          status: 'COMPLETED',
        }).success,
      ).toBe(false);
    });

    it('rejects non-string createdAt or missing required fields', () => {
      expect(
        recentOrderSchema.safeParse({
          ...rawOrder,
          createdAt: 123456789,
        }).success,
      ).toBe(false);

      expect(
        recentOrderSchema.safeParse({
          id: 'ord-101',
        }).success,
      ).toBe(false);
    });
  });

  describe('topProductSchema', () => {
    it('parses valid top product with string imageUrl', () => {
      const validProduct = {
        id: 'prod-01',
        name: 'Nước hoa Santal 33',
        imageUrl: 'https://example.com/santal33.jpg',
        soldQuantity: 150,
        revenue: 450000000,
      };

      const result: TopProduct = topProductSchema.parse(validProduct);
      expect(result.imageUrl).toBe('https://example.com/santal33.jpg');
      expect(result.soldQuantity).toBe(150);
      expect(result.revenue).toBe(450000000);
    });

    it('parses valid top product with null imageUrl', () => {
      const productWithNullImage = {
        id: 'prod-02',
        name: 'Nước hoa Aventus',
        imageUrl: null,
        soldQuantity: 95,
        revenue: 380000000,
      };

      const result = topProductSchema.parse(productWithNullImage);
      expect(result.imageUrl).toBeNull();
    });

    it('rejects invalid top product fields', () => {
      expect(
        topProductSchema.safeParse({
          id: 'prod-03',
          name: 'Nước hoa Lỗi',
          imageUrl: 12345, // invalid type
          soldQuantity: 10,
          revenue: 100000,
        }).success,
      ).toBe(false);
    });
  });

  describe('revenueHistorySchema', () => {
    it('parses valid revenue history entry', () => {
      const validEntry: RevenueHistory = {
        name: 'Tháng 01',
        total: 120000000,
      };

      const result = revenueHistorySchema.parse(validEntry);
      expect(result).toEqual(validEntry);
    });

    it('rejects invalid revenue history data', () => {
      expect(
        revenueHistorySchema.safeParse({
          name: 'Tháng 01',
          total: '120000000',
        }).success,
      ).toBe(false);
    });
  });

  describe('dashboardStatsSchema', () => {
    const validDashboardData = {
      revenue: {
        totalRevenue: 500000000,
        monthlyRevenue: 120000000,
        monthlyChange: 8.5,
      },
      orders: {
        totalOrders: 1200,
        monthlyOrders: 280,
        monthlyChange: 5.2,
        pendingOrders: 35,
        shippingOrders: 42,
      },
      products: {
        totalProducts: 150,
        activeProducts: 142,
        newProductsThisMonth: 15,
        lowStockProducts: 6,
      },
      customers: {
        totalCustomers: 3400,
        newCustomersThisMonth: 210,
        monthlyChange: 14.1,
      },
      recentOrders: [
        {
          id: 'rec-ord-1',
          orderNumber: 'ORD-2026-901',
          customerName: 'Hoàng Văn B',
          totalAmount: 2100000,
          status: 'PAID' as const,
          createdAt: '2026-03-02T10:00:00.000Z',
        },
        {
          id: 'rec-ord-2',
          orderNumber: 'ORD-2026-902',
          customerName: 'Phạm Thị D',
          totalAmount: 850000,
          status: 'DELIVERED' as const,
          createdAt: '2026-03-02T11:15:00.000Z',
        },
      ],
      topProducts: [
        {
          id: 'prod-top-1',
          name: 'Nước hoa Bleu',
          imageUrl: 'https://example.com/bleu.jpg',
          soldQuantity: 320,
          revenue: 640000000,
        },
        {
          id: 'prod-top-2',
          name: 'Nước hoa Sauvage',
          imageUrl: null,
          soldQuantity: 280,
          revenue: 560000000,
        },
      ],
      revenueHistory: [
        { name: 'Tháng 01', total: 95000000 },
        { name: 'Tháng 02', total: 110000000 },
        { name: 'Tháng 03', total: 120000000 },
      ],
    };

    it('parses complete dashboard stats and transforms recent order dates', () => {
      const result: DashboardStats =
        dashboardStatsSchema.parse(validDashboardData);

      expect(result.revenue.totalRevenue).toBe(500000000);
      expect(result.orders.totalOrders).toBe(1200);
      expect(result.products.totalProducts).toBe(150);
      expect(result.customers.totalCustomers).toBe(3400);

      expect(result.recentOrders).toHaveLength(2);
      expect(result.recentOrders[0].createdAt).toBeInstanceOf(Date);
      expect(result.recentOrders[1].createdAt).toBeInstanceOf(Date);
      expect(result.recentOrders[0].createdAt.toISOString()).toBe(
        '2026-03-02T10:00:00.000Z',
      );

      expect(result.topProducts).toHaveLength(2);
      expect(result.topProducts[0].imageUrl).toBe(
        'https://example.com/bleu.jpg',
      );
      expect(result.topProducts[1].imageUrl).toBeNull();

      expect(result.revenueHistory).toHaveLength(3);
      expect(result.revenueHistory[0].name).toBe('Tháng 01');
    });

    it('rejects when any nested schema component is missing or invalid', () => {
      const { revenue, ...dataWithoutRevenue } = validDashboardData;
      expect(dashboardStatsSchema.safeParse(dataWithoutRevenue).success).toBe(
        false,
      );

      const dataWithInvalidOrder = {
        ...validDashboardData,
        recentOrders: [
          {
            ...validDashboardData.recentOrders[0],
            status: 'UNKNOWN_STATUS',
          },
        ],
      };
      expect(dashboardStatsSchema.safeParse(dataWithInvalidOrder).success).toBe(
        false,
      );

      const dataWithInvalidTopProduct = {
        ...validDashboardData,
        topProducts: [
          {
            ...validDashboardData.topProducts[0],
            revenue: 'not-a-number',
          },
        ],
      };
      expect(
        dashboardStatsSchema.safeParse(dataWithInvalidTopProduct).success,
      ).toBe(false);

      const dataWithInvalidRevenueHistory = {
        ...validDashboardData,
        revenueHistory: [
          {
            name: 'Tháng 01',
            total: null,
          },
        ],
      };
      expect(
        dashboardStatsSchema.safeParse(dataWithInvalidRevenueHistory).success,
      ).toBe(false);
    });
  });
});
