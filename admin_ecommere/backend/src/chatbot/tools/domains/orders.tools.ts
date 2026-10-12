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

export type AdminOrdersToolDeps = {
  orders: OrdersService;
};

function projectOrderItem(item: any): any {
  if (!item || typeof item !== 'object') {
    return item;
  }

  const customerName =
    item.customer?.name ?? item.user?.name ?? item.customerName;
  const customerEmail =
    item.customer?.email ?? item.user?.email ?? item.customerEmail;

  return {
    id: item.id,
    code: item.code,
    status: item.status,
    paymentStatus: item.paymentStatus,
    total: item.total,
    createdAt: item.createdAt,
    customer: {
      name: customerName,
      email: customerEmail,
    },
  };
}

function projectOrdersList(result: any): any {
  if (!result || typeof result !== 'object') {
    return result;
  }

  if (Array.isArray(result)) {
    return result.slice(0, 20).map(projectOrderItem);
  }

  if (Array.isArray(result.data)) {
    const { password, token, ...rest } = result;
    return {
      ...rest,
      data: result.data.slice(0, 20).map(projectOrderItem),
    };
  }

  return result;
}

export function createAdminOrdersTools(deps: AdminOrdersToolDeps): AgentToolDef[] {
  const listOrdersTool: AgentToolDef = {
    name: 'list_orders',
    domain: 'orders',
    description:
      'Danh sách đơn hàng toàn cửa hàng, có lọc theo trạng thái và tìm theo mã, email hoặc tên khách.',
    schema: z
      .object({
        status: z.enum(ORDER_STATUSES).optional(),
        search: z.string().min(1).max(100).optional(),
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (args) => {
      return deps.orders.getAllOrders({
        status: args.status,
        search: args.search,
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) => {
      if (args?.status) {
        return `Xem danh sách đơn hàng (${args.status})`;
      }
      if (args?.search) {
        return `Tìm kiếm đơn hàng "${args.search}"`;
      }
      return 'Xem danh sách đơn hàng toàn cửa hàng';
    },
    project: projectOrdersList,
  };

  const getOrderTool: AgentToolDef = {
    name: 'get_order',
    domain: 'orders',
    description: 'Xem chi tiết đơn hàng theo mã đơn hàng.',
    schema: z
      .object({
        orderId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (args) => {
      return deps.orders.getOrderById(args.orderId);
    },
    summarize: (args) => `Xem chi tiết đơn hàng ${args.orderId}`,
  };

  const updateOrderStatusTool: AgentToolDef = {
    name: 'update_order_status',
    domain: 'orders',
    description:
      'Đổi trạng thái đơn hàng theo đúng luồng: đang chờ thanh toán, đã thanh toán, đang đóng gói, đã giao vận chuyển, đã giao, hoàn tiền. Hủy và hoàn tiền tự hoàn tồn kho. Trạng thái đã hủy hoặc đã hoàn tiền không đổi được.',
    schema: z
      .object({
        orderId: z.string().min(1).max(64),
        status: z.enum(ORDER_STATUSES),
      })
      .strict(),
    auth: 'admin',
    risk: 'SENSITIVE',
    handler: async (args) => {
      return deps.orders.updateOrderStatus(args.orderId, {
        status: args.status,
      });
    },
    summarize: (args) => `Đổi trạng thái đơn ${args.orderId} sang ${args.status}`,
  };

  return [listOrdersTool, getOrderTool, updateOrderStatusTool];
}
