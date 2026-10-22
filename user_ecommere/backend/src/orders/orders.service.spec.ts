import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CouponType, OrderStatus, PaymentStatus } from '@prisma/client';
import { CheckoutDto, ShippingMethod } from './dtos/checkout.dto';
import { ShippingService } from '../shipping/shipping.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('OrdersService', () => {
  let service: OrdersService;

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
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        stock: 8,
      });

      const result = await service.checkout('user1', { addressId: 'addr1' });

      expect(result).toBeDefined();
      expect(result.code).toContain('ORD');
      expect(result.total).toBe(200000);
      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: 'cart1',
          id: { in: ['item1'] },
        },
      });
      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart1' },
        data: { couponId: null },
      });
    });

    it('should remove ordered variants from customer server cart when checkout uses explicit items', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 100000,
        discount: 0,
        shippingFee: 0,
        total: 100000,
        couponCode: null,
        addressJson: mockAddress,
        items: [
          {
            variantId: 'var1',
            quantity: 1,
            price: 100000,
            total: 100000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCartWithMultipleItems = {
        id: 'cart1',
        userId: 'user1',
        couponCode: null,
        items: [
          mockCart.items[0],
          {
            id: 'item2',
            cartId: 'cart1',
            variantId: 'var2',
            quantity: 1,
            variant: {
              id: 'var2',
              sku: 'ROSE-250ML',
              scent: 'Rose',
              volumeMl: 250,
              price: 120000,
              salePrice: null,
              stock: 5,
              product: {
                id: 'prod2',
                name: 'Rose Spray',
                active: true,
              },
            },
          },
        ],
        coupon: null,
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(
        mockCartWithMultipleItems,
      );
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: 'cart1',
          variantId: { in: ['var1'] },
        },
      });
      expect(mockPrismaService.cart.update).not.toHaveBeenCalled();
    });

    it('should complete checkout with explicit items when customer has no server cart', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 100000,
        discount: 0,
        shippingFee: 0,
        total: 100000,
        couponCode: null,
        addressJson: mockAddress,
        items: [
          {
            variantId: 'var1',
            quantity: 1,
            price: 100000,
            total: 100000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.cartItem.deleteMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when cart is empty', async () => {
      const emptyCart = {
        id: 'cart1',
        userId: 'user1',
        items: [],
        coupon: null,
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(emptyCart);

      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow('Cart is empty');
    });

    it('should throw NotFoundException when address not found', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.address.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout('user1', { addressId: 'invalid' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.checkout('user1', { addressId: 'invalid' }),
      ).rejects.toThrow('Address not found');
    });

    it('should throw BadRequestException when address belongs to different user', async () => {
      const otherUserAddress = { ...mockAddress, userId: 'user2' };

      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.address.findUnique.mockResolvedValue(otherUserAddress);

      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow(NotFoundException);
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

      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow('Product is no longer available');
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

      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', { addressId: 'addr1' }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should apply coupon discount when explicit items checkout provides a valid couponCode', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 100000,
        discount: 10000,
        shippingFee: 0,
        total: 90000,
        couponCode: 'SAVE10',
        addressJson: mockAddress,
        items: [
          {
            variantId: 'var1',
            quantity: 1,
            price: 100000,
            total: 100000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCoupon = {
        code: 'SAVE10',
        type: CouponType.PERCENT,
        value: 10,
        minOrder: null,
        maxDiscount: null,
        validFrom: null,
        validUntil: null,
        maxUses: 100,
        maxUsesPerUser: 1,
        usedCount: 0,
        active: true,
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: 'SAVE10',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
      });
      expect(mockPrismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            couponCode: 'SAVE10',
            discount: 10000,
            total: 90000,
          }),
        }),
      );
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          code: 'SAVE10',
          active: true,
          usedCount: { lt: 100 },
        },
        data: { usedCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when explicit items checkout provides an invalid couponCode', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'INVALID',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when explicit items checkout provides an expired couponCode', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'EXPIRED10',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        validUntil: new Date('2020-01-01'),
        usedCount: 0,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'EXPIRED10',
        }),
      ).rejects.toThrow('Coupon has expired');

      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when explicit items checkout provides an inactive couponCode', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'INACTIVE10',
        type: CouponType.PERCENT,
        value: 10,
        active: false,
        usedCount: 0,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'INACTIVE10',
        }),
      ).rejects.toThrow('Coupon is inactive');

      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order subtotal is below coupon minOrder in explicit items checkout', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'MINORDER',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        minOrder: 500000,
        usedCount: 0,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'MINORDER',
        }),
      ).rejects.toThrow('Minimum order amount is');

      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when coupon has reached maxUses in explicit items checkout', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'MAXUSES',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        maxUses: 5,
        usedCount: 5,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'MAXUSES',
        }),
      ).rejects.toThrow('Coupon has reached maximum usage limit');

      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when customer has reached maxUsesPerUser in explicit items checkout', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'PERUSER',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        maxUsesPerUser: 1,
        usedCount: 1,
      });
      mockPrismaService.order.count.mockResolvedValue(1);

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'PERUSER',
        }),
      ).rejects.toThrow(
        'You have already used this coupon the maximum number of times',
      );

      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
    });

    it('should set shippingFee to 0 when freeship coupon is applied with explicit items', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 100000,
        discount: 0,
        shippingFee: 0,
        total: 100000,
        couponCode: 'FREESHIP',
        addressJson: mockAddress,
        items: [
          {
            variantId: 'var1',
            quantity: 1,
            price: 100000,
            total: 100000,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCoupon = {
        code: 'FREESHIP',
        type: CouponType.FREESHIP,
        value: 0,
        active: true,
        usedCount: 0,
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        shippingMethod: ShippingMethod.EXPRESS,
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: 'FREESHIP',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            couponCode: 'FREESHIP',
            discount: 0,
            shippingFee: 0,
            total: 100000,
          }),
        }),
      );
    });

    it('should find and apply coupon when explicit items checkout provides lowercase couponCode', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 100000,
        discount: 10000,
        shippingFee: 0,
        total: 90000,
        couponCode: 'SAVE10',
        addressJson: mockAddress,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCoupon = {
        code: 'SAVE10',
        type: CouponType.PERCENT,
        value: 10,
        active: true,
        usedCount: 0,
      };

      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
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
      });
      mockPrismaService.coupon.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue(mockCoupon);
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: 'save10',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            couponCode: 'SAVE10',
          }),
        }),
      );
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

      await service.getMyOrders('user1', {
        page: 1,
        limit: 10,
        status: OrderStatus.DELIVERED,
      });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1', status: OrderStatus.DELIVERED },
        }),
      );
    });
  });

  describe('getMyOrderById', () => {
    const mockOrder = {
      id: 'order1',
      code: 'ORD25102800001',
      userId: 'user1',
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
      createdAt: new Date(),
      updatedAt: new Date(),
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
        service.getMyOrderById('user1', 'invalid-order'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getMyOrderById('user1', 'invalid-order'),
      ).rejects.toThrow('Order not found');
    });

    it('should throw ForbiddenException when order belongs to a different user', async () => {
      const foreignOrder = {
        ...mockOrder,
        userId: 'user2',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(foreignOrder);

      await expect(service.getMyOrderById('user1', 'order1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.getMyOrderById('user1', 'order1')).rejects.toThrow(
        'Unauthorized',
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
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.PAID,
      });

      expect(result.status).toBe(OrderStatus.PAID);
      expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus('invalid', { status: OrderStatus.PAID }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockOrder = {
        id: 'order1',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.updateOrderStatus('order1', {
          status: OrderStatus.PENDING_PAYMENT,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateOrderStatus('order1', {
          status: OrderStatus.PENDING_PAYMENT,
        }),
      ).rejects.toThrow('Invalid status transition');
    });

    it('should transition to CANCELED from PAID and set paymentStatus to REFUNDED, restore stock, and release coupon', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        couponCode: 'SAVE10',
        items: [
          {
            variantId: 'var1',
            quantity: 2,
          },
        ],
      };

      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.REFUNDED,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var1',
        stock: 12,
      });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.CANCELED,
      });

      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order1',
          status: OrderStatus.PAID,
        },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          code: 'SAVE10',
          usedCount: { gt: 0 },
        },
        data: { usedCount: { decrement: 1 } },
      });
      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should transition to CANCELED from PENDING_PAYMENT and set paymentStatus to FAILED', async () => {
      const mockOrder = {
        id: 'order1',
        code: 'ORD25102800001',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        couponCode: null,
        items: [],
      };

      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELED,
        paymentStatus: PaymentStatus.FAILED,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      const releaseCouponSpy = jest.spyOn(service as any, 'releaseCouponUsage');

      const result = await service.updateOrderStatus('order1', {
        status: OrderStatus.CANCELED,
      });

      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order1',
          status: OrderStatus.PENDING_PAYMENT,
        },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
      expect(releaseCouponSpy).not.toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
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
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var1',
        stock: 12,
      });
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      const result = await service.cancelOrder('user1', 'order1');

      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
    });

    it('should cancel a paid order and set paymentStatus to REFUNDED, restore stock, and release coupon', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        couponCode: 'SAVE10',
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
        paymentStatus: PaymentStatus.REFUNDED,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var1',
        stock: 12,
      });
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      const result = await service.cancelOrder('user1', 'order1');

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
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          code: 'SAVE10',
          usedCount: { gt: 0 },
        },
        data: { usedCount: { decrement: 1 } },
      });
      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should cancel a pending payment order with coupon, set paymentStatus to FAILED, restore stock, and release coupon', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        couponCode: 'SAVE10',
        items: [
          {
            variantId: 'var1',
            quantity: 1,
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
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 5,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var1',
        stock: 6,
      });
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      const result = await service.cancelOrder('user1', 'order1');

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
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: {
          code: 'SAVE10',
          usedCount: { gt: 0 },
        },
        data: { usedCount: { decrement: 1 } },
      });
      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.FAILED);
    });

    it('should not call releaseCouponUsage when cancelling an order without coupon', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.COMPLETED,
        couponCode: null,
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
        paymentStatus: PaymentStatus.REFUNDED,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        stock: 10,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var1',
        stock: 12,
      });
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);

      const releaseCouponSpy = jest.spyOn(service as any, 'releaseCouponUsage');

      const result = await service.cancelOrder('user1', 'order1');

      expect(releaseCouponSpy).not.toHaveBeenCalled();
      expect(mockPrismaService.coupon.updateMany).not.toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.cancelOrder('user1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when order belongs to different user', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user2',
        status: OrderStatus.PENDING_PAYMENT,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw BadRequestException when order cannot be cancelled', async () => {
      const mockOrder = {
        id: 'order1',
        userId: 'user1',
        status: OrderStatus.DELIVERED,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelOrder('user1', 'order1')).rejects.toThrow(
        'Order cannot be cancelled at this stage',
      );
    });
  });

  describe('quoteShippingFee', () => {
    it('should throw BadRequestException when province is empty', () => {
      expect(() => service.quoteShippingFee('')).toThrow(BadRequestException);
      expect(() => service.quoteShippingFee('')).toThrow(
        'Vui lòng nhập tỉnh/thành phố',
      );
      expect(() => service.quoteShippingFee('   ')).toThrow(
        BadRequestException,
      );
      expect(() => service.quoteShippingFee('   ')).toThrow(
        'Vui lòng nhập tỉnh/thành phố',
      );
    });

    it('should return 0 for a Bangkok quote', () => {
      const result = service.quoteShippingFee('Bangkok');

      expect(result).toEqual({
        province: 'Bangkok',
        shippingMethod: ShippingMethod.STANDARD,
        fee: 0,
      });

      const expressResult = service.quoteShippingFee(
        'Bangkok',
        ShippingMethod.EXPRESS,
      );
      expect(expressResult).toEqual({
        province: 'Bangkok',
        shippingMethod: ShippingMethod.EXPRESS,
        fee: 0,
      });
    });

    it('should return the same fee as calculateShippingFee for a non-free province with STANDARD and EXPRESS', () => {
      const province = 'Chiang Mai';
      const address = { province };

      const standardExpectedFee = (service as any).calculateShippingFee(
        address,
        ShippingMethod.STANDARD,
      );
      const standardResult = service.quoteShippingFee(
        province,
        ShippingMethod.STANDARD,
      );

      expect(standardResult).toEqual({
        province,
        shippingMethod: ShippingMethod.STANDARD,
        fee: standardExpectedFee,
      });

      const expressExpectedFee = (service as any).calculateShippingFee(
        address,
        ShippingMethod.EXPRESS,
      );
      const expressResult = service.quoteShippingFee(
        province,
        ShippingMethod.EXPRESS,
      );

      expect(expressResult).toEqual({
        province,
        shippingMethod: ShippingMethod.EXPRESS,
        fee: expressExpectedFee,
      });
    });

    it('should default shippingMethod to STANDARD when not provided', () => {
      const province = 'Chiang Mai';
      const address = { province };
      const expectedFee = (service as any).calculateShippingFee(
        address,
        ShippingMethod.STANDARD,
      );

      const result = service.quoteShippingFee(province);

      expect(result).toEqual({
        province,
        shippingMethod: ShippingMethod.STANDARD,
        fee: expectedFee,
      });
    });

    it('should trim province before calculating fee', () => {
      const result = service.quoteShippingFee('  Bangkok  ');

      expect(result).toEqual({
        province: 'Bangkok',
        shippingMethod: ShippingMethod.STANDARD,
        fee: 0,
      });
    });

    describe('shipping fee rules spec table', () => {
      const cases = [
        {
          name: 'Bangkok is free (STANDARD)',
          province: 'Bangkok',
          weight: 1,
          method: ShippingMethod.STANDARD,
          expectedFee: 0,
        },
        {
          name: 'Bangkok is free (EXPRESS)',
          province: 'Bangkok',
          weight: 1,
          method: ShippingMethod.EXPRESS,
          expectedFee: 0,
        },
        {
          name: 'Nonthaburi is free (STANDARD)',
          province: 'Nonthaburi',
          weight: 1,
          method: ShippingMethod.STANDARD,
          expectedFee: 0,
        },
        {
          name: 'Nonthaburi is free (EXPRESS)',
          province: 'Nonthaburi',
          weight: 1,
          method: ShippingMethod.EXPRESS,
          expectedFee: 0,
        },
        {
          name: 'Samut Prakan is not free (STANDARD)',
          province: 'Samut Prakan',
          weight: 1,
          method: ShippingMethod.STANDARD,
          expectedFee: 30000,
        },
        {
          name: 'Samut Prakan is not free (EXPRESS)',
          province: 'Samut Prakan',
          weight: 1,
          method: ShippingMethod.EXPRESS,
          expectedFee: 50000,
        },
        {
          name: 'missing province is not free and does not throw exception (STANDARD)',
          province: undefined,
          weight: 1,
          method: ShippingMethod.STANDARD,
          expectedFee: 30000,
        },
        {
          name: 'missing province is not free and does not throw exception (EXPRESS)',
          province: undefined,
          weight: 1,
          method: ShippingMethod.EXPRESS,
          expectedFee: 50000,
        },
        {
          name: 'standard shipping for non-free province',
          province: 'Chiang Mai',
          weight: 1,
          method: ShippingMethod.STANDARD,
          expectedFee: 30000,
        },
        {
          name: 'express shipping for non-free province',
          province: 'Chiang Mai',
          weight: 1,
          method: ShippingMethod.EXPRESS,
          expectedFee: 50000,
        },
        {
          name: 'weight does not change fee (non-free province with 10kg STANDARD)',
          province: 'Chiang Mai',
          weight: 10,
          method: ShippingMethod.STANDARD,
          expectedFee: 30000,
        },
        {
          name: 'weight does not change fee (non-free province with 20kg EXPRESS)',
          province: 'Chiang Mai',
          weight: 20,
          method: ShippingMethod.EXPRESS,
          expectedFee: 50000,
        },
        {
          name: 'weight does not change fee (free province with 10kg)',
          province: 'Bangkok',
          weight: 10,
          method: ShippingMethod.STANDARD,
          expectedFee: 0,
        },
        {
          name: 'weight does not change fee (Samut Prakan with 15kg STANDARD)',
          province: 'Samut Prakan',
          weight: 15,
          method: ShippingMethod.STANDARD,
          expectedFee: 30000,
        },
        {
          name: 'weight does not change fee (Samut Prakan with 15kg EXPRESS)',
          province: 'Samut Prakan',
          weight: 15,
          method: ShippingMethod.EXPRESS,
          expectedFee: 50000,
        },
      ];

      test.each(cases)(
        '$name ($province, weight: $weight, method: $method) -> fee: $expectedFee',
        async ({ province, weight, method, expectedFee }) => {
          const address = province !== undefined ? { province } : {};
          const fee = (service as any).calculateShippingFee(address, method);
          expect(fee).toBe(expectedFee);

          const shippingService = new ShippingService();
          const mockOrigin = {
            province: 'Bangkok',
            district: 'Chatuchak',
            ward: 'Lat Yao',
            line1: '123 Warehouse St.',
          };
          const destination = {
            province: province ?? '',
            district: 'Unknown',
            ward: 'Unknown',
            line1: 'Customer address',
          };
          const shippingQuote = await shippingService.calculateFee(
            mockOrigin,
            destination,
            weight,
            method,
          );
          expect(shippingQuote.fee).toBe(expectedFee);
        },
      );
    });
  });

  describe('previewCheckout', () => {
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

    it('should return preview data with server prices, subtotal, shipping fee, and delivery address without writing to database', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 100000,
        salePrice: 90000,
        stock: 10,
        product: {
          id: 'prod1',
          name: 'Lavender Spray',
          active: true,
        },
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 2 }],
      });

      expect(result.address).toEqual(mockAddress);
      expect(result.deliveryAddress).toBe(
        '123 Test St., Lat Yao, Chatuchak, Bangkok',
      );
      expect(result.itemCount).toBe(1);
      expect(result.subtotal).toBe(180000);
      expect(result.shippingFee).toBe(0);
      expect(result.everyItemPriced).toBe(true);

      // Verify read-only behavior: no writes or stock reservations
      expect(mockPrismaService.order.create).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });

    it('should return null address and 0 shipping fee when address belongs to a different user (foreign address)', async () => {
      const foreignAddress = { ...mockAddress, userId: 'user2' };
      mockPrismaService.address.findUnique.mockResolvedValue(foreignAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 100000,
        salePrice: null,
        product: { id: 'prod1', name: 'Lavender Spray', active: true },
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result.address).toBeNull();
      expect(result.deliveryAddress).toBeNull();
      expect(result.shippingFee).toBe(0);
    });

    it('should return everyItemPriced false when product variant is not found or product is inactive', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 100000,
        salePrice: null,
        product: { id: 'prod1', name: 'Inactive Spray', active: false },
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result.everyItemPriced).toBe(false);
      expect(result.subtotal).toBe(0);
    });

    it('should compute shipping fee for non-free province with STANDARD and EXPRESS', async () => {
      const chiangMaiAddress = { ...mockAddress, province: 'Chiang Mai' };
      mockPrismaService.address.findUnique.mockResolvedValue(chiangMaiAddress);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 100000,
        salePrice: null,
        product: { id: 'prod1', name: 'Spray', active: true },
      });

      const standardResult = await service.previewCheckout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        shippingMethod: ShippingMethod.STANDARD,
      });
      expect(standardResult.shippingFee).toBe(30000);

      const expressResult = await service.previewCheckout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        shippingMethod: ShippingMethod.EXPRESS,
      });
      expect(expressResult.shippingFee).toBe(50000);
    });

    it('should fall back to server cart if items are not provided', async () => {
      const mockCart = {
        id: 'cart1',
        userId: 'user1',
        items: [
          {
            id: 'item1',
            cartId: 'cart1',
            variantId: 'var1',
            quantity: 2,
          },
        ],
      };
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var1',
        price: 100000,
        salePrice: null,
        product: { id: 'prod1', name: 'Spray', active: true },
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr1',
      });

      expect(result.itemCount).toBe(1);
      expect(result.subtotal).toBe(200000);
      expect(result.everyItemPriced).toBe(true);
    });
  });

  describe('CheckoutDto - couponCode validation', () => {
    it('should accept valid couponCode up to 50 characters', async () => {
      const dto = plainToInstance(CheckoutDto, {
        couponCode: 'SUMMER2024',
      });
      const errors = await validate(dto);
      const couponErrors = errors.filter((e) => e.property === 'couponCode');
      expect(couponErrors).toHaveLength(0);
    });

    it('should allow optional couponCode when undefined', async () => {
      const dto = plainToInstance(CheckoutDto, {});
      const errors = await validate(dto);
      const couponErrors = errors.filter((e) => e.property === 'couponCode');
      expect(couponErrors).toHaveLength(0);
    });

    it('should reject couponCode exceeding 50 characters', async () => {
      const dto = plainToInstance(CheckoutDto, {
        couponCode: 'A'.repeat(51),
      });
      const errors = await validate(dto);
      const couponErrors = errors.filter((e) => e.property === 'couponCode');
      expect(couponErrors).toHaveLength(1);
      expect(couponErrors[0].constraints).toHaveProperty('maxLength');
    });

    it('should reject couponCode when not a string', async () => {
      const dto = plainToInstance(CheckoutDto, {
        couponCode: 12345 as any,
      });
      const errors = await validate(dto);
      const couponErrors = errors.filter((e) => e.property === 'couponCode');
      expect(couponErrors).toHaveLength(1);
      expect(couponErrors[0].constraints).toHaveProperty('isString');
    });
  });
});
