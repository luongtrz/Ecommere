import { createHash } from 'crypto';
import { z } from 'zod';
import { AgentToolDef, ToolContext } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { OrdersService } from '../../../orders/orders.service';
import type { CartService } from '../../../cart/cart.service';
import { MoneyUtil } from '../../../common/utils/money.util';

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
  'REFUNDED',
] as const;

export const SHIPPING_METHODS = ['STANDARD', 'EXPRESS'] as const;

export type OrdersToolDeps = {
  orders: OrdersService;
  cart: CartService;
};

export function deriveCheckoutKey(params: {
  threadId: string;
  addressId?: string | null;
  items: Array<{ variantId: string; quantity: number }>;
  paymentMethod?: string | null;
  shippingMethod?: string | null;
  cartId?: string | null;
  couponCode?: string | null;
}): string {
  const normalizedItems = (params.items ?? [])
    .map((item) => ({
      variantId: String(item.variantId),
      quantity: Number(item.quantity),
    }))
    .sort((a, b) =>
      a.variantId.localeCompare(b.variantId) || a.quantity - b.quantity,
    );

  const payload = JSON.stringify({
    threadId: params.threadId ?? '',
    addressId: params.addressId ?? null,
    items: normalizedItems,
    paymentMethod: params.paymentMethod ?? 'COD',
    shippingMethod: params.shippingMethod ?? 'STANDARD',
    cartId: params.cartId ?? null,
    couponCode: params.couponCode ?? null,
  });

  return createHash('sha256').update(payload).digest('hex');
}

