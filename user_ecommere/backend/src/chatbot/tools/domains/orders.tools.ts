import { z } from 'zod';
import { AgentToolDef, ToolContext } from '../tool.types';
import type { OrdersService } from '../../../orders/orders.service';

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
};

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
        throw new Error('Cần đăng nhập để dùng chức năng này');
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
        throw new Error('Cần đăng nhập để dùng chức năng này');
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
        throw new Error('Cần đăng nhập để dùng chức năng này');
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
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }

      const rawCart = ctx.clientContext?.cart;
      const cartItems = Array.isArray(rawCart)
        ? rawCart
        : rawCart && typeof rawCart === 'object' && Array.isArray((rawCart as any).items)
          ? (rawCart as any).items
          : null;

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Giỏ hàng đang trống');
      }

      const items = cartItems.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const shippingMethod = args.shippingMethod ?? 'STANDARD';
      const paymentMethod = args.paymentMethod ?? 'COD';

      const checkoutDto: any = {
        ...(args.addressId ? { addressId: args.addressId } : {}),
        items,
        paymentMethod,
        shippingMethod,
      };

      return deps.orders.checkout(ctx.userId, checkoutDto);
    },
    summarize: (args: any) => {
      const method = args?.shippingMethod === 'EXPRESS' ? 'nhanh' : 'tiêu chuẩn';
      return `Đặt đơn từ giỏ hàng hiện tại, giao hàng ${method}`;
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
