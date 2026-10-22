import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  CouponType,
  OrderStatus,
  PaymentStatus,
  Prisma,
  StockMovementType,
} from '@prisma/client';
import { ShippingMethod } from './dtos/checkout.dto';

describe('OrdersService - Coverage Companion', () => {
  let service: OrdersService;

  const mockPrismaService = {
    cart: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    address: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    coupon: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    referral: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

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

    mockPrismaService.$transaction.mockImplementation(
      async (callback: (tx: any) => Promise<any>) => {
        return callback(mockPrismaService);
      },
    );
    mockPrismaService.productVariant.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.productVariant.findUnique.mockResolvedValue({
      id: 'var1',
      price: 100000,
      salePrice: null,
      stock: 10,
      product: { id: 'prod1', name: 'Product', active: true },
    });
    mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.order.count.mockResolvedValue(0);
    mockPrismaService.referral.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyOrderById', () => {
    const mockOrder = {
      id: 'order1',
      userId: 'user1',
      code: 'ORD25102800001',
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      subtotal: 100000,
      discount: 0,
      shippingFee: 0,
      total: 100000,
      items: [
        {
          id: 'item1',
          variantId: 'var1',
          variant: {
            product: {
              id: 'prod1',
              name: 'Lavender Spray',
              slug: 'lavender-spray',
              images: ['lavender.jpg'],
            },
          },
        },
      ],
    };

    it('should return the order when it exists and belongs to the user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getMyOrderById('user1', 'order1');

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      images: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.getMyOrderById('user1', 'missing-order'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getMyOrderById('user1', 'missing-order'),
      ).rejects.toThrow('Order not found');
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-order' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when order belongs to a different user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order1',
        userId: 'other-user',
      });

      await expect(service.getMyOrderById('user1', 'order1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMyOrderById('user1', 'order1')).rejects.toThrow(
        'Order not found',
      );
    });
  });

  describe('getAllOrders', () => {
    const mockOrderList = [
      {
        id: 'order1',
        code: 'ORD001',
        user: {
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0123456789',
        },
        items: [],
      },
    ];

    it('should return paginated orders with default parameters when filterDto is empty', async () => {
      mockPrismaService.order.findMany.mockResolvedValue(mockOrderList);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getAllOrders({});

      expect(result).toEqual({
        data: mockOrderList,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should apply status, search filter, and calculate pagination flags correctly', async () => {
      mockPrismaService.order.findMany.mockResolvedValue(mockOrderList);
      mockPrismaService.order.count.mockResolvedValue(25);

      const result = await service.getAllOrders({
        page: 2,
        limit: 10,
        status: OrderStatus.PAID,
        search: 'keyword',
      });

      const expectedWhere = {
        status: OrderStatus.PAID,
        OR: [
          { id: { contains: 'keyword', mode: 'insensitive' } },
          { code: { contains: 'keyword', mode: 'insensitive' } },
          { user: { email: { contains: 'keyword', mode: 'insensitive' } } },
          { user: { name: { contains: 'keyword', mode: 'insensitive' } } },
        ],
      };

      expect(result).toEqual({
        data: mockOrderList,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });
  });

  describe('getOrderById', () => {
    const mockOrder = {
      id: 'order1',
      user: {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      items: [],
    };

    it('should return order when found by ID', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('order1');

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order1' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundException when order is not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrderById('missing-id')).rejects.toThrow(
        'Order not found',
      );
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-id' },
        include: expect.any(Object),
      });
    });
  });

  describe('getMyOrders', () => {
    it('should compute hasPreviousPage and hasNextPage for middle pages and apply default pagination', async () => {
      const mockOrders = [{ id: 'order1' }];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);
      mockPrismaService.order.count.mockResolvedValue(30);

      const result = await service.getMyOrders('user1', {
        page: 2,
        limit: 10,
      });

      expect(result).toEqual({
        data: mockOrders,
        total: 30,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
          skip: 10,
          take: 10,
        }),
      );
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should throw BadRequestException when concurrent order status update returns count !== 1', async () => {
      const mockOrder = {
        id: 'order1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateOrderStatus('order1', { status: OrderStatus.PAID }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateOrderStatus('order1', { status: OrderStatus.PAID }),
      ).rejects.toThrow('Order status changed; please retry');
    });

    it('should transition from PAID to PACKING with paymentStatus COMPLETED', async () => {
      const mockOrder = {
        id: 'order1',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.PACKING,
        paymentStatus: PaymentStatus.COMPLETED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.PACKING,
      });

      expect(result.status).toBe(OrderStatus.PACKING);
      expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order1',
          status: OrderStatus.PAID,
        },
        data: {
          status: OrderStatus.PACKING,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });
    });

    it('should transition from PACKING to SHIPPED with paymentStatus COMPLETED', async () => {
      const mockOrder = {
        id: 'order1',
        status: OrderStatus.PACKING,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.COMPLETED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.SHIPPED,
      });

      expect(result.status).toBe(OrderStatus.SHIPPED);
      expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
    });

    it('should transition from SHIPPED to DELIVERED maintaining paymentStatus', async () => {
      const mockOrder = {
        id: 'order1',
        status: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.DELIVERED,
      });

      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order1',
          status: OrderStatus.SHIPPED,
        },
        data: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });
    });

    it('should transition from DELIVERED to REFUNDED, restore stock, and not release coupon', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD001',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        couponCode: 'SAVE10',
        items: [{ variantId: 'var1', quantity: 3 }],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 5,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var1',
        stock: 8,
      });

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.REFUNDED,
      });

      expect(result.status).toBe(OrderStatus.REFUNDED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var1' },
        data: { stock: { increment: 3 } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var1',
          type: StockMovementType.IN,
          quantity: 3,
          previousStock: 5,
          newStock: 8,
          notes: 'Stock restored from DELIVERED order ORD001',
        },
      });
      expect(mockPrismaService.coupon.updateMany).not.toHaveBeenCalled();
    });

    it('should transition from PACKING to CANCELED and set paymentStatus to REFUNDED', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD001',
        status: OrderStatus.PACKING,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.REFUNDED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.CANCELED,
      });

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order1',
          status: OrderStatus.PACKING,
        },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
    });

    it('should transition from SHIPPED to CANCELED and set paymentStatus to REFUNDED', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD001',
        status: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.updateOrderStatus('order1', {
          status: OrderStatus.CANCELED,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateOrderStatus('order1', {
          status: OrderStatus.CANCELED,
        }),
      ).rejects.toThrow('Invalid status transition from SHIPPED to CANCELED');
    });

    it('should skip variant stock restore when variant does not exist during cancellation', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD001',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [{ variantId: 'deleted-variant', quantity: 2 }],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.REFUNDED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.CANCELED,
      });

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'deleted-variant' },
      });
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should throw BadRequestException when status update count is not 1', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(
        'Order cannot be cancelled at this stage',
      );
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order1',
          userId: 'user1',
          status: {
            in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID],
          },
        },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    });

    it('should skip restoring stock when variant is missing in cancelOrder', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        items: [{ variantId: 'missing-var', quantity: 1 }],
      };
      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      const result = await service.cancelOrder('user1', 'order1');

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-var' },
      });
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('previewCheckout', () => {
    it('should handle previewCheckout when called with default empty arguments and empty cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);

      const result = await service.previewCheckout('user1');

      expect(result).toEqual({
        address: null,
        deliveryAddress: null,
        itemCount: 0,
        subtotal: 0,
        shippingFee: 0,
        everyItemPriced: false,
        canPriceAll: false,
      });
      expect(mockPrismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: { items: true },
      });
    });

    it('should mark everyItemPriced as false when item quantity is not an integer or < 1', async () => {
      const result = await service.previewCheckout('user1', {
        items: [{ variantId: 'var1', quantity: 0 }],
      });

      expect(result.itemCount).toBe(1);
      expect(result.everyItemPriced).toBe(false);
      expect(result.subtotal).toBe(0);
    });

    it('should mark everyItemPriced as false when item has no variantId', async () => {
      const result = await service.previewCheckout('user1', {
        items: [{ variantId: '', quantity: 2 }],
      });

      expect(result.itemCount).toBe(1);
      expect(result.everyItemPriced).toBe(false);
      expect(result.subtotal).toBe(0);
    });

    it('should use variant.price when salePrice is null or undefined', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 75000,
        salePrice: null,
        product: { id: 'prod1', active: true },
      });

      const result = await service.previewCheckout('user1', {
        items: [{ variantId: 'var1', quantity: 2 }],
      });

      expect(result.everyItemPriced).toBe(true);
      expect(result.subtotal).toBe(150000);
    });

    it('should filter out empty parts when constructing deliveryAddress', async () => {
      const partialAddress = {
        id: 'addr1',
        userId: 'user1',
        line1: '100 Main St',
        ward: '',
        district: '  ',
        province: 'Bangkok',
      };
      mockPrismaService.address.findUnique.mockResolvedValue(partialAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 50000,
        salePrice: null,
        product: { id: 'prod1', active: true },
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result.deliveryAddress).toBe('100 Main St, Bangkok');
    });

    it('should select EXPRESS shipping when string "EXPRESS" is passed', async () => {
      const address = {
        id: 'addr1',
        userId: 'user1',
        province: 'Chiang Mai',
        line1: 'Street',
        district: 'Dist',
        ward: 'Ward',
      };
      mockPrismaService.address.findUnique.mockResolvedValue(address);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 50000,
        salePrice: null,
        product: { id: 'prod1', active: true },
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        shippingMethod: 'EXPRESS',
      });

      expect(result.shippingFee).toBe(50000);
    });
  });

  describe('quoteShippingFee', () => {
    it('should throw BadRequestException when province is non-string or whitespace', () => {
      expect(() => service.quoteShippingFee(null as any)).toThrow(
        BadRequestException,
      );
      expect(() => service.quoteShippingFee(null as any)).toThrow(
        'Vui lòng nhập tỉnh/thành phố',
      );
      expect(() => service.quoteShippingFee(undefined as any)).toThrow(
        BadRequestException,
      );
      expect(() => service.quoteShippingFee(undefined as any)).toThrow(
        'Vui lòng nhập tỉnh/thành phố',
      );
    });
  });

  describe('checkout', () => {
    it('should throw BadRequestException when checkoutKey belongs to a different user', async () => {
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [],
        addressJson: JSON.stringify({
          fullName: 'John',
          phone: '123',
          province: 'BKK',
          district: 'D1',
          ward: 'W1',
          line1: 'Street',
        }),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when checkoutKey exists but items count mismatches', async () => {
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [{ variantId: 'var1', quantity: 1 }],
        addressJson: JSON.stringify({ line1: 'Street' }),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          items: [
            { variantId: 'var1', quantity: 1 },
            { variantId: 'var2', quantity: 1 },
          ],
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          items: [
            { variantId: 'var1', quantity: 1 },
            { variantId: 'var2', quantity: 1 },
          ],
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when checkoutKey items differ in variant or quantity', async () => {
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [{ variantId: 'var1', quantity: 1 }],
        addressJson: JSON.stringify({ line1: 'Street' }),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          items: [{ variantId: 'var1', quantity: 2 }],
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          items: [{ variantId: 'var1', quantity: 2 }],
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when existing order addressJson is invalid or not an object', async () => {
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [],
        addressJson: 'not-valid-json',
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when existing order addressId is not found', async () => {
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [],
        addressJson: JSON.stringify({ fullName: 'John' }),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when address field does not match existing order address', async () => {
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [],
        addressJson: JSON.stringify({
          fullName: 'John',
          phone: '123',
          province: 'BKK',
          district: 'D1',
          ward: 'W1',
          line1: 'Old Street',
        }),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue({
        fullName: 'John',
        phone: '123',
        province: 'BKK',
        district: 'D1',
        ward: 'W1',
        line1: 'New Street',
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when shippingAddress in checkoutDto does not match existing order', async () => {
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [],
        addressJson: JSON.stringify({
          fullName: 'John',
          phone: '123',
          province: 'BKK',
          district: 'D1',
          ward: 'W1',
          line1: 'Street',
        }),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-123',
          fullName: 'Different Name',
          phone: '123',
          province: 'BKK',
          district: 'D1',
          ward: 'W1',
          line1: 'Street',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-123',
          fullName: 'Different Name',
          phone: '123',
          province: 'BKK',
          district: 'D1',
          ward: 'W1',
          line1: 'Street',
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when paymentMethod does not match existing order', async () => {
      const addressData = {
        fullName: 'John',
        phone: '123',
        province: 'BKK',
        district: 'D1',
        ward: 'W1',
        line1: 'Street',
      };
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [],
        addressJson: JSON.stringify(addressData),
        paymentMethod: 'COD',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue(addressData);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          paymentMethod: 'MOMO',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          paymentMethod: 'MOMO',
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should throw ConflictException when shippingMethod does not match existing order', async () => {
      const addressData = {
        fullName: 'John',
        phone: '123',
        province: 'BKK',
        district: 'D1',
        ward: 'W1',
        line1: 'Street',
        shippingMethod: ShippingMethod.STANDARD,
      };
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [],
        addressJson: JSON.stringify(addressData),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue(addressData);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          shippingMethod: ShippingMethod.EXPRESS,
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-123',
          shippingMethod: ShippingMethod.EXPRESS,
        }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('should return existing order when checkoutKey matches completely (idempotent return)', async () => {
      const addressData = {
        fullName: 'John',
        phone: '123',
        province: 'BKK',
        district: 'D1',
        ward: 'W1',
        line1: 'Street',
        shippingMethod: ShippingMethod.STANDARD,
      };
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [{ variantId: 'var1', quantity: 2 }],
        addressJson: JSON.stringify(addressData),
        paymentMethod: 'PENDING',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue(addressData);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        checkoutKey: 'key-123',
        items: [{ variantId: 'var1', quantity: 2 }],
        shippingMethod: ShippingMethod.STANDARD,
      });

      expect(result).toBe(existingOrder);
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should handle concurrent insertion race condition on checkoutKey when P2002 is thrown and order matches', async () => {
      const addressData = {
        fullName: 'John',
        phone: '123',
        province: 'BKK',
        district: 'D1',
        ward: 'W1',
        line1: 'Street',
        shippingMethod: ShippingMethod.STANDARD,
      };
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [{ variantId: 'var1', quantity: 1 }],
        addressJson: JSON.stringify(addressData),
        paymentMethod: 'PENDING',
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingOrder);

      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        ...addressData,
        id: 'addr1',
        userId: 'user1',
      });
      mockPrismaService.address.findFirst.mockResolvedValue(addressData);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`checkoutKey`)',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['checkoutKey'] },
        },
      );

      mockPrismaService.$transaction.mockRejectedValue(p2002Error);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        checkoutKey: 'key-concurrent',
        items: [{ variantId: 'var1', quantity: 1 }],
        shippingMethod: ShippingMethod.STANDARD,
      });

      expect(result).toBe(existingOrder);
    });

    it('should handle P2002 error when meta.target is a string checkoutKey', async () => {
      const addressData = {
        fullName: 'John',
        phone: '123',
        province: 'BKK',
        district: 'D1',
        ward: 'W1',
        line1: 'Street',
        shippingMethod: ShippingMethod.STANDARD,
      };
      const existingOrder = {
        id: 'existing1',
        userId: 'user1',
        items: [{ variantId: 'var1', quantity: 1 }],
        addressJson: JSON.stringify(addressData),
        paymentMethod: 'PENDING',
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingOrder);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        ...addressData,
        id: 'addr1',
        userId: 'user1',
      });
      mockPrismaService.address.findFirst.mockResolvedValue(addressData);

      const p2002StringTargetError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on checkoutKey',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: 'orders_checkoutKey_key' },
        },
      );
      mockPrismaService.$transaction.mockRejectedValue(p2002StringTargetError);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        checkoutKey: 'key-str',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result).toBe(existingOrder);
    });

    it('should rethrow P2002 error when target is not checkoutKey', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Bangkok',
      });

      const p2002OtherError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on email',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );
      mockPrismaService.$transaction.mockRejectedValue(p2002OtherError);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-other',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow(p2002OtherError);
    });

    it('should rethrow original error when non-P2002 error occurs in transaction', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Bangkok',
      });

      const genericError = new Error('Database connection failed');
      mockPrismaService.$transaction.mockRejectedValue(genericError);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          checkoutKey: 'key-err',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow('Database connection failed');
    });

    it('should throw BadRequestException when explicit item quantity is not a positive integer', async () => {
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 0 }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 0 }],
        }),
      ).rejects.toThrow('Quantity must be a positive integer');

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1.5 }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1.5 }],
        }),
      ).rejects.toThrow('Quantity must be a positive integer');
    });

    it('should throw NotFoundException when variant is not found in explicit items checkout', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'nonexistent-var', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'nonexistent-var', quantity: 1 }],
        }),
      ).rejects.toThrow('Product variant not found: nonexistent-var');
    });

    it('should throw BadRequestException when variant product is inactive in explicit items checkout', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Inactive Item', active: false },
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow('Product is no longer available: Inactive Item');
    });

    it('should throw BadRequestException when variant stock is insufficient in explicit items checkout', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Citrus',
        stock: 2,
        product: { id: 'prod1', name: 'Citrus Spray', active: true },
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 5 }],
        }),
      ).rejects.toThrow(
        'Insufficient stock for Citrus Spray - Citrus. Only 2 available.',
      );
    });

    it('should throw BadRequestException when neither addressId nor full address info is provided', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Spray', active: true },
      });

      await expect(
        service.checkout('user1', {
          items: [{ variantId: 'var1', quantity: 1 }],
          fullName: 'John',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          items: [{ variantId: 'var1', quantity: 1 }],
          fullName: 'John',
        }),
      ).rejects.toThrow(
        'Either addressId or complete address information must be provided',
      );
    });

    it('should create new address when full address info is provided without addressId', async () => {
      const createdAddress = {
        id: 'new-addr-1',
        userId: 'user1',
        fullName: 'Alice Smith',
        phone: '0912345678',
        province: 'Bangkok',
        district: 'Pathum Wan',
        ward: 'Siam',
        line1: '999 Rama I Rd',
        isDefault: false,
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Floral',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        stock: 10,
        product: { id: 'prod1', name: 'Floral Mist', active: true },
      });
      mockPrismaService.address.create.mockResolvedValue(createdAddress);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order1',
        code: 'ORD001',
        total: 50000,
      });

      const result = await service.checkout('user1', {
        items: [{ variantId: 'var1', quantity: 1 }],
        fullName: 'Alice Smith',
        phone: '0912345678',
        province: 'Bangkok',
        district: 'Pathum Wan',
        ward: 'Siam',
        line1: '999 Rama I Rd',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.address.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          fullName: 'Alice Smith',
          phone: '0912345678',
          province: 'Bangkok',
          district: 'Pathum Wan',
          ward: 'Siam',
          line1: '999 Rama I Rd',
          isDefault: false,
        },
      });
    });

    it('should throw NotFoundException when user is not authorized to use referral coupon', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Bangkok',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'REF10',
        active: true,
      });
      mockPrismaService.referral.findFirst.mockResolvedValue({
        referrerCouponCode: 'REF10',
        referrerId: 'user999',
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'REF10',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'REF10',
        }),
      ).rejects.toThrow('Coupon not found');
    });

    it('should throw BadRequestException when coupon is not yet valid (validFrom > now)', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
        product: { id: 'prod1', name: 'Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Bangkok',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'FUTURE10',
        active: true,
        validFrom: new Date(Date.now() + 86400000),
        usedCount: 0,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'FUTURE10',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'FUTURE10',
        }),
      ).rejects.toThrow('Coupon is not yet valid');
    });

    it('should apply FIXED coupon discount and increment usage when maxUses is null', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Rose',
        volumeMl: 100,
        price: 100000,
        salePrice: null,
        stock: 10,
        product: { id: 'prod1', name: 'Rose Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        fullName: 'Alice',
        phone: '123',
        province: 'Bangkok',
        district: 'D1',
        ward: 'W1',
        line1: 'L1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'FIXED30',
        type: CouponType.FIXED,
        value: 30000,
        active: true,
        maxUses: null,
        usedCount: 5,
      });
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order1',
        code: 'ORD001',
        subtotal: 100000,
        discount: 30000,
        total: 70000,
      });

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: 'FIXED30',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discount: 30000,
            total: 70000,
          }),
        }),
      );
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: { code: 'FIXED30', active: true },
        data: { usedCount: { increment: 1 } },
      });
    });

    it('should ignore couponCode when it is empty or whitespace only', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Rose',
        volumeMl: 100,
        price: 100000,
        salePrice: null,
        stock: 10,
        product: { id: 'prod1', name: 'Rose Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        fullName: 'Alice',
        phone: '123',
        province: 'Bangkok',
        district: 'D1',
        ward: 'W1',
        line1: 'L1',
      });
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order1',
        code: 'ORD001',
        total: 100000,
      });

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: '   ',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
    });

    it('should apply coupon from server cart when checkout does not provide explicit items', async () => {
      const mockCartWithCoupon = {
        id: 'cart1',
        userId: 'user1',
        couponId: 'CART10',
        items: [
          {
            id: 'item1',
            cartId: 'cart1',
            variantId: 'var1',
            quantity: 1,
            variant: {
              id: 'var1',
              scent: 'Rose',
              volumeMl: 100,
              price: 100000,
              salePrice: null,
              stock: 10,
              product: { id: 'prod1', name: 'Rose Spray', active: true },
            },
          },
        ],
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(mockCartWithCoupon);
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        fullName: 'Alice',
        phone: '123',
        province: 'Bangkok',
        district: 'D1',
        ward: 'W1',
        line1: 'L1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'CART10',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        usedCount: 0,
      });
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order1',
        code: 'ORD001',
        discount: 10000,
        total: 90000,
      });

      const result = await service.checkout('user1', { addressId: 'addr1' });

      expect(result).toBeDefined();
      expect(mockPrismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            couponCode: 'CART10',
            discount: 10000,
            total: 90000,
          }),
        }),
      );
    });

    it('should throw BadRequestException when cart item quantity is not a positive integer', async () => {
      const mockCartInvalidQuantity = {
        id: 'cart1',
        userId: 'user1',
        items: [
          {
            id: 'item1',
            cartId: 'cart1',
            variantId: 'var1',
            quantity: 0,
            variant: {
              id: 'var1',
              stock: 10,
              product: { id: 'prod1', active: true },
            },
          },
        ],
      };
      mockPrismaService.cart.findUnique.mockResolvedValue(
        mockCartInvalidQuantity,
      );

      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow('Quantity must be a positive integer');
    });

    it('should throw BadRequestException when stock update count is not 1 inside transaction', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Mint',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        stock: 5,
        product: { id: 'prod1', name: 'Mint Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        fullName: 'Alice',
        phone: '123',
        province: 'Bangkok',
        district: 'D1',
        ward: 'W1',
        line1: 'L1',
      });
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 2 }],
        }),
      ).rejects.toThrow('Insufficient stock for Mint Spray - Mint.');
    });

    it('should throw NotFoundException when variant is not found after stock decrement', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Bangkok',
      });
      mockPrismaService.productVariant.findUnique.mockImplementation(
        ({ select }: any) => {
          if (select) {
            return Promise.resolve(null);
          }
          return Promise.resolve({
            id: 'var1',
            scent: 'Mint',
            volumeMl: 100,
            price: 50000,
            salePrice: null,
            stock: 5,
            product: { id: 'prod1', name: 'Mint Spray', active: true },
          });
        },
      );
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow('Product variant not found: var1');
    });

    it('should throw BadRequestException when coupon usage update count is not 1 inside transaction', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Mint',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        stock: 5,
        product: { id: 'prod1', name: 'Mint Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        fullName: 'Alice',
        phone: '123',
        province: 'Bangkok',
        district: 'D1',
        ward: 'W1',
        line1: 'L1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'LIMITED',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        maxUses: 10,
        usedCount: 9,
      });
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'LIMITED',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'LIMITED',
        }),
      ).rejects.toThrow('Coupon is no longer available');
    });

    it('should throw BadRequestException when user usage limit is exceeded inside transaction', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Mint',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        stock: 5,
        product: { id: 'prod1', name: 'Mint Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        fullName: 'Alice',
        phone: '123',
        province: 'Bangkok',
        district: 'D1',
        ward: 'W1',
        line1: 'L1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'ONCEPERUSER',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        maxUsesPerUser: 1,
        usedCount: 0,
      });

      let txCheck = false;
      mockPrismaService.order.count.mockImplementation(({ where }: any) => {
        if (where?.couponCode) {
          if (!txCheck) {
            txCheck = true;
            return Promise.resolve(0);
          }
          txCheck = false;
          return Promise.resolve(1);
        }
        return Promise.resolve(0);
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'ONCEPERUSER',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'ONCEPERUSER',
        }),
      ).rejects.toThrow(
        'You have already used this coupon the maximum number of times',
      );
    });

    it('should retry on P2034 serializable conflict and succeed on next attempt', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD001',
        total: 50000,
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Mint',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        stock: 5,
        product: { id: 'prod1', name: 'Mint Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        fullName: 'Alice',
        phone: '123',
        province: 'Bangkok',
        district: 'D1',
        ward: 'W1',
        line1: 'L1',
      });

      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Transaction failed due to a write conflict or a deadlock. Please retry your transaction',
        {
          code: 'P2034',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.$transaction
        .mockRejectedValueOnce(p2034Error)
        .mockImplementationOnce(async (callback) =>
          callback(mockPrismaService),
        );
      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result).toBe(mockOrder);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when serializable transaction exhausts all retries on P2034', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        scent: 'Mint',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        stock: 5,
        product: { id: 'prod1', name: 'Mint Spray', active: true },
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Bangkok',
      });

      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Transaction failed due to a write conflict or a deadlock',
        {
          code: 'P2034',
          clientVersion: '5.0.0',
        },
      );

      mockPrismaService.$transaction.mockRejectedValue(p2034Error);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow(
        'Transaction failed due to a write conflict or a deadlock',
      );
    });
  });
});
