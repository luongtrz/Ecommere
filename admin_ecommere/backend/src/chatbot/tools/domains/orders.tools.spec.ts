import {
  createAdminOrdersTools,
  AdminOrdersToolDeps,
  ORDER_STATUSES,
} from './orders.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import type { OrdersService } from '../../../orders/orders.service';

describe('Admin Orders Tools', () => {
  let mockOrdersService: {
    getAllOrders: jest.Mock;
    getOrderById: jest.Mock;
    updateOrderStatus: jest.Mock;
  };
  let tools: AgentToolDef[];
  let listTool: AgentToolDef;
  let getTool: AgentToolDef;
  let updateStatusTool: AgentToolDef;

  const adminCtx: ToolContext = {
    userId: 'admin-123',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'thread-admin-1',
  };

  beforeEach(() => {
    mockOrdersService = {
      getAllOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
    };

    const deps: AdminOrdersToolDeps = {
      orders: mockOrdersService as unknown as OrdersService,
    };

    tools = createAdminOrdersTools(deps);
    listTool = tools.find((t) => t.name === 'list_orders')!;
    getTool = tools.find((t) => t.name === 'get_order')!;
    updateStatusTool = tools.find((t) => t.name === 'update_order_status')!;
  });

  describe('Factory and General Requirements', () => {
    it('returns exactly 3 tools with unique names', () => {
      expect(tools).toHaveLength(3);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(3);
      expect(names).toEqual(['list_orders', 'get_order', 'update_order_status']);
    });

    it('sets auth to "admin" on all tools', () => {
      for (const tool of tools) {
        expect(tool.auth).toBe('admin');
      }
    });

    it('sets domain to "orders" on all tools', () => {
      for (const tool of tools) {
        expect(tool.domain).toBe('orders');
      }
    });

    it('assigns correct risk levels: update_order_status is SENSITIVE, list_orders and get_order are READ', () => {
      expect(listTool.risk).toBe('READ');
      expect(getTool.risk).toBe('READ');
      expect(updateStatusTool.risk).toBe('SENSITIVE');
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

        const checkUserId = tool.schema.safeParse({ userId: 'admin-123' });
        expect(checkUserId.success).toBe(false);

        const checkRole = tool.schema.safeParse({ role: 'ADMIN' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('ensures each tool has a summarize function returning a short Vietnamese string', () => {
      for (const tool of tools) {
        const summary = tool.summarize({
          orderId: 'ord-123',
          status: 'PAID',
          search: 'query',
        });
        expect(typeof summary).toBe('string');
        expect(summary.trim().length).toBeGreaterThan(0);
      }
    });

    it('does not pass userId to service calls across all handlers', async () => {
      mockOrdersService.getAllOrders.mockResolvedValue({ data: [], total: 0 });
      mockOrdersService.getOrderById.mockResolvedValue({ id: 'ord-1' });
      mockOrdersService.updateOrderStatus.mockResolvedValue({ id: 'ord-1', status: 'PAID' });

      await listTool.handler({}, adminCtx);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith({
        status: undefined,
        search: undefined,
        page: undefined,
        limit: undefined,
      });

      await getTool.handler({ orderId: 'ord-1' }, adminCtx);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('ord-1');

      await updateStatusTool.handler({ orderId: 'ord-1', status: 'PAID' }, adminCtx);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith('ord-1', {
        status: 'PAID',
      });
    });
  });

  describe('list_orders', () => {
    it('has risk READ and expected description', () => {
      expect(listTool.risk).toBe('READ');
      expect(listTool.description).toBe(
        'Danh sách đơn hàng toàn cửa hàng, có lọc theo trạng thái và tìm theo mã, email hoặc tên khách.',
      );
    });

    it('calls getAllOrders with expected filter arguments', async () => {
      mockOrdersService.getAllOrders.mockResolvedValue({
        data: [],
        total: 0,
      });

      const args = {
        status: 'PAID' as const,
        search: 'ORD-2026',
        page: 2,
        limit: 15,
      };
      await listTool.handler(args, adminCtx);

      expect(mockOrdersService.getAllOrders).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith({
        status: 'PAID',
        search: 'ORD-2026',
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

    it('validates search string constraints (1..100)', () => {
      expect(listTool.schema.safeParse({ search: '' }).success).toBe(false);
      expect(listTool.schema.safeParse({ search: 'a'.repeat(101) }).success).toBe(false);
      expect(listTool.schema.safeParse({ search: 'ORD-123' }).success).toBe(true);
      expect(listTool.schema.safeParse({ search: 'a'.repeat(100) }).success).toBe(true);
    });

    it('validates page and limit range (1..50)', () => {
      expect(listTool.schema.safeParse({ page: 0 }).success).toBe(false);
      expect(listTool.schema.safeParse({ page: 51 }).success).toBe(false);
      expect(listTool.schema.safeParse({ limit: 0 }).success).toBe(false);
      expect(listTool.schema.safeParse({ limit: 51 }).success).toBe(false);
      expect(listTool.schema.safeParse({ page: 1, limit: 50 }).success).toBe(true);
    });

    it('accepts empty filter options', () => {
      const res = listTool.schema.safeParse({});
      expect(res.success).toBe(true);
    });

    it('rejects extra unknown properties (strict)', () => {
      const res = listTool.schema.safeParse({ extraKey: 'forbidden' });
      expect(res.success).toBe(false);
    });

    it('summarize returns a Vietnamese string', () => {
      expect(listTool.summarize({})).toBe('Xem danh sách đơn hàng toàn cửa hàng');
      expect(listTool.summarize({ status: 'PAID' })).toBe('Xem danh sách đơn hàng (PAID)');
      expect(listTool.summarize({ search: 'khách hàng A' })).toBe(
        'Tìm kiếm đơn hàng "khách hàng A"',
      );
    });

    describe('project()', () => {
      it('keeps at most 20 items from an array and drops any password or token field present in the mock', () => {
        const now = new Date();
        const rawOrders = Array.from({ length: 25 }, (_, i) => ({
          id: `ord-${i + 1}`,
          code: `ORD-${i + 1}`,
          status: 'PAID',
          paymentStatus: 'COMPLETED',
          total: 100000,
          createdAt: now,
          userId: `user-${i + 1}`,
          subtotal: 90000,
          shippingFee: 10000,
          addressJson: '{"line1":"123 St"}',
          password: 'order-password-leak',
          token: 'order-token-leak',
          secretKey: 'top-secret',
          user: {
            id: `user-${i + 1}`,
            name: `Khách Hàng ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            password: 'hashed-user-password',
            token: 'user-refresh-token',
          },
          customer: {
            name: `Khách Hàng ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            password: 'customer-password-leak',
            token: 'customer-token-leak',
          },
          items: [{ id: 'item-1', variantId: 'v-1' }],
        }));

        const projected = listTool.project!(rawOrders) as Array<Record<string, unknown>>;
        expect(Array.isArray(projected)).toBe(true);
        expect(projected).toHaveLength(20);

        expect(projected[0]).toEqual({
          id: 'ord-1',
          code: 'ORD-1',
          status: 'PAID',
          paymentStatus: 'COMPLETED',
          total: 100000,
          createdAt: now,
          customer: {
            name: 'Khách Hàng 1',
            email: 'customer1@example.com',
          },
        });

        for (const item of projected) {
          expect(item).not.toHaveProperty('password');
          expect(item).not.toHaveProperty('token');
          expect(item).not.toHaveProperty('secretKey');
          expect(item).not.toHaveProperty('userId');
          expect(item).not.toHaveProperty('user');
          expect(item).not.toHaveProperty('subtotal');
          expect(item).not.toHaveProperty('shippingFee');
          expect(item).not.toHaveProperty('addressJson');
          expect(item).not.toHaveProperty('items');

          const cust = item.customer as Record<string, unknown>;
          expect(cust).not.toHaveProperty('password');
          expect(cust).not.toHaveProperty('token');
          expect(cust).toHaveProperty('name');
          expect(cust).toHaveProperty('email');
        }
      });

      it('keeps at most 20 items in a paginated object and drops password/token', () => {
        const now = new Date();
        const rawData = {
          data: Array.from({ length: 25 }, (_, i) => ({
            id: `ord-${i + 1}`,
            code: `ORD-${i + 1}`,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING',
            total: 50000,
            createdAt: now,
            password: 'item-pw',
            token: 'item-tok',
            user: {
              name: `Khách ${i + 1}`,
              email: `k${i + 1}@shop.vn`,
              password: 'user-pw',
              token: 'user-tok',
            },
          })),
          total: 25,
          page: 1,
          limit: 20,
          password: 'root-leak',
          token: 'root-token-leak',
        };

        const projected = listTool.project!(rawData) as Record<string, unknown>;
        expect(projected).not.toHaveProperty('password');
        expect(projected).not.toHaveProperty('token');
        expect(projected.total).toBe(25);

        const data = projected.data as Array<Record<string, unknown>>;
        expect(data).toHaveLength(20);
        expect(data[0].id).toBe('ord-1');
        expect(data[0].customer).toEqual({
          name: 'Khách 1',
          email: 'k1@shop.vn',
        });
        expect(data[0]).not.toHaveProperty('password');
        expect(data[0]).not.toHaveProperty('token');
      });

      it('returns non-object or falsy inputs untouched', () => {
        expect(listTool.project!(null)).toBeNull();
        expect(listTool.project!(undefined)).toBeUndefined();
        expect(listTool.project!('string')).toBe('string');
      });
    });
  });

  describe('get_order', () => {
    it('has risk READ and calls getOrderById with exact arguments', async () => {
      expect(getTool.risk).toBe('READ');
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'order-123',
        code: 'ORD-123',
      });

      const result = await getTool.handler(
        { orderId: 'order-123' },
        adminCtx,
      );

      expect(mockOrdersService.getOrderById).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(result).toEqual({ id: 'order-123', code: 'ORD-123' });
    });

    it('validates orderId string constraints (1..64)', () => {
      expect(getTool.schema.safeParse({ orderId: '' }).success).toBe(false);
      expect(getTool.schema.safeParse({ orderId: 'a'.repeat(65) }).success).toBe(false);
      expect(getTool.schema.safeParse({ orderId: 'valid-id-123' }).success).toBe(true);
      expect(getTool.schema.safeParse({}).success).toBe(false);
    });

    it('rejects an extra key (strict)', () => {
      const res = getTool.schema.safeParse({
        orderId: 'valid-id',
        extraKey: 'not-allowed',
      });
      expect(res.success).toBe(false);
    });

    it('summarize returns a Vietnamese line referencing orderId', () => {
      const summary = getTool.summarize({ orderId: 'order-123' });
      expect(summary).toBe('Xem chi tiết đơn hàng order-123');
    });
  });

  describe('update_order_status', () => {
    it('has risk SENSITIVE and exact description', () => {
      expect(updateStatusTool.risk).toBe('SENSITIVE');
      expect(updateStatusTool.description).toBe(
        'Đổi trạng thái đơn hàng theo đúng luồng: đang chờ thanh toán, đã thanh toán, đang đóng gói, đã giao vận chuyển, đã giao, hoàn tiền. Hủy và hoàn tiền tự hoàn tồn kho. Trạng thái đã hủy hoặc đã hoàn tiền không đổi được.',
      );
    });

    it('calls updateOrderStatus with { status } and exact arguments (no userId)', async () => {
      mockOrdersService.updateOrderStatus.mockResolvedValue({
        id: 'order-999',
        status: 'PAID',
      });

      const result = await updateStatusTool.handler(
        { orderId: 'order-999', status: 'PAID' },
        adminCtx,
      );

      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-999',
        { status: 'PAID' },
      );
      expect(result).toEqual({ id: 'order-999', status: 'PAID' });
    });

    it('rejects a missing status', () => {
      const res = updateStatusTool.schema.safeParse({ orderId: 'ord-123' });
      expect(res.success).toBe(false);
    });

    it('rejects a missing orderId', () => {
      const res = updateStatusTool.schema.safeParse({ status: 'PAID' });
      expect(res.success).toBe(false);
    });

    it('rejects an extra key (strict)', () => {
      const res = updateStatusTool.schema.safeParse({
        orderId: 'ord-123',
        status: 'PAID',
        extraKey: 'disallowed',
      });
      expect(res.success).toBe(false);
    });

    it('rejects an invalid status value', () => {
      const res = updateStatusTool.schema.safeParse({
        orderId: 'ord-123',
        status: 'UNKNOWN_STATUS',
      });
      expect(res.success).toBe(false);
    });

    it('accepts all seven valid OrderStatus values', () => {
      for (const status of ORDER_STATUSES) {
        const res = updateStatusTool.schema.safeParse({
          orderId: 'ord-123',
          status,
        });
        expect(res.success).toBe(true);
      }
    });

    it('summarize returns "Đổi trạng thái đơn <orderId> sang <status>"', () => {
      expect(
        updateStatusTool.summarize({ orderId: 'ord-123', status: 'PAID' }),
      ).toBe('Đổi trạng thái đơn ord-123 sang PAID');
      expect(
        updateStatusTool.summarize({ orderId: 'ord-456', status: 'CANCELED' }),
      ).toBe('Đổi trạng thái đơn ord-456 sang CANCELED');
    });

    it('propagates service transition errors without duplicating the transition table in tool code', async () => {
      mockOrdersService.updateOrderStatus.mockRejectedValue(
        new Error('Invalid status transition from CANCELED to PAID'),
      );

      await expect(
        updateStatusTool.handler(
          { orderId: 'ord-999', status: 'PAID' },
          adminCtx,
        ),
      ).rejects.toThrow('Invalid status transition from CANCELED to PAID');
    });
  });
});
