import { NotFoundException } from '@nestjs/common';
import {
  createReportsTools,
  ReportsToolDeps,
  projectCustomer,
  projectCustomerDetails,
  projectDashboardStats,
  projectList,
  DATE_REGEX,
  GROUP_BY_OPTIONS,
} from './reports.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import type { AdminService } from '../../../admin/admin.service';
import type { ReportsService } from '../../../admin/reports.service';
import type { CustomersService } from '../../../admin/customers.service';

describe('Reports Tools - Coverage Companion Spec', () => {
  let mockAdminService: {
    getDashboardStats: jest.Mock;
  };

  let mockReportsService: {
    getSalesReport: jest.Mock;
    getTopProducts: jest.Mock;
  };

  let mockCustomersService: {
    getCustomers: jest.Mock;
    getCustomerById: jest.Mock;
  };

  let tools: AgentToolDef[];
  let getDashboardStatsTool: AgentToolDef;
  let getSalesReportTool: AgentToolDef;
  let getTopProductsTool: AgentToolDef;
  let listCustomersTool: AgentToolDef;
  let getCustomerTool: AgentToolDef;

  const adminCtx: ToolContext = {
    userId: 'admin-1',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'thread-admin-1',
  };

  beforeEach(() => {
    mockAdminService = {
      getDashboardStats: jest.fn(),
    };

    mockReportsService = {
      getSalesReport: jest.fn(),
      getTopProducts: jest.fn(),
    };

    mockCustomersService = {
      getCustomers: jest.fn(),
      getCustomerById: jest.fn(),
    };

    const deps: ReportsToolDeps = {
      admin: mockAdminService as unknown as AdminService,
      reports: mockReportsService as unknown as ReportsService,
      customers: mockCustomersService as unknown as CustomersService,
    };

    tools = createReportsTools(deps);
    getDashboardStatsTool = tools.find(
      (t) => t.name === 'get_dashboard_stats',
    )!;
    getSalesReportTool = tools.find((t) => t.name === 'get_sales_report')!;
    getTopProductsTool = tools.find((t) => t.name === 'get_top_products')!;
    listCustomersTool = tools.find((t) => t.name === 'list_customers')!;
    getCustomerTool = tools.find((t) => t.name === 'get_customer')!;
  });

  describe('Constants and Types', () => {
    it('verifies DATE_REGEX matches valid YYYY-MM-DD dates and rejects invalid formats', () => {
      expect(DATE_REGEX.test('2026-01-01')).toBe(true);
      expect(DATE_REGEX.test('2025-12-31')).toBe(true);
      expect(DATE_REGEX.test('2026-1-1')).toBe(false);
      expect(DATE_REGEX.test('2026/01/01')).toBe(false);
      expect(DATE_REGEX.test('01-01-2026')).toBe(false);
      expect(DATE_REGEX.test('invalid')).toBe(false);
    });

    it('verifies GROUP_BY_OPTIONS contains day, week, month', () => {
      expect(GROUP_BY_OPTIONS).toEqual(['day', 'week', 'month']);
    });
  });

  describe('projectCustomer', () => {
    it('returns falsy or non-object input unchanged', () => {
      expect(projectCustomer(null)).toBeNull();
      expect(projectCustomer(undefined)).toBeUndefined();
      expect(projectCustomer('')).toBe('');
      expect(projectCustomer('string')).toBe('string');
      expect(projectCustomer(12345)).toBe(12345);
      expect(projectCustomer(true)).toBe(true);
    });

    it('filters out keys with lowercase or uppercase password or token', () => {
      const input = {
        id: 'cust-1',
        PASSWORD: 'secretPassword',
        UserToken: 'token123',
        authToken: 'bearer',
        reset_password_key: 'pwd',
        name: 'Nguyen Van A',
        active: true,
      };

      const result = projectCustomer(input) as Record<string, unknown>;

      expect(result).toEqual({
        id: 'cust-1',
        name: 'Nguyen Van A',
        active: true,
      });
      expect(result).not.toHaveProperty('PASSWORD');
      expect(result).not.toHaveProperty('UserToken');
      expect(result).not.toHaveProperty('authToken');
      expect(result).not.toHaveProperty('reset_password_key');
    });
  });

  describe('projectCustomerDetails', () => {
    it('returns falsy or non-object input unchanged', () => {
      expect(projectCustomerDetails(null)).toBeNull();
      expect(projectCustomerDetails(undefined)).toBeUndefined();
      expect(projectCustomerDetails('non-object')).toBe('non-object');
      expect(projectCustomerDetails(999)).toBe(999);
      expect(projectCustomerDetails(false)).toBe(false);
    });

    it('handles customer details when addresses is not an array (null, undefined, string)', () => {
      const inputWithoutArrayAddresses = {
        id: 'cust-2',
        name: 'Tran B',
        addresses: null,
      };

      const result = projectCustomerDetails(
        inputWithoutArrayAddresses,
      ) as Record<string, unknown>;

      expect(result.id).toBe('cust-2');
      expect(result.name).toBe('Tran B');
      expect(result.addresses).toBeNull();
    });

    it('keeps addresses as-is when length is <= 20', () => {
      const inputWithFewAddresses = {
        id: 'cust-3',
        name: 'Le C',
        addresses: [{ id: 'addr-1' }, { id: 'addr-2' }],
      };

      const result = projectCustomerDetails(
        inputWithFewAddresses,
      ) as typeof inputWithFewAddresses;

      expect(result.addresses).toHaveLength(2);
      expect(result.addresses[0].id).toBe('addr-1');
    });
  });

  describe('projectDashboardStats', () => {
    it('returns falsy or non-object input unchanged', () => {
      expect(projectDashboardStats(null)).toBeNull();
      expect(projectDashboardStats(undefined)).toBeUndefined();
      expect(projectDashboardStats('text')).toBe('text');
      expect(projectDashboardStats(42)).toBe(42);
    });

    it('handles missing or non-array recentOrders, topProducts, and revenueHistory', () => {
      const input = {
        totalRevenue: 5000000,
        recentOrders: null,
        topProducts: undefined,
        revenueHistory: 'not-an-array',
      };

      const result = projectDashboardStats(input) as typeof input;

      expect(result.totalRevenue).toBe(5000000);
      expect(result.recentOrders).toBeNull();
      expect(result.topProducts).toBeUndefined();
      expect(result.revenueHistory).toBe('not-an-array');
    });
  });

  describe('projectList', () => {
    it('returns falsy or non-object input unchanged', () => {
      expect(projectList(null)).toBeNull();
      expect(projectList(undefined)).toBeUndefined();
      expect(projectList(100)).toBe(100);
      expect(projectList('raw-string')).toBe('raw-string');
    });

    it('slices array directly without projector when itemProjector is omitted', () => {
      const items = [1, 2, 3, 4, 5];
      const result = projectList(items, undefined, 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('slices array with custom itemProjector and custom maxItems', () => {
      const items = ['a', 'b', 'c', 'd'];
      const projector = (item: string) => item.toUpperCase();
      const result = projectList(items, projector, 2);
      expect(result).toEqual(['A', 'B']);
    });

    it('handles result with data array without itemProjector', () => {
      const input = {
        data: [10, 20, 30, 40],
        total: 4,
      };

      const result = projectList(input, undefined, 2) as typeof input;

      expect(result.data).toEqual([10, 20]);
      expect(result.total).toBe(4);
    });

    it('handles result with data array with itemProjector', () => {
      const input = {
        data: [{ val: 1 }, { val: 2 }, { val: 3 }],
        page: 1,
      };
      const projector = (item: { val: number }) => ({ val: item.val * 10 });

      const result = projectList(input, projector, 2) as typeof input;

      expect(result.data).toEqual([{ val: 10 }, { val: 20 }]);
      expect(result.page).toBe(1);
    });

    it('handles periods array when length > maxItems WITH itemProjector', () => {
      const input = {
        periods: [
          { p: 1, rev: 100 },
          { p: 2, rev: 200 },
          { p: 3, rev: 300 },
        ],
        extra: 'info',
      };
      const projector = (p: { p: number; rev: number }) => ({
        ...p,
        rev: p.rev * 2,
      });

      const result = projectList(input, projector, 2) as any;

      expect(result.periods).toEqual([
        { p: 1, rev: 200 },
        { p: 2, rev: 400 },
      ]);
      expect(result.periodsTotal).toBe(3);
      expect(result.periodsShown).toBe(2);
      expect(result.truncated).toBe(true);
      expect(result.extra).toBe('info');
    });

    it('handles periods array when length <= maxItems WITH itemProjector', () => {
      const input = {
        periods: [
          { p: 1, rev: 100 },
          { p: 2, rev: 200 },
        ],
      };
      const projector = (p: { p: number; rev: number }) => ({
        ...p,
        projected: true,
      });

      const result = projectList(input, projector, 5) as any;

      expect(result.periods).toEqual([
        { p: 1, rev: 100, projected: true },
        { p: 2, rev: 200, projected: true },
      ]);
      expect(result.periodsTotal).toBeUndefined();
      expect(result.truncated).toBeUndefined();
    });

    it('returns non-array, non-data, non-periods object unchanged', () => {
      const genericObject = { foo: 'bar', count: 123 };
      const result = projectList(genericObject);
      expect(result).toBe(genericObject);
    });
  });

  describe('summarize fallbacks across all tools', () => {
    it('get_sales_report returns fallback when args is empty, undefined, or missing one date', () => {
      expect(getSalesReportTool.summarize({})).toBe('Xem báo cáo doanh thu');
      expect(getSalesReportTool.summarize(undefined as any)).toBe(
        'Xem báo cáo doanh thu',
      );
      expect(getSalesReportTool.summarize({ from: '2026-01-01' })).toBe(
        'Xem báo cáo doanh thu',
      );
      expect(getSalesReportTool.summarize({ to: '2026-01-31' })).toBe(
        'Xem báo cáo doanh thu',
      );
    });

    it('get_top_products returns fallback when args is empty, undefined, or missing one date', () => {
      expect(getTopProductsTool.summarize({})).toBe(
        'Xem top sản phẩm bán chạy',
      );
      expect(getTopProductsTool.summarize(undefined as any)).toBe(
        'Xem top sản phẩm bán chạy',
      );
      expect(getTopProductsTool.summarize({ from: '2026-01-01' })).toBe(
        'Xem top sản phẩm bán chạy',
      );
      expect(getTopProductsTool.summarize({ to: '2026-01-31' })).toBe(
        'Xem top sản phẩm bán chạy',
      );
    });

    it('list_customers returns fallback when args is undefined', () => {
      expect(listCustomersTool.summarize(undefined as any)).toBe(
        'Xem danh sách khách hàng',
      );
    });

    it('get_customer returns fallback when id is empty or args is undefined', () => {
      expect(getCustomerTool.summarize({})).toBe('Xem chi tiết khách hàng');
      expect(getCustomerTool.summarize(undefined as any)).toBe(
        'Xem chi tiết khách hàng',
      );
      expect(getCustomerTool.summarize({ id: '' })).toBe(
        'Xem chi tiết khách hàng',
      );
    });
  });

  describe('tool project functions with falsy/non-object input', () => {
    it('getDashboardStatsTool.project passes through null and undefined', () => {
      expect(getDashboardStatsTool.project!(null)).toBeNull();
      expect(getDashboardStatsTool.project!(undefined)).toBeUndefined();
    });

    it('getSalesReportTool.project passes through null and undefined', () => {
      expect(getSalesReportTool.project!(null)).toBeNull();
      expect(getSalesReportTool.project!(undefined)).toBeUndefined();
    });

    it('getTopProductsTool.project passes through null and undefined', () => {
      expect(getTopProductsTool.project!(null)).toBeNull();
      expect(getTopProductsTool.project!(undefined)).toBeUndefined();
    });

    it('listCustomersTool.project passes through null and undefined', () => {
      expect(listCustomersTool.project!(null)).toBeNull();
      expect(listCustomersTool.project!(undefined)).toBeUndefined();
    });

    it('getCustomerTool.project passes through null and undefined', () => {
      expect(getCustomerTool.project!(null)).toBeNull();
      expect(getCustomerTool.project!(undefined)).toBeUndefined();
    });
  });

  describe('dependency failure paths across all tools', () => {
    it('get_dashboard_stats rethrows when deps.admin.getDashboardStats fails', async () => {
      const error = new Error(
        'Database connection failed in getDashboardStats',
      );
      mockAdminService.getDashboardStats.mockRejectedValue(error);

      await expect(getDashboardStatsTool.handler({}, adminCtx)).rejects.toThrow(
        error,
      );
      await expect(getDashboardStatsTool.handler({}, adminCtx)).rejects.toThrow(
        'Database connection failed in getDashboardStats',
      );
      expect(mockAdminService.getDashboardStats).toHaveBeenCalled();
    });

    it('get_sales_report rethrows when deps.reports.getSalesReport fails', async () => {
      const error = new Error('Sales report query timed out');
      mockReportsService.getSalesReport.mockRejectedValue(error);

      await expect(
        getSalesReportTool.handler(
          { from: '2026-01-01', to: '2026-01-31' },
          adminCtx,
        ),
      ).rejects.toThrow(error);
      await expect(
        getSalesReportTool.handler(
          { from: '2026-01-01', to: '2026-01-31' },
          adminCtx,
        ),
      ).rejects.toThrow('Sales report query timed out');
      expect(mockReportsService.getSalesReport).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-01-31',
        groupBy: undefined,
      });
    });

    it('get_top_products rethrows when deps.reports.getTopProducts fails', async () => {
      const error = new Error('Failed to calculate top products');
      mockReportsService.getTopProducts.mockRejectedValue(error);

      await expect(
        getTopProductsTool.handler(
          { from: '2026-01-01', to: '2026-01-31', limit: 10 },
          adminCtx,
        ),
      ).rejects.toThrow(error);
      await expect(
        getTopProductsTool.handler(
          { from: '2026-01-01', to: '2026-01-31', limit: 10 },
          adminCtx,
        ),
      ).rejects.toThrow('Failed to calculate top products');
      expect(mockReportsService.getTopProducts).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 10,
      });
    });

    it('list_customers rethrows when deps.customers.getCustomers fails', async () => {
      const error = new Error('Customer service query error');
      mockCustomersService.getCustomers.mockRejectedValue(error);

      await expect(
        listCustomersTool.handler({ search: 'test' }, adminCtx),
      ).rejects.toThrow(error);
      await expect(
        listCustomersTool.handler({ search: 'test' }, adminCtx),
      ).rejects.toThrow('Customer service query error');
      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith({
        search: 'test',
        page: undefined,
        limit: undefined,
      });
    });

    it('get_customer rethrows when deps.customers.getCustomerById fails with NotFoundException', async () => {
      const notFoundError = new NotFoundException(
        'Customer cust-999 not found',
      );
      mockCustomersService.getCustomerById.mockRejectedValue(notFoundError);

      await expect(
        getCustomerTool.handler({ id: 'cust-999' }, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        getCustomerTool.handler({ id: 'cust-999' }, adminCtx),
      ).rejects.toThrow('Customer cust-999 not found');
      expect(mockCustomersService.getCustomerById).toHaveBeenCalledWith(
        'cust-999',
      );
    });
  });
});
