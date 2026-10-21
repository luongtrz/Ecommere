import {
  createAdminOrdersTools,
  AdminOrdersToolDeps,
  ORDER_STATUSES,
} from './orders.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import type { OrdersService } from '../../../orders/orders.service';
import { MoneyUtil } from '../../../common/utils/money.util';

describe('Admin Orders Tools - Coverage Companion', () => {
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
    userId: 'admin-coverage-user',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'thread-cov-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ORDER_STATUSES constant', () => {
    it('contains all 7 supported order status strings', () => {
      expect(ORDER_STATUSES).toEqual([
        'PENDING_PAYMENT',
        'PAID',
        'PACKING',
        'SHIPPED',
        'DELIVERED',
        'CANCELED',
        'REFUNDED',
      ]);
    });
  });

  describe('projectOrdersList & projectOrderItem branches', () => {
    it('passes through non-object and falsy items inside an order array untouched', () => {
      const input = [
        null,
        undefined,
        123,
        'raw string',
        false,
        {
          id: 'ord-valid',
          code: 'ORD-VALID',
          status: 'PAID',
          paymentStatus: 'COMPLETED',
          total: 100000,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          customerName: 'Top Level',
          customerEmail: 'top@test.com',
        },
      ];

      const projected = listTool.project!(input) as any[];
      expect(projected[0]).toBeNull();
      expect(projected[1]).toBeUndefined();
      expect(projected[2]).toBe(123);
      expect(projected[3]).toBe('raw string');
      expect(projected[4]).toBe(false);
      expect(projected[5]).toEqual({
        id: 'ord-valid',
        code: 'ORD-VALID',
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        total: 100000,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        customer: {
          name: 'Top Level',
          email: 'top@test.com',
        },
      });
    });

    it('passes through non-object and falsy items inside result.data array', () => {
      const input = {
        data: [null, undefined, 456, 'plain string', true],
        total: 5,
        password: 'leak-pw',
        token: 'leak-tok',
      };

      const projected = listTool.project!(input) as any;
      expect(projected.total).toBe(5);
      expect(projected).not.toHaveProperty('password');
      expect(projected).not.toHaveProperty('token');
      expect(projected.data).toEqual([
        null,
        undefined,
        456,
        'plain string',
        true,
      ]);
    });

    it('falls back to customerName and customerEmail when neither customer nor user is present', () => {
      const rawOrders = [
        {
          id: 'ord-fallback-1',
          code: 'ORD-FB1',
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          total: 200000,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          customerName: 'Nguyen Van Direct',
          customerEmail: 'direct@test.com',
        },
      ];

      const projected = listTool.project!(rawOrders) as any[];
      expect(projected).toHaveLength(1);
      expect(projected[0].customer).toEqual({
        name: 'Nguyen Van Direct',
        email: 'direct@test.com',
      });
    });

    it('falls back to user.name and user.email when customer is omitted but user is present', () => {
      const rawOrders = [
        {
          id: 'ord-fallback-2',
          code: 'ORD-FB2',
          status: 'PAID',
          paymentStatus: 'COMPLETED',
          total: 350000,
          createdAt: new Date('2026-02-02T00:00:00.000Z'),
          user: {
            name: 'Tran Van User',
            email: 'user-field@test.com',
          },
          customerName: 'Direct Should Be Ignored',
          customerEmail: 'direct-ignored@test.com',
        },
      ];

      const projected = listTool.project!(rawOrders) as any[];
      expect(projected[0].customer).toEqual({
        name: 'Tran Van User',
        email: 'user-field@test.com',
      });
    });

    it('prefers customer over user and top-level fields', () => {
      const rawOrders = [
        {
          id: 'ord-fallback-3',
          code: 'ORD-FB3',
          status: 'SHIPPED',
          paymentStatus: 'COMPLETED',
          total: 500000,
          createdAt: new Date('2026-02-03T00:00:00.000Z'),
          customer: {
            name: 'Primary Customer',
            email: 'primary@test.com',
          },
          user: {
            name: 'Secondary User',
            email: 'secondary@test.com',
          },
          customerName: 'Tertiary Top',
          customerEmail: 'tertiary@test.com',
        },
      ];

      const projected = listTool.project!(rawOrders) as any[];
      expect(projected[0].customer).toEqual({
        name: 'Primary Customer',
        email: 'primary@test.com',
      });
    });

    it('returns undefined for customer name and email when no customer sources are present', () => {
      const rawOrders = [
        {
          id: 'ord-empty-cust',
          code: 'ORD-EMPTY',
          status: 'PACKING',
          paymentStatus: 'COMPLETED',
          total: 150000,
          createdAt: new Date('2026-02-04T00:00:00.000Z'),
        },
      ];

      const projected = listTool.project!(rawOrders) as any[];
      expect(projected[0].customer).toEqual({
        name: undefined,
        email: undefined,
      });
    });

    it('supports mixed fallback sources (e.g. name from customer, email from user or customerEmail)', () => {
      const rawOrders = [
        {
          id: 'ord-mixed-1',
          code: 'ORD-MIX1',
          status: 'DELIVERED',
          paymentStatus: 'COMPLETED',
          total: 400000,
          createdAt: new Date('2026-02-05T00:00:00.000Z'),
          customer: {
            name: 'Customer Name Only',
          },
          user: {
            email: 'user-email@test.com',
          },
        },
        {
          id: 'ord-mixed-2',
          code: 'ORD-MIX2',
          status: 'DELIVERED',
          paymentStatus: 'COMPLETED',
          total: 450000,
          createdAt: new Date('2026-02-05T00:00:00.000Z'),
          customer: {
            email: 'cust-email@test.com',
          },
          customerName: 'Top Level Fallback Name',
        },
      ];

      const projected = listTool.project!(rawOrders) as any[];
      expect(projected[0].customer).toEqual({
        name: 'Customer Name Only',
        email: 'user-email@test.com',
      });
      expect(projected[1].customer).toEqual({
        name: 'Top Level Fallback Name',
        email: 'cust-email@test.com',
      });
    });

    it('returns object untouched when input is an object but neither an array nor has an array in data', () => {
      const plainObj = { count: 0, status: 'empty' };
      expect(listTool.project!(plainObj)).toEqual(plainObj);

      const objWithNonArrayData = { data: 'not-array', meta: { total: 10 } };
      expect(listTool.project!(objWithNonArrayData)).toEqual(
        objWithNonArrayData,
      );

      const objWithNullData = { data: null };
      expect(listTool.project!(objWithNullData)).toEqual(objWithNullData);

      const objWithNumberData = { data: 999 };
      expect(listTool.project!(objWithNumberData)).toEqual(objWithNumberData);
    });
  });

  describe('list_orders edge cases', () => {
    it('summarize handles undefined and null args safely', () => {
      expect(listTool.summarize(undefined as any)).toBe(
        'Xem danh sách đơn hàng toàn cửa hàng',
      );
      expect(listTool.summarize(null as any)).toBe(
        'Xem danh sách đơn hàng toàn cửa hàng',
      );
    });

    it('summarize prioritizes status when both status and search are present', () => {
      expect(
        listTool.summarize({ status: 'SHIPPED', search: 'Nguyen' } as any),
      ).toBe('Xem danh sách đơn hàng (SHIPPED)');
    });

    it('propagates error when ordersService.getAllOrders rejects', async () => {
      const error = new Error('Database connection failed');
      mockOrdersService.getAllOrders.mockRejectedValue(error);

      await expect(listTool.handler({}, adminCtx)).rejects.toThrow(Error);
      await expect(listTool.handler({}, adminCtx)).rejects.toThrow(
        'Database connection failed',
      );
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledTimes(2);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith({
        status: undefined,
        search: undefined,
        page: undefined,
        limit: undefined,
      });
    });
  });

  describe('get_order edge cases', () => {
    it('summarize formats with arbitrary orderId strings', () => {
      expect(getTool.summarize({ orderId: 'ORD-XYZ-999' })).toBe(
        'Xem chi tiết đơn hàng ORD-XYZ-999',
      );
    });

    it('propagates error when ordersService.getOrderById rejects', async () => {
      const notFoundError = new Error('Order ord-not-found not found');
      mockOrdersService.getOrderById.mockRejectedValue(notFoundError);

      await expect(
        getTool.handler({ orderId: 'ord-not-found' }, adminCtx),
      ).rejects.toThrow(Error);
      await expect(
        getTool.handler({ orderId: 'ord-not-found' }, adminCtx),
      ).rejects.toThrow('Order ord-not-found not found');
      expect(mockOrdersService.getOrderById).toHaveBeenCalledTimes(2);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(
        'ord-not-found',
      );
    });
  });

  describe('update_order_status preview & error handling', () => {
    it('preview returns undefined when getOrderById returns null', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(null);

      const refundPreview = await updateStatusTool.preview!(
        { orderId: 'ord-missing', status: 'REFUNDED' },
        adminCtx,
      );
      expect(refundPreview).toBeUndefined();

      const cancelPreview = await updateStatusTool.preview!(
        { orderId: 'ord-missing', status: 'CANCELED' },
        adminCtx,
      );
      expect(cancelPreview).toBeUndefined();

      expect(mockOrdersService.getOrderById).toHaveBeenCalledTimes(2);
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(
        'ord-missing',
      );
    });

    it('preview returns undefined when getOrderById returns undefined', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(undefined);

      const preview = await updateStatusTool.preview!(
        { orderId: 'ord-undef', status: 'REFUNDED' },
        adminCtx,
      );
      expect(preview).toBeUndefined();
      expect(mockOrdersService.getOrderById).toHaveBeenCalledWith('ord-undef');
    });

    it('preview returns undefined when order.total is not a number', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'ord-no-total',
        total: undefined,
      });
      expect(
        await updateStatusTool.preview!(
          { orderId: 'ord-no-total', status: 'REFUNDED' },
          adminCtx,
        ),
      ).toBeUndefined();

      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'ord-null-total',
        total: null,
      });
      expect(
        await updateStatusTool.preview!(
          { orderId: 'ord-null-total', status: 'CANCELED' },
          adminCtx,
        ),
      ).toBeUndefined();

      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'ord-string-total',
        total: '100000' as any,
      });
      expect(
        await updateStatusTool.preview!(
          { orderId: 'ord-string-total', status: 'REFUNDED' },
          adminCtx,
        ),
      ).toBeUndefined();

      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'ord-obj-total',
        total: {} as any,
      });
      expect(
        await updateStatusTool.preview!(
          { orderId: 'ord-obj-total', status: 'CANCELED' },
          adminCtx,
        ),
      ).toBeUndefined();
    });

    it('preview returns formatted string when total is 0', async () => {
      mockOrdersService.getOrderById.mockResolvedValue({
        id: 'ord-zero',
        total: 0,
      });

      const refundRes = await updateStatusTool.preview!(
        { orderId: 'ord-zero', status: 'REFUNDED' },
        adminCtx,
      );
      expect(refundRes).toBeDefined();
      expect(refundRes).toContain('ord-zero');
      expect(refundRes).toContain('REFUNDED');
      expect(refundRes).toContain(MoneyUtil.format(0));
      expect(refundRes).toContain('Số tiền hoàn lại:');

      const cancelRes = await updateStatusTool.preview!(
        { orderId: 'ord-zero', status: 'CANCELED' },
        adminCtx,
      );
      expect(cancelRes).toBeDefined();
      expect(cancelRes).toContain('ord-zero');
      expect(cancelRes).toContain('CANCELED');
      expect(cancelRes).toContain(MoneyUtil.format(0));
      expect(cancelRes).toContain('Số tiền giải phóng:');
    });

    it('preview returns undefined when getOrderById throws a non-Error or unexpected rejection', async () => {
      mockOrdersService.getOrderById.mockRejectedValue('fatal rejection');

      const res = await updateStatusTool.preview!(
        { orderId: 'ord-fail', status: 'REFUNDED' },
        adminCtx,
      );
      expect(res).toBeUndefined();
    });

    it('handler propagates any unexpected error thrown by ordersService.updateOrderStatus', async () => {
      const dbError = new Error('Failed to update database record');
      mockOrdersService.updateOrderStatus.mockRejectedValue(dbError);

      await expect(
        updateStatusTool.handler(
          { orderId: 'ord-fail', status: 'DELIVERED' },
          adminCtx,
        ),
      ).rejects.toThrow(Error);
      await expect(
        updateStatusTool.handler(
          { orderId: 'ord-fail', status: 'DELIVERED' },
          adminCtx,
        ),
      ).rejects.toThrow('Failed to update database record');

      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'ord-fail',
        { status: 'DELIVERED' },
      );
    });

    it('handler successfully updates order status and returns result', async () => {
      const updatedOrder = {
        id: 'ord-success',
        status: 'SHIPPED',
        total: 250000,
      };
      mockOrdersService.updateOrderStatus.mockResolvedValue(updatedOrder);

      const result = await updateStatusTool.handler(
        { orderId: 'ord-success', status: 'SHIPPED' },
        adminCtx,
      );

      expect(result).toEqual(updatedOrder);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'ord-success',
        { status: 'SHIPPED' },
      );
    });
  });
});
