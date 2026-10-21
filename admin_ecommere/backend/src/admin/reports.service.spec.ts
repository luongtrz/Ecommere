import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { ReportsService } from './reports.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SalesReportQueryDto } from './dtos/sales-report-query.dto';
import { TopProductsQueryDto } from './dtos/top-products-query.dto';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseAndValidateDateRange', () => {
    it('should throw BadRequestException when from date format is not YYYY-MM-DD', async () => {
      await expect(
        service.getSalesReport({
          from: '2026/01/01',
          to: '2026-01-10',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026/01/01',
          to: '2026-01-10',
        }),
      ).rejects.toThrow('Định dạng ngày phải là YYYY-MM-DD');
    });

    it('should throw BadRequestException when to date format is not YYYY-MM-DD', async () => {
      await expect(
        service.getSalesReport({
          from: '2026-01-01',
          to: '2026-1-10',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026-01-01',
          to: '2026-1-10',
        }),
      ).rejects.toThrow('Định dạng ngày phải là YYYY-MM-DD');
    });

    it('should throw BadRequestException when from date is invalid on the calendar (non-existent day)', async () => {
      await expect(
        service.getSalesReport({
          from: '2026-02-30',
          to: '2026-03-05',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026-02-30',
          to: '2026-03-05',
        }),
      ).rejects.toThrow('Ngày bắt đầu không hợp lệ');
    });

    it('should throw BadRequestException when from date has invalid month', async () => {
      await expect(
        service.getSalesReport({
          from: '2026-13-01',
          to: '2026-12-01',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026-13-01',
          to: '2026-12-01',
        }),
      ).rejects.toThrow('Ngày bắt đầu không hợp lệ');
    });

    it('should throw BadRequestException when to date is invalid on the calendar (non-existent day)', async () => {
      await expect(
        service.getSalesReport({
          from: '2026-04-01',
          to: '2026-04-31',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026-04-01',
          to: '2026-04-31',
        }),
      ).rejects.toThrow('Ngày kết thúc không hợp lệ');
    });

    it('should throw BadRequestException when to date has non-leap year Feb 29', async () => {
      await expect(
        service.getSalesReport({
          from: '2026-02-01',
          to: '2026-02-29',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026-02-01',
          to: '2026-02-29',
        }),
      ).rejects.toThrow('Ngày kết thúc không hợp lệ');
    });

    it('should throw BadRequestException when from is strictly after to', async () => {
      await expect(
        service.getSalesReport({
          from: '2026-01-10',
          to: '2026-01-05',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026-01-10',
          to: '2026-01-05',
        }),
      ).rejects.toThrow('Ngày bắt đầu không được lớn hơn ngày kết thúc');
    });

    it('should throw BadRequestException when date range exceeds 366 days', async () => {
      await expect(
        service.getSalesReport({
          from: '2025-01-01',
          to: '2026-01-03',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2025-01-01',
          to: '2026-01-03',
        }),
      ).rejects.toThrow('Khoảng thời gian không được vượt quá 366 ngày');
    });

    it('should accept a 366-day leap year date range without throwing', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getSalesReport({
        from: '2024-01-01',
        to: '2024-12-31',
        groupBy: 'month',
      });

      expect(result).toBeDefined();
      expect(result.periods).toHaveLength(12);
      expect(result.totals).toEqual({ orders: 0, revenue: 0 });
    });
  });

  describe('getSalesReport', () => {
    it('should throw BadRequestException when groupBy is invalid', async () => {
      await expect(
        service.getSalesReport({
          from: '2026-01-01',
          to: '2026-01-05',
          groupBy: 'year' as any,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getSalesReport({
          from: '2026-01-01',
          to: '2026-01-05',
          groupBy: 'year' as any,
        }),
      ).rejects.toThrow('groupBy phải là day, week hoặc month');
    });

    it('should default groupBy to day when omitted and return correctly formatted report', async () => {
      const mockRawRows = [
        { period: '2026-01-01', orders: BigInt(2), revenue: BigInt(150000) },
        { period: '2026-01-03', orders: 1, revenue: 80000 },
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(mockRawRows);

      const query: SalesReportQueryDto = {
        from: '2026-01-01',
        to: '2026-01-03',
      };

      const result = await service.getSalesReport(query);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      expect(sqlCall.values).toEqual([
        'day',
        OrderStatus.PAID,
        OrderStatus.PACKING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        '2025-12-31T17:00:00.000Z',
        '2026-01-03T16:59:59.999Z',
      ]);

      expect(result).toEqual({
        from: '2026-01-01',
        to: '2026-01-03',
        groupBy: 'day',
        timezone: 'Asia/Ho_Chi_Minh',
        periods: [
          { period: '2026-01-01', orders: 2, revenue: 150000 },
          { period: '2026-01-02', orders: 0, revenue: 0 },
          { period: '2026-01-03', orders: 1, revenue: 80000 },
        ],
        totals: {
          orders: 3,
          revenue: 230000,
        },
      });
    });

    it('should generate periods and aggregate report correctly for groupBy=week', async () => {
      // 2026-01-04 is Sunday (dayOfWeek === 0, Monday is 2025-12-29)
      // 2026-01-14 is Wednesday (dayOfWeek === 3, Monday is 2026-01-12)
      const mockRawRows = [
        { period: '2025-12-29', orders: 4, revenue: 400000 },
        { period: '2026-01-05', orders: 2, revenue: 200000 },
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(mockRawRows);

      const query: SalesReportQueryDto = {
        from: '2026-01-04',
        to: '2026-01-14',
        groupBy: 'week',
      };

      const result = await service.getSalesReport(query);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      expect(sqlCall.values[0]).toBe('week');

      expect(result).toEqual({
        from: '2026-01-04',
        to: '2026-01-14',
        groupBy: 'week',
        timezone: 'Asia/Ho_Chi_Minh',
        periods: [
          { period: '2025-12-29', orders: 4, revenue: 400000 },
          { period: '2026-01-05', orders: 2, revenue: 200000 },
          { period: '2026-01-12', orders: 0, revenue: 0 },
        ],
        totals: {
          orders: 6,
          revenue: 600000,
        },
      });
    });

    it('should generate ISO week correctly when from date is already a Monday (dayOfWeek === 1)', async () => {
      // 2026-01-05 is Monday
      mockPrismaService.$queryRaw.mockResolvedValue([
        { period: '2026-01-05', orders: 1, revenue: 50000 },
      ]);

      const result = await service.getSalesReport({
        from: '2026-01-05',
        to: '2026-01-05',
        groupBy: 'week',
      });

      expect(result.periods).toEqual([
        { period: '2026-01-05', orders: 1, revenue: 50000 },
      ]);
      expect(result.totals).toEqual({ orders: 1, revenue: 50000 });
    });

    it('should generate periods and aggregate report correctly for groupBy=month spanning year boundary', async () => {
      // From 2025-11-15 to 2026-02-10 -> triggers curMonth > 12 rollover
      const mockRawRows = [
        { period: '2025-11-01', orders: 10, revenue: 1000000 },
        { period: '2026-01-01', orders: 5, revenue: 500000 },
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(mockRawRows);

      const query: SalesReportQueryDto = {
        from: '2025-11-15',
        to: '2026-02-10',
        groupBy: 'month',
      };

      const result = await service.getSalesReport(query);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      expect(sqlCall.values[0]).toBe('month');

      expect(result).toEqual({
        from: '2025-11-15',
        to: '2026-02-10',
        groupBy: 'month',
        timezone: 'Asia/Ho_Chi_Minh',
        periods: [
          { period: '2025-11-01', orders: 10, revenue: 1000000 },
          { period: '2025-12-01', orders: 0, revenue: 0 },
          { period: '2026-01-01', orders: 5, revenue: 500000 },
          { period: '2026-02-01', orders: 0, revenue: 0 },
        ],
        totals: {
          orders: 15,
          revenue: 1500000,
        },
      });
    });

    it('should generate monthly periods within a single year without year rollover', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { period: '2026-01-01', orders: 1, revenue: 10000 },
      ]);

      const result = await service.getSalesReport({
        from: '2026-01-01',
        to: '2026-03-31',
        groupBy: 'month',
      });

      expect(result.periods).toEqual([
        { period: '2026-01-01', orders: 1, revenue: 10000 },
        { period: '2026-02-01', orders: 0, revenue: 0 },
        { period: '2026-03-01', orders: 0, revenue: 0 },
      ]);
      expect(result.totals).toEqual({ orders: 1, revenue: 10000 });
    });

    it('should safely ignore DB rows whose period is outside the generated range and handle null/undefined values', async () => {
      const mockRawRows = [
        { period: '2026-01-01', orders: null as any, revenue: undefined as any },
        { period: '2025-01-01', orders: 99, revenue: 999999 }, // not in periodMap
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(mockRawRows);

      const result = await service.getSalesReport({
        from: '2026-01-01',
        to: '2026-01-02',
        groupBy: 'day',
      });

      expect(result.periods).toEqual([
        { period: '2026-01-01', orders: 0, revenue: 0 },
        { period: '2026-01-02', orders: 0, revenue: 0 },
      ]);
      expect(result.totals).toEqual({ orders: 0, revenue: 0 });
    });

    it('should return all periods with zero counts when DB returns empty array', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getSalesReport({
        from: '2026-01-01',
        to: '2026-01-02',
        groupBy: 'day',
      });

      expect(result.periods).toEqual([
        { period: '2026-01-01', orders: 0, revenue: 0 },
        { period: '2026-01-02', orders: 0, revenue: 0 },
      ]);
      expect(result.totals).toEqual({ orders: 0, revenue: 0 });
    });

    it('should rethrow error when prisma.$queryRaw fails', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.$queryRaw.mockRejectedValue(dbError);

      await expect(
        service.getSalesReport({
          from: '2026-01-01',
          to: '2026-01-02',
        }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('getTopProducts', () => {
    it('should throw BadRequestException when date range is invalid in getTopProducts', async () => {
      await expect(
        service.getTopProducts({
          from: 'invalid-date',
          to: '2026-01-10',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getTopProducts({
          from: 'invalid-date',
          to: '2026-01-10',
        }),
      ).rejects.toThrow('Định dạng ngày phải là YYYY-MM-DD');
    });

    it('should return empty array immediately without querying DB when limit <= 0', async () => {
      const resultZero = await service.getTopProducts({
        from: '2026-01-01',
        to: '2026-01-10',
        limit: 0,
      });

      expect(resultZero).toEqual([]);
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();

      const resultNegative = await service.getTopProducts({
        from: '2026-01-01',
        to: '2026-01-10',
        limit: -5,
      });

      expect(resultNegative).toEqual([]);
      expect(mockPrismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should query top products with default limit=5 when limit is omitted and map raw rows correctly', async () => {
      const mockRawRows = [
        {
          productId: 'prod-1',
          name: 'Spray Paint Red',
          soldQuantity: BigInt(25),
          revenue: BigInt(1250000),
        },
        {
          productId: 'prod-2',
          name: 'Spray Paint Blue',
          soldQuantity: 10,
          revenue: 500000,
        },
        {
          productId: 'prod-3',
          name: '', // tests empty string fallback to 'Unknown Product'
          soldQuantity: 3,
          revenue: 150000,
        },
        {
          productId: 'prod-4',
          name: null as any, // tests null fallback to 'Unknown Product'
          soldQuantity: null as any, // tests null fallback to 0
          revenue: undefined as any, // tests undefined fallback to 0
        },
      ];
      mockPrismaService.$queryRaw.mockResolvedValue(mockRawRows);

      const query: TopProductsQueryDto = {
        from: '2026-01-01',
        to: '2026-01-31',
      };

      const result = await service.getTopProducts(query);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      expect(sqlCall.values[0]).toBe(OrderStatus.DELIVERED);
      expect(sqlCall.values[1]).toBe('2025-12-31T17:00:00.000Z');
      expect(sqlCall.values[2]).toBe('2026-01-31T16:59:59.999Z');
      expect(sqlCall.values[3]).toBe(5);

      expect(result).toEqual([
        {
          productId: 'prod-1',
          name: 'Spray Paint Red',
          soldQuantity: 25,
          revenue: 1250000,
        },
        {
          productId: 'prod-2',
          name: 'Spray Paint Blue',
          soldQuantity: 10,
          revenue: 500000,
        },
        {
          productId: 'prod-3',
          name: 'Unknown Product',
          soldQuantity: 3,
          revenue: 150000,
        },
        {
          productId: 'prod-4',
          name: 'Unknown Product',
          soldQuantity: 0,
          revenue: 0,
        },
      ]);
    });

    it('should query top products with custom limit when provided', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const query: TopProductsQueryDto = {
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 10,
      };

      const result = await service.getTopProducts(query);

      expect(result).toEqual([]);
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
      const sqlCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      expect(sqlCall.values[3]).toBe(10);
    });

    it('should rethrow error when prisma.$queryRaw fails in getTopProducts', async () => {
      const dbError = new Error('Database query timeout');
      mockPrismaService.$queryRaw.mockRejectedValue(dbError);

      await expect(
        service.getTopProducts({
          from: '2026-01-01',
          to: '2026-01-05',
        }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('generatePeriods fallback', () => {
    it('should return empty array for unsupported groupBy value to cover fallback branch', () => {
      const periods = (service as any).generatePeriods(
        2026,
        1,
        1,
        2026,
        1,
        2,
        'unsupported' as any,
      );
      expect(periods).toEqual([]);
    });
  });
});
