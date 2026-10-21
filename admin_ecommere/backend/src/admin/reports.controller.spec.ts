import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SalesReportQueryDto } from './dtos/sales-report-query.dto';
import { TopProductsQueryDto } from './dtos/top-products-query.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

describe('ReportsController', () => {
  let controller: ReportsController;

  const mockReportsService = {
    getSalesReport: jest.fn(),
    getTopProducts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSalesReport', () => {
    const validQuery: SalesReportQueryDto = {
      from: '2026-03-01',
      to: '2026-03-31',
      groupBy: 'day',
    };

    const mockSalesReport = {
      from: '2026-03-01',
      to: '2026-03-31',
      groupBy: 'day',
      timezone: 'Asia/Ho_Chi_Minh',
      periods: [
        { period: '2026-03-01', orders: 5, revenue: 500000 },
        { period: '2026-03-02', orders: 8, revenue: 800000 },
      ],
      totals: {
        orders: 13,
        revenue: 1300000,
      },
    };

    it('should return sales report successfully for valid date range and groupBy', async () => {
      mockReportsService.getSalesReport.mockResolvedValue(mockSalesReport);

      const result = await controller.getSalesReport(validQuery);

      expect(result).toEqual(mockSalesReport);
      expect(mockReportsService.getSalesReport).toHaveBeenCalledWith(
        validQuery,
      );
      expect(mockReportsService.getSalesReport).toHaveBeenCalledTimes(1);
    });

    it('should forward query parameters with week or month groupBy', async () => {
      const monthQuery: SalesReportQueryDto = {
        from: '2026-01-01',
        to: '2026-03-31',
        groupBy: 'month',
      };
      mockReportsService.getSalesReport.mockResolvedValue({
        ...mockSalesReport,
        groupBy: 'month',
      });

      const result = await controller.getSalesReport(monthQuery);

      expect(result.groupBy).toBe('month');
      expect(mockReportsService.getSalesReport).toHaveBeenCalledWith(
        monthQuery,
      );
    });

    it('should propagate BadRequestException when date format is invalid', async () => {
      const invalidQuery: SalesReportQueryDto = {
        from: 'invalid-date',
        to: '2026-03-31',
        groupBy: 'day',
      };
      const badRequestError = new BadRequestException(
        'Định dạng ngày phải là YYYY-MM-DD',
      );
      mockReportsService.getSalesReport.mockRejectedValue(badRequestError);

      await expect(controller.getSalesReport(invalidQuery)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getSalesReport(invalidQuery)).rejects.toThrow(
        'Định dạng ngày phải là YYYY-MM-DD',
      );
      expect(mockReportsService.getSalesReport).toHaveBeenCalledWith(
        invalidQuery,
      );
    });

    it('should propagate BadRequestException when date range exceeds 366 days', async () => {
      const longQuery: SalesReportQueryDto = {
        from: '2024-01-01',
        to: '2026-01-01',
        groupBy: 'day',
      };
      const rangeError = new BadRequestException(
        'Khoảng thời gian không được vượt quá 366 ngày',
      );
      mockReportsService.getSalesReport.mockRejectedValue(rangeError);

      await expect(controller.getSalesReport(longQuery)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getSalesReport(longQuery)).rejects.toThrow(
        'Khoảng thời gian không được vượt quá 366 ngày',
      );
    });

    it('should propagate unexpected service errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockReportsService.getSalesReport.mockRejectedValue(unexpectedError);

      await expect(controller.getSalesReport(validQuery)).rejects.toThrow(
        unexpectedError,
      );
    });
  });

  describe('getTopProducts', () => {
    const validQuery: TopProductsQueryDto = {
      from: '2026-03-01',
      to: '2026-03-31',
      limit: 5,
    };

    const mockTopProducts = [
      {
        productId: 'prod-1',
        name: 'Nước hoa Hoa Hồng',
        soldQuantity: 50,
        revenue: 5000000,
      },
      {
        productId: 'prod-2',
        name: 'Xịt thơm Lavender',
        soldQuantity: 30,
        revenue: 3000000,
      },
    ];

    it('should return top products successfully for valid query parameters', async () => {
      mockReportsService.getTopProducts.mockResolvedValue(mockTopProducts);

      const result = await controller.getTopProducts(validQuery);

      expect(result).toEqual(mockTopProducts);
      expect(mockReportsService.getTopProducts).toHaveBeenCalledWith(
        validQuery,
      );
      expect(mockReportsService.getTopProducts).toHaveBeenCalledTimes(1);
    });

    it('should handle custom limit parameter', async () => {
      const customLimitQuery: TopProductsQueryDto = {
        from: '2026-01-01',
        to: '2026-03-31',
        limit: 10,
      };
      mockReportsService.getTopProducts.mockResolvedValue(mockTopProducts);

      const result = await controller.getTopProducts(customLimitQuery);

      expect(result).toEqual(mockTopProducts);
      expect(mockReportsService.getTopProducts).toHaveBeenCalledWith(
        customLimitQuery,
      );
    });

    it('should propagate BadRequestException when start date is invalid', async () => {
      const invalidQuery: TopProductsQueryDto = {
        from: '2026-02-30',
        to: '2026-03-31',
        limit: 5,
      };
      const invalidDateError = new BadRequestException(
        'Ngày bắt đầu không hợp lệ',
      );
      mockReportsService.getTopProducts.mockRejectedValue(invalidDateError);

      await expect(controller.getTopProducts(invalidQuery)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getTopProducts(invalidQuery)).rejects.toThrow(
        'Ngày bắt đầu không hợp lệ',
      );
      expect(mockReportsService.getTopProducts).toHaveBeenCalledWith(
        invalidQuery,
      );
    });

    it('should propagate unexpected service errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockReportsService.getTopProducts.mockRejectedValue(unexpectedError);

      await expect(controller.getTopProducts(validQuery)).rejects.toThrow(
        unexpectedError,
      );
    });
  });
});
