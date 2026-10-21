import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';

describe('AdminService (Coverage Companion)', () => {
  let service: AdminService;

  const mockPrismaService = {
    order: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    orderItem: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockPrismaService.order.aggregate.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should aggregate and return all dashboard statistics successfully', async () => {
      // 1. Revenue aggregates & history: handled via mockImplementation to avoid race condition in Promise.all
      mockPrismaService.order.aggregate.mockImplementation(
        async (params: any) => {
          const createdAt = params?.where?.createdAt;
          if (!createdAt) {
            // totalRevenueData (no createdAt filter)
            return { _sum: { total: 10000000 } };
          }
          if (createdAt.gte && createdAt.lt) {
            // lastMonthRevenueData
            return { _sum: { total: 2000000 } };
          }
          if (createdAt.gte && createdAt.lte) {
            // getRevenueHistory (has gte and lte)
            return { _sum: { total: 1000000 } };
          }
          if (createdAt.gte) {
            // monthlyRevenueData (only gte)
            return { _sum: { total: 3000000 } };
          }
          return { _sum: { total: 0 } };
        },
      );

      // 2. Order counts: total, monthly, lastMonth, pending, shipping
      mockPrismaService.order.count
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(45)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(8);

      // 3. Product counts & low stock: total, active, newThisMonth, low stock variants
      mockPrismaService.product.count
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(10);
      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        { productId: 'prod-1' },
        { productId: 'prod-2' },
      ]);

      // 4. Customer counts: total, newThisMonth, lastMonth
      mockPrismaService.user.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(20);

      // 5. Recent orders
      const orderDate = new Date('2026-03-01T10:00:00Z');
      mockPrismaService.order.findMany.mockResolvedValueOnce([
        {
          id: 'ord-1',
          code: 'ORD001',
          total: 500000,
          status: OrderStatus.PAID,
          createdAt: orderDate,
          user: { name: 'Nguyen Van A', email: 'a@example.com' },
        },
      ]);

      // 6. Top products: orderItem groupBy, product findMany, orderItem revenue groupBy
      mockPrismaService.orderItem.groupBy
        .mockResolvedValueOnce([
          {
            productId: 'prod-1',
            _sum: { quantity: 15 },
            _count: { productId: 1 },
          },
        ])
        .mockResolvedValueOnce([
          {
            productId: 'prod-1',
            _sum: { lineTotal: 1500000 },
          },
        ]);
      mockPrismaService.product.findMany.mockResolvedValueOnce([
        {
          id: 'prod-1',
          name: 'Nước hoa A',
          images: ['https://example.com/img1.png'],
        },
      ]);


      const result = await service.getDashboardStats();

      expect(result).toBeDefined();
      expect(result.revenue).toEqual({
        totalRevenue: 10000000,
        monthlyRevenue: 3000000,
        monthlyChange: 50,
      });
      expect(result.orders).toEqual({
        totalOrders: 150,
        monthlyOrders: 45,
        monthlyChange: 50,
        pendingOrders: 12,
        shippingOrders: 8,
      });
      expect(result.products).toEqual({
        totalProducts: 80,
        activeProducts: 70,
        newProductsThisMonth: 10,
        lowStockProducts: 2,
      });
      expect(result.customers).toEqual({
        totalCustomers: 200,
        newCustomersThisMonth: 25,
        monthlyChange: 25,
      });
      expect(result.recentOrders).toHaveLength(1);
      expect(result.recentOrders[0]).toEqual({
        id: 'ord-1',
        orderNumber: 'ORD001',
        customerName: 'Nguyen Van A',
        totalAmount: 500000,
        status: OrderStatus.PAID,
        createdAt: orderDate,
      });
      expect(result.topProducts).toHaveLength(1);
      expect(result.topProducts[0]).toEqual({
        id: 'prod-1',
        name: 'Nước hoa A',
        imageUrl: 'https://example.com/img1.png',
        soldQuantity: 15,
        revenue: 1500000,
      });
      expect(result.revenueHistory).toHaveLength(6);
    });

    it('should propagate error when one of the queries fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.order.aggregate.mockRejectedValue(dbError);

      await expect(service.getDashboardStats()).rejects.toThrow(dbError);
    });
  });

  describe('getRevenueStats (calculation branches)', () => {
    const firstDayOfMonth = new Date('2026-03-01T00:00:00Z');
    const firstDayOfLastMonth = new Date('2026-02-01T00:00:00Z');
    const lastDayOfLastMonth = new Date('2026-03-01T00:00:00Z');

    it('should calculate monthlyChange correctly when lastMonthRevenue > 0', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 5000000 } })
        .mockResolvedValueOnce({ _sum: { total: 3000000 } })
        .mockResolvedValueOnce({ _sum: { total: 2000000 } });

      const result = await (service as any).getRevenueStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result).toEqual({
        totalRevenue: 5000000,
        monthlyRevenue: 3000000,
        monthlyChange: 50,
      });
    });

    it('should set monthlyChange to 100 when lastMonthRevenue is 0 and monthlyRevenue > 0', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 1000000 } })
        .mockResolvedValueOnce({ _sum: { total: 1000000 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } });

      const result = await (service as any).getRevenueStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result).toEqual({
        totalRevenue: 1000000,
        monthlyRevenue: 1000000,
        monthlyChange: 100,
      });
    });

    it('should set monthlyChange to 0 when lastMonthRevenue is 0 and monthlyRevenue is 0', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } })
        .mockResolvedValueOnce({ _sum: { total: 0 } });

      const result = await (service as any).getRevenueStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result).toEqual({
        totalRevenue: 0,
        monthlyRevenue: 0,
        monthlyChange: 0,
      });
    });

    it('should fallback to 0 when _sum.total is null or undefined', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: null } })
        .mockResolvedValueOnce({ _sum: { total: null } })
        .mockResolvedValueOnce({ _sum: { total: null } });

      const result = await (service as any).getRevenueStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result).toEqual({
        totalRevenue: 0,
        monthlyRevenue: 0,
        monthlyChange: 0,
      });
    });

    it('should use default lastDayOfLastMonth when parameter is omitted', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 1000 } })
        .mockResolvedValueOnce({ _sum: { total: 1000 } })
        .mockResolvedValueOnce({ _sum: { total: 1000 } });

      await (service as any).getRevenueStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
      );

      expect(mockPrismaService.order.aggregate).toHaveBeenNthCalledWith(3, {
        where: {
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.PACKING,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
            ],
          },
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
        _sum: {
          total: true,
        },
      });
    });
  });

  describe('getOrderStats (calculation branches)', () => {
    const firstDayOfMonth = new Date('2026-03-01T00:00:00Z');
    const firstDayOfLastMonth = new Date('2026-02-01T00:00:00Z');
    const lastDayOfLastMonth = new Date('2026-03-01T00:00:00Z');

    it('should calculate monthlyChange correctly when lastMonthOrders > 0', async () => {
      mockPrismaService.order.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10);

      const result = await (service as any).getOrderStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result).toEqual({
        totalOrders: 100,
        monthlyOrders: 40,
        monthlyChange: 100,
        pendingOrders: 5,
        shippingOrders: 10,
      });
    });

    it('should set monthlyChange to 100 when lastMonthOrders is 0 and monthlyOrders > 0', async () => {
      mockPrismaService.order.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      const result = await (service as any).getOrderStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result.monthlyChange).toBe(100);
    });

    it('should set monthlyChange to 0 when lastMonthOrders is 0 and monthlyOrders is 0', async () => {
      mockPrismaService.order.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await (service as any).getOrderStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result.monthlyChange).toBe(0);
    });

    it('should use default lastDayOfLastMonth when omitted in getOrderStats', async () => {
      mockPrismaService.order.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      await (service as any).getOrderStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
      );

      expect(mockPrismaService.order.count).toHaveBeenNthCalledWith(3, {
        where: {
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
      });
    });
  });

  describe('getProductStats', () => {
    it('should query product counts and distinct low stock variants', async () => {
      const firstDayOfMonth = new Date('2026-03-01T00:00:00Z');

      mockPrismaService.product.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(45)
        .mockResolvedValueOnce(5);

      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        { productId: 'p1' },
        { productId: 'p2' },
        { productId: 'p3' },
      ]);

      const result = await (service as any).getProductStats(firstDayOfMonth);

      expect(result).toEqual({
        totalProducts: 50,
        activeProducts: 45,
        newProductsThisMonth: 5,
        lowStockProducts: 3,
      });

      expect(mockPrismaService.productVariant.findMany).toHaveBeenCalledWith({
        where: {
          stock: { lte: 10 },
          product: { active: true },
        },
        select: { productId: true },
        distinct: ['productId'],
      });
    });
  });

  describe('getCustomerStats (calculation branches)', () => {
    const firstDayOfMonth = new Date('2026-03-01T00:00:00Z');
    const firstDayOfLastMonth = new Date('2026-02-01T00:00:00Z');
    const lastDayOfLastMonth = new Date('2026-03-01T00:00:00Z');

    it('should calculate monthlyChange when lastMonthCustomers > 0', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(20);

      const result = await (service as any).getCustomerStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result).toEqual({
        totalCustomers: 100,
        newCustomersThisMonth: 30,
        monthlyChange: 50,
      });
    });

    it('should set monthlyChange to 100 when lastMonthCustomers is 0 and newCustomersThisMonth > 0', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0);

      const result = await (service as any).getCustomerStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result.monthlyChange).toBe(100);
    });

    it('should set monthlyChange to 0 when lastMonthCustomers is 0 and newCustomersThisMonth is 0', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await (service as any).getCustomerStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
        lastDayOfLastMonth,
      );

      expect(result.monthlyChange).toBe(0);
    });

    it('should use default lastDayOfLastMonth when omitted in getCustomerStats', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);

      await (service as any).getCustomerStats(
        firstDayOfMonth,
        firstDayOfLastMonth,
      );

      expect(mockPrismaService.user.count).toHaveBeenNthCalledWith(3, {
        where: {
          role: Role.CUSTOMER,
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
      });
    });
  });

  describe('getRecentOrders (name fallback branches)', () => {
    it('should return recent orders with customerName prioritizing name over email over fallback', async () => {
      const now = new Date();
      mockPrismaService.order.findMany.mockResolvedValueOnce([
        {
          id: 'ord-1',
          code: 'CODE1',
          total: 100000,
          status: OrderStatus.DELIVERED,
          createdAt: now,
          user: { name: 'Alice', email: 'alice@example.com' },
        },
        {
          id: 'ord-2',
          code: 'CODE2',
          total: 200000,
          status: OrderStatus.SHIPPED,
          createdAt: now,
          user: { name: '', email: 'bob@example.com' },
        },
        {
          id: 'ord-3',
          code: 'CODE3',
          total: 300000,
          status: OrderStatus.PACKING,
          createdAt: now,
          user: { name: null, email: '' },
        },
        {
          id: 'ord-4',
          code: 'CODE4',
          total: 400000,
          status: OrderStatus.PAID,
          createdAt: now,
          user: { name: null, email: null },
        },
      ]);

      const result = await (service as any).getRecentOrders();

      expect(result).toHaveLength(4);
      expect(result[0].customerName).toBe('Alice');
      expect(result[1].customerName).toBe('bob@example.com');
      expect(result[2].customerName).toBe('Khách hàng');
      expect(result[3].customerName).toBe('Khách hàng');

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });
  });

  describe('getTopProducts (mapping and fallback branches)', () => {
    const firstDayOfMonth = new Date('2026-03-01T00:00:00Z');

    it('should map top products with existing image, empty images, missing product, and default quantity/revenue', async () => {
      mockPrismaService.orderItem.groupBy
        .mockResolvedValueOnce([
          {
            productId: 'p-with-img',
            _sum: { quantity: 10 },
            _count: { productId: 1 },
          },
          {
            productId: 'p-empty-imgs',
            _sum: { quantity: null },
            _count: { productId: 1 },
          },
          {
            productId: 'p-null-imgs',
            _sum: { quantity: 5 },
            _count: { productId: 1 },
          },
          {
            productId: 'p-not-found',
            _sum: { quantity: 2 },
            _count: { productId: 1 },
          },
        ])
        .mockResolvedValueOnce([
          {
            productId: 'p-with-img',
            _sum: { lineTotal: 500000 },
          },
          {
            productId: 'p-empty-imgs',
            _sum: { lineTotal: null },
          },
          // p-null-imgs has no revenue entry
        ]);

      mockPrismaService.product.findMany.mockResolvedValueOnce([
        {
          id: 'p-with-img',
          name: 'Sản phẩm có ảnh',
          images: ['https://example.com/img1.png'],
        },
        {
          id: 'p-empty-imgs',
          name: 'Sản phẩm mảng ảnh rỗng',
          images: [],
        },
        {
          id: 'p-null-imgs',
          name: 'Sản phẩm ảnh null',
          images: null,
        },
      ]);

      const result = await (service as any).getTopProducts(firstDayOfMonth);

      expect(result).toHaveLength(4);

      // p-with-img
      expect(result[0]).toEqual({
        id: 'p-with-img',
        name: 'Sản phẩm có ảnh',
        imageUrl: 'https://example.com/img1.png',
        soldQuantity: 10,
        revenue: 500000,
      });

      // p-empty-imgs: quantity null -> 0, lineTotal null -> 0, images[] -> null
      expect(result[1]).toEqual({
        id: 'p-empty-imgs',
        name: 'Sản phẩm mảng ảnh rỗng',
        imageUrl: null,
        soldQuantity: 0,
        revenue: 0,
      });

      // p-null-imgs: no revenue entry -> 0, images null -> null
      expect(result[2]).toEqual({
        id: 'p-null-imgs',
        name: 'Sản phẩm ảnh null',
        imageUrl: null,
        soldQuantity: 5,
        revenue: 0,
      });

      // p-not-found: missing product in map -> name 'Unknown Product', imageUrl null
      expect(result[3]).toEqual({
        id: 'p-not-found',
        name: 'Unknown Product',
        imageUrl: null,
        soldQuantity: 2,
        revenue: 0,
      });

      expect(mockPrismaService.orderItem.groupBy).toHaveBeenNthCalledWith(1, {
        by: ['productId'],
        where: {
          order: {
            status: OrderStatus.DELIVERED,
            createdAt: {
              gte: firstDayOfMonth,
            },
          },
        },
        _sum: {
          quantity: true,
        },
        _count: {
          productId: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['p-with-img', 'p-empty-imgs', 'p-null-imgs', 'p-not-found'],
          },
        },
        select: {
          id: true,
          name: true,
          images: true,
        },
      });

      expect(mockPrismaService.orderItem.groupBy).toHaveBeenNthCalledWith(2, {
        by: ['productId'],
        where: {
          productId: {
            in: ['p-with-img', 'p-empty-imgs', 'p-null-imgs', 'p-not-found'],
          },
          order: {
            status: OrderStatus.DELIVERED,
          },
        },
        _sum: {
          lineTotal: true,
        },
      });
    });
  });

  describe('getRevenueHistory (history loop and total fallback)', () => {
    it('should query revenue for 6 months and default null total to 0', async () => {
      // 5 months return values, 1 month returns null total
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { total: 100000 } })
        .mockResolvedValueOnce({ _sum: { total: null } })
        .mockResolvedValueOnce({ _sum: { total: 300000 } })
        .mockResolvedValueOnce({ _sum: { total: 400000 } })
        .mockResolvedValueOnce({ _sum: { total: 500000 } })
        .mockResolvedValueOnce({ _sum: { total: 600000 } });

      const result = await (service as any).getRevenueHistory();

      expect(result).toHaveLength(6);
      result.forEach((monthData: any) => {
        expect(monthData).toHaveProperty('name');
        expect(monthData.name).toMatch(/^T\d{1,2}$/);
        expect(typeof monthData.total).toBe('number');
      });
      expect(result[1].total).toBe(0);
      expect(mockPrismaService.order.aggregate).toHaveBeenCalledTimes(6);
    });
  });
});
