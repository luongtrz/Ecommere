import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cart: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    address: {
      findUnique: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    coupon: {
      update: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout', () => {
    const mockAddress = {
      id: 'addr1',
      userId: 'user1',
      fullName: 'John Doe',
      phone: '0812345678',
      province: 'Bangkok',
      district: 'Chatuchak',
      ward: 'Lat Yao',
      line1: '123 Test St.',
      line2: null,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCart = {
      id: 'cart1',
      userId: 'user1',
      couponCode: null,
      items: [
        {
          id: 'item1',
          cartId: 'cart1',
          variantId: 'var1',
          quantity: 2,
          variant: {
            id: 'var1',
            sku: 'LAV-250ML',
            scent: 'Lavender',
            volumeMl: 250,
            price: 100000,
            salePrice: null,
            stock: 10,
            product: {
              id: 'prod1',
              name: 'Lavender Spray',
              active: true,
            },
          },
        },
      ],
      coupon: null,
    };

    it('should create an order successfully', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 200000,
        discount: 0,
        shippingFee: 0,
        total: 200000,
        couponCode: null,
        addressJson: mockAddress,
        items: [
          {
            variantId: 'var1',
            quantity: 2,
            price: 100000,
            total: 200000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.checkout('user1', { addressId: 'addr1' });

      expect(result).toBeDefined();
      expect(result.code).toContain('ORD');
      expect(result.total).toBe(200000);
    });

    it('should throw BadRequestException when cart is empty', async () => {
      const emptyCart = {
        id: 'cart1',
        userId: 'user1',
        items: [],
        coupon: null,
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(emptyCart);

      await expect(service.checkout('user1', { addressId: 'addr1' })).rejects.toThrow(BadRequestException);
      await expect(service.checkout('user1', { addressId: 'addr1' })).rejects.toThrow('Cart is empty');
    });

    it('should throw NotFoundException when address not found', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.address.findUnique.mockResolvedValue(null);

      await expect(service.checkout('user1', { addressId: 'invalid' })).rejects.toThrow(NotFoundException);
      await expect(service.checkout('user1', { addressId: 'invalid' })).rejects.toThrow('Address not found');
    });

    it('should throw BadRequestException when address belongs to different user', async () => {
      const otherUserAddress = { ...mockAddress, userId: 'user2' };

      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.address.findUnique.mockResolvedValue(otherUserAddress);

      await expect(service.checkout('user1', { addressId: 'addr1' })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when product is inactive', async () => {
      const inactiveProductCart = {
        ...mockCart,
        items: [
          {
            ...mockCart.items[0],
            variant: {
              ...mockCart.items[0].variant,
              product: {
                id: 'prod1',
                name: 'Inactive Product',
                active: false,
              },
            },
          },
        ],
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(inactiveProductCart);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);

      await expect(service.checkout('user1', { addressId: 'addr1' })).rejects.toThrow(BadRequestException);
      await expect(service.checkout('user1', { addressId: 'addr1' })).rejects.toThrow('Product is no longer available');
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const lowStockCart = {
        ...mockCart,
        items: [
          {
            ...mockCart.items[0],
            quantity: 20,
            variant: {
              ...mockCart.items[0].variant,
              stock: 5,
            },
          },
        ],
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(lowStockCart);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);

      await expect(service.checkout('user1', { addressId: 'addr1' })).rejects.toThrow(BadRequestException);
      await expect(service.checkout('user1', { addressId: 'addr1' })).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getMyOrders', () => {
    it('should return user orders with pagination', async () => {
      const mockOrders = [
        {
          id: 'order1',
          code: 'ORD25102800001',
          userId: 'user1',
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.COMPLETED,
          subtotal: 200000,
          discount: 0,
          shippingFee: 0,
          total: 200000,
          items: [],
          coupon: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getMyOrders('user1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
        }),
      );
    });

    it('should filter orders by status', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      await service.getMyOrders('user1', { page: 1, limit: 10, status: OrderStatus.DELIVERED });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1', status: OrderStatus.DELIVERED },
        }),
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        items: [],
      };

      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus('order1', { status: OrderStatus.PAID });

      expect(result.status).toBe(OrderStatus.PAID);
      expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.updateOrderStatus('invalid', { status: OrderStatus.PAID })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockOrder = {
        id: 'order1',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.updateOrderStatus('order1', { status: OrderStatus.PENDING_PAYMENT })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateOrderStatus('order1', { status: OrderStatus.PENDING_PAYMENT })).rejects.toThrow(
        'Invalid status transition',
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a pending order successfully', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        items: [
          {
            variantId: 'var1',
            quantity: 2,
          },
        ],
      };

      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({ id: 'var1', stock: 10 });
      mockPrismaService.order.update.mockResolvedValue(cancelledOrder);

      const result = await service.cancelOrder('user1', 'order1');

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.cancelOrder('user1', 'invalid')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order belongs to different user', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user2',
        status: OrderStatus.PENDING_PAYMENT,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(BadRequestException);
      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow('Unauthorized');
    });

    it('should throw BadRequestException when order cannot be cancelled', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.DELIVERED,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(BadRequestException);
      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow('Order cannot be cancelled at this stage');
    });
  });
});
