import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  CouponType,
  OrderStatus,
  PaymentStatus,
  StockMovementType,
} from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CheckoutDto, ShippingMethod } from './dtos/checkout.dto';
import { OrderFilterDto } from './dtos/order-filter.dto';

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
      updateMany: jest.fn(),
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
    $transaction: jest.fn(),
  };

  const defaultMockAddress = {
    id: 'addr-1',
    userId: 'user-1',
    fullName: 'John Doe',
    phone: '0812345678',
    province: 'Bangkok',
    district: 'Chatuchak',
    ward: 'Lat Yao',
    line1: '123 Test St.',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultMockVariant = {
    id: 'var-1',
    productId: 'prod-1',
    sku: 'LAV-250',
    scent: 'Lavender',
    volumeMl: 250,
    price: 100000,
    salePrice: null,
    stock: 20,
    product: {
      id: 'prod-1',
      name: 'Lavender Spray',
      active: true,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaService);
      }
      return callback;
    });

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkout - Idempotency & checkoutKey handling', () => {
    it('returns existing order when checkoutKey matches and items, address, and payment method match', async () => {
      const existingOrder = {
        id: 'order-1',
        code: 'ORD2601010001AAAA',
        userId: 'user-1',
        paymentMethod: 'COD',
        addressJson: JSON.stringify({
          fullName: 'John Doe',
          phone: '0812345678',
          province: 'Bangkok',
          district: 'Chatuchak',
          ward: 'Lat Yao',
          line1: '123 Test St.',
        }),
        items: [
          {
            variantId: 'var-1',
            quantity: 2,
          },
        ],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue(defaultMockAddress);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'unique-key-1',
        addressId: 'addr-1',
        paymentMethod: 'COD',
        items: [
          {
            variantId: 'var-1',
            quantity: 2,
            price: 100000,
          },
        ],
      };

      const result = await service.checkout('user-1', checkoutDto);

      expect(result).toBe(existingOrder);
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { checkoutKey: 'unique-key-1' },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('returns existing order when checkoutKey matches with inline address and default PENDING paymentMethod', async () => {
      const existingOrder = {
        id: 'order-1',
        code: 'ORD2601010001AAAA',
        userId: 'user-1',
        paymentMethod: 'PENDING',
        addressJson: JSON.stringify({
          fullName: 'John Doe',
          phone: '0812345678',
          province: 'Bangkok',
          district: 'Chatuchak',
          ward: 'Lat Yao',
          line1: '123 Test St.',
        }),
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'unique-key-inline',
        fullName: 'John Doe',
        phone: '0812345678',
        province: 'Bangkok',
        district: 'Chatuchak',
        ward: 'Lat Yao',
        line1: '123 Test St.',
      };

      const result = await service.checkout('user-1', checkoutDto);

      expect(result).toBe(existingOrder);
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when existing order checkoutKey belongs to a different user', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-other',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user-1', { checkoutKey: 'key-stolen' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { checkoutKey: 'key-stolen' }),
      ).rejects.toThrow('Mã đặt hàng không hợp lệ');
    });

    it('throws ConflictException when checkoutKey order items length differs', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-mismatch',
        items: [
          { variantId: 'var-1', quantity: 1 },
          { variantId: 'var-2', quantity: 1 },
        ],
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        'Mã đặt hàng đã được dùng cho một đơn khác',
      );
    });

    it('throws ConflictException when checkoutKey order item variantId does not match', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-var-mismatch',
        items: [{ variantId: 'var-different', quantity: 1 }],
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        'Mã đặt hàng đã được dùng cho một đơn khác',
      );
    });

    it('throws ConflictException when checkoutKey order item quantity does not match', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-qty-mismatch',
        items: [{ variantId: 'var-1', quantity: 5 }],
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when existing order addressJson cannot be parsed', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        addressJson: 'invalid-json{',
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user-1', { checkoutKey: 'bad-json' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.checkout('user-1', { checkoutKey: 'bad-json' }),
      ).rejects.toThrow('Mã đặt hàng đã được dùng cho một đơn khác');
    });

    it('throws ConflictException when existing order addressJson parsed to a non-object', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        addressJson: '12345',
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user-1', { checkoutKey: 'number-json' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when addressId is not found for the user in existing order check', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        addressJson: JSON.stringify({ fullName: 'A' }),
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue(null);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-addr-missing',
        addressId: 'addr-nonexistent',
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.address.findFirst).toHaveBeenCalledWith({
        where: { id: 'addr-nonexistent', userId: 'user-1' },
      });
    });

    it('throws ConflictException when request address field differs from order addressJson', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        paymentMethod: 'COD',
        addressJson: JSON.stringify({
          fullName: 'John Doe',
          phone: '0812345678',
          province: 'Bangkok',
          district: 'Chatuchak',
          ward: 'Lat Yao',
          line1: '123 Test St.',
        }),
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-diff-field',
        fullName: 'Jane Doe', // Different name
        phone: '0812345678',
        province: 'Bangkok',
        district: 'Chatuchak',
        ward: 'Lat Yao',
        line1: '123 Test St.',
        paymentMethod: 'COD',
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws ConflictException when paymentMethod does not match order paymentMethod', async () => {
      const existingOrder = {
        id: 'order-1',
        userId: 'user-1',
        paymentMethod: 'COD',
        addressJson: JSON.stringify({
          fullName: 'John Doe',
          phone: '0812345678',
          province: 'Bangkok',
          district: 'Chatuchak',
          ward: 'Lat Yao',
          line1: '123 Test St.',
        }),
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-diff-pm',
        fullName: 'John Doe',
        phone: '0812345678',
        province: 'Bangkok',
        district: 'Chatuchak',
        ward: 'Lat Yao',
        line1: '123 Test St.',
        paymentMethod: 'STRIPE',
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        'Mã đặt hàng đã được dùng cho một đơn khác',
      );
    });
  });

  describe('checkout - Concurrency conflict & recovery (P2002 handling)', () => {
    it('catches P2002 with target array containing checkoutKey and returns matching existing order', async () => {
      const existingOrder = {
        id: 'order-p2002-recovered',
        code: 'ORD2601010002BBBB',
        userId: 'user-1',
        paymentMethod: 'COD',
        addressJson: JSON.stringify({
          fullName: 'John Doe',
          phone: '0812345678',
          province: 'Bangkok',
          district: 'Chatuchak',
          ward: 'Lat Yao',
          line1: '123 Test St.',
        }),
        items: [],
      };

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.8.0',
          meta: { target: ['checkoutKey'] },
        } as any,
      );

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingOrder);

      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.address.findFirst.mockResolvedValue(defaultMockAddress);
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      mockPrismaService.$transaction.mockRejectedValue(p2002Error);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-p2002-arr',
        addressId: 'addr-1',
        paymentMethod: 'COD',
      };

      const result = await service.checkout('user-1', checkoutDto);

      expect(result).toBe(existingOrder);
    });

    it('catches P2002 with target string containing checkoutKey and recovers', async () => {
      const existingOrder = {
        id: 'order-p2002-str',
        userId: 'user-1',
        paymentMethod: 'COD',
        addressJson: JSON.stringify({
          fullName: 'John Doe',
          phone: '0812345678',
          province: 'Bangkok',
          district: 'Chatuchak',
          ward: 'Lat Yao',
          line1: '123 Test St.',
        }),
        items: [],
      };

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.8.0',
          meta: { target: 'orders_checkoutKey_key' },
        } as any,
      );

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingOrder);

      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.address.findFirst.mockResolvedValue(defaultMockAddress);
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      mockPrismaService.$transaction.mockRejectedValue(p2002Error);

      const checkoutDto: CheckoutDto = {
        checkoutKey: 'key-p2002-str',
        addressId: 'addr-1',
        paymentMethod: 'COD',
      };

      const result = await service.checkout('user-1', checkoutDto);

      expect(result).toBe(existingOrder);
    });

    it('rethrows P2002 error when recovery lookup returns null', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.8.0',
          meta: { target: ['checkoutKey'] },
        } as any,
      );

      mockPrismaService.order.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      mockPrismaService.$transaction.mockRejectedValue(p2002Error);

      await expect(
        service.checkout('user-1', {
          checkoutKey: 'key-not-found-on-recovery',
          addressId: 'addr-1',
        }),
      ).rejects.toThrow(p2002Error);
    });

    it('rethrows P2002 error when target does not include checkoutKey', async () => {
      const p2002CodeError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation on code',
        {
          code: 'P2002',
          clientVersion: '5.8.0',
          meta: { target: ['code'] },
        } as any,
      );

      mockPrismaService.order.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      mockPrismaService.$transaction.mockRejectedValue(p2002CodeError);

      await expect(
        service.checkout('user-1', {
          checkoutKey: 'key-code-target',
          addressId: 'addr-1',
        }),
      ).rejects.toThrow(p2002CodeError);
    });

    it('rethrows non-P2002 error immediately during checkout', async () => {
      const generalError = new Error('Database disk error');

      mockPrismaService.order.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      mockPrismaService.$transaction.mockRejectedValue(generalError);

      await expect(
        service.checkout('user-1', {
          checkoutKey: 'key-general-err',
          addressId: 'addr-1',
        }),
      ).rejects.toThrow(generalError);
    });
  });

  describe('checkout - Explicit checkout items (Local cart authoritative)', () => {
    it('creates order successfully with explicit items using salePrice', async () => {
      const variantWithSalePrice = {
        ...defaultMockVariant,
        price: 200000,
        salePrice: 150000,
        stock: 10,
      };

      mockPrismaService.productVariant.findUnique
        .mockResolvedValueOnce(variantWithSalePrice) // first pass validation
        .mockResolvedValueOnce({ stock: 8 }); // inside tx findUnique after decrement

      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });

      const mockCreatedOrder = {
        id: 'order-explicit-1',
        code: 'ORD2601010001XXXX',
        userId: 'user-1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 300000,
        discount: 0,
        shippingFee: 0,
        total: 300000,
      };
      mockPrismaService.order.create.mockResolvedValue(mockCreatedOrder);

      const checkoutDto: CheckoutDto = {
        addressId: 'addr-1',
        items: [
          {
            variantId: 'var-1',
            quantity: 2,
            price: 200000,
          },
        ],
      };

      const result = await service.checkout('user-1', checkoutDto);

      expect(result).toEqual(mockCreatedOrder);
      expect(mockPrismaService.productVariant.updateMany).toHaveBeenCalledWith({
        where: { id: 'var-1', stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var-1',
          type: StockMovementType.OUT,
          quantity: 2,
          previousStock: 10,
          newStock: 8,
          notes: expect.stringContaining('Reserved for order'),
        },
      });
    });

    it('throws BadRequestException when explicit item quantity is not an integer', async () => {
      const checkoutDto: CheckoutDto = {
        addressId: 'addr-1',
        items: [
          {
            variantId: 'var-1',
            quantity: 1.5 as any,
          },
        ],
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        'Quantity must be a positive integer',
      );
    });

    it('throws BadRequestException when explicit item quantity is zero or negative', async () => {
      const checkoutDtoZero: CheckoutDto = {
        addressId: 'addr-1',
        items: [{ variantId: 'var-1', quantity: 0 }],
      };
      await expect(service.checkout('user-1', checkoutDtoZero)).rejects.toThrow(
        BadRequestException,
      );

      const checkoutDtoNeg: CheckoutDto = {
        addressId: 'addr-1',
        items: [{ variantId: 'var-1', quantity: -3 }],
      };
      await expect(service.checkout('user-1', checkoutDtoNeg)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when explicit item variant does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      const checkoutDto: CheckoutDto = {
        addressId: 'addr-1',
        items: [{ variantId: 'var-nonexistent', quantity: 1 }],
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        'Product variant not found: var-nonexistent',
      );
    });

    it('throws BadRequestException when explicit item product is inactive', async () => {
      const inactiveVariant = {
        ...defaultMockVariant,
        product: {
          id: 'prod-1',
          name: 'Lavender Spray',
          active: false,
        },
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        inactiveVariant,
      );

      const checkoutDto: CheckoutDto = {
        addressId: 'addr-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        'Product is no longer available: Lavender Spray',
      );
    });

    it('throws BadRequestException when explicit item has insufficient stock', async () => {
      const lowStockVariant = {
        ...defaultMockVariant,
        stock: 2,
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        lowStockVariant,
      );

      const checkoutDto: CheckoutDto = {
        addressId: 'addr-1',
        items: [{ variantId: 'var-1', quantity: 5 }],
      };

      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.checkout('user-1', checkoutDto)).rejects.toThrow(
        'Insufficient stock for Lavender Spray - Lavender. Only 2 available.',
      );
    });
  });

  describe('checkout - Server cart fallback, coupon lookup & item revalidation', () => {
    it('throws BadRequestException when cart is null and no items provided', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Cart is empty or no items provided');
    });

    it('throws BadRequestException when cart has 0 items and items is empty array', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-empty',
        items: [],
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1', items: [] }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1', items: [] }),
      ).rejects.toThrow('Cart is empty or no items provided');
    });

    it('finds and applies coupon from cart.couponId when coupon exists', async () => {
      const mockCoupon = {
        id: 'coupon-1',
        code: 'DISCOUNT10',
        active: true,
        type: CouponType.PERCENT,
        value: 10,
        maxDiscount: 50000,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        usedCount: 0,
        maxUsesPerUser: null,
        minOrder: null,
      };

      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        couponId: 'DISCOUNT10',
        items: [
          {
            id: 'cart-item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.count.mockResolvedValue(0);

      const mockCreatedOrder = {
        id: 'order-with-cart-coupon',
        discount: 10000,
        total: 90000,
      };
      mockPrismaService.order.create.mockResolvedValue(mockCreatedOrder);

      const result = await service.checkout('user-1', { addressId: 'addr-1' });

      expect(result).toEqual(mockCreatedOrder);
      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: 'cart-1',
          id: { in: ['cart-item-1'] },
        },
      });
      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { couponId: null },
      });
    });

    it('proceeds without coupon if cart.couponId does not exist in DB', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        couponId: 'NONEXISTENT_CODE',
        items: [
          {
            id: 'cart-item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });
      mockPrismaService.order.count.mockResolvedValue(0);

      const mockOrder = { id: 'order-no-coupon', discount: 0, total: 100000 };
      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const result = await service.checkout('user-1', { addressId: 'addr-1' });

      expect(result).toEqual(mockOrder);
    });

    it('throws BadRequestException during cart revalidation when item quantity is invalid', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 0,
            variant: defaultMockVariant,
          },
        ],
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Quantity must be a positive integer');
    });

    it('throws BadRequestException with "Unknown product" when product name is missing on inactive cart product', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variant: {
              ...defaultMockVariant,
              product: {
                active: false,
                name: undefined,
              },
            },
          },
        ],
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Product is no longer available: Unknown product');
    });
  });

  describe('checkout - Address creation and validation', () => {
    it('creates a new address during checkout when complete address fields are provided', async () => {
      const newAddress = {
        id: 'addr-created',
        userId: 'user-1',
        fullName: 'Jane Doe',
        phone: '0987654321',
        province: 'Bangkok',
        district: 'Pathum Wan',
        ward: 'Lumphini',
        line1: '456 Rama IV Rd',
        isDefault: false,
      };

      mockPrismaService.address.create.mockResolvedValue(newAddress);
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });

      const mockOrder = { id: 'order-new-addr' };
      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const checkoutDto: CheckoutDto = {
        fullName: 'Jane Doe',
        phone: '0987654321',
        province: 'Bangkok',
        district: 'Pathum Wan',
        ward: 'Lumphini',
        line1: '456 Rama IV Rd',
      };

      const result = await service.checkout('user-1', checkoutDto);

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.address.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          fullName: 'Jane Doe',
          phone: '0987654321',
          province: 'Bangkok',
          district: 'Pathum Wan',
          ward: 'Lumphini',
          line1: '456 Rama IV Rd',
          isDefault: false,
        },
      });
    });

    it('throws BadRequestException when neither addressId nor complete address info is provided', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });

      const incompleteCheckoutDto: CheckoutDto = {
        fullName: 'Jane Doe',
        phone: '0987654321',
        // missing province, district, ward, line1
      };

      await expect(
        service.checkout('user-1', incompleteCheckoutDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', incompleteCheckoutDto),
      ).rejects.toThrow(
        'Either addressId or complete address information must be provided',
      );
    });
  });

  describe('checkout - Coupon rules, usage limits and discounts', () => {
    const setupCartWithItem = (subtotal = 100000) => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        couponId: 'TEST_COUPON',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: {
              ...defaultMockVariant,
              price: subtotal,
            },
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
    };

    it('throws BadRequestException when coupon is inactive', async () => {
      setupCartWithItem();
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'TEST_COUPON',
        active: false,
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Coupon is inactive');
    });

    it('throws BadRequestException when coupon validFrom is in the future', async () => {
      setupCartWithItem();
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'TEST_COUPON',
        active: true,
        validFrom: new Date(Date.now() + 1000000),
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Coupon is not yet valid');
    });

    it('throws BadRequestException when coupon validUntil is in the past', async () => {
      setupCartWithItem();
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'TEST_COUPON',
        active: true,
        validUntil: new Date(Date.now() - 1000000),
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Coupon has expired');
    });

    it('throws BadRequestException when coupon reached maxUses', async () => {
      setupCartWithItem();
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'TEST_COUPON',
        active: true,
        maxUses: 10,
        usedCount: 10,
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Coupon has reached maximum usage limit');
    });

    it('throws BadRequestException when user has already reached maxUsesPerUser', async () => {
      setupCartWithItem();
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'TEST_COUPON',
        active: true,
        maxUsesPerUser: 2,
      });
      mockPrismaService.order.count.mockResolvedValue(2);

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(
        'You have already used this coupon the maximum number of times',
      );
    });

    it('throws BadRequestException when subtotal is below coupon minOrder', async () => {
      setupCartWithItem(100000);
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'TEST_COUPON',
        active: true,
        minOrder: 500000,
      });

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Minimum order amount is');
    });

    it('calculates FIXED coupon discount correctly', async () => {
      setupCartWithItem(200000);
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'TEST_COUPON',
        active: true,
        type: CouponType.FIXED,
        value: 50000,
      });

      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });

      let capturedOrderData: any = null;
      mockPrismaService.order.create.mockImplementation(({ data }) => {
        capturedOrderData = data;
        return { id: 'order-fixed-coupon', ...data };
      });

      await service.checkout('user-1', { addressId: 'addr-1' });

      expect(capturedOrderData.subtotal).toBe(200000);
      expect(capturedOrderData.discount).toBe(50000);
      expect(capturedOrderData.total).toBe(150000);
    });
  });

  describe('checkout - Shipping fee calculation', () => {
    const setupNonBangkokCart = (province = 'Da Nang') => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        ...defaultMockAddress,
        province,
      });
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });
    };

    it('charges 0 shipping fee for Thai script Bangkok / Nonthaburi variations', async () => {
      setupNonBangkokCart('กรุงเทพมหานคร');
      let capturedOrderData: any = null;
      mockPrismaService.order.create.mockImplementation(({ data }) => {
        capturedOrderData = data;
        return { id: 'order-thai-bkk', ...data };
      });

      await service.checkout('user-1', { addressId: 'addr-1' });
      expect(capturedOrderData.shippingFee).toBe(0);

      // Nonthaburi in Thai
      setupNonBangkokCart('นนทบุรี');
      await service.checkout('user-1', { addressId: 'addr-1' });
      expect(capturedOrderData.shippingFee).toBe(0);

      // Nonthaburi in English
      setupNonBangkokCart('Nonthaburi');
      await service.checkout('user-1', { addressId: 'addr-1' });
      expect(capturedOrderData.shippingFee).toBe(0);
    });

    it('charges 50000 shipping fee for non-Bangkok province with EXPRESS shippingMethod', async () => {
      setupNonBangkokCart('Da Nang');
      let capturedOrderData: any = null;
      mockPrismaService.order.create.mockImplementation(({ data }) => {
        capturedOrderData = data;
        return { id: 'order-express', ...data };
      });

      await service.checkout('user-1', {
        addressId: 'addr-1',
        shippingMethod: ShippingMethod.EXPRESS,
      });

      expect(capturedOrderData.shippingFee).toBe(50000);
      expect(capturedOrderData.total).toBe(150000); // 100000 + 50000
    });

    it('charges 30000 shipping fee for non-Bangkok province with STANDARD shippingMethod', async () => {
      setupNonBangkokCart('Da Nang');
      let capturedOrderData: any = null;
      mockPrismaService.order.create.mockImplementation(({ data }) => {
        capturedOrderData = data;
        return { id: 'order-standard', ...data };
      });

      await service.checkout('user-1', {
        addressId: 'addr-1',
        shippingMethod: ShippingMethod.STANDARD,
      });

      expect(capturedOrderData.shippingFee).toBe(30000);
      expect(capturedOrderData.total).toBe(130000);
    });

    it('applies 0 shippingFee when FREESHIP coupon is used on non-Bangkok address', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        couponId: 'FREESHIP_COUPON',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        ...defaultMockAddress,
        province: 'Da Nang',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'FREESHIP_COUPON',
        active: true,
        type: CouponType.FREESHIP,
      });
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });

      let capturedOrderData: any = null;
      mockPrismaService.order.create.mockImplementation(({ data }) => {
        capturedOrderData = data;
        return { id: 'order-freeship', ...data };
      });

      await service.checkout('user-1', {
        addressId: 'addr-1',
        shippingMethod: ShippingMethod.EXPRESS,
      });

      expect(capturedOrderData.discount).toBe(0);
      expect(capturedOrderData.shippingFee).toBe(0);
      expect(capturedOrderData.total).toBe(100000);
    });
  });

  describe('checkout - In-transaction stock reservation and coupon updates', () => {
    it('throws BadRequestException when stock update count is not 1 inside transaction', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 2,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 0,
      }); // Concurrent depletion

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Insufficient stock for Lavender Spray - Lavender.');
    });

    it('throws NotFoundException when updated variant is missing after decrement inside transaction', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null); // Missing variant

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Product variant not found: var-1');
    });

    it('throws BadRequestException when coupon update count is not 1 inside transaction', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        couponId: 'LIMITED_COUPON',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'LIMITED_COUPON',
        active: true,
        type: CouponType.FIXED,
        value: 10000,
        maxUses: 1,
      });
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 0 }); // Concurrent usage limit reached

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow('Coupon is no longer available');
    });

    it('throws BadRequestException when per-user coupon limit is reached during transaction check', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        couponId: 'USER_LIMITED',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'USER_LIMITED',
        active: true,
        type: CouponType.FIXED,
        value: 10000,
        maxUsesPerUser: 1,
      });

      let userCouponCountCalls = 0;
      mockPrismaService.order.count.mockImplementation(async (query: any) => {
        if (query?.where?.createdAt) {
          return 0; // generateOrderNumber
        }
        if (query?.where?.couponCode) {
          userCouponCountCalls += 1;
          // Return 0 on 1st check (pre-tx check passes) and 1 on subsequent checks (in-tx check fails)
          return userCouponCountCalls % 2 === 1 ? 0 : 1;
        }
        return 0;
      });

      const checkoutPromise = service.checkout('user-1', {
        addressId: 'addr-1',
      });

      await expect(checkoutPromise).rejects.toThrow(BadRequestException);
      await expect(checkoutPromise).rejects.toThrow(
        'You have already used this coupon the maximum number of times',
      );
    });

    it('increments coupon usage without maxUses condition when coupon.maxUses is null', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        couponId: 'UNLIMITED_COUPON',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'UNLIMITED_COUPON',
        active: true,
        type: CouponType.FIXED,
        value: 10000,
        maxUses: null,
      });
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-unlimited',
      });

      await service.checkout('user-1', { addressId: 'addr-1' });

      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: { code: 'UNLIMITED_COUPON', active: true },
        data: { usedCount: { increment: 1 } },
      });
    });
  });

  describe('checkout - Transaction retry logic (runSerializableTransaction)', () => {
    it('retries on P2034 serialization error and succeeds on 2nd attempt', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Serialization failure',
        {
          code: 'P2034',
          clientVersion: '5.8.0',
        },
      );

      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 19,
      });

      const mockOrder = { id: 'order-retry-success' };

      mockPrismaService.$transaction
        .mockRejectedValueOnce(p2034Error)
        .mockImplementationOnce(async (callback: any) =>
          callback(mockPrismaService),
        );

      mockPrismaService.order.create.mockResolvedValue(mockOrder);

      const result = await service.checkout('user-1', { addressId: 'addr-1' });

      expect(result).toEqual(mockOrder);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
    });

    it('retries up to 3 times and rethrows P2034 error if all attempts fail', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Serialization failure',
        {
          code: 'P2034',
          clientVersion: '5.8.0',
        },
      );

      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            quantity: 1,
            variantId: 'var-1',
            variant: defaultMockVariant,
          },
        ],
      });
      mockPrismaService.address.findUnique.mockResolvedValue(
        defaultMockAddress,
      );
      mockPrismaService.order.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockRejectedValue(p2034Error);

      await expect(
        service.checkout('user-1', { addressId: 'addr-1' }),
      ).rejects.toThrow(p2034Error);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe('getMyOrderById', () => {
    it('throws NotFoundException when order is not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.getMyOrderById('user-1', 'order-nonexistent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getMyOrderById('user-1', 'order-nonexistent'),
      ).rejects.toThrow('Order not found');
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-nonexistent' },
        include: expect.any(Object),
      });
    });

    it('throws NotFoundException when order belongs to a different user', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-2',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(order);

      await expect(service.getMyOrderById('user-1', 'order-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMyOrderById('user-1', 'order-1')).rejects.toThrow(
        'Order not found',
      );
    });

    it('returns order when order exists and belongs to requesting user', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        code: 'ORD2601010001',
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(order);

      const result = await service.getMyOrderById('user-1', 'order-1');

      expect(result).toBe(order);
    });
  });

  describe('getAllOrders', () => {
    it('returns orders using default page=1 and limit=20 when filterDto is empty', async () => {
      const orders = [
        { id: 'order-1', code: 'ORD001' },
        { id: 'order-2', code: 'ORD002' },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(orders);
      mockPrismaService.order.count.mockResolvedValue(2);

      const filterDto: OrderFilterDto = {};
      const result = await service.getAllOrders(filterDto);

      expect(result).toEqual({
        data: orders,
        total: 2,
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
        include: expect.any(Object),
      });
    });

    it('filters orders by status and search query', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      const filterDto: OrderFilterDto = {
        page: 2,
        limit: 10,
        status: OrderStatus.SHIPPED,
        search: 'Alice',
      };

      const result = await service.getAllOrders(filterDto);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: {
          status: OrderStatus.SHIPPED,
          OR: [
            { id: { contains: 'Alice', mode: 'insensitive' } },
            { code: { contains: 'Alice', mode: 'insensitive' } },
            { user: { email: { contains: 'Alice', mode: 'insensitive' } } },
            { user: { name: { contains: 'Alice', mode: 'insensitive' } } },
          ],
        },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('calculates pagination boundary flags hasNextPage and hasPreviousPage correctly', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(55);

      const filterDto: OrderFilterDto = { page: 2, limit: 20 };
      const result = await service.getAllOrders(filterDto);

      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });
  });

  describe('getOrderById', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('order-nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrderById('order-nonexistent')).rejects.toThrow(
        'Order not found',
      );
      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-nonexistent' },
        include: expect.any(Object),
      });
    });

    it('returns the order when found', async () => {
      const order = {
        id: 'order-1',
        code: 'ORD001',
        user: { id: 'user-1', name: 'John Doe' },
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(order);

      const result = await service.getOrderById('order-1');

      expect(result).toBe(order);
    });
  });

  describe('updateOrderStatus - Status transitions, payment updates, and stock restoration', () => {
    it('transitions from PAID to PACKING setting paymentStatus to COMPLETED', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.PACKING,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order-1', {
        status: OrderStatus.PACKING,
      });

      expect(result.status).toBe(OrderStatus.PACKING);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: OrderStatus.PAID },
        data: {
          status: OrderStatus.PACKING,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });
    });

    it('transitions from PACKING to SHIPPED setting paymentStatus to COMPLETED', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PACKING,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order-1', {
        status: OrderStatus.SHIPPED,
      });

      expect(result.status).toBe(OrderStatus.SHIPPED);
    });

    it('transitions from SHIPPED to DELIVERED preserving current paymentStatus', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.SHIPPED,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order-1', {
        status: OrderStatus.DELIVERED,
      });

      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: OrderStatus.SHIPPED },
        data: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });
    });

    it('transitions from DELIVERED to REFUNDED setting paymentStatus to REFUNDED', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
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

      const result = await service.updateOrderStatus('order-1', {
        status: OrderStatus.REFUNDED,
      });

      expect(result.status).toBe(OrderStatus.REFUNDED);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: OrderStatus.DELIVERED },
        data: {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
    });

    it('transitions from PENDING_PAYMENT to CANCELED setting paymentStatus to FAILED, restoring stock, and releasing coupon', async () => {
      const mockOrder = {
        id: 'order-1',
        code: 'ORD001',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        couponCode: 'SAVE20',
        items: [
          {
            variantId: 'var-1',
            quantity: 3,
          },
        ],
      };
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        stock: 5,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var-1',
        stock: 8,
      });

      const result = await service.updateOrderStatus('order-1', {
        status: OrderStatus.CANCELED,
      });

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: OrderStatus.PENDING_PAYMENT },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: { increment: 3 } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var-1',
          type: StockMovementType.IN,
          quantity: 3,
          previousStock: 5,
          newStock: 8,
          notes: 'Stock restored from PENDING_PAYMENT order ORD001',
        },
      });
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: { code: 'SAVE20', usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    });

    it('transitions from PAID to CANCELED setting paymentStatus to REFUNDED', async () => {
      const mockOrder = {
        id: 'order-1',
        code: 'ORD001',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        couponCode: null,
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

      const result = await service.updateOrderStatus('order-1', {
        status: OrderStatus.CANCELED,
      });

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: OrderStatus.PAID },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
    });

    it('transitions from PACKING to CANCELED setting paymentStatus to REFUNDED', async () => {
      const mockOrder = {
        id: 'order-1',
        code: 'ORD001',
        status: OrderStatus.PACKING,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: OrderStatus.CANCELED });
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      await service.updateOrderStatus('order-1', {
        status: OrderStatus.CANCELED,
      });

      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: OrderStatus.PACKING },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
    });

    it('throws BadRequestException for invalid transitions from terminal statuses (CANCELED, REFUNDED)', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
        items: [],
      });

      await expect(
        service.updateOrderStatus('order-1', { status: OrderStatus.PAID }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateOrderStatus('order-1', { status: OrderStatus.PAID }),
      ).rejects.toThrow('Invalid status transition from CANCELED to PAID');

      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-2',
        status: OrderStatus.REFUNDED,
        paymentStatus: PaymentStatus.REFUNDED,
        items: [],
      });

      await expect(
        service.updateOrderStatus('order-2', { status: OrderStatus.DELIVERED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when concurrent status update modifies 0 records', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 0 }); // Concurrent change

      await expect(
        service.updateOrderStatus('order-1', { status: OrderStatus.PAID }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateOrderStatus('order-1', { status: OrderStatus.PAID }),
      ).rejects.toThrow('Order status changed; please retry');
    });

    it('skips variant update during stock restore when variant no longer exists in DB', async () => {
      const mockOrder = {
        id: 'order-1',
        code: 'ORD001',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        items: [{ variantId: 'var-deleted', quantity: 2 }],
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: OrderStatus.CANCELED });
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await service.updateOrderStatus('order-1', {
        status: OrderStatus.CANCELED,
      });

      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder - Additional cancellation flows & concurrency', () => {
    it('cancels a PAID order without releasing coupon usage', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        code: 'ORD001',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        couponCode: 'SAVE10',
        items: [{ variantId: 'var-1', quantity: 1 }],
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
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        stock: 10,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var-1',
        stock: 11,
      });

      const result = await service.cancelOrder('user-1', 'order-1');

      expect(result.status).toBe(OrderStatus.CANCELED);
      // Coupon is NOT released for PAID order cancellation
      expect(mockPrismaService.coupon.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: { increment: 1 } },
      });
    });

    it('cancels a PENDING_PAYMENT order with coupon and releases coupon usage', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        code: 'ORD001',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        couponCode: 'SAVE10',
        items: [],
      };

      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
      };

      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });

      await service.cancelOrder('user-1', 'order-1');

      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: { code: 'SAVE10', usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    });

    it('throws BadRequestException when concurrent cancellation modifies 0 records', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PENDING_PAYMENT,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 0 }); // Concurrent status modification

      await expect(service.cancelOrder('user-1', 'order-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelOrder('user-1', 'order-1')).rejects.toThrow(
        'Order cannot be cancelled at this stage',
      );
    });
  });

  describe('Private helper edge cases', () => {
    it('restores stock using fallback prisma.$transaction when transactionClient is omitted', async () => {
      const order = {
        id: 'order-1',
        code: 'ORD001',
        status: OrderStatus.CANCELED,
        items: [{ variantId: 'var-1', quantity: 2 }],
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        stock: 5,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var-1',
        stock: 7,
      });

      await (service as any).restoreStockForOrder(order);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: { increment: 2 } },
      });
    });

    it('isCheckoutKeyUniqueConstraintError returns false for non-object, null, and non-P2002 errors', () => {
      const helper = (service as any).isCheckoutKeyUniqueConstraintError;

      expect(helper(null)).toBe(false);
      expect(helper(undefined)).toBe(false);
      expect(helper('error string')).toBe(false);
      expect(helper(12345)).toBe(false);
      expect(helper({ code: 'P2003' })).toBe(false);
      expect(helper({ code: 'P2002' })).toBe(false); // No meta/target
      expect(helper({ code: 'P2002', meta: { target: null } })).toBe(false);
      expect(helper({ code: 'P2002', meta: { target: ['otherField'] } })).toBe(
        false,
      );
      expect(helper({ code: 'P2002', meta: { target: 'otherField' } })).toBe(
        false,
      );
      expect(helper({ code: 'P2002', meta: { target: ['checkoutKey'] } })).toBe(
        true,
      );
      expect(
        helper({ code: 'P2002', meta: { target: 'order_checkoutKey_key' } }),
      ).toBe(true);
    });
  });
});
