import {
  createOrdersTools,
  deriveCheckoutKey,
  OrdersToolDeps,
} from './orders.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { OrdersService } from '../../../orders/orders.service';
import type { CartService } from '../../../cart/cart.service';
import { MoneyUtil } from '../../../common/utils/money.util';

describe('Orders Tools - Gap Coverage', () => {
  let mockOrdersService: {
    checkout: jest.Mock;
    getMyOrders: jest.Mock;
    getMyOrderById: jest.Mock;
    cancelOrder: jest.Mock;
    previewCheckout: jest.Mock;
  };
  let mockCartService: {
    getCart: jest.Mock;
  };
  let tools: AgentToolDef[];
  let checkoutTool: AgentToolDef;

  const validCustomerCtx: ToolContext = {
    userId: 'user-gap-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-gap-1',
  };

  beforeEach(() => {
    mockOrdersService = {
      checkout: jest.fn(),
      getMyOrders: jest.fn(),
      getMyOrderById: jest.fn(),
      cancelOrder: jest.fn(),
      previewCheckout: jest.fn(),
    };
    mockCartService = {
      getCart: jest.fn().mockResolvedValue(null),
    };

    const deps: OrdersToolDeps = {
      orders: mockOrdersService as unknown as OrdersService,
      cart: mockCartService as unknown as CartService,
    };

    tools = createOrdersTools(deps);
    checkoutTool = tools.find((t) => t.name === 'checkout')!;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deriveCheckoutKey - missing branch coverage', () => {
    it('handles undefined or null params.items gracefully defaulting to empty array', () => {
      const key = deriveCheckoutKey({
        threadId: 'thread-t1',
        items: undefined as any,
      });

      expect(typeof key).toBe('string');
      expect(key.length).toBe(64);
    });

    it('handles items with identical variantIds by sorting on quantity difference', () => {
      const key1 = deriveCheckoutKey({
        threadId: 'thread-t1',
        items: [
          { variantId: 'var-dup', quantity: 1 },
          { variantId: 'var-dup', quantity: 5 },
        ],
      });

      const key2 = deriveCheckoutKey({
        threadId: 'thread-t1',
        items: [
          { variantId: 'var-dup', quantity: 5 },
          { variantId: 'var-dup', quantity: 1 },
        ],
      });

      expect(key1).toBe(key2);
    });

    it('defaults threadId to empty string, and other optional params to defaults or null', () => {
      const keyDefault = deriveCheckoutKey({
        threadId: undefined as any,
        addressId: undefined,
        items: [],
        paymentMethod: undefined,
        shippingMethod: undefined,
        cartId: undefined,
        couponCode: undefined,
      });

      const keyExplicit = deriveCheckoutKey({
        threadId: '',
        addressId: null,
        items: [],
        paymentMethod: 'COD',
        shippingMethod: 'STANDARD',
        cartId: null,
        couponCode: null,
      });

      expect(keyDefault).toBe(keyExplicit);
    });
  });

  describe('checkoutTool.handler - missing branch coverage', () => {
    it('handles server cart with null or missing id and coupon without code', async () => {
      mockCartService.getCart.mockResolvedValue({
        id: undefined,
        items: [{ variantId: 'var-10', quantity: 3 }],
        coupon: {}, // coupon without code
      });
      mockOrdersService.checkout.mockResolvedValue({ id: 'ord-cart-no-id' });

      await checkoutTool.handler({ addressId: 'addr-test' }, validCustomerCtx);

      expect(mockOrdersService.checkout).toHaveBeenCalledTimes(1);
      const [, dto] = mockOrdersService.checkout.mock.calls[0];
      expect(dto.items).toEqual([{ variantId: 'var-10', quantity: 3 }]);
      expect(dto).not.toHaveProperty('cartId');
      expect(dto).not.toHaveProperty('couponCode');
    });

    it('extracts cart items from clientContext when cart is an object with items array', async () => {
      mockCartService.getCart.mockResolvedValue(null);
      mockOrdersService.checkout.mockResolvedValue({ id: 'ord-obj-cart' });

      const ctxWithObjectCart: ToolContext = {
        ...validCustomerCtx,
        clientContext: {
          cart: {
            items: [
              { variantId: 'var-obj-1', quantity: 4 },
              { variantId: 'var-obj-2', quantity: 2 },
            ],
          },
        },
      };

      await checkoutTool.handler({ addressId: 'addr-obj' }, ctxWithObjectCart);

      expect(mockOrdersService.checkout).toHaveBeenCalledWith('user-gap-123', {
        addressId: 'addr-obj',
        items: [
          { variantId: 'var-obj-1', quantity: 4 },
          { variantId: 'var-obj-2', quantity: 2 },
        ],
        paymentMethod: 'COD',
        shippingMethod: 'STANDARD',
        checkoutKey: expect.any(String),
      });
    });

    it('throws ToolError when clientContext cart is an object without an items array', async () => {
      mockCartService.getCart.mockResolvedValue(null);

      const ctxWithMalformedObjectCart: ToolContext = {
        ...validCustomerCtx,
        clientContext: {
          cart: {
            items: 'not-an-array' as any,
          },
        },
      };

      await expect(
        checkoutTool.handler(
          { addressId: 'addr-fail' },
          ctxWithMalformedObjectCart,
        ),
      ).rejects.toThrow(ToolError);
      await expect(
        checkoutTool.handler(
          { addressId: 'addr-fail' },
          ctxWithMalformedObjectCart,
        ),
      ).rejects.toThrow('Giỏ hàng đang trống');
    });

    it('throws ToolError when clientContext cart is a primitive value', async () => {
      mockCartService.getCart.mockResolvedValue(null);

      const ctxWithPrimitiveCart: ToolContext = {
        ...validCustomerCtx,
        clientContext: {
          cart: 12345 as any,
        },
      };

      await expect(
        checkoutTool.handler({ addressId: 'addr-fail' }, ctxWithPrimitiveCart),
      ).rejects.toThrow('Giỏ hàng đang trống');
    });

    it('omits addressId from checkoutDto when args.addressId is not passed', async () => {
      mockCartService.getCart.mockResolvedValue({
        id: 'cart-123',
        items: [{ variantId: 'var-1', quantity: 1 }],
      });
      mockOrdersService.checkout.mockResolvedValue({ id: 'ord-no-addr' });

      await checkoutTool.handler({}, validCustomerCtx);

      const [, dto] = mockOrdersService.checkout.mock.calls[0];
      expect(dto).not.toHaveProperty('addressId');
      expect(dto.shippingMethod).toBe('STANDARD');
      expect(dto.paymentMethod).toBe('COD');
    });
  });

  describe('checkoutTool.summarize - missing branch coverage', () => {
    it('handles undefined or null args safely in summarize', () => {
      expect(checkoutTool.summarize(undefined as any)).toBe(
        'Đặt đơn từ giỏ hàng hiện tại, giao hàng tiêu chuẩn',
      );
      expect(checkoutTool.summarize(null as any)).toBe(
        'Đặt đơn từ giỏ hàng hiện tại, giao hàng tiêu chuẩn',
      );
    });
  });

  describe('checkoutTool.preview - address formatting fallback and branches', () => {
    it('executes fallback filter callback and formats address when deliveryAddress is missing', async () => {
      mockOrdersService.previewCheckout.mockResolvedValue({
        address: {
          id: 'addr-custom-1',
          line1: 'Số 45 Lê Duẩn',
          ward: '   ', // whitespace only - should be filtered out
          district: 'Quận 1',
          province: 'TP. Hồ Chí Minh',
        },
        deliveryAddress: null, // trigger fallback formatting!
        itemCount: 2,
        subtotal: 200000,
        shippingFee: 25000,
        everyItemPriced: true,
      });

      const previewText = await checkoutTool.preview!(
        { addressId: 'addr-custom-1' },
        {
          ...validCustomerCtx,
          clientContext: {
            cart: [{ variantId: 'var-1', quantity: 2 }],
          },
        },
      );

      expect(previewText).toBeDefined();
      expect(previewText).toContain('Số 45 Lê Duẩn, Quận 1, TP. Hồ Chí Minh');
      expect(previewText).not.toContain('   ');
      expect(previewText).toContain('2 sản phẩm');
      expect(previewText).toContain(`tiền hàng ${MoneyUtil.format(200000)}`);
      expect(previewText).toContain(
        `phí vận chuyển ${MoneyUtil.format(25000)}`,
      );
      expect(previewText).toContain('tạm tính, giá chốt khi đặt đơn');
    });

    it('filters out non-string and empty string components in address formatting callback', async () => {
      mockOrdersService.previewCheckout.mockResolvedValue({
        address: {
          id: 'addr-mixed',
          line1: '100 Nguyễn Huệ',
          ward: null,
          district: undefined,
          province: 'TP. Hồ Chí Minh',
        },
        deliveryAddress: '', // empty string triggers fallback
        itemCount: 1,
        subtotal: 100000,
        shippingFee: 20000,
        everyItemPriced: true,
      });

      const previewText = await checkoutTool.preview!(
        { addressId: 'addr-mixed' },
        {
          ...validCustomerCtx,
          clientContext: {
            cart: [{ variantId: 'var-1', quantity: 1 }],
          },
        },
      );

      expect(previewText).toBeDefined();
      expect(previewText).toContain('100 Nguyễn Huệ, TP. Hồ Chí Minh');
      expect(previewText).not.toContain('null');
      expect(previewText).not.toContain('undefined');
    });

    it('extracts cart items from clientContext object with items array in preview', async () => {
      mockCartService.getCart.mockResolvedValue(null);
      mockOrdersService.previewCheckout.mockResolvedValue({
        address: {
          line1: '789 Phố Huế',
          province: 'Hà Nội',
        },
        deliveryAddress: '789 Phố Huế, Hà Nội',
        itemCount: 1,
        subtotal: 50000,
        shippingFee: 15000,
        everyItemPriced: true,
      });

      const previewText = await checkoutTool.preview!(
        { addressId: 'addr-1' },
        {
          ...validCustomerCtx,
          clientContext: {
            cart: {
              items: [{ variantId: 'var-prev-obj', quantity: 1 }],
            },
          },
        },
      );

      expect(previewText).toBeDefined();
      expect(mockOrdersService.previewCheckout).toHaveBeenCalledWith(
        'user-gap-123',
        expect.objectContaining({
          items: [{ variantId: 'var-prev-obj', quantity: 1 }],
        }),
      );
    });

    it('returns undefined when clientContext cart in preview is malformed object or primitive', async () => {
      mockCartService.getCart.mockResolvedValue(null);

      const previewMalformed = await checkoutTool.preview!(
        { addressId: 'addr-1' },
        {
          ...validCustomerCtx,
          clientContext: {
            cart: { items: 'invalid' } as any,
          },
        },
      );
      expect(previewMalformed).toBeUndefined();

      const previewPrimitive = await checkoutTool.preview!(
        { addressId: 'addr-1' },
        {
          ...validCustomerCtx,
          clientContext: {
            cart: 9999 as any,
          },
        },
      );
      expect(previewPrimitive).toBeUndefined();
    });

    it('returns undefined when previewCheckout service returns null or null address', async () => {
      mockCartService.getCart.mockResolvedValue({
        id: 'cart-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
      });

      mockOrdersService.previewCheckout.mockResolvedValue(null);
      const resNull = await checkoutTool.preview!(
        { addressId: 'addr-1' },
        validCustomerCtx,
      );
      expect(resNull).toBeUndefined();

      mockOrdersService.previewCheckout.mockResolvedValue({ address: null });
      const resNullAddress = await checkoutTool.preview!(
        { addressId: 'addr-1' },
        validCustomerCtx,
      );
      expect(resNullAddress).toBeUndefined();
    });

    it('supports coupon passed as args.coupon property', async () => {
      mockCartService.getCart.mockResolvedValue({
        id: 'cart-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
      });
      mockOrdersService.previewCheckout.mockResolvedValue({
        address: { line1: 'Test St' },
        deliveryAddress: 'Test St',
        itemCount: 1,
        subtotal: 50000,
        shippingFee: 10000,
        everyItemPriced: true,
      });

      const previewText = await checkoutTool.preview!(
        { addressId: 'addr-1', coupon: 'DISCOUNT_ALT' } as any,
        validCustomerCtx,
      );

      expect(previewText).toContain(
        'mã giảm giá DISCOUNT_ALT sẽ được áp dụng khi đặt đơn',
      );
    });

    it('ignores empty string or non-string coupon values in preview', async () => {
      mockCartService.getCart.mockResolvedValue({
        id: 'cart-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
      });
      mockOrdersService.previewCheckout.mockResolvedValue({
        address: { line1: 'Test St' },
        deliveryAddress: 'Test St',
        itemCount: 1,
        subtotal: 50000,
        shippingFee: 10000,
        everyItemPriced: true,
      });

      const previewEmpty = await checkoutTool.preview!(
        { addressId: 'addr-1', couponCode: '   ' } as any,
        validCustomerCtx,
      );
      expect(previewEmpty).not.toContain('mã giảm giá');

      const previewNonString = await checkoutTool.preview!(
        { addressId: 'addr-1', couponCode: 12345 } as any,
        validCustomerCtx,
      );
      expect(previewNonString).not.toContain('mã giảm giá');
    });
  });

  describe('checkoutTool.project - missing branch coverage', () => {
    it('returns result unchanged when result is null, undefined, or a primitive', () => {
      expect(checkoutTool.project!(null)).toBeNull();
      expect(checkoutTool.project!(undefined)).toBeUndefined();
      expect(checkoutTool.project!('simple-string')).toBe('simple-string');
      expect(checkoutTool.project!(12345)).toBe(12345);
    });

    it('uses numeric result.itemCount when result.items is not an array', () => {
      const order = {
        id: 'ord-itemcount-num',
        code: 'ORD-NUM-1',
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        total: 150000,
        createdAt: new Date(),
        items: null,
        itemCount: 7,
      };

      const projected = checkoutTool.project!(order) as Record<string, unknown>;
      expect(projected.itemCount).toBe(7);
      expect(projected.id).toBe('ord-itemcount-num');
    });

    it('defaults itemCount to 0 when result.items is not an array and result.itemCount is not a number', () => {
      const order = {
        id: 'ord-itemcount-zero',
        code: 'ORD-ZERO-1',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        total: 100000,
        createdAt: new Date(),
        items: undefined,
        itemCount: 'seven' as any,
      };

      const projected = checkoutTool.project!(order) as Record<string, unknown>;
      expect(projected.itemCount).toBe(0);
      expect(projected.id).toBe('ord-itemcount-zero');
    });
  });
});
