import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { ApplyCouponDto } from './dtos/apply-coupon.dto';

describe('CartController', () => {
  let controller: CartController;
  let cartService: CartService;

  const canActivateStub = jest.fn(() => true);

  const mockCartService = {
    getCart: jest.fn(),
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
    applyCoupon: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [
        {
          provide: CartService,
          useValue: mockCartService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: canActivateStub })
      .compile();

    controller = module.get<CartController>(CartController);
    cartService = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Guards', () => {
    it('should override route guards with canActivate stub returning true', () => {
      expect(canActivateStub()).toBe(true);
    });
  });

  describe('getCart', () => {
    it('should delegate to cartService.getCart with userId and return cart', async () => {
      const userId = 'user-123';
      const mockCart = {
        id: 'cart-1',
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      };
      mockCartService.getCart.mockResolvedValue(mockCart);

      const result = await controller.getCart(userId);

      expect(cartService.getCart).toHaveBeenCalledWith(userId);
      expect(cartService.getCart).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockCart);
    });

    it('should propagate errors from cartService.getCart', async () => {
      const userId = 'user-123';
      const error = new NotFoundException('Cart not found');
      mockCartService.getCart.mockRejectedValue(error);

      await expect(controller.getCart(userId)).rejects.toThrow(error);
      expect(cartService.getCart).toHaveBeenCalledWith(userId);
    });
  });

  describe('addToCart', () => {
    it('should delegate to cartService.addToCart with userId and dto, and return updated cart', async () => {
      const userId = 'user-123';
      const dto: AddToCartDto = { variantId: 'variant-456', quantity: 2 };
      const mockCart = {
        id: 'cart-1',
        userId,
        items: [{ variantId: 'variant-456', quantity: 2 }],
        subtotal: 200,
        discount: 0,
        total: 200,
      };
      mockCartService.addToCart.mockResolvedValue(mockCart);

      const result = await controller.addToCart(userId, dto);

      expect(cartService.addToCart).toHaveBeenCalledWith(userId, dto);
      expect(cartService.addToCart).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockCart);
    });

    it('should propagate errors from cartService.addToCart', async () => {
      const userId = 'user-123';
      const dto: AddToCartDto = { variantId: 'variant-456', quantity: 99 };
      const error = new BadRequestException('Product is not available');
      mockCartService.addToCart.mockRejectedValue(error);

      await expect(controller.addToCart(userId, dto)).rejects.toThrow(error);
      expect(cartService.addToCart).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('updateCartItem', () => {
    it('should delegate to cartService.updateCartItem with userId, itemId, and dto, and return updated cart', async () => {
      const userId = 'user-123';
      const itemId = 'item-789';
      const dto: UpdateCartItemDto = { quantity: 4 };
      const mockCart = {
        id: 'cart-1',
        userId,
        items: [{ id: itemId, quantity: 4 }],
        subtotal: 400,
        discount: 0,
        total: 400,
      };
      mockCartService.updateCartItem.mockResolvedValue(mockCart);

      const result = await controller.updateCartItem(userId, itemId, dto);

      expect(cartService.updateCartItem).toHaveBeenCalledWith(userId, itemId, dto);
      expect(cartService.updateCartItem).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockCart);
    });

    it('should propagate errors from cartService.updateCartItem', async () => {
      const userId = 'user-123';
      const itemId = 'item-789';
      const dto: UpdateCartItemDto = { quantity: 1 };
      const error = new NotFoundException('Cart item not found');
      mockCartService.updateCartItem.mockRejectedValue(error);

      await expect(controller.updateCartItem(userId, itemId, dto)).rejects.toThrow(error);
      expect(cartService.updateCartItem).toHaveBeenCalledWith(userId, itemId, dto);
    });
  });

  describe('removeCartItem', () => {
    it('should delegate to cartService.removeCartItem with userId and itemId, and return updated cart', async () => {
      const userId = 'user-123';
      const itemId = 'item-789';
      const mockCart = {
        id: 'cart-1',
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      };
      mockCartService.removeCartItem.mockResolvedValue(mockCart);

      const result = await controller.removeCartItem(userId, itemId);

      expect(cartService.removeCartItem).toHaveBeenCalledWith(userId, itemId);
      expect(cartService.removeCartItem).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockCart);
    });

    it('should propagate errors from cartService.removeCartItem', async () => {
      const userId = 'user-123';
      const itemId = 'item-789';
      const error = new NotFoundException('Cart item not found');
      mockCartService.removeCartItem.mockRejectedValue(error);

      await expect(controller.removeCartItem(userId, itemId)).rejects.toThrow(error);
      expect(cartService.removeCartItem).toHaveBeenCalledWith(userId, itemId);
    });
  });

  describe('clearCart', () => {
    it('should delegate to cartService.clearCart with userId and return cleared cart', async () => {
      const userId = 'user-123';
      const mockCart = {
        id: 'cart-1',
        userId,
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      };
      mockCartService.clearCart.mockResolvedValue(mockCart);

      const result = await controller.clearCart(userId);

      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
      expect(cartService.clearCart).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockCart);
    });

    it('should propagate errors from cartService.clearCart', async () => {
      const userId = 'user-123';
      const error = new NotFoundException('Cart not found');
      mockCartService.clearCart.mockRejectedValue(error);

      await expect(controller.clearCart(userId)).rejects.toThrow(error);
      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
    });
  });

  describe('applyCoupon', () => {
    it('should delegate to cartService.applyCoupon with userId and couponCode when provided', async () => {
      const userId = 'user-123';
      const dto: ApplyCouponDto = { couponCode: 'SUMMER2025' };
      const mockCart = {
        id: 'cart-1',
        userId,
        items: [],
        couponCode: 'SUMMER2025',
        subtotal: 100,
        discount: 20,
        total: 80,
      };
      mockCartService.applyCoupon.mockResolvedValue(mockCart);

      const result = await controller.applyCoupon(userId, dto);

      expect(cartService.applyCoupon).toHaveBeenCalledWith(userId, 'SUMMER2025');
      expect(cartService.applyCoupon).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockCart);
    });

    it('should delegate to cartService.applyCoupon with userId and undefined when couponCode is omitted', async () => {
      const userId = 'user-123';
      const dto: ApplyCouponDto = {};
      const mockCart = {
        id: 'cart-1',
        userId,
        items: [],
        couponCode: null,
        subtotal: 100,
        discount: 0,
        total: 100,
      };
      mockCartService.applyCoupon.mockResolvedValue(mockCart);

      const result = await controller.applyCoupon(userId, dto);

      expect(cartService.applyCoupon).toHaveBeenCalledWith(userId, undefined);
      expect(cartService.applyCoupon).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockCart);
    });

    it('should propagate errors from cartService.applyCoupon', async () => {
      const userId = 'user-123';
      const dto: ApplyCouponDto = { couponCode: 'EXPIRED' };
      const error = new BadRequestException('Coupon has expired');
      mockCartService.applyCoupon.mockRejectedValue(error);

      await expect(controller.applyCoupon(userId, dto)).rejects.toThrow(error);
      expect(cartService.applyCoupon).toHaveBeenCalledWith(userId, 'EXPIRED');
    });
  });
});
