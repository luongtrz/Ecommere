import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { CheckoutDto, ShippingMethod } from './dtos/checkout.dto';
import { PreviewCheckoutDto } from './dtos/preview-checkout.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { OrderFilterDto } from './dtos/order-filter.dto';
import { OrderStatus } from '@prisma/client';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<Partial<OrdersService>>;

  const mockOrdersService = {
    previewCheckout: jest.fn(),
    checkout: jest.fn(),
    getMyOrders: jest.fn(),
    getMyOrderById: jest.fn(),
    cancelOrder: jest.fn(),
    getAllOrders: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
  };

  beforeEach(async () => {
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
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('previewCheckout', () => {
    it('delegates to ordersService.previewCheckout with authenticated userId and body DTO and returns result', async () => {
      const userId = 'user-auth-1';
      const previewCheckoutDto: PreviewCheckoutDto = {
        addressId: 'addr-1',
        shippingMethod: ShippingMethod.STANDARD,
        items: [{ variantId: 'var-1', quantity: 2 }],
      };
      const expectedResult = {
        address: { id: 'addr-1', userId },
        deliveryAddress: '123 Le Loi, Ben Nghe, District 1, Ho Chi Minh',
        itemCount: 1,
        subtotal: 300000,
        shippingFee: 30000,
        everyItemPriced: true,
        canPriceAll: true,
      };
      mockOrdersService.previewCheckout.mockResolvedValue(expectedResult);

      const result = await controller.previewCheckout(userId, previewCheckoutDto);

      expect(mockOrdersService.previewCheckout).toHaveBeenCalledWith(userId, previewCheckoutDto);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.previewCheckout', async () => {
      const userId = 'user-auth-1';
      const previewCheckoutDto: PreviewCheckoutDto = {};
      mockOrdersService.previewCheckout.mockRejectedValue(new Error('Preview checkout failed'));

      await expect(controller.previewCheckout(userId, previewCheckoutDto)).rejects.toThrow(
        'Preview checkout failed',
      );
      expect(mockOrdersService.previewCheckout).toHaveBeenCalledWith(userId, previewCheckoutDto);
    });
  });

  describe('checkout', () => {
    it('delegates to ordersService.checkout with authenticated userId and body DTO and returns created order', async () => {
      const userId = 'user-auth-1';
      const checkoutDto: CheckoutDto = {
        addressId: 'addr-1',
        shippingMethod: ShippingMethod.STANDARD,
        paymentMethod: 'COD',
        checkoutKey: 'checkout-key-valid-1234',
        items: [{ variantId: 'var-1', quantity: 2 }],
      };
      const expectedResult = {
        id: 'order-1',
        code: 'ORD-2026-001',
        userId,
        status: OrderStatus.PENDING_PAYMENT,
        subtotal: 300000,
        shippingFee: 30000,
        total: 330000,
        checkoutKey: 'checkout-key-valid-1234',
      };
      mockOrdersService.checkout.mockResolvedValue(expectedResult);

      const result = await controller.checkout(userId, checkoutDto);

      expect(mockOrdersService.checkout).toHaveBeenCalledWith(userId, checkoutDto);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.checkout', async () => {
      const userId = 'user-auth-1';
      const checkoutDto: CheckoutDto = { addressId: 'addr-invalid' };
      mockOrdersService.checkout.mockRejectedValue(new Error('Cart is empty or no items provided'));

      await expect(controller.checkout(userId, checkoutDto)).rejects.toThrow(
        'Cart is empty or no items provided',
      );
      expect(mockOrdersService.checkout).toHaveBeenCalledWith(userId, checkoutDto);
    });
  });

  describe('getMyOrders', () => {
    it('delegates to ordersService.getMyOrders with authenticated userId and filter query and returns orders', async () => {
      const userId = 'user-auth-1';
      const filterDto: OrderFilterDto = {
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING_PAYMENT,
      };
      const expectedResult = {
        data: [
          {
            id: 'order-1',
            code: 'ORD-2026-001',
            userId,
            status: OrderStatus.PENDING_PAYMENT,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockOrdersService.getMyOrders.mockResolvedValue(expectedResult);

      const result = await controller.getMyOrders(userId, filterDto);

      expect(mockOrdersService.getMyOrders).toHaveBeenCalledWith(userId, filterDto);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.getMyOrders', async () => {
      const userId = 'user-auth-1';
      const filterDto: OrderFilterDto = { page: 1, limit: 10 };
      mockOrdersService.getMyOrders.mockRejectedValue(new Error('Failed to retrieve user orders'));

      await expect(controller.getMyOrders(userId, filterDto)).rejects.toThrow(
        'Failed to retrieve user orders',
      );
      expect(mockOrdersService.getMyOrders).toHaveBeenCalledWith(userId, filterDto);
    });
  });

  describe('getMyOrderById', () => {
    it('delegates to ordersService.getMyOrderById with authenticated userId and orderId param and returns order', async () => {
      const userId = 'user-auth-1';
      const orderId = 'order-1';
      const expectedResult = {
        id: orderId,
        code: 'ORD-2026-001',
        userId,
        status: OrderStatus.PENDING_PAYMENT,
        items: [],
      };
      mockOrdersService.getMyOrderById.mockResolvedValue(expectedResult);

      const result = await controller.getMyOrderById(userId, orderId);

      expect(mockOrdersService.getMyOrderById).toHaveBeenCalledWith(userId, orderId);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.getMyOrderById', async () => {
      const userId = 'user-auth-1';
      const orderId = 'order-missing';
      mockOrdersService.getMyOrderById.mockRejectedValue(new Error('Order not found'));

      await expect(controller.getMyOrderById(userId, orderId)).rejects.toThrow('Order not found');
      expect(mockOrdersService.getMyOrderById).toHaveBeenCalledWith(userId, orderId);
    });
  });

  describe('cancelOrder', () => {
    it('delegates to ordersService.cancelOrder with authenticated userId and orderId param and returns cancelled order', async () => {
      const userId = 'user-auth-1';
      const orderId = 'order-1';
      const expectedResult = {
        id: orderId,
        code: 'ORD-2026-001',
        userId,
        status: OrderStatus.CANCELED,
      };
      mockOrdersService.cancelOrder.mockResolvedValue(expectedResult);

      const result = await controller.cancelOrder(userId, orderId);

      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(userId, orderId);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.cancelOrder', async () => {
      const userId = 'user-auth-1';
      const orderId = 'order-packed';
      mockOrdersService.cancelOrder.mockRejectedValue(
        new Error('Order cannot be cancelled at this stage'),
      );

      await expect(controller.cancelOrder(userId, orderId)).rejects.toThrow(
        'Order cannot be cancelled at this stage',
      );
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(userId, orderId);
    });
  });

  describe('getAllOrders', () => {
    it('delegates to ordersService.getAllOrders with filter query and returns all orders for admin', async () => {
      const filterDto: OrderFilterDto = {
        page: 1,
        limit: 20,
        status: OrderStatus.PACKING,
        search: 'customer@example.com',
      };
      const expectedResult = {
        data: [
          {
            id: 'order-admin-1',
            code: 'ORD-2026-ADMIN-1',
            status: OrderStatus.PACKING,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockOrdersService.getAllOrders.mockResolvedValue(expectedResult);

      const result = await controller.getAllOrders(filterDto);

      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.getAllOrders', async () => {
      const filterDto: OrderFilterDto = { page: 1, limit: 20 };
      mockOrdersService.getAllOrders.mockRejectedValue(new Error('Failed to retrieve all orders'));

      await expect(controller.getAllOrders(filterDto)).rejects.toThrow(
        'Failed to retrieve all orders',
      );
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('getOrderById', () => {
    it('delegates to ordersService.getOrderById with orderId param and returns order for admin', async () => {
      const orderId = 'order-admin-1';
      const expectedResult = {
        id: orderId,
        code: 'ORD-2026-ADMIN-1',
        status: OrderStatus.PACKING,
        user: { id: 'user-1', email: 'customer@example.com' },
        items: [],
      };
      mockOrdersService.getOrderById.mockResolvedValue(expectedResult);

      const result = await controller.getOrderById(orderId);

      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.getOrderById', async () => {
      const orderId = 'order-missing';
      mockOrdersService.getOrderById.mockRejectedValue(new Error('Order not found'));

      await expect(controller.getOrderById(orderId)).rejects.toThrow('Order not found');
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(orderId);
    });
  });

  describe('updateOrderStatus', () => {
    it('delegates to ordersService.updateOrderStatus with orderId param and body DTO and returns updated order', async () => {
      const orderId = 'order-admin-1';
      const updateOrderStatusDto: UpdateOrderStatusDto = {
        status: OrderStatus.SHIPPED,
      };
      const expectedResult = {
        id: orderId,
        code: 'ORD-2026-ADMIN-1',
        status: OrderStatus.SHIPPED,
      };
      mockOrdersService.updateOrderStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateOrderStatus(orderId, updateOrderStatusDto);

      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(orderId, updateOrderStatusDto);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by ordersService.updateOrderStatus', async () => {
      const orderId = 'order-admin-1';
      const updateOrderStatusDto: UpdateOrderStatusDto = {
        status: OrderStatus.DELIVERED,
      };
      mockOrdersService.updateOrderStatus.mockRejectedValue(new Error('Invalid status transition'));

      await expect(controller.updateOrderStatus(orderId, updateOrderStatusDto)).rejects.toThrow(
        'Invalid status transition',
      );
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        orderId,
        updateOrderStatusDto,
      );
    });
  });
});
