import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderFilterDto } from './dtos/order-filter.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';

describe('OrdersController', () => {
  let controller: OrdersController;
  let mockOrdersService: {
    getAllOrders: jest.Mock;
    getOrderById: jest.Mock;
    updateOrderStatus: jest.Mock;
  };

  const mockJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCsrfGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    mockOrdersService = {
      getAllOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(CsrfGuard)
      .useValue(mockCsrfGuard)
      .compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(OrdersController);
  });

  describe('Route guards', () => {
    it('overrides route guards with canActivate stubs returning true', () => {
      expect(mockJwtGuard.canActivate()).toBe(true);
      expect(mockRolesGuard.canActivate()).toBe(true);
      expect(mockCsrfGuard.canActivate()).toBe(true);
    });
  });

  describe('Direct instantiation', () => {
    it('creates an instance of OrdersController directly', () => {
      const instance = new OrdersController(mockOrdersService as any);
      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(OrdersController);
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders matching filterDto', async () => {
      const filterDto: OrderFilterDto = {
        page: 1,
        limit: 10,
        status: OrderStatus.PAID,
        search: 'ORD251028',
      };

      const mockResponse = {
        data: [
          {
            id: 'order-1',
            code: 'ORD2510280001',
            status: OrderStatus.PAID,
            total: 250000,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockOrdersService.getAllOrders.mockResolvedValue(mockResponse);

      const result = await controller.getAllOrders(filterDto);

      expect(result).toEqual(mockResponse);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith(filterDto);
    });

    it('should pass empty or default filterDto when no filters are provided', async () => {
      const emptyFilter: OrderFilterDto = {};
      const mockEmptyResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockOrdersService.getAllOrders.mockResolvedValue(mockEmptyResponse);

      const result = await controller.getAllOrders(emptyFilter);

      expect(result).toEqual(mockEmptyResponse);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith(emptyFilter);
    });

    it('should propagate service errors when getAllOrders fails', async () => {
      const filterDto: OrderFilterDto = { page: 1, limit: 10 };
      const serviceError = new BadRequestException('Invalid filter parameters');

      mockOrdersService.getAllOrders.mockRejectedValue(serviceError);

      await expect(controller.getAllOrders(filterDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getAllOrders(filterDto)).rejects.toThrow(
        'Invalid filter parameters',
      );
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('getOrderById', () => {
    it('should return the order details when found', async () => {
      const mockOrder = {
        id: 'order-1',
        code: 'ORD2510280001',
        userId: 'user-1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 300000,
        discount: 0,
        shippingFee: 30000,
        total: 330000,
        user: {
          id: 'user-1',
          name: 'Nguyen Van A',
          email: 'user1@example.com',
          phone: '0912345678',
        },
        items: [],
      };

      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);

      const result = await controller.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('order-1');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrdersService.getOrderById.mockRejectedValue(
        new NotFoundException('Order not found'),
      );

      await expect(controller.getOrderById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getOrderById('non-existent-id')).rejects.toThrow(
        'Order not found',
      );
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(
        'non-existent-id',
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update and return the order when transition is valid', async () => {
      const updateDto: UpdateOrderStatusDto = {
        status: OrderStatus.PAID,
      };

      const mockUpdatedOrder = {
        id: 'order-1',
        code: 'ORD2510280001',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };

      mockOrdersService.updateOrderStatus.mockResolvedValue(mockUpdatedOrder);

      const result = await controller.updateOrderStatus('order-1', updateDto);

      expect(result).toEqual(mockUpdatedOrder);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        updateDto,
      );
    });

    it('should throw NotFoundException when updating non-existent order', async () => {
      const updateDto: UpdateOrderStatusDto = {
        status: OrderStatus.PAID,
      };

      mockOrdersService.updateOrderStatus.mockRejectedValue(
        new NotFoundException('Order not found'),
      );

      await expect(
        controller.updateOrderStatus('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.updateOrderStatus('non-existent-id', updateDto),
      ).rejects.toThrow('Order not found');
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'non-existent-id',
        updateDto,
      );
    });

    it('should throw BadRequestException when transition is invalid', async () => {
      const updateDto: UpdateOrderStatusDto = {
        status: OrderStatus.PENDING_PAYMENT,
      };

      mockOrdersService.updateOrderStatus.mockRejectedValue(
        new BadRequestException(
          'Invalid status transition from DELIVERED to PENDING_PAYMENT',
        ),
      );

      await expect(
        controller.updateOrderStatus('order-1', updateDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.updateOrderStatus('order-1', updateDto),
      ).rejects.toThrow(
        'Invalid status transition from DELIVERED to PENDING_PAYMENT',
      );
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        updateDto,
      );
    });
  });
});
