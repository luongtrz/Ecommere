import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CouponType, OrderStatus, Prisma } from '@prisma/client';
import { CartService } from './cart.service';
import { PrismaService } from '@/prisma/prisma.service';
import { MoneyUtil } from '@/common/utils/money.util';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';

describe('CartService', () => {
  let service: CartService;

  const mockPrismaService = {
    cart: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    cartItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    referral: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const createMockVariant = (overrides?: any) => ({
    id: 'var-1',
    sku: 'LAV-250ML',
    scent: 'Lavender',
    volumeMl: 250,
    price: 100000,
    salePrice: null,
    stock: 10,
    product: {
      id: 'prod-1',
      name: 'Lavender Spray',
      slug: 'lavender-spray',
      images: ['img1.jpg'],
      active: true,
      ...overrides?.product,
    },
    ...overrides,
  });

  const createMockCartItem = (overrides?: any) => ({
    id: 'item-1',
    cartId: 'cart-1',
    variantId: 'var-1',
    quantity: 2,
    priceSnapshot: 100000,
    variant: createMockVariant(overrides?.variant),
    ...overrides,
  });

  const createMockCart = (overrides?: any) => ({
    id: 'cart-1',
    userId: 'user-1',
    couponId: null,
    items: [createMockCartItem()],
    coupon: null,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockImplementation(
      async (callback: (tx: any) => Promise<any>) => {
        return callback(mockPrismaService);
      },
    );

    mockPrismaService.referral.findFirst.mockResolvedValue(null);
    mockPrismaService.order.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should return an empty cart when user has no items', async () => {
      const mockCart = createMockCart({ items: [] });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(mockPrismaService.cart.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1' },
        update: {},
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
          coupon: true,
        },
      });
      expect(result).toEqual({
        ...mockCart,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      });
    });

    it('should calculate items total using regular price when salePrice is null', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.items[0].price).toBe(100000);
      expect(result.items[0].itemTotal).toBe(200000);
      expect(result.subtotal).toBe(200000);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(200000);
    });

    it('should calculate items total using salePrice when salePrice is present', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 3,
            variant: { price: 100000, salePrice: 75000 },
          }),
        ],
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.items[0].price).toBe(75000);
      expect(result.items[0].itemTotal).toBe(225000);
      expect(result.subtotal).toBe(225000);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(225000);
    });

    it('should apply PERCENT coupon without maxDiscount', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'SAVE10',
          type: CouponType.PERCENT,
          value: 10,
          active: true,
          validFrom: null,
          validUntil: null,
          minOrder: null,
          maxDiscount: null,
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.subtotal).toBe(200000);
      expect(result.discount).toBe(20000);
      expect(result.total).toBe(180000);
    });

    it('should cap discount at maxDiscount when PERCENT discount exceeds maxDiscount', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'SAVE20',
          type: CouponType.PERCENT,
          value: 20,
          active: true,
          validFrom: null,
          validUntil: null,
          minOrder: null,
          maxDiscount: 25000,
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.subtotal).toBe(200000);
      expect(result.discount).toBe(25000);
      expect(result.total).toBe(175000);
    });

    it('should apply FIXED coupon', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'FIXED50K',
          type: CouponType.FIXED,
          value: 50000,
          active: true,
          validFrom: null,
          validUntil: null,
          minOrder: null,
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.subtotal).toBe(200000);
      expect(result.discount).toBe(50000);
      expect(result.total).toBe(150000);
    });

    it('should apply FREESHIP coupon (discount on merchandise is 0)', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'FREESHIP',
          type: CouponType.FREESHIP,
          value: 30000,
          active: true,
          validFrom: null,
          validUntil: null,
          minOrder: null,
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.subtotal).toBe(200000);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(200000);
    });

    it('should not apply discount when coupon active is false', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'INACTIVE',
          type: CouponType.PERCENT,
          value: 10,
          active: false,
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.discount).toBe(0);
      expect(result.total).toBe(200000);
    });

    it('should not apply discount when coupon validFrom is in the future', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'FUTURE',
          type: CouponType.PERCENT,
          value: 10,
          active: true,
          validFrom: new Date(Date.now() + 1000000),
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.discount).toBe(0);
      expect(result.total).toBe(200000);
    });

    it('should apply discount when coupon validFrom is in the past', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'PAST',
          type: CouponType.PERCENT,
          value: 10,
          active: true,
          validFrom: new Date(Date.now() - 1000000),
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.discount).toBe(20000);
      expect(result.total).toBe(180000);
    });

    it('should not apply discount when coupon validUntil is in the past', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'EXPIRED',
          type: CouponType.PERCENT,
          value: 10,
          active: true,
          validUntil: new Date(Date.now() - 1000000),
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.discount).toBe(0);
      expect(result.total).toBe(200000);
    });

    it('should apply discount when coupon validUntil is in the future', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'VALID',
          type: CouponType.PERCENT,
          value: 10,
          active: true,
          validUntil: new Date(Date.now() + 1000000),
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.discount).toBe(20000);
      expect(result.total).toBe(180000);
    });

    it('should not apply discount when subtotal is below coupon minOrder', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'MINORDER',
          type: CouponType.PERCENT,
          value: 10,
          active: true,
          minOrder: 300000,
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.subtotal).toBe(200000);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(200000);
    });

    it('should apply discount when subtotal meets coupon minOrder', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            quantity: 2,
            variant: { price: 100000, salePrice: null },
          }),
        ],
        coupon: {
          code: 'MINORDER',
          type: CouponType.PERCENT,
          value: 10,
          active: true,
          minOrder: 200000,
        },
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);

      const result = await service.getCart('user-1');

      expect(result.subtotal).toBe(200000);
      expect(result.discount).toBe(20000);
      expect(result.total).toBe(180000);
    });
  });

  describe('addToCart', () => {
    const addToCartDto: AddToCartDto = {
      variantId: 'var-1',
      quantity: 2,
    };

    it('should throw NotFoundException when product variant does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.addToCart('user-1', addToCartDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addToCart('user-1', addToCartDto)).rejects.toThrow(
        'Product variant not found',
      );
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        include: { product: true },
      });
    });

    it('should throw BadRequestException when product is not active', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        createMockVariant({ product: { active: false } }),
      );

      await expect(service.addToCart('user-1', addToCartDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addToCart('user-1', addToCartDto)).rejects.toThrow(
        'Product is not available',
      );
    });

    it('should throw BadRequestException when adding new item with quantity exceeding stock', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        createMockVariant({ stock: 3 }),
      );
      mockPrismaService.cart.upsert.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.cartItem.findFirst.mockResolvedValue(null);

      const dto: AddToCartDto = { variantId: 'var-1', quantity: 5 };

      await expect(service.addToCart('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addToCart('user-1', dto)).rejects.toThrow(
        'Only 3 units available in stock',
      );
    });

    it('should throw BadRequestException when adding to existing item causes total quantity to exceed stock', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        createMockVariant({ stock: 5 }),
      );
      mockPrismaService.cart.upsert.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.cartItem.findFirst.mockResolvedValue({
        id: 'item-1',
        quantity: 4,
      });

      const dto: AddToCartDto = { variantId: 'var-1', quantity: 2 };

      await expect(service.addToCart('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addToCart('user-1', dto)).rejects.toThrow(
        'Only 5 units available in stock',
      );
    });

    it('should create new cart item with salePrice snapshot when item does not exist in cart', async () => {
      const mockVariant = createMockVariant({
        stock: 10,
        price: 100000,
        salePrice: 85000,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cartItem.findFirst.mockResolvedValue(null);
      mockPrismaService.cartItem.create.mockResolvedValue({ id: 'item-new' });

      const result = await service.addToCart('user-1', addToCartDto);

      expect(mockPrismaService.cart.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        create: { userId: 'user-1' },
        update: {},
      });
      expect(mockPrismaService.cartItem.findFirst).toHaveBeenCalledWith({
        where: {
          cartId: 'cart-1',
          variantId: 'var-1',
        },
      });
      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-1',
          variantId: 'var-1',
          quantity: 2,
          priceSnapshot: 85000,
        },
      });
      expect(mockPrismaService.cartItem.update).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create new cart item with regular price snapshot when salePrice is null', async () => {
      const mockVariant = createMockVariant({
        stock: 10,
        price: 100000,
        salePrice: null,
      });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cartItem.findFirst.mockResolvedValue(null);
      mockPrismaService.cartItem.create.mockResolvedValue({ id: 'item-new' });

      const dto: AddToCartDto = { variantId: 'var-1', quantity: 1 };
      await service.addToCart('user-1', dto);

      expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: 'cart-1',
          variantId: 'var-1',
          quantity: 1,
          priceSnapshot: 100000,
        },
      });
    });

    it('should update existing cart item quantity when item is already in cart', async () => {
      const mockVariant = createMockVariant({ stock: 10 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cartItem.findFirst.mockResolvedValue({
        id: 'item-1',
        quantity: 2,
      });
      mockPrismaService.cartItem.update.mockResolvedValue({
        id: 'item-1',
        quantity: 5,
      });

      const dto: AddToCartDto = { variantId: 'var-1', quantity: 3 };
      await service.addToCart('user-1', dto);

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
      expect(mockPrismaService.cartItem.create).not.toHaveBeenCalled();
    });

    it('should run transaction with Serializable isolation level', async () => {
      const mockVariant = createMockVariant({ stock: 10 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cartItem.findFirst.mockResolvedValue(null);

      await service.addToCart('user-1', addToCartDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });

    it('should retry and succeed when transaction encounters a P2002 error on first attempt', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Conflict', {
        code: 'P2002',
        clientVersion: '5.8.0',
      });

      mockPrismaService.$transaction
        .mockRejectedValueOnce(p2002Error)
        .mockImplementationOnce(async (callback) =>
          callback(mockPrismaService),
        );

      const mockVariant = createMockVariant({ stock: 10 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cartItem.findFirst.mockResolvedValue(null);

      const result = await service.addToCart('user-1', addToCartDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should retry and succeed when transaction encounters a P2034 error on first attempt', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Serialization failure',
        { code: 'P2034', clientVersion: '5.8.0' },
      );

      mockPrismaService.$transaction
        .mockRejectedValueOnce(p2034Error)
        .mockImplementationOnce(async (callback) =>
          callback(mockPrismaService),
        );

      const mockVariant = createMockVariant({ stock: 10 });
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cartItem.findFirst.mockResolvedValue(null);

      const result = await service.addToCart('user-1', addToCartDto);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should rethrow after exhausting all 3 attempts on P2002 conflict error', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError('Conflict', {
        code: 'P2002',
        clientVersion: '5.8.0',
      });
      mockPrismaService.$transaction.mockRejectedValue(p2002Error);

      await expect(service.addToCart('user-1', addToCartDto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(3);
    });

    it('should immediately rethrow non-retryable Prisma errors without retrying', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );
      mockPrismaService.$transaction.mockRejectedValue(p2025Error);

      await expect(service.addToCart('user-1', addToCartDto)).rejects.toThrow(
        Prisma.PrismaClientKnownRequestError,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should immediately rethrow generic errors without retrying', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('DB failure'));

      await expect(service.addToCart('user-1', addToCartDto)).rejects.toThrow(
        'DB failure',
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateCartItem', () => {
    const updateCartItemDto: UpdateCartItemDto = {
      quantity: 4,
    };

    it('should throw NotFoundException when cart item is not found', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCartItem('user-1', 'item-missing', updateCartItemDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateCartItem('user-1', 'item-missing', updateCartItemDto),
      ).rejects.toThrow('Cart item not found');
      expect(mockPrismaService.cartItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-missing' },
        include: {
          cart: true,
          variant: true,
        },
      });
    });

    it('should throw ForbiddenException when cart item belongs to another user', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'other-user' },
        variant: { stock: 10 },
      });

      await expect(
        service.updateCartItem('user-1', 'item-1', updateCartItemDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateCartItem('user-1', 'item-1', updateCartItemDto),
      ).rejects.toThrow('Unauthorized');
      expect(mockPrismaService.cartItem.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when requested quantity exceeds available stock', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'user-1' },
        variant: { stock: 3 },
      });

      const dto: UpdateCartItemDto = { quantity: 5 };

      await expect(
        service.updateCartItem('user-1', 'item-1', dto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateCartItem('user-1', 'item-1', dto),
      ).rejects.toThrow('Only 3 units available in stock');
      expect(mockPrismaService.cartItem.update).not.toHaveBeenCalled();
    });

    it('should update cart item quantity and return updated cart when valid', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'user-1' },
        variant: { stock: 10 },
      });
      mockPrismaService.cartItem.update.mockResolvedValue({
        id: 'item-1',
        quantity: 4,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());

      const result = await service.updateCartItem(
        'user-1',
        'item-1',
        updateCartItemDto,
      );

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 4 },
      });
      expect(result).toBeDefined();
    });
  });

  describe('removeCartItem', () => {
    it('should throw NotFoundException when cart item is not found', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);

      await expect(
        service.removeCartItem('user-1', 'item-missing'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.removeCartItem('user-1', 'item-missing'),
      ).rejects.toThrow('Cart item not found');
      expect(mockPrismaService.cartItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'item-missing' },
        include: { cart: true },
      });
    });

    it('should throw ForbiddenException when cart item belongs to another user', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'other-user' },
      });

      await expect(service.removeCartItem('user-1', 'item-1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.removeCartItem('user-1', 'item-1')).rejects.toThrow(
        'Unauthorized',
      );
      expect(mockPrismaService.cartItem.delete).not.toHaveBeenCalled();
    });

    it('should delete cart item and return updated cart when valid', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        cart: { userId: 'user-1' },
      });
      mockPrismaService.cartItem.delete.mockResolvedValue({ id: 'item-1' });
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({ items: [] }),
      );

      const result = await service.removeCartItem('user-1', 'item-1');

      expect(mockPrismaService.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(result).toBeDefined();
    });
  });

  describe('clearCart', () => {
    it('should delete all cart items and remove coupon when cart exists', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 3 });
      mockPrismaService.cart.update.mockResolvedValue({
        id: 'cart-1',
        couponId: null,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({ items: [], couponId: null }),
      );

      const result = await service.clearCart('user-1');

      expect(mockPrismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { couponId: null },
      });
      expect(result).toBeDefined();
    });

    it('should not delete items or update cart when cart does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({ items: [] }),
      );

      const result = await service.clearCart('user-1');

      expect(mockPrismaService.cartItem.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.cart.update).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('applyCoupon', () => {
    it('should throw NotFoundException when cart does not exist', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);

      await expect(service.applyCoupon('user-1', 'SAVE10')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.applyCoupon('user-1', 'SAVE10')).rejects.toThrow(
        'Cart not found',
      );
      expect(mockPrismaService.cart.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should remove coupon when couponCode is undefined', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.cart.update.mockResolvedValue({
        id: 'cart-1',
        couponId: null,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({ couponId: null, coupon: null }),
      );

      const result = await service.applyCoupon('user-1');

      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { couponId: null },
      });
      expect(result).toBeDefined();
    });

    it('should remove coupon when couponCode is empty string', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.cart.update.mockResolvedValue({
        id: 'cart-1',
        couponId: null,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({ couponId: null, coupon: null }),
      );

      const result = await service.applyCoupon('user-1', '');

      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { couponId: null },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when coupon code is not found in database', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.applyCoupon('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.applyCoupon('user-1', 'nonexistent'),
      ).rejects.toThrow('Coupon not found');
      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'NONEXISTENT' },
      });
    });

    it('should throw NotFoundException when coupon referral check fails (unauthorized user)', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'REF10',
        active: true,
      });
      mockPrismaService.referral.findFirst.mockResolvedValue({
        referrerCouponCode: 'REF10',
        referrerId: 'other-user',
        refereeCouponCode: null,
        refereeId: null,
      });

      await expect(service.applyCoupon('user-1', 'REF10')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.applyCoupon('user-1', 'REF10')).rejects.toThrow(
        'Coupon not found',
      );
    });

    it('should throw BadRequestException when coupon is inactive', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'INACTIVE',
        active: false,
      });

      await expect(service.applyCoupon('user-1', 'INACTIVE')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.applyCoupon('user-1', 'INACTIVE')).rejects.toThrow(
        'Coupon is inactive',
      );
    });

    it('should throw BadRequestException when coupon validFrom is in the future', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'FUTURE',
        active: true,
        validFrom: new Date(Date.now() + 1000000),
      });

      await expect(service.applyCoupon('user-1', 'FUTURE')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.applyCoupon('user-1', 'FUTURE')).rejects.toThrow(
        'Coupon is not yet valid',
      );
    });

    it('should throw BadRequestException when coupon validUntil is in the past', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'EXPIRED',
        active: true,
        validUntil: new Date(Date.now() - 1000000),
      });

      await expect(service.applyCoupon('user-1', 'EXPIRED')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.applyCoupon('user-1', 'EXPIRED')).rejects.toThrow(
        'Coupon has expired',
      );
    });

    it('should throw BadRequestException when coupon maxUses limit is reached', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'MAXED',
        active: true,
        maxUses: 5,
        usedCount: 5,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());

      await expect(service.applyCoupon('user-1', 'MAXED')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.applyCoupon('user-1', 'MAXED')).rejects.toThrow(
        'Coupon has reached maximum usage limit',
      );
    });

    it('should throw BadRequestException when user has reached maxUsesPerUser limit', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'PERUSER',
        active: true,
        maxUsesPerUser: 1,
        usedCount: 1,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.order.count.mockResolvedValue(1);

      await expect(service.applyCoupon('user-1', 'PERUSER')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.applyCoupon('user-1', 'PERUSER')).rejects.toThrow(
        'You have already used this coupon the maximum number of times',
      );
      expect(mockPrismaService.order.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          couponCode: 'PERUSER',
          status: { not: OrderStatus.CANCELED },
        },
      });
    });

    it('should throw BadRequestException when cart subtotal is less than coupon minOrder', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'MIN500K',
        active: true,
        minOrder: 500000,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({
          items: [
            createMockCartItem({
              quantity: 2,
              variant: { price: 100000, salePrice: null },
            }),
          ],
        }),
      );

      await expect(service.applyCoupon('user-1', 'MIN500K')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.applyCoupon('user-1', 'MIN500K')).rejects.toThrow(
        `Minimum order amount is ${MoneyUtil.format(500000)}`,
      );
    });

    it('should successfully apply coupon when all conditions pass (and convert code to uppercase)', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'SAVE10',
        active: true,
        minOrder: 100000,
        maxUses: 100,
        usedCount: 5,
        maxUsesPerUser: 2,
        validFrom: new Date(Date.now() - 1000000),
        validUntil: new Date(Date.now() + 1000000),
      });
      mockPrismaService.order.count.mockResolvedValue(1);
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({
          items: [
            createMockCartItem({
              quantity: 2,
              variant: { price: 100000, salePrice: null },
            }),
          ],
        }),
      );
      mockPrismaService.cart.update.mockResolvedValue({
        id: 'cart-1',
        couponId: 'SAVE10',
      });

      const result = await service.applyCoupon('user-1', 'save10');

      expect(mockPrismaService.coupon.findUnique).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
      });
      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { couponId: 'SAVE10' },
      });
      expect(result).toBeDefined();
    });

    it('should successfully apply coupon when user is the referee of the referral coupon', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'REFEREE10',
        active: true,
      });
      mockPrismaService.referral.findFirst.mockResolvedValue({
        referrerCouponCode: null,
        referrerId: null,
        refereeCouponCode: 'REFEREE10',
        refereeId: 'user-1',
      });
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cart.update.mockResolvedValue({
        id: 'cart-1',
        couponId: 'REFEREE10',
      });

      const result = await service.applyCoupon('user-1', 'REFEREE10');

      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { couponId: 'REFEREE10' },
      });
      expect(result).toBeDefined();
    });

    it('should successfully apply coupon when user is the referrer of the referral coupon', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
      });
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        code: 'REFERRER10',
        active: true,
      });
      mockPrismaService.referral.findFirst.mockResolvedValue({
        referrerCouponCode: 'REFERRER10',
        referrerId: 'user-1',
        refereeCouponCode: null,
        refereeId: null,
      });
      mockPrismaService.cart.upsert.mockResolvedValue(createMockCart());
      mockPrismaService.cart.update.mockResolvedValue({
        id: 'cart-1',
        couponId: 'REFERRER10',
      });

      const result = await service.applyCoupon('user-1', 'REFERRER10');

      expect(mockPrismaService.cart.update).toHaveBeenCalledWith({
        where: { id: 'cart-1' },
        data: { couponId: 'REFERRER10' },
      });
      expect(result).toBeDefined();
    });
  });

  describe('validateCartForCheckout', () => {
    it('should throw BadRequestException when cart has no items', async () => {
      mockPrismaService.cart.upsert.mockResolvedValue(
        createMockCart({ items: [] }),
      );

      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        'Cart is empty',
      );
    });

    it('should throw BadRequestException when variant is not found in database', async () => {
      const mockCart = createMockCart({
        items: [
          createMockCartItem({
            variantId: 'var-missing',
            variant: { sku: 'SKU-NOT-FOUND' },
          }),
        ],
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        'Product variant not found: SKU-NOT-FOUND',
      );
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var-missing' },
        include: { product: true },
      });
    });

    it('should throw BadRequestException when variant product is inactive', async () => {
      const mockCart = createMockCart({
        items: [createMockCartItem({ variantId: 'var-inactive' })],
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        createMockVariant({
          product: { name: 'Old Spray', active: false },
        }),
      );

      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        'Product is no longer available: Old Spray',
      );
    });

    it('should throw BadRequestException when variant stock is less than cart item quantity', async () => {
      const mockCart = createMockCart({
        items: [createMockCartItem({ variantId: 'var-low', quantity: 8 })],
      });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);
      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        createMockVariant({
          stock: 3,
          scent: 'Rose',
          product: { name: 'Rose Mist', active: true },
        }),
      );

      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCartForCheckout('user-1')).rejects.toThrow(
        'Insufficient stock for Rose Mist - Rose. Only 3 available.',
      );
    });

    it('should return validated cart when all items are available and have sufficient stock', async () => {
      const item1 = createMockCartItem({
        id: 'item-1',
        variantId: 'var-1',
        quantity: 2,
      });
      const item2 = createMockCartItem({
        id: 'item-2',
        variantId: 'var-2',
        quantity: 1,
        variant: {
          id: 'var-2',
          sku: 'ROSE-250ML',
          scent: 'Rose',
          price: 120000,
          salePrice: null,
          stock: 5,
          product: {
            id: 'prod-2',
            name: 'Rose Spray',
            active: true,
          },
        },
      });
      const mockCart = createMockCart({ items: [item1, item2] });
      mockPrismaService.cart.upsert.mockResolvedValue(mockCart);
      mockPrismaService.productVariant.findUnique.mockImplementation(
        async ({ where }: any) => {
          if (where.id === 'var-1') return item1.variant;
          if (where.id === 'var-2') return item2.variant;
          return null;
        },
      );

      const result = await service.validateCartForCheckout('user-1');

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(2);
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        include: { product: true },
      });
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var-2' },
        include: { product: true },
      });
    });
  });
});
