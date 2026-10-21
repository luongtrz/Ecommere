import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DashboardStatsDto } from './dtos/dashboard-stats.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('AdminController (Coverage)', () => {
  let controller: AdminController;
  let mockAdminService: {
    getDashboardStats: jest.Mock;
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockDashboardStats: DashboardStatsDto = {
    revenue: {
      totalRevenue: 50000000,
      monthlyRevenue: 15000000,
      monthlyChange: 12.5,
    },
    orders: {
      totalOrders: 350,
      monthlyOrders: 120,
      monthlyChange: 5.2,
      pendingOrders: 15,
      shippingOrders: 20,
    },
    products: {
      totalProducts: 45,
      activeProducts: 40,
      newProductsThisMonth: 5,
      lowStockProducts: 3,
    },
    customers: {
      totalCustomers: 200,
      newCustomersThisMonth: 25,
      monthlyChange: 8.0,
    },
    recentOrders: [
      {
        id: 'order-1',
        orderNumber: 'ORD-2026-001',
        customerName: 'Nguyen Van A',
        totalAmount: 500000,
        status: 'DELIVERED',
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-2026-002',
        customerName: 'Tran Thi B',
        totalAmount: 750000,
        status: 'PAID',
        createdAt: new Date('2026-03-02T11:00:00.000Z'),
      },
    ],
    topProducts: [
      {
        id: 'prod-1',
        name: 'Bình xịt chống thấm đa năng',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/prod1.jpg',
        soldQuantity: 100,
        revenue: 10000000,
      },
    ],
    revenueHistory: [
      {
        name: 'T1',
        total: 500000,
      },
      {
        name: 'T2',
        total: 750000,
      },
    ],
  };

  beforeEach(async () => {
    mockAdminService = {
      getDashboardStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined and instantiate properly with guards overridden', () => {
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AdminController);
  });

  describe('Route: GET /admin/dashboard/stats (getDashboardStats)', () => {
    it('should return complete dashboard statistics from adminService', async () => {
      mockAdminService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      const result = await controller.getDashboardStats();

      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDashboardStats);
    });

    it('should return empty or zeroed stats when store has no data', async () => {
      const emptyStats: DashboardStatsDto = {
        revenue: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          monthlyChange: 0,
        },
        orders: {
          totalOrders: 0,
          monthlyOrders: 0,
          monthlyChange: 0,
          pendingOrders: 0,
          shippingOrders: 0,
        },
        products: {
          totalProducts: 0,
          activeProducts: 0,
          newProductsThisMonth: 0,
          lowStockProducts: 0,
        },
        customers: {
          totalCustomers: 0,
          newCustomersThisMonth: 0,
          monthlyChange: 0,
        },
        recentOrders: [],
        topProducts: [],
        revenueHistory: [],
      };
      mockAdminService.getDashboardStats.mockResolvedValue(emptyStats);

      const result = await controller.getDashboardStats();

      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(emptyStats);
    });

    it('should propagate InternalServerErrorException when adminService fails', async () => {
      mockAdminService.getDashboardStats.mockRejectedValue(
        new InternalServerErrorException('Lỗi tính toán thống kê dashboard'),
      );

      await expect(controller.getDashboardStats()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(controller.getDashboardStats()).rejects.toThrow(
        'Lỗi tính toán thống kê dashboard',
      );
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
    });

    it('should propagate BadRequestException when adminService throws BadRequestException', async () => {
      mockAdminService.getDashboardStats.mockRejectedValue(
        new BadRequestException('Cấu hình ngày tháng không hợp lệ'),
      );

      await expect(controller.getDashboardStats()).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getDashboardStats()).rejects.toThrow(
        'Cấu hình ngày tháng không hợp lệ',
      );
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
    });

    it('should propagate UnauthorizedException when user session is unauthorized', async () => {
      mockAdminService.getDashboardStats.mockRejectedValue(
        new UnauthorizedException('Không có quyền truy cập'),
      );

      await expect(controller.getDashboardStats()).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.getDashboardStats()).rejects.toThrow(
        'Không có quyền truy cập',
      );
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
    });

    it('should propagate unexpected Error when database connection fails', async () => {
      mockAdminService.getDashboardStats.mockRejectedValue(
        new Error('PrismaClientInitializationError: Can not reach database server'),
      );

      await expect(controller.getDashboardStats()).rejects.toThrow(Error);
      await expect(controller.getDashboardStats()).rejects.toThrow(
        'PrismaClientInitializationError: Can not reach database server',
      );
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
    });
  });
});