export function createOrdersTools(deps: OrdersToolDeps): AgentToolDef[] {
  const listMyOrdersTool: AgentToolDef = {
    name: 'list_my_orders',
    domain: 'orders',
    description:
      'Danh sách đơn hàng của khách, mới nhất trước. Dùng công cụ này để tìm mã đơn trước khi xem chi tiết.',
    schema: z
      .object({
        status: z.enum(ORDER_STATUSES).optional(),
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new ToolError('Cần đăng nhập để dùng chức năng này');
      }
      return deps.orders.getMyOrders(ctx.userId, {
        status: args.status,
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) => {
      if (args?.status) {
        return `Xem danh sách đơn hàng (${args.status})`;
      }
      return 'Xem danh sách đơn hàng';
    },
  };

  const getMyOrderTool: AgentToolDef = {
    name: 'get_my_order',
    domain: 'orders',
    description: 'Xem chi tiết đơn hàng của khách theo mã đơn hàng.',
    schema: z
      .object({
        orderId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new ToolError('Cần đăng nhập để dùng chức năng này');
      }
      return deps.orders.getMyOrderById(ctx.userId, args.orderId);
    },
    summarize: (args) => `Xem đơn hàng ${args.orderId}`,
  };

  const cancelMyOrderTool: AgentToolDef = {
    name: 'cancel_my_order',
    domain: 'orders',
    description:
      'Hủy đơn hàng. Chỉ hủy được đơn đang chờ thanh toán hoặc đã thanh toán. Không hoàn tác được.',
    schema: z
      .object({
        orderId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'customer',
    risk: 'SENSITIVE',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new ToolError('Cần đăng nhập để dùng chức năng này');
      }
      return deps.orders.cancelOrder(ctx.userId, args.orderId);
    },
    summarize: (args) => `Hủy đơn hàng ${args.orderId}`,
  };

  const checkoutTool: AgentToolDef = {
    name: 'checkout',
    domain: 'orders',
    description:
      'Đặt đơn từ giỏ hàng hiện tại của khách. Giá và phí ship do máy chủ tính lại. Thanh toán thực hiện trên trang đơn hàng.',
    schema: z
      .object({
        addressId: z.string().min(1).max(64).optional(),
        shippingMethod: z
          .enum(SHIPPING_METHODS)
          .optional()
          .default('STANDARD'),
        paymentMethod: z.string().min(1).max(40).optional().default('COD'),
      })
      .strict(),
    auth: 'customer',
    risk: 'SENSITIVE',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new ToolError('Cần đăng nhập để dùng chức năng này');
      }

      const cart = await deps.cart.getCart(ctx.userId);

      let cartItems: any[] | null = null;
      let cartId: string | null = null;
      let couponCode: string | null = null;

      const hasServerCartItems =
        cart && Array.isArray(cart.items) && cart.items.length > 0;

      if (hasServerCartItems) {
        cartItems = cart.items;
        cartId = cart.id ?? null;
        couponCode = cart.coupon?.code ?? null;
      } else {
        const rawCart = ctx.clientContext?.cart;
        cartItems = Array.isArray(rawCart)
          ? rawCart
          : rawCart && typeof rawCart === 'object' && Array.isArray((rawCart as any).items)
            ? (rawCart as any).items
            : null;
      }

      if (!cartItems || cartItems.length === 0) {
        throw new ToolError('Giỏ hàng đang trống');
      }

      const items = cartItems.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const shippingMethod = args.shippingMethod ?? 'STANDARD';
      const paymentMethod = args.paymentMethod ?? 'COD';

      const checkoutKey = deriveCheckoutKey({
        threadId: ctx.threadId,
        addressId: args.addressId,
        items,
        paymentMethod,
        shippingMethod,
        cartId,
        couponCode,
      });

      const checkoutDto: any = {
        ...(args.addressId ? { addressId: args.addressId } : {}),
        items,
        paymentMethod,
        shippingMethod,
        ...(cartId ? { cartId } : {}),
        ...(couponCode ? { couponCode } : {}),
        checkoutKey,
      };

      return deps.orders.checkout(ctx.userId, checkoutDto);
    },
    summarize: (args: any) => {
      const method = args?.shippingMethod === 'EXPRESS' ? 'nhanh' : 'tiêu chuẩn';
      return `Đặt đơn từ giỏ hàng hiện tại, giao hàng ${method}`;
    },
    preview: async (args: any, ctx: ToolContext) => {
      if (!ctx.userId || !args?.addressId) {
        return undefined;
      }

      const cart = await deps.cart.getCart(ctx.userId);

      let cartItems: any[] | null = null;
      let couponCodeFromCart: string | null = null;

      const hasServerCartItems =
        cart && Array.isArray(cart.items) && cart.items.length > 0;

      if (hasServerCartItems) {
        cartItems = cart.items;
        couponCodeFromCart = cart.coupon?.code ?? null;
      } else {
        const rawCart = ctx.clientContext?.cart;
        cartItems = Array.isArray(rawCart)
          ? rawCart
          : rawCart && typeof rawCart === 'object' && Array.isArray((rawCart as any).items)
            ? (rawCart as any).items
            : null;
      }

      if (!cartItems || cartItems.length === 0) {
        return undefined;
      }

      const items = cartItems.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const previewData = await deps.orders.previewCheckout(ctx.userId, {
        addressId: args.addressId,
        shippingMethod: args.shippingMethod,
        items,
      });

      if (!previewData || !previewData.address) {
        return undefined;
      }

      const addressText =
        previewData.deliveryAddress ||
        [
          previewData.address.line1,
          previewData.address.ward,
          previewData.address.district,
          previewData.address.province,
        ]
          .filter((p: any) => typeof p === 'string' && p.trim().length > 0)
          .join(', ');

      const parts: string[] = [];

      // 1. Full delivery address of args.addressId
      parts.push(addressText);

      // 2. Number of products
      parts.push(`${previewData.itemCount} sản phẩm`);

      // 3. Estimated subtotal from server prices, or notice if some items cannot be priced
      if (previewData.everyItemPriced) {
        parts.push(`tiền hàng ${MoneyUtil.format(previewData.subtotal)}`);
      } else {
        parts.push('một số sản phẩm không thể tính giá');
      }

      // 4. Shipping fee
      parts.push(`phí vận chuyển ${MoneyUtil.format(previewData.shippingFee)}`);

      // Optional note if args has a coupon code
      const couponCode = args?.couponCode || (args as any)?.coupon || couponCodeFromCart;
      if (couponCode && typeof couponCode === 'string' && couponCode.trim().length > 0) {
        parts.push(`mã giảm giá ${couponCode.trim()} sẽ được áp dụng khi đặt đơn`);
      }

      // 5. Note
      parts.push('tạm tính, giá chốt khi đặt đơn');

      return parts.join(' · ');
    },
    project: (result: any) => {
      if (!result || typeof result !== 'object') {
        return result;
      }
      const itemCount = Array.isArray(result.items)
        ? result.items.length
        : typeof result.itemCount === 'number'
          ? result.itemCount
          : 0;

      return {
        id: result.id,
        code: result.code,
        status: result.status,
        paymentStatus: result.paymentStatus,
        total: result.total,
        createdAt: result.createdAt,
        itemCount,
      };
    },
  };

  return [listMyOrdersTool, getMyOrderTool, cancelMyOrderTool, checkoutTool];
}
