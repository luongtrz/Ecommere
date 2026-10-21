import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerQueryDto } from './dtos/customer-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('CustomersController', () => {
  let controller: CustomersController;
  let mockCustomersService: {
    getCustomers: jest.Mock;
    getCustomerById: jest.Mock;
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    mockCustomersService = {
      getCustomers: jest.fn(),
      getCustomerById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Route: GET /admin/customers (getCustomers)', () => {
    it('should return paginated list of customers when empty query is provided', async () => {
      const mockResult = {
        data: [
          {
            id: 'cust-1',
            name: 'Nguyen Van A',
            phone: '0901234567',
            email: 'a@example.com',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            orderCount: 3,
            totalSpent: 1200000,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockCustomersService.getCustomers.mockResolvedValue(mockResult);

      const query: CustomerQueryDto = {};
      const result = await controller.getCustomers(query);

      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith(query);
      expect(mockCustomersService.getCustomers).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should pass search, page, and limit query parameters to customersService.getCustomers', async () => {
      const mockResult = {
        data: [
          {
            id: 'cust-2',
            name: 'Tran Van B',
            phone: '0912345678',
            email: 'b@example.com',
            createdAt: new Date('2026-02-01T00:00:00.000Z'),
            orderCount: 10,
            totalSpent: 5000000,
          },
        ],
        total: 15,
        page: 2,
        limit: 10,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      };
      mockCustomersService.getCustomers.mockResolvedValue(mockResult);

      const query: CustomerQueryDto = {
        page: 2,
        limit: 10,
        search: 'Tran',
      };
      const result = await controller.getCustomers(query);

      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith(query);
      expect(mockCustomersService.getCustomers).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should return empty list when no customers match criteria', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockCustomersService.getCustomers.mockResolvedValue(mockResult);

      const query: CustomerQueryDto = { search: 'NonExistent' };
      const result = await controller.getCustomers(query);

      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });

    it('should propagate BadRequestException when customersService.getCustomers throws', async () => {
      const query: CustomerQueryDto = { search: 'invalid' };
      mockCustomersService.getCustomers.mockRejectedValue(
        new BadRequestException('Tham số truy vấn không hợp lệ'),
      );

      await expect(controller.getCustomers(query)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getCustomers(query)).rejects.toThrow(
        'Tham số truy vấn không hợp lệ',
      );
      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith(query);
    });

    it('should propagate unexpected Error when customersService.getCustomers encounters database failure', async () => {
      const query: CustomerQueryDto = {};
      mockCustomersService.getCustomers.mockRejectedValue(
        new Error('Database query timed out'),
      );

      await expect(controller.getCustomers(query)).rejects.toThrow(Error);
      await expect(controller.getCustomers(query)).rejects.toThrow(
        'Database query timed out',
      );
      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith(query);
    });
  });

  describe('Route: GET /admin/customers/:id (getCustomerById)', () => {
    it('should return customer details with addresses when customer exists', async () => {
      const customerId = 'cust-uuid-1';
      const mockCustomer = {
        id: customerId,
        name: 'Nguyen Van A',
        phone: '0901234567',
        email: 'a@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        orderCount: 5,
        totalSpent: 2500000,
        addresses: [
          {
            id: 'addr-1',
            fullName: 'Nguyen Van A',
            phone: '0901234567',
            province: 'Thành phố Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
            line1: '123 Đường Lê Lợi',
            isDefault: true,
          },
          {
            id: 'addr-2',
            fullName: 'Nguyen Van A',
            phone: '0901234567',
            province: 'Thành phố Hà Nội',
            district: 'Quận Hoàn Kiếm',
            ward: 'Phường Hàng Bạc',
            line1: '456 Đường Đinh Tiên Hoàng',
            isDefault: false,
          },
        ],
      };
      mockCustomersService.getCustomerById.mockResolvedValue(mockCustomer);

      const result = await controller.getCustomerById(customerId);

      expect(mockCustomersService.getCustomerById).toHaveBeenCalledWith(
        customerId,
      );
      expect(mockCustomersService.getCustomerById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCustomer);
    });

    it('should propagate NotFoundException when customer is not found', async () => {
      const customerId = 'cust-not-found';
      mockCustomersService.getCustomerById.mockRejectedValue(
        new NotFoundException('Không tìm thấy khách hàng'),
      );

      await expect(controller.getCustomerById(customerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getCustomerById(customerId)).rejects.toThrow(
        'Không tìm thấy khách hàng',
      );
      expect(mockCustomersService.getCustomerById).toHaveBeenCalledWith(
        customerId,
      );
    });

    it('should propagate BadRequestException when invalid id format is provided', async () => {
      const customerId = 'invalid-id';
      mockCustomersService.getCustomerById.mockRejectedValue(
        new BadRequestException('ID khách hàng không hợp lệ'),
      );

      await expect(controller.getCustomerById(customerId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getCustomerById(customerId)).rejects.toThrow(
        'ID khách hàng không hợp lệ',
      );
      expect(mockCustomersService.getCustomerById).toHaveBeenCalledWith(
        customerId,
      );
    });

    it('should propagate unexpected Error when database fails during getCustomerById', async () => {
      const customerId = 'cust-err';
      mockCustomersService.getCustomerById.mockRejectedValue(
        new Error('PrismaClientKnownRequestError: connection refused'),
      );

      await expect(controller.getCustomerById(customerId)).rejects.toThrow(
        Error,
      );
      await expect(controller.getCustomerById(customerId)).rejects.toThrow(
        'PrismaClientKnownRequestError: connection refused',
      );
      expect(mockCustomersService.getCustomerById).toHaveBeenCalledWith(
        customerId,
      );
    });
  });
});
