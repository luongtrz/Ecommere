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

describe('OrdersService - Gap Coverage', () => {
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

  describe('assertCheckoutMatchesOrder - sort comparison callbacks and edge cases', () => {
    const baseAddressJson = JSON.stringify({
      fullName: 'John Doe',
      phone: '0901234567',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng',
      line1: '123 Cầu Giấy',
      shippingMethod: 'STANDARD',
    });

    it('exercises both sort comparator callbacks when items has >= 2 elements with different variantIds', async () => {
      const existingOrder = {
        id: 'ord-sort-1',
        userId: 'user1',
        paymentMethod: 'COD',
        addressJson: baseAddressJson,
        items: [
          { variantId: 'var-z', quantity: 1 },
          { variantId: 'var-a', quantity: 2 },
        ],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue({
        fullName: 'John Doe',
        phone: '0901234567',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: '123 Cầu Giấy',
      });

      const result = await service.checkout('user1', {
        checkoutKey: 'key-sort-1',
        addressId: 'addr1',
        paymentMethod: 'COD',
        shippingMethod: ShippingMethod.STANDARD,
        items: [
          { variantId: 'var-a', quantity: 2 },
          { variantId: 'var-z', quantity: 1 },
        ],
      });

      expect(result).toBe(existingOrder);
    });

    it('exercises secondary quantity comparison in sort callbacks when items have identical variantIds', async () => {
      const existingOrder = {
        id: 'ord-sort-dup',
        userId: 'user1',
        paymentMethod: 'COD',
        addressJson: baseAddressJson,
        items: [
          { variantId: 'var-same', quantity: 5 },
          { variantId: 'var-same', quantity: 2 },
        ],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue({
        fullName: 'John Doe',
        phone: '0901234567',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: '123 Cầu Giấy',
      });

      const result = await service.checkout('user1', {
        checkoutKey: 'key-sort-dup',
        addressId: 'addr1',
        paymentMethod: 'COD',
        shippingMethod: ShippingMethod.STANDARD,
        items: [
          { variantId: 'var-same', quantity: 2 },
          { variantId: 'var-same', quantity: 5 },
        ],
      });

      expect(result).toBe(existingOrder);
    });

    it('exercises fallback ?? "" and ?? 0 when variantId or quantity is undefined in sort items', async () => {
      const existingOrder = {
        id: 'ord-sort-nullish',
        userId: 'user1',
        paymentMethod: 'PENDING',
        addressJson: baseAddressJson,
        items: [
          { variantId: undefined, quantity: undefined },
          { variantId: 'var-b', quantity: 3 },
        ],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue({
        fullName: 'John Doe',
        phone: '0901234567',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: '123 Cầu Giấy',
      });

      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-sort-nullish',
          addressId: 'addr1',
          paymentMethod: 'PENDING',
          items: [
            { variantId: 'var-b', quantity: 3 },
            { variantId: undefined as any, quantity: undefined as any },
          ],
        }),
      ).resolves.toBe(existingOrder);
    });

    it('handles order.items being null/undefined in existing order', async () => {
      const existingOrder = {
        id: 'ord-no-items',
        userId: 'user1',
        paymentMethod: 'PENDING',
        addressJson: baseAddressJson,
        items: null,
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-no-items',
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when order.addressJson is not a string', async () => {
      const existingOrder = {
        id: 'ord-non-string-addr',
        userId: 'user1',
        paymentMethod: 'PENDING',
        addressJson: 12345 as any,
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-non-string-addr',
          addressId: 'addr1',
          items: [],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when parsed orderAddress is not an object', async () => {
      const existingOrder = {
        id: 'ord-prim-addr',
        userId: 'user1',
        paymentMethod: 'PENDING',
        addressJson: '12345',
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-prim-addr',
          addressId: 'addr1',
          items: [],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('resolves address from shippingAddress and falls back through line1, address, and checkoutDto', async () => {
      const existingOrder = {
        id: 'ord-ship-addr',
        userId: 'user1',
        paymentMethod: 'COD',
        addressJson: JSON.stringify({
          fullName: 'Fallback Name',
          phone: '0987654321',
          province: 'Đà Nẵng',
          district: 'Hải Châu',
          ward: 'Thạch Thang',
          line1: '99 Bạch Đằng',
          shippingMethod: 'STANDARD',
        }),
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

      // 1. shippingAddress.line1 undefined, shippingAddress.address defined
      const resultWithAddressProp = await service.checkout('user1', {
        checkoutKey: 'key-ship-addr',
        items: [],
        paymentMethod: 'COD',
        shippingMethod: ShippingMethod.STANDARD,
        shippingAddress: {
          fullName: 'Fallback Name',
          phone: '0987654321',
          province: 'Đà Nẵng',
          district: 'Hải Châu',
          ward: 'Thạch Thang',
          address: '99 Bạch Đằng',
        } as any,
      });
      expect(resultWithAddressProp).toBe(existingOrder);

      // 2. Both shippingAddress.line1 and address undefined, checkoutDto.line1 used
      const resultWithDtoLine1 = await service.checkout('user1', {
        checkoutKey: 'key-ship-addr',
        items: [],
        paymentMethod: 'COD',
        shippingMethod: ShippingMethod.STANDARD,
        shippingAddress: {
          fullName: 'Fallback Name',
          phone: '0987654321',
          province: 'Đà Nẵng',
          district: 'Hải Châu',
          ward: 'Thạch Thang',
        } as any,
        line1: '99 Bạch Đằng',
      });
      expect(resultWithDtoLine1).toBe(existingOrder);
    });

    it('throws ConflictException on each address field mismatch when validating requestAddress against orderAddress', async () => {
      const fields = [
        'fullName',
        'phone',
        'province',
        'district',
        'ward',
        'line1',
      ] as const;

      for (const mismatchField of fields) {
        const orderAddressObj: Record<string, any> = {
          fullName: 'Nguyen Van A',
          phone: '0911222333',
          province: 'Hà Nội',
          district: 'Hoàn Kiếm',
          ward: 'Hàng Bạc',
          line1: '10 Hàng Bạc',
          shippingMethod: 'STANDARD',
        };

        const existingOrder = {
          id: `ord-mismatch-${mismatchField}`,
          userId: 'user1',
          paymentMethod: 'COD',
          addressJson: JSON.stringify(orderAddressObj),
          items: [],
        };
        mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);

        const requestAddressData = { ...orderAddressObj };
        requestAddressData[mismatchField] = 'DIFFERENT_VALUE';

        mockPrismaService.address.findFirst.mockResolvedValue(
          requestAddressData,
        );

        await expect(
          service.checkout('user1', {
            checkoutKey: `key-mismatch-${mismatchField}`,
            addressId: 'addr-mismatch',
            items: [],
            paymentMethod: 'COD',
            shippingMethod: ShippingMethod.STANDARD,
          }),
        ).rejects.toThrow(ConflictException);
      }
    });

    it('validates paymentMethod and shippingMethod differences in assertCheckoutMatchesOrder', async () => {
      const existingOrder = {
        id: 'ord-mismatch-methods',
        userId: 'user1',
        paymentMethod: 'COD',
        addressJson: JSON.stringify({
          fullName: 'Nguyen Van A',
          phone: '0911222333',
          province: 'Hà Nội',
          district: 'Hoàn Kiếm',
          ward: 'Hàng Bạc',
          line1: '10 Hàng Bạc',
          shippingMethod: 'STANDARD',
        }),
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(existingOrder);
      mockPrismaService.address.findFirst.mockResolvedValue({
        fullName: 'Nguyen Van A',
        phone: '0911222333',
        province: 'Hà Nội',
        district: 'Hoàn Kiếm',
        ward: 'Hàng Bạc',
        line1: '10 Hàng Bạc',
      });

      // Payment method mismatch
      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-pay-mismatch',
          addressId: 'addr-1',
          items: [],
          paymentMethod: 'BANK_TRANSFER',
          shippingMethod: ShippingMethod.STANDARD,
        }),
      ).rejects.toThrow(ConflictException);

      // Shipping method mismatch
      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-ship-mismatch',
          addressId: 'addr-1',
          items: [],
          paymentMethod: 'COD',
          shippingMethod: ShippingMethod.EXPRESS,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('isCheckoutKeyUniqueConstraintError - full coverage of type guards', () => {
    it('returns false for null, primitives, non-Prisma errors, or non-P2002 error codes', () => {
      const checker = (service as any).isCheckoutKeyUniqueConstraintError.bind(
        service,
      );

      expect(checker(null)).toBe(false);
      expect(checker(undefined)).toBe(false);
      expect(checker('plain string error')).toBe(false);
      expect(checker(404)).toBe(false);
      expect(checker(new Error('generic error'))).toBe(false);

      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        },
      );
      expect(checker(p2003Error)).toBe(false);
    });

    it('evaluates plain object errors matching PrismaClientKnownRequestError shape', () => {
      const checker = (service as any).isCheckoutKeyUniqueConstraintError.bind(
        service,
      );

      const plainPrismaP2002 = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2002',
        meta: { target: ['checkoutKey'] },
      };
      expect(checker(plainPrismaP2002)).toBe(true);

      const plainP2002WithoutName = {
        code: 'P2002',
        meta: { target: ['checkoutKey'] },
      };
      expect(checker(plainP2002WithoutName)).toBe(true);
    });

    it('evaluates target array with non-strings or without checkoutKey', () => {
      const checker = (service as any).isCheckoutKeyUniqueConstraintError.bind(
        service,
      );

      const targetNonStrings = {
        code: 'P2002',
        meta: { target: [123, null, false] },
      };
      expect(checker(targetNonStrings)).toBe(false);

      const targetOtherFields = {
        code: 'P2002',
        meta: { target: ['id', 'email'] },
      };
      expect(checker(targetOtherFields)).toBe(false);
    });

    it('evaluates target when it is neither array nor string', () => {
      const checker = (service as any).isCheckoutKeyUniqueConstraintError.bind(
        service,
      );

      const targetObject = {
        code: 'P2002',
        meta: { target: { field: 'checkoutKey' } },
      };
      expect(checker(targetObject)).toBe(false);

      const targetUndefined = {
        code: 'P2002',
        meta: {},
      };
      expect(checker(targetUndefined)).toBe(false);
    });
  });

  describe('checkout - missing branch coverage', () => {
    it('handles non-string couponCode gracefully by trimming to empty string', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.order.create.mockResolvedValue({ id: 'ord-no-coupon' });

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: 12345 as any,
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.coupon.findUnique).not.toHaveBeenCalled();
    });

    it('handles lowercase coupon code matching uppercase coupon in DB', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.coupon.findUnique
        .mockResolvedValueOnce(null) // first try: where { code: 'sale50' } -> null
        .mockResolvedValueOnce({
          // second try: where { code: 'SALE50' } -> found
          code: 'SALE50',
          active: true,
          type: CouponType.PERCENT,
          value: 50,
        })
        .mockResolvedValue({
          code: 'SALE50',
          active: true,
          type: CouponType.PERCENT,
          value: 50,
        });

      mockPrismaService.order.create.mockResolvedValue({
        id: 'ord-uppercase-coupon',
      });

      const result = await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: 'sale50',
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SALE50' },
      });
    });

    it('throws NotFoundException when coupon is found but canUserUseCoupon returns false', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'REFERRAL_COUPON',
        active: true,
      });
      // canUserUseCoupon returns false when referral belongs to another user
      mockPrismaService.referral.findFirst.mockResolvedValue({
        referrerCouponCode: 'REFERRAL_COUPON',
        referrerId: 'other-user',
        refereeCouponCode: null,
        refereeId: null,
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'REFERRAL_COUPON',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'REFERRAL_COUPON',
        }),
      ).rejects.toThrow('Coupon not found');
    });

    it('validates server cart item with inactive product without name fallback to "Unknown product"', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart1',
        userId: 'user1',
        items: [
          {
            id: 'ci-1',
            variantId: 'var-anon',
            quantity: 1,
            variant: {
              stock: 10,
              product: {
                active: false,
                name: null,
              },
            },
          },
        ],
      });

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
        }),
      ).rejects.toThrow('Product is no longer available: Unknown product');
    });

    it('sets couponCode to null when server cart couponId does not exist in DB', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart1',
        userId: 'user1',
        couponId: 'NON_EXISTENT_COUPON',
        items: [
          {
            id: 'ci-1',
            variantId: 'var1',
            quantity: 1,
            variant: {
              stock: 10,
              product: { active: true, name: 'Prod' },
            },
          },
        ],
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.order.create.mockResolvedValue({
        id: 'ord-cart-no-coupon',
      });

      const result = await service.checkout('user1', {
        addressId: 'addr1',
      });

      expect(result).toBeDefined();
    });

    it('sets couponCode to null when server cart coupon exists but canUserUseCoupon returns false', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart1',
        userId: 'user1',
        couponId: 'RESTRICTED_COUPON',
        items: [
          {
            id: 'ci-1',
            variantId: 'var1',
            quantity: 1,
            variant: {
              stock: 10,
              product: { active: true, name: 'Prod' },
            },
          },
        ],
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'RESTRICTED_COUPON',
        active: true,
      });
      mockPrismaService.referral.findFirst.mockResolvedValue({
        referrerCouponCode: 'RESTRICTED_COUPON',
        referrerId: 'another-user',
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.order.create.mockResolvedValue({
        id: 'ord-cart-restricted-coupon',
      });

      const result = await service.checkout('user1', {
        addressId: 'addr1',
      });

      expect(result).toBeDefined();
    });

    it('throws NotFoundException when updatedVariant is not found in database during stock reservation', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.order.create.mockResolvedValue({ id: 'ord-tmp' });
      // updateMany succeeds, but subsequent findUnique returns null
      mockPrismaService.productVariant.findUnique.mockImplementation(
        async (args: any) => {
          if (args?.include?.product) {
            return {
              id: 'var1',
              price: 100000,
              stock: 10,
              product: { active: true, name: 'Product' },
            };
          }
          return null;
        },
      );

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

    it('updates coupon without usedCount limit when coupon.maxUses is not defined', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'UNLIMITED_COUPON',
        active: true,
        type: CouponType.FIXED,
        value: 10000,
        maxUses: null, // no max uses limit
      });
      mockPrismaService.order.create.mockResolvedValue({ id: 'ord-unlimited' });

      await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
        couponCode: 'UNLIMITED_COUPON',
      });

      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: { code: 'UNLIMITED_COUPON', active: true },
        data: { usedCount: { increment: 1 } },
      });
    });

    it('throws BadRequestException when coupon updateMany returns count !== 1 in transaction', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'EXPIRED_RACE',
        active: true,
        type: CouponType.FIXED,
        value: 10000,
      });
      mockPrismaService.order.create.mockResolvedValue({ id: 'ord-race' });
      mockPrismaService.coupon.updateMany.mockResolvedValue({ count: 0 }); // race lost!

      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'EXPIRED_RACE',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.checkout('user1', {
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
          couponCode: 'EXPIRED_RACE',
        }),
      ).rejects.toThrow('Coupon is no longer available');
    });

    it('deletes orderedVariantIds from user cart when explicit items are ordered and user has a cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'user-cart-1',
        userId: 'user1',
        items: [{ id: 'item-1', variantId: 'var1' }],
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.order.create.mockResolvedValue({
        id: 'ord-explicit-items',
      });

      await service.checkout('user1', {
        addressId: 'addr1',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: {
          cartId: 'user-cart-1',
          variantId: { in: ['var1'] },
        },
      });
    });

    it('rethrows original error when checkoutKey is set but error is not unique constraint', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      mockPrismaService.order.create.mockRejectedValue(
        new Error('Database disk full'),
      );

      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-disk-full',
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow('Database disk full');
    });

    it('rethrows P2002 error when checkoutKey order is not found upon conflict lookup', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
      });
      const p2002Error = new Prisma.PrismaClientKnownRequestError('P2002', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['checkoutKey'] },
      });
      mockPrismaService.order.create.mockRejectedValue(p2002Error);
      mockPrismaService.order.findUnique.mockResolvedValue(null); // order lookup returns null

      await expect(
        service.checkout('user1', {
          checkoutKey: 'key-not-found-after-p2002',
          addressId: 'addr1',
          items: [{ variantId: 'var1', quantity: 1 }],
        }),
      ).rejects.toThrow(p2002Error);
    });
  });

  describe('previewCheckout - additional branch coverage', () => {
    it('sets address to null when foundAddress belongs to a different user', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr-other',
        userId: 'other-user',
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr-other',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result.address).toBeNull();
      expect(result.deliveryAddress).toBeNull();
      expect(result.shippingFee).toBe(0);
    });

    it('sets everyItemPriced to false when variantId is missing in preview items', async () => {
      const result = await service.previewCheckout('user1', {
        items: [{ variantId: '', quantity: 1 }],
      });

      expect(result.everyItemPriced).toBe(false);
      expect(result.canPriceAll).toBe(false);
    });

    it('sets everyItemPriced to false when product variant is not active in preview', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-inactive',
        price: 50000,
        product: { active: false },
      });

      const result = await service.previewCheckout('user1', {
        items: [{ variantId: 'var-inactive', quantity: 1 }],
      });

      expect(result.everyItemPriced).toBe(false);
      expect(result.canPriceAll).toBe(false);
    });

    it('sets everyItemPriced to false when variant has no product in preview', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-no-prod',
        price: 50000,
        product: null,
      });

      const result = await service.previewCheckout('user1', {
        items: [{ variantId: 'var-no-prod', quantity: 1 }],
      });

      expect(result.everyItemPriced).toBe(false);
    });

    it('uses ShippingMethod.EXPRESS when shippingMethod is string "EXPRESS"', async () => {
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: 'addr1',
        userId: 'user1',
        province: 'Hà Nội',
        line1: '123 Phố',
      });

      const result = await service.previewCheckout('user1', {
        addressId: 'addr1',
        shippingMethod: 'EXPRESS',
        items: [{ variantId: 'var1', quantity: 1 }],
      });

      expect(result.shippingFee).toBeGreaterThan(0);
    });
  });

  describe('updateOrderStatus - additional status transition branches', () => {
    it('updates paymentStatus to REFUNDED and restores stock when status is REFUNDED', async () => {
      const mockOrder = {
        id: 'ord-ref',
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.COMPLETED,
        items: [
          {
            id: 'item-1',
            variantId: 'var1',
            quantity: 2,
          },
        ],
      };
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({
          ...mockOrder,
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        });

      mockPrismaService.productVariant.update.mockResolvedValue({ stock: 12 });

      await service.updateOrderStatus('ord-ref', {
        status: OrderStatus.REFUNDED,
      });

      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'ord-ref', status: OrderStatus.DELIVERED },
        data: {
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var1' },
        data: { stock: { increment: 2 } },
      });
    });

    it('sets paymentStatus to REFUNDED when canceling an order that was PACKING or SHIPPED', async () => {
      const packingOrder = {
        id: 'ord-pack-cancel',
        status: OrderStatus.PACKING,
        paymentStatus: PaymentStatus.COMPLETED,
        couponCode: null,
        items: [],
      };
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(packingOrder)
        .mockResolvedValueOnce({
          ...packingOrder,
          status: OrderStatus.CANCELED,
        });

      await service.updateOrderStatus('ord-pack-cancel', {
        status: OrderStatus.CANCELED,
      });

      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'ord-pack-cancel', status: OrderStatus.PACKING },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
      });
    });

    it('releases coupon usage when canceling an order with couponCode in updateOrderStatus', async () => {
      const canceledOrderWithCoupon = {
        id: 'ord-cancel-cpn',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        couponCode: 'DISCOUNT_TO_RELEASE',
        items: [],
      };
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(canceledOrderWithCoupon)
        .mockResolvedValueOnce({
          ...canceledOrderWithCoupon,
          status: OrderStatus.CANCELED,
        });

      await service.updateOrderStatus('ord-cancel-cpn', {
        status: OrderStatus.CANCELED,
      });

      expect(mockPrismaService.coupon.updateMany).toHaveBeenCalledWith({
        where: { code: 'DISCOUNT_TO_RELEASE', usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    });

    it('throws BadRequestException for invalid transitions from terminal statuses', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'ord-canceled',
        status: OrderStatus.CANCELED,
        items: [],
      });

      await expect(
        service.updateOrderStatus('ord-canceled', { status: OrderStatus.PAID }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateOrderStatus('ord-canceled', { status: OrderStatus.PAID }),
      ).rejects.toThrow('Invalid status transition from CANCELED to PAID');
    });

    it('throws BadRequestException when order status updateMany affects count !== 1 (concurrent update)', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'ord-concurrent',
        status: OrderStatus.PENDING_PAYMENT,
        items: [],
      });
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateOrderStatus('ord-concurrent', {
          status: OrderStatus.PAID,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateOrderStatus('ord-concurrent', {
          status: OrderStatus.PAID,
        }),
      ).rejects.toThrow('Order status changed; please retry');
    });
  });

  describe('cancelOrder - additional branch coverage', () => {
    it('sets paymentStatus to FAILED when canceling a PENDING_PAYMENT order', async () => {
      const pendingOrder = {
        id: 'ord-pending-cancel',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        couponCode: null,
        items: [],
      };
      mockPrismaService.order.findUnique
        .mockResolvedValueOnce(pendingOrder)
        .mockResolvedValueOnce({
          ...pendingOrder,
          status: OrderStatus.CANCELED,
        });

      await service.cancelOrder('user1', 'ord-pending-cancel');

      expect(mockPrismaService.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'ord-pending-cancel',
          userId: 'user1',
          status: { in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID] },
        },
        data: {
          status: OrderStatus.CANCELED,
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    });

    it('throws BadRequestException when status updateMany affects count !== 1 in cancelOrder', async () => {
      const pendingOrder = {
        id: 'ord-cancel-race',
        userId: 'user1',
        status: OrderStatus.PENDING_PAYMENT,
        items: [],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(pendingOrder);
      mockPrismaService.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.cancelOrder('user1', 'ord-cancel-race'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelOrder('user1', 'ord-cancel-race'),
      ).rejects.toThrow('Order cannot be cancelled at this stage');
    });
  });

  describe('quoteShippingFee - non-string and whitespace province validation', () => {
    it('throws BadRequestException when province is not a string', () => {
      expect(() => service.quoteShippingFee(null as any)).toThrow(
        BadRequestException,
      );
      expect(() => service.quoteShippingFee(12345 as any)).toThrow(
        BadRequestException,
      );
      expect(() => service.quoteShippingFee(undefined as any)).toThrow(
        'Vui lòng nhập tỉnh/thành phố',
      );
    });

    it('throws BadRequestException when province consists only of whitespace', () => {
      expect(() => service.quoteShippingFee('   ')).toThrow(
        BadRequestException,
      );
      expect(() => service.quoteShippingFee('   ')).toThrow(
        'Vui lòng nhập tỉnh/thành phố',
      );
    });

    it('defaults shippingMethod to STANDARD when not provided in quoteShippingFee', () => {
      const quote = service.quoteShippingFee('Hà Nội');
      expect(quote.shippingMethod).toBe(ShippingMethod.STANDARD);
      expect(quote.province).toBe('Hà Nội');
      expect(typeof quote.fee).toBe('number');
    });
  });

  describe('restoreStockForOrder and releaseCouponUsage - edge cases', () => {
    it('executes restoreStockForOrder without transactionClient by starting a transaction', async () => {
      const order = {
        code: 'ORD-RESTORE',
        status: OrderStatus.CANCELED,
        items: [
          {
            variantId: 'var-restore',
            quantity: 3,
          },
        ],
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-restore',
        stock: 5,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        id: 'var-restore',
        stock: 8,
      });

      await (service as any).restoreStockForOrder(order);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-restore' },
        data: { stock: { increment: 3 } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var-restore',
          type: StockMovementType.IN,
          quantity: 3,
          previousStock: 5,
          newStock: 8,
          notes: 'Stock restored from CANCELED order ORD-RESTORE',
        },
      });
    });

    it('skips item in restoreStockForOrder when variant is not found in database', async () => {
      const order = {
        code: 'ORD-SKIP',
        status: OrderStatus.CANCELED,
        items: [{ variantId: 'var-deleted', quantity: 2 }],
      };
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await (service as any).restoreStockForOrder(order, mockPrismaService);

      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });

    it('returns early in releaseCouponUsage when order has no couponCode', async () => {
      await (service as any).releaseCouponUsage(
        { couponCode: null },
        mockPrismaService,
      );

      expect(mockPrismaService.coupon.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('runSerializableTransaction - failure without retry', () => {
    it('rethrows non-P2034 Prisma error immediately on attempt 0', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique error',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        },
      );
      mockPrismaService.$transaction.mockRejectedValue(p2002Error);

      await expect(
        (service as any).runSerializableTransaction(async () => 'ok'),
      ).rejects.toThrow(p2002Error);
    });

    it('rethrows standard non-Prisma error immediately on attempt 0', async () => {
      mockPrismaService.$transaction.mockRejectedValue(
        new Error('Connection failed'),
      );

      await expect(
        (service as any).runSerializableTransaction(async () => 'ok'),
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('getMyOrderById - gap coverage', () => {
    it('throws NotFoundException when order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getMyOrderById('user1', 'ord-404')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMyOrderById('user1', 'ord-404')).rejects.toThrow(
        'Order not found',
      );
    });

    it('throws NotFoundException when order belongs to a different user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'other-user',
      });

      await expect(service.getMyOrderById('user1', 'ord-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns order when order exists and belongs to the requesting user', async () => {
      const mockOrder = {
        id: 'ord-1',
        userId: 'user1',
        code: 'ORD-001',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getMyOrderById('user1', 'ord-1');
      expect(result).toBe(mockOrder);
    });
  });

  describe('getAllOrders - gap coverage', () => {
    it('applies search filters across id, code, email, and name', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.getAllOrders({
        page: 2,
        limit: 15,
        status: OrderStatus.PAID,
        search: 'spray',
      });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 2,
        limit: 15,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
      });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: {
          status: OrderStatus.PAID,
          OR: [
            { id: { contains: 'spray', mode: 'insensitive' } },
            { code: { contains: 'spray', mode: 'insensitive' } },
            { user: { email: { contains: 'spray', mode: 'insensitive' } } },
            { user: { name: { contains: 'spray', mode: 'insensitive' } } },
          ],
        },
        skip: 15,
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getOrderById - gap coverage', () => {
    it('throws NotFoundException when order is not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderById('ord-not-found')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrderById('ord-not-found')).rejects.toThrow(
        'Order not found',
      );
    });

    it('returns order when order is found', async () => {
      const mockOrder = {
        id: 'ord-found',
        code: 'ORD-FOUND',
        user: { id: 'u1' },
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('ord-found');
      expect(result).toBe(mockOrder);
    });
  });
});
