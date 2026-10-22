import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import { CustomerQueryDto } from './dtos/customer-query.dto';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    order: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const REVENUE_ORDER_STATUSES = [
    OrderStatus.PAID,
    OrderStatus.PACKING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomers', () => {
    const mockUsers = [
      {
        id: 'cust-1',
        name: 'Nguyen Van A',
        phone: '0901234567',
        email: 'a@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        _count: { orders: 3 },
      },
      {
        id: 'cust-2',
        name: 'Tran Thi B',
        phone: '0902345678',
        email: 'b@example.com',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        _count: { orders: 1 },
      },
      {
        id: 'cust-3',
        name: 'Le Van C',
        phone: '0903456789',
        email: 'c@example.com',
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        _count: { orders: 0 },
      },
    ];

    it('should return paginated customers with default page and limit', async () => {
      mockPrismaService.user.count.mockResolvedValue(3);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.order.groupBy.mockResolvedValue([
        {
          userId: 'cust-1',
          _sum: { total: 1500000 },
        },
        {
          userId: 'cust-2',
          _sum: { total: null }, // covers fallback || 0 when total is null
        },
        // cust-3 is not present in spentData, covers spentMap.get(id) || 0
      ]);

      const query: CustomerQueryDto = {};
      const result = await service.getCustomers(query);

      expect(result).toEqual({
        data: [
          {
            id: 'cust-1',
            name: 'Nguyen Van A',
            phone: '0901234567',
            email: 'a@example.com',
            createdAt: mockUsers[0].createdAt,
            orderCount: 3,
            totalSpent: 1500000,
          },
          {
            id: 'cust-2',
            name: 'Tran Thi B',
            phone: '0902345678',
            email: 'b@example.com',
            createdAt: mockUsers[1].createdAt,
            orderCount: 1,
            totalSpent: 0,
          },
          {
            id: 'cust-3',
            name: 'Le Van C',
            phone: '0903456789',
            email: 'c@example.com',
            createdAt: mockUsers[2].createdAt,
            orderCount: 0,
            totalSpent: 0,
          },
        ],
        total: 3,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { role: Role.CUSTOMER },
      });
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.CUSTOMER },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              orders: {
                where: {
                  status: { not: OrderStatus.CANCELED },
                },
              },
            },
          },
        },
      });
      expect(mockPrismaService.order.groupBy).toHaveBeenCalledWith({
        by: ['userId'],
        where: {
          userId: { in: ['cust-1', 'cust-2', 'cust-3'] },
          status: { in: REVENUE_ORDER_STATUSES },
        },
        _sum: {
          total: true,
        },
      });
    });

    it('should handle custom page, limit within bounds, and calculate hasNextPage and hasPreviousPage', async () => {
      mockPrismaService.user.count.mockResolvedValue(55);
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.order.groupBy.mockResolvedValue([
        {
          userId: 'cust-1',
          _sum: { total: 500000 },
        },
      ]);

      const query: CustomerQueryDto = { page: 2, limit: 10 };
      const result = await service.getCustomers(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(55);
      expect(result.totalPages).toBe(6);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { role: Role.CUSTOMER },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should clamp limit to 100 when query.limit exceeds 100', async () => {
      mockPrismaService.user.count.mockResolvedValue(120);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const query: CustomerQueryDto = { page: 1, limit: 250 };
      const result = await service.getCustomers(query);

      expect(result.limit).toBe(100);
      expect(result.totalPages).toBe(2);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          skip: 0,
        }),
      );
    });

    it('should fallback to page=1 and limit=20 when page or limit is <= 0 or invalid', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const query: CustomerQueryDto = { page: -2, limit: 0 };
      const result = await service.getCustomers(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        }),
      );
    });

    it('should filter by trimmed search term across name, phone, and email with case insensitivity', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.order.groupBy.mockResolvedValue([]);

      const query: CustomerQueryDto = { search: '  Nguyen  ' };
      await service.getCustomers(query);

      const expectedWhere = {
        role: Role.CUSTOMER,
        OR: [
          { name: { contains: 'Nguyen', mode: 'insensitive' } },
          { phone: { contains: 'Nguyen', mode: 'insensitive' } },
          { email: { contains: 'Nguyen', mode: 'insensitive' } },
        ],
      };

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });

    it('should not add OR condition when search string contains only whitespace', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const query: CustomerQueryDto = { search: '     ' };
      await service.getCustomers(query);

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { role: Role.CUSTOMER },
      });
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: Role.CUSTOMER },
        }),
      );
    });

    it('should not call prisma.order.groupBy when no users are found', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const query: CustomerQueryDto = {};
      const result = await service.getCustomers(query);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
      expect(mockPrismaService.order.groupBy).not.toHaveBeenCalled();
    });

    it('should correctly set hasNextPage=false on the last page', async () => {
      mockPrismaService.user.count.mockResolvedValue(30);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const query: CustomerQueryDto = { page: 3, limit: 10 };
      const result = await service.getCustomers(query);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should propagate errors from database queries', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.user.count.mockRejectedValue(dbError);

      await expect(service.getCustomers({})).rejects.toThrow(dbError);
    });

    it('should propagate errors when order groupBy fails', async () => {
      const aggregationError = new Error('Aggregation failed');
      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0]]);
      mockPrismaService.order.groupBy.mockRejectedValue(aggregationError);

      await expect(service.getCustomers({})).rejects.toThrow(aggregationError);
    });
  });

  describe('getCustomerById', () => {
    const mockUserDetail = {
      id: 'cust-1',
      name: 'Nguyen Van A',
      phone: '0901234567',
      email: 'a@example.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { orders: 4 },
      addresses: [
        {
          id: 'addr-1',
          fullName: 'Nguyen Van A',
          phone: '0901234567',
          province: 'Hà Nội',
          district: 'Cầu Giấy',
          ward: 'Dịch Vọng',
          line1: '123 Cầu Giấy',
          isDefault: true,
        },
        {
          id: 'addr-2',
          fullName: 'Nguyen Van A',
          phone: '0901234567',
          province: 'Hà Nội',
          district: 'Nam Từ Liêm',
          ward: 'Mỹ Đình',
          line1: '456 Lê Đức Thọ',
          isDefault: false,
        },
      ],
    };

    it('should return customer details and total spent when customer exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUserDetail);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { total: 3200000 },
      });

      const result = await service.getCustomerById('cust-1');

      expect(result).toEqual({
        id: 'cust-1',
        name: 'Nguyen Van A',
        phone: '0901234567',
        email: 'a@example.com',
        createdAt: mockUserDetail.createdAt,
        orderCount: 4,
        totalSpent: 3200000,
        addresses: mockUserDetail.addresses,
      });

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'cust-1',
          role: Role.CUSTOMER,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              orders: {
                where: {
                  status: { not: OrderStatus.CANCELED },
                },
              },
            },
          },
          addresses: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              province: true,
              district: true,
              ward: true,
              line1: true,
              isDefault: true,
            },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          },
        },
      });

      expect(mockPrismaService.order.aggregate).toHaveBeenCalledWith({
        where: {
          userId: 'cust-1',
          status: { in: REVENUE_ORDER_STATUSES },
        },
        _sum: {
          total: true,
        },
      });
    });

    it('should default totalSpent to 0 when _sum.total is null or undefined', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUserDetail);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { total: null },
      });

      const result = await service.getCustomerById('cust-1');

      expect(result.totalSpent).toBe(0);
    });

    it('should throw NotFoundException with exact message when customer is not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.getCustomerById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getCustomerById('non-existent')).rejects.toThrow(
        'Không tìm thấy khách hàng',
      );

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'non-existent',
          role: Role.CUSTOMER,
        },
        select: expect.any(Object),
      });
      expect(mockPrismaService.order.aggregate).not.toHaveBeenCalled();
    });

    it('should propagate database errors when findFirst fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.user.findFirst.mockRejectedValue(dbError);

      await expect(service.getCustomerById('cust-1')).rejects.toThrow(dbError);
      expect(mockPrismaService.order.aggregate).not.toHaveBeenCalled();
    });

    it('should propagate database errors when aggregate fails', async () => {
      const aggError = new Error('Aggregate query timeout');
      mockPrismaService.user.findFirst.mockResolvedValue(mockUserDetail);
      mockPrismaService.order.aggregate.mockRejectedValue(aggError);

      await expect(service.getCustomerById('cust-1')).rejects.toThrow(aggError);
    });
  });
});
