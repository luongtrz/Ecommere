import { createOrdersTools, OrdersToolDeps, ORDER_STATUSES } from './orders.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { OrdersService } from '../../../orders/orders.service';
import type { CartService } from '../../../cart/cart.service';
import { MoneyUtil } from '../../../common/utils/money.util';

describe('Orders Tools', () => {
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
  let listTool: AgentToolDef;
  let getTool: AgentToolDef;
  let cancelTool: AgentToolDef;
  let checkoutTool: AgentToolDef;

  const validCustomerCtx: ToolContext = {
    userId: 'user-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-1',
    clientContext: {
      cart: [
        {
          variantId: 'var-1',
          quantity: 2,
          price: 50000,
          total: 100000,
        },
      ],
    },
  };

  const unauthenticatedCtx: ToolContext = {
    userId: null,
    role: 'GUEST',
    app: 'USER',
    threadId: 'thread-2',
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
    listTool = tools.find((t) => t.name === 'list_my_orders')!;
    getTool = tools.find((t) => t.name === 'get_my_order')!;
    cancelTool = tools.find((t) => t.name === 'cancel_my_order')!;
    checkoutTool = tools.find((t) => t.name === 'checkout')!;
  });

  describe('Factory and General Requirements', () => {
    it('returns exactly 4 tools with unique names', () => {
      expect(tools).toHaveLength(4);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(4);
      expect(names).toEqual([
        'list_my_orders',
        'get_my_order',
        'cancel_my_order',
        'checkout',
      ]);
    });

    it('sets auth to "customer" on all tools', () => {
      for (const tool of tools) {
        expect(tool.auth).toBe('customer');
      }
    });

    it('sets domain to "orders" on all tools', () => {
      for (const tool of tools) {
        expect(tool.domain).toBe('orders');
      }
    });

    it('enforces strict schema on all tools (rejects unknown properties)', () => {
      for (const tool of tools) {
        const result = tool.schema.safeParse({ unknownProp: 'value' });
        expect(result.success).toBe(false);
      }
    });

    it('does not include userId or role in any schema', () => {
      for (const tool of tools) {
        expect(tool.schema.shape).not.toHaveProperty('userId');
        expect(tool.schema.shape).not.toHaveProperty('role');

        const checkUserId = tool.schema.safeParse({ userId: 'user-1' });
        expect(checkUserId.success).toBe(false);

        const checkRole = tool.schema.safeParse({ role: 'CUSTOMER' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('throws "Cần đăng nhập để dùng chức năng này" for all tools when ctx.userId is null', async () => {
      await expect(listTool.handler({}, unauthenticatedCtx)).rejects.toThrow(
        ToolError,
      );
      await expect(listTool.handler({}, unauthenticatedCtx)).rejects.toThrow(
        'Cần đăng nhập để dùng chức năng này',
      );
      await expect(
        getTool.handler({ orderId: 'ord-1' }, unauthenticatedCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        getTool.handler({ orderId: 'ord-1' }, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(
        cancelTool.handler({ orderId: 'ord-1' }, unauthenticatedCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        cancelTool.handler({ orderId: 'ord-1' }, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
      await expect(checkoutTool.handler({}, unauthenticatedCtx)).rejects.toThrow(
        ToolError,
      );
      await expect(checkoutTool.handler({}, unauthenticatedCtx)).rejects.toThrow(
        'Cần đăng nhập để dùng chức năng này',
      );
    });
  });

  describe('list_my_orders', () => {
    it('has risk READ and expected description', () => {
      expect(listTool.risk).toBe('READ');
      expect(listTool.description).toBe(
        'Danh sách đơn hàng của khách, mới nhất trước. Dùng công cụ này để tìm mã đơn trước khi xem chi tiết.',
      );
    });

    it('calls getMyOrders with expected filter arguments', async () => {
      mockOrdersService.getMyOrders.mockResolvedValue({
        data: [],
        total: 0,
      });

      const args = { status: 'PAID' as const, page: 2, limit: 15 };
      await listTool.handler(args, validCustomerCtx);

      expect(mockOrdersService.getMyOrders).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.getMyOrders).toHaveBeenCalledWith('user-123', {
        status: 'PAID',
        page: 2,
        limit: 15,
      });
    });

    it('rejects an invalid status', () => {
      const invalid = listTool.schema.safeParse({ status: 'INVALID_STATUS' });
      expect(invalid.success).toBe(false);
    });

    it('accepts each of the seven valid OrderStatus values', () => {
      for (const status of ORDER_STATUSES) {
        const res = listTool.schema.safeParse({ status });
        expect(res.success).toBe(true);
      }
    });

    it('validates page and limit range (1..50)', () => {
      expect(listTool.schema.safeParse({ page: 0 }).success).toBe(false);
      expect(listTool.schema.safeParse({ page: 51 }).success).toBe(false);
      expect(listTool.schema.safeParse({ limit: 0 }).success).toBe(false);
      expect(listTool.schema.safeParse({ limit: 51 }).success).toBe(false);
      expect(listTool.schema.safeParse({ page: 1, limit: 50 }).success).toBe(true);
    });

    it('summarize returns a Vietnamese string', () => {
      expect(listTool.summarize({})).toBe('Xem danh sách đơn hàng');
      expect(listTool.summarize({ status: 'PAID' })).toContain('PAID');
    });
  });

  describe('get_my_order', () => {
    it('has risk READ and calls getMyOrderById', async () => {
      expect(getTool.risk).toBe('READ');
      mockOrdersService.getMyOrderById.mockResolvedValue({
        id: 'order-123',
        code: 'ORD-123',
      });

      const result = await getTool.handler(
        { orderId: 'order-123' },
        validCustomerCtx,
      );

      expect(mockOrdersService.getMyOrderById).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.getMyOrderById).toHaveBeenCalledWith(
        'user-123',
        'order-123',
      );
      expect(result).toEqual({ id: 'order-123', code: 'ORD-123' });
    });

    it('validates orderId string constraints', () => {
      expect(getTool.schema.safeParse({ orderId: '' }).success).toBe(false);
      expect(getTool.schema.safeParse({ orderId: 'a'.repeat(65) }).success).toBe(
        false,
      );
      expect(getTool.schema.safeParse({ orderId: 'valid-id-123' }).success).toBe(
        true,
      );
    });

    it('summarize returns a Vietnamese line referencing orderId', () => {
      const summary = getTool.summarize({ orderId: 'order-123' });
      expect(summary).toBe('Xem đơn hàng order-123');
    });
  });

  describe('cancel_my_order', () => {
    it('has risk SENSITIVE and expected description', () => {
      expect(cancelTool.risk).toBe('SENSITIVE');
      expect(cancelTool.description).toBe(
        'Hủy đơn hàng. Chỉ hủy được đơn đang chờ thanh toán hoặc đã thanh toán. Không hoàn tác được.',
      );
    });

    it('calls cancelOrder with userId and orderId', async () => {
      mockOrdersService.cancelOrder.mockResolvedValue({
        id: 'order-999',
        status: 'CANCELED',
      });

      const result = await cancelTool.handler(
        { orderId: 'order-999' },
        validCustomerCtx,
      );

      expect(mockOrdersService.cancelOrder).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith(
        'user-123',
        'order-999',
      );
      expect(result).toEqual({ id: 'order-999', status: 'CANCELED' });
    });

    it('summarize returns "Hủy đơn hàng <orderId>"', () => {
      expect(cancelTool.summarize({ orderId: 'order-999' })).toBe(
        'Hủy đơn hàng order-999',
      );
    });
  });

  describe('checkout', () => {
    it('has risk SENSITIVE and expected description', () => {
      expect(checkoutTool.risk).toBe('SENSITIVE');
      expect(checkoutTool.description).toBe(
        'Đặt đơn từ giỏ hàng hiện tại của khách. Giá và phí ship do máy chủ tính lại. Thanh toán thực hiện trên trang đơn hàng.',
      );
    });

    it('rejects a model argument named items or userId via strict schema', () => {
      const withItems = checkoutTool.schema.safeParse({
        items: [{ variantId: 'v1', quantity: 1 }],
      });
      expect(withItems.success).toBe(false);

      const withUserId = checkoutTool.schema.safeParse({
        userId: 'some-user',
      });
      expect(withUserId.success).toBe(false);
    });

    it('defaults shippingMethod to STANDARD and paymentMethod to COD', () => {
      const parsed = checkoutTool.schema.parse({});
      expect(parsed.shippingMethod).toBe('STANDARD');
      expect(parsed.paymentMethod).toBe('COD');
    });

    it('throws "Giỏ hàng đang trống" when clientContext.cart is missing or empty', async () => {
      const missingClientCtx: ToolContext = {
        userId: 'user-123',
        role: 'CUSTOMER',
        app: 'USER',
        threadId: 't-1',
      };
      await expect(
        checkoutTool.handler({}, missingClientCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        checkoutTool.handler({}, missingClientCtx),
      ).rejects.toThrow('Giỏ hàng đang trống');

      const nullCartCtx: ToolContext = {
        ...missingClientCtx,
        clientContext: { cart: null },
      };
      await expect(checkoutTool.handler({}, nullCartCtx)).rejects.toThrow(
        ToolError,
      );
      await expect(checkoutTool.handler({}, nullCartCtx)).rejects.toThrow(
        'Giỏ hàng đang trống',
      );

      const emptyCartCtx: ToolContext = {
        ...missingClientCtx,
        clientContext: { cart: [] },
      };
      await expect(checkoutTool.handler({}, emptyCartCtx)).rejects.toThrow(
        ToolError,
      );
      await expect(checkoutTool.handler({}, emptyCartCtx)).rejects.toThrow(
        'Giỏ hàng đang trống',
      );
    });

    it('sends no price or total fields to the service even when present in cart items (strip them)', async () => {
      mockOrdersService.checkout.mockResolvedValue({
        id: 'order-res-1',
        code: 'ORD-2026-001',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        total: 100000,
        createdAt: new Date(),
        items: [{ id: 'item-1' }],
      });

      const ctxWithExtraFields: ToolContext = {
        userId: 'user-123',
        role: 'CUSTOMER',
        app: 'USER',
        threadId: 'thread-1',
        clientContext: {
          cart: [
            {
              variantId: 'var-1',
              quantity: 2,
              price: 50000,
              total: 100000,
              salePrice: 45000,
              unitPrice: 50000,
              lineTotal: 100000,
            },
            {
              variantId: 'var-2',
              quantity: 1,
              price: 30000,
              total: 30000,
            },
          ],
        },
      };

      await checkoutTool.handler(
        { addressId: 'addr-001' },
        ctxWithExtraFields,
      );

      expect(mockOrdersService.checkout).toHaveBeenCalledTimes(1);
      const [userIdArg, dtoArg] = mockOrdersService.checkout.mock.calls[0];
      expect(userIdArg).toBe('user-123');

      // Check DTO does not have root price, shippingFee, or total
      expect(dtoArg).not.toHaveProperty('total');
      expect(dtoArg).not.toHaveProperty('price');
      expect(dtoArg).not.toHaveProperty('shippingFee');
      expect(dtoArg).not.toHaveProperty('subtotal');

      expect(dtoArg.addressId).toBe('addr-001');
      expect(dtoArg.paymentMethod).toBe('COD');
      expect(dtoArg.shippingMethod).toBe('STANDARD');

      // Check items have ONLY variantId and quantity
      expect(dtoArg.items).toEqual([
        { variantId: 'var-1', quantity: 2 },
        { variantId: 'var-2', quantity: 1 },
      ]);
      for (const item of dtoArg.items) {
        expect(item).not.toHaveProperty('price');
        expect(item).not.toHaveProperty('total');
        expect(item).not.toHaveProperty('salePrice');
        expect(item).not.toHaveProperty('unitPrice');
        expect(item).not.toHaveProperty('lineTotal');
      }
    });

    it('supports custom shippingMethod and paymentMethod', async () => {
      mockOrdersService.checkout.mockResolvedValue({ id: 'ord-1' });

      await checkoutTool.handler(
        {
          addressId: 'addr-xyz',
          shippingMethod: 'EXPRESS',
          paymentMethod: 'BANK_TRANSFER',
        },
        validCustomerCtx,
      );

      expect(mockOrdersService.checkout).toHaveBeenCalledWith('user-123', {
        addressId: 'addr-xyz',
        shippingMethod: 'EXPRESS',
        paymentMethod: 'BANK_TRANSFER',
        items: [{ variantId: 'var-1', quantity: 2 }],
      });
    });

    it('project() keeps id, code, status, paymentStatus, total, createdAt, and itemCount while stripping other fields', () => {
      const now = new Date();
      const rawOrder = {
        id: 'ord-999',
        code: 'ORD-CODE-999',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        total: 250000,
        createdAt: now,
        userId: 'user-123',
        subtotal: 220000,
        shippingFee: 30000,
        addressId: 'addr-1',
        address: { province: 'Hà Nội' },
        items: [
          { id: 'item-1', variantId: 'v-1', quantity: 2 },
          { id: 'item-2', variantId: 'v-2', quantity: 1 },
        ],
        extraField: 'should-be-omitted',
      };

      const projected = checkoutTool.project!(rawOrder) as Record<string, unknown>;

      expect(projected).toEqual({
        id: 'ord-999',
        code: 'ORD-CODE-999',
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        total: 250000,
        createdAt: now,
        itemCount: 2,
      });

      expect(projected).not.toHaveProperty('userId');
      expect(projected).not.toHaveProperty('items');
      expect(projected).not.toHaveProperty('subtotal');
      expect(projected).not.toHaveProperty('shippingFee');
      expect(projected).not.toHaveProperty('address');
      expect(projected).not.toHaveProperty('extraField');
    });

    it('summarize() describes the cart checkout and the shipping method', () => {
      expect(checkoutTool.summarize({ shippingMethod: 'EXPRESS' })).toBe(
        'Đặt đơn từ giỏ hàng hiện tại, giao hàng nhanh',
      );
      expect(checkoutTool.summarize({})).toBe(
        'Đặt đơn từ giỏ hàng hiện tại, giao hàng tiêu chuẩn',
      );
    });

    describe('preview()', () => {
      const mockAddress = {
        id: 'addr-001',
        userId: 'user-123',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng',
        line1: '123 Đường Cầu Giấy',
      };

      it('shows the address, the item count and an estimated subtotal computed from server prices (not from client price hints)', async () => {
        mockOrdersService.previewCheckout.mockResolvedValue({
          address: mockAddress,
          deliveryAddress: '123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
          itemCount: 1,
          subtotal: 160000,
          shippingFee: 30000,
          everyItemPriced: true,
        });

        // validCustomerCtx has client price hints: price: 50000, total: 100000
        const text = await checkoutTool.preview!(
          { addressId: 'addr-001', shippingMethod: 'STANDARD' },
          validCustomerCtx,
        );

        expect(mockOrdersService.previewCheckout).toHaveBeenCalledTimes(1);
        const [userIdArg, inputArg] = mockOrdersService.previewCheckout.mock.calls[0];
        expect(userIdArg).toBe('user-123');
        expect(inputArg.addressId).toBe('addr-001');
        expect(inputArg.shippingMethod).toBe('STANDARD');

        // Stripped of client price hints
        expect(inputArg.items).toEqual([{ variantId: 'var-1', quantity: 2 }]);
        expect(inputArg.items[0]).not.toHaveProperty('price');
        expect(inputArg.items[0]).not.toHaveProperty('total');

        expect(text).toBeDefined();
        expect(text).toContain('123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội');
        expect(text).toContain('1 sản phẩm');
        expect(text).toContain(MoneyUtil.format(160000));
        expect(text).not.toContain(MoneyUtil.format(100000));
        expect(text).toContain(MoneyUtil.format(30000));
        expect(text).toContain('tạm tính, giá chốt khi đặt đơn');
        expect(text).toContain(' · ');
      });

      it('returns undefined when the delivery address does not belong to the user (foreign address)', async () => {
        mockOrdersService.previewCheckout.mockResolvedValue({
          address: null,
          deliveryAddress: null,
          itemCount: 1,
          subtotal: 160000,
          shippingFee: 0,
          everyItemPriced: true,
        });

        const result = await checkoutTool.preview!(
          { addressId: 'foreign-addr' },
          validCustomerCtx,
        );

        expect(result).toBeUndefined();
      });

      it('returns text without total when a cart item is missing or inactive', async () => {
        mockOrdersService.previewCheckout.mockResolvedValue({
          address: mockAddress,
          deliveryAddress: '123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
          itemCount: 1,
          subtotal: 0,
          shippingFee: 30000,
          everyItemPriced: false,
        });

        const text = await checkoutTool.preview!(
          { addressId: 'addr-001' },
          validCustomerCtx,
        );

        expect(text).toBeDefined();
        expect(text).toContain('123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội');
        expect(text).toContain('1 sản phẩm');
        expect(text).toContain('một số sản phẩm không thể tính giá');
        expect(text).not.toContain('tiền hàng');
        expect(text).toContain(MoneyUtil.format(30000));
        expect(text).toContain('tạm tính, giá chốt khi đặt đơn');
      });

      it('includes note for coupon code that it will be applied when order is placed', async () => {
        mockOrdersService.previewCheckout.mockResolvedValue({
          address: mockAddress,
          deliveryAddress: '123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
          itemCount: 1,
          subtotal: 160000,
          shippingFee: 30000,
          everyItemPriced: true,
        });

        const text = await checkoutTool.preview!(
          { addressId: 'addr-001', couponCode: 'DISCOUNT10' } as any,
          validCustomerCtx,
        );

        expect(text).toContain('mã giảm giá DISCOUNT10 sẽ được áp dụng khi đặt đơn');
      });

      it('returns undefined when unauthenticated, cart is empty or missing addressId', async () => {
        expect(
          await checkoutTool.preview!({ addressId: 'addr-001' }, unauthenticatedCtx),
        ).toBeUndefined();
        expect(await checkoutTool.preview!({}, validCustomerCtx)).toBeUndefined();

        const emptyCtx = { ...validCustomerCtx, clientContext: { cart: [] } };
        expect(
          await checkoutTool.preview!({ addressId: 'addr-001' }, emptyCtx),
        ).toBeUndefined();
      });
    });

    describe('server-side DB cart and resume', () => {
      it('resume without clientContext checks out using the DB cart', async () => {
        const mockCartService = {
          getCart: jest.fn().mockResolvedValue({
            id: 'cart-db-1',
            userId: 'user-123',
            items: [
              {
                variantId: 'var-101',
                quantity: 2,
              },
            ],
            couponId: null,
            coupon: null,
          }),
        };
        const toolsWithCart = createOrdersTools({
          orders: mockOrdersService as unknown as OrdersService,
          cart: mockCartService as unknown as CartService,
        });
        const checkoutWithCart = toolsWithCart.find((t) => t.name === 'checkout')!;

        const resumeCtx: ToolContext = {
          userId: 'user-123',
          role: 'CUSTOMER',
          app: 'USER',
          threadId: 't-resume',
        };

        mockOrdersService.checkout.mockResolvedValue({
          id: 'ord-res-1',
          code: 'ORD-1',
        });

        await checkoutWithCart.handler({ addressId: 'addr-001' }, resumeCtx);

        expect(mockCartService.getCart).toHaveBeenCalledWith('user-123');
        expect(mockOrdersService.checkout).toHaveBeenCalledWith('user-123', {
          addressId: 'addr-001',
          paymentMethod: 'COD',
          shippingMethod: 'STANDARD',
          cartId: 'cart-db-1',
          items: [{ variantId: 'var-101', quantity: 2 }],
        });
      });

      it('checkout passes cartId when a server cart exists and couponCode only when coupon with code exists', async () => {
        const mockCartService = {
          getCart: jest.fn().mockResolvedValue({
            id: 'cart-srv-789',
            userId: 'user-123',
            items: [
              {
                variantId: 'var-1',
                quantity: 1,
              },
            ],
            couponId: 'cuid-not-a-code',
            coupon: { code: 'SALE50' },
          }),
        };
        const toolsWithCart = createOrdersTools({
          orders: mockOrdersService as unknown as OrdersService,
          cart: mockCartService as unknown as CartService,
        });
        const checkoutWithCart = toolsWithCart.find((t) => t.name === 'checkout')!;

        mockOrdersService.checkout.mockResolvedValue({ id: 'ord-2' });

        await checkoutWithCart.handler(
          {
            addressId: 'addr-xyz',
            shippingMethod: 'EXPRESS',
            paymentMethod: 'BANK_TRANSFER',
          },
          validCustomerCtx,
        );

        expect(mockOrdersService.checkout).toHaveBeenCalledWith('user-123', {
          addressId: 'addr-xyz',
          shippingMethod: 'EXPRESS',
          paymentMethod: 'BANK_TRANSFER',
          cartId: 'cart-srv-789',
          couponCode: 'SALE50',
          items: [{ variantId: 'var-1', quantity: 1 }],
        });

        // When coupon has no code or coupon is null, couponCode must not be passed
        mockCartService.getCart.mockResolvedValueOnce({
          id: 'cart-srv-no-code',
          userId: 'user-123',
          items: [{ variantId: 'var-1', quantity: 1 }],
          couponId: 'cuid-without-code',
          coupon: null,
        });

        await checkoutWithCart.handler(
          { addressId: 'addr-xyz' },
          validCustomerCtx,
        );

        const lastCallDto = mockOrdersService.checkout.mock.calls[1][1];
        expect(lastCallDto).toHaveProperty('cartId', 'cart-srv-no-code');
        expect(lastCallDto).not.toHaveProperty('couponCode');
      });

      it('falls back to browser cart when server cart has no items, or throws when both are empty', async () => {
        const mockCartService = {
          getCart: jest.fn().mockResolvedValue({
            id: 'cart-empty-1',
            userId: 'user-123',
            items: [],
          }),
        };
        const toolsWithCart = createOrdersTools({
          orders: mockOrdersService as unknown as OrdersService,
          cart: mockCartService as unknown as CartService,
        });
        const checkoutWithCart = toolsWithCart.find((t) => t.name === 'checkout')!;

        mockOrdersService.checkout.mockResolvedValue({
          id: 'ord-fallback-1',
          code: 'ORD-FB-1',
        });

        await checkoutWithCart.handler({}, validCustomerCtx);

        expect(mockCartService.getCart).toHaveBeenCalledWith('user-123');
        expect(mockOrdersService.checkout).toHaveBeenCalledWith('user-123', {
          paymentMethod: 'COD',
          shippingMethod: 'STANDARD',
          items: [{ variantId: 'var-1', quantity: 2 }],
        });

        const noClientCtx: ToolContext = {
          userId: 'user-123',
          role: 'CUSTOMER',
          app: 'USER',
          threadId: 't-no-client',
        };
        await expect(
          checkoutWithCart.handler({}, noClientCtx),
        ).rejects.toThrow(ToolError);
        await expect(
          checkoutWithCart.handler({}, noClientCtx),
        ).rejects.toThrow('Giỏ hàng đang trống');
      });

      it('builds confirm preview falling back to browser cart when server cart has no items', async () => {
        const mockCartService = {
          getCart: jest.fn().mockResolvedValue({
            id: 'cart-empty-prev',
            userId: 'user-123',
            items: [],
          }),
        };
        mockOrdersService.previewCheckout.mockResolvedValue({
          address: {
            id: 'addr-001',
            line1: '123 Đường Cầu Giấy',
            ward: 'Dịch Vọng',
            district: 'Cầu Giấy',
            province: 'Hà Nội',
          },
          deliveryAddress: '123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
          itemCount: 1,
          subtotal: 100000,
          shippingFee: 30000,
          everyItemPriced: true,
        });

        const toolsWithCart = createOrdersTools({
          orders: mockOrdersService as unknown as OrdersService,
          cart: mockCartService as unknown as CartService,
        });
        const checkoutWithCart = toolsWithCart.find((t) => t.name === 'checkout')!;

        const previewText = await checkoutWithCart.preview!(
          { addressId: 'addr-001' },
          validCustomerCtx,
        );

        expect(mockCartService.getCart).toHaveBeenCalledWith('user-123');
        expect(mockOrdersService.previewCheckout).toHaveBeenCalledWith('user-123', {
          addressId: 'addr-001',
          shippingMethod: undefined,
          items: [{ variantId: 'var-1', quantity: 2 }],
        });
        expect(previewText).toContain('123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội');
        expect(previewText).toContain('1 sản phẩm');
        expect(previewText).toContain(MoneyUtil.format(100000));
      });

      it('returns undefined in preview when server cart and browser cart are both empty', async () => {
        const mockCartService = {
          getCart: jest.fn().mockResolvedValue({
            id: 'cart-empty-prev',
            userId: 'user-123',
            items: [],
          }),
        };
        const toolsWithCart = createOrdersTools({
          orders: mockOrdersService as unknown as OrdersService,
          cart: mockCartService as unknown as CartService,
        });
        const checkoutWithCart = toolsWithCart.find((t) => t.name === 'checkout')!;

        const noClientCtx: ToolContext = {
          userId: 'user-123',
          role: 'CUSTOMER',
          app: 'USER',
          threadId: 't-no-client-preview',
        };

        const previewText = await checkoutWithCart.preview!(
          { addressId: 'addr-001' },
          noClientCtx,
        );
        expect(previewText).toBeUndefined();
      });

      it('builds confirm preview from server cart for logged-in user', async () => {
        const mockCartService = {
          getCart: jest.fn().mockResolvedValue({
            id: 'cart-srv-prev',
            userId: 'user-123',
            items: [
              {
                variantId: 'var-1',
                quantity: 2,
              },
            ],
            couponId: 'COUPON2026',
            coupon: { code: 'COUPON2026' },
          }),
        };
        mockOrdersService.previewCheckout.mockResolvedValue({
          address: {
            id: 'addr-001',
            line1: '123 Đường Cầu Giấy',
            ward: 'Dịch Vọng',
            district: 'Cầu Giấy',
            province: 'Hà Nội',
          },
          deliveryAddress: '123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
          itemCount: 1,
          subtotal: 100000,
          shippingFee: 30000,
          everyItemPriced: true,
        });

        const toolsWithCart = createOrdersTools({
          orders: mockOrdersService as unknown as OrdersService,
          cart: mockCartService as unknown as CartService,
        });
        const checkoutWithCart = toolsWithCart.find((t) => t.name === 'checkout')!;

        const resumeCtx: ToolContext = {
          userId: 'user-123',
          role: 'CUSTOMER',
          app: 'USER',
          threadId: 't-resume-preview',
        };

        const previewText = await checkoutWithCart.preview!(
          { addressId: 'addr-001' },
          resumeCtx,
        );

        expect(mockCartService.getCart).toHaveBeenCalledWith('user-123');
        expect(mockOrdersService.previewCheckout).toHaveBeenCalledWith('user-123', {
          addressId: 'addr-001',
          shippingMethod: undefined,
          items: [{ variantId: 'var-1', quantity: 2 }],
        });
        expect(previewText).toContain('123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội');
        expect(previewText).toContain('1 sản phẩm');
        expect(previewText).toContain(MoneyUtil.format(100000));
        expect(previewText).toContain('mã giảm giá COUPON2026 sẽ được áp dụng khi đặt đơn');
      });
    });
  });
});
