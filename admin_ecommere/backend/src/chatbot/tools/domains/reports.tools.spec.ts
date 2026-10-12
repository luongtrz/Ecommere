import {
  createReportsTools,
  ReportsToolDeps,
  DATE_REGEX,
  GROUP_BY_OPTIONS,
  projectCustomer,
  projectList,
} from './reports.tools';
import { ToolContext, AgentToolDef } from '../tool.types';
import type { AdminService } from '../../../admin/admin.service';
import type { ReportsService } from '../../../admin/reports.service';
import type { CustomersService } from '../../../admin/customers.service';

describe('Reports Tools', () => {
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
    getDashboardStatsTool = tools.find((t) => t.name === 'get_dashboard_stats')!;
    getSalesReportTool = tools.find((t) => t.name === 'get_sales_report')!;
    getTopProductsTool = tools.find((t) => t.name === 'get_top_products')!;
    listCustomersTool = tools.find((t) => t.name === 'list_customers')!;
    getCustomerTool = tools.find((t) => t.name === 'get_customer')!;
  });

  describe('Factory and General Requirements', () => {
    it('returns exactly 5 tools with unique names', () => {
      expect(tools).toHaveLength(5);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(5);
      expect(names).toEqual([
        'get_dashboard_stats',
        'get_sales_report',
        'get_top_products',
        'list_customers',
        'get_customer',
      ]);
    });

    it('sets auth to "admin" on all tools', () => {
      for (const tool of tools) {
        expect(tool.auth).toBe('admin');
      }
    });

    it('sets domain to "reports" on all tools', () => {
      for (const tool of tools) {
        expect(tool.domain).toBe('reports');
      }
    });

    it('assigns risk level "READ" to all tools', () => {
      for (const tool of tools) {
        expect(tool.risk).toBe('READ');
      }
    });

    it('enforces strict schema on all tools (rejects unknown properties)', () => {
      for (const tool of tools) {
        const result = tool.schema.safeParse({ unexpectedProperty: 'value' });
        expect(result.success).toBe(false);
      }
    });

    it('does not include userId or role in any schema', () => {
      for (const tool of tools) {
        expect(tool.schema.shape).not.toHaveProperty('userId');
        expect(tool.schema.shape).not.toHaveProperty('role');

        const checkUserId = tool.schema.safeParse({ userId: 'admin-1' });
        expect(checkUserId.success).toBe(false);

        const checkRole = tool.schema.safeParse({ role: 'ADMIN' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('ensures each tool has a summarize function returning a short Vietnamese string', () => {
      for (const tool of tools) {
        const summary = tool.summarize({
          from: '2026-01-01',
          to: '2026-01-31',
          groupBy: 'day',
          limit: 10,
          search: 'Nguyen',
          page: 1,
          id: 'cust-123',
        });
        expect(typeof summary).toBe('string');
        expect(summary.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('get_dashboard_stats', () => {
    it('has risk READ, auth admin, and calls admin.getDashboardStats() with no arguments', async () => {
      expect(getDashboardStatsTool.risk).toBe('READ');
      expect(getDashboardStatsTool.auth).toBe('admin');

      const mockStats = {
        revenue: { totalRevenue: 100000000, monthlyRevenue: 25000000, monthlyChange: 15.5 },
        orders: { totalOrders: 500, monthlyOrders: 120, monthlyChange: 8.2, pendingOrders: 10, shippingOrders: 20 },
        products: { totalProducts: 80, activeProducts: 75, newProductsThisMonth: 5, lowStockProducts: 3 },
        customers: { totalCustomers: 300, newCustomersThisMonth: 30, monthlyChange: 10.0 },
        recentOrders: [],
        topProducts: [],
        revenueHistory: [],
      };
      mockAdminService.getDashboardStats.mockResolvedValue(mockStats);

      const result = await getDashboardStatsTool.handler({}, adminCtx);

      expect(mockAdminService.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(mockAdminService.getDashboardStats).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
    });

    it('has the expected exact description', () => {
      expect(getDashboardStatsTool.description).toBe(
        'Số liệu tổng quan của cửa hàng: doanh thu và đơn hàng của tháng này và tháng trước, 6 tháng gần nhất, top sản phẩm. Không nhận khoảng thời gian tùy chọn; dùng get_sales_report cho khoảng thời gian khác.',
      );
    });

    it('summarize returns a Vietnamese string', () => {
      expect(getDashboardStatsTool.summarize({})).toBe(
        'Xem số liệu thống kê tổng quan của cửa hàng',
      );
    });

    it('project() trims recentOrders, topProducts, and revenueHistory to at most 20 items', () => {
      const mockStats = {
        revenue: { totalRevenue: 1000 },
        recentOrders: Array.from({ length: 25 }, (_, i) => ({ id: `ord-${i + 1}` })),
        topProducts: Array.from({ length: 25 }, (_, i) => ({ id: `prod-${i + 1}` })),
        revenueHistory: Array.from({ length: 25 }, (_, i) => ({ month: `M-${i + 1}` })),
      };

      const projected = getDashboardStatsTool.project!(mockStats) as typeof mockStats;
      expect(projected.recentOrders).toHaveLength(20);
      expect(projected.topProducts).toHaveLength(20);
      expect(projected.revenueHistory).toHaveLength(20);
      expect(projected.recentOrders[0].id).toBe('ord-1');
      expect(projected.recentOrders[19].id).toBe('ord-20');
    });
  });

  describe('get_sales_report', () => {
    it('has risk READ, auth admin, and calls reports.getSalesReport with expected arguments', async () => {
      expect(getSalesReportTool.risk).toBe('READ');
      expect(getSalesReportTool.auth).toBe('admin');

      const mockReport = {
        from: '2026-01-01',
        to: '2026-01-31',
        groupBy: 'day',
        timezone: 'Asia/Ho_Chi_Minh',
        periods: [{ period: '2026-01-01', orders: 5, revenue: 1200000 }],
        totals: { orders: 5, revenue: 1200000 },
      };
      mockReportsService.getSalesReport.mockResolvedValue(mockReport);

      const result = await getSalesReportTool.handler(
        { from: '2026-01-01', to: '2026-01-31', groupBy: 'day' },
        adminCtx,
      );

      expect(mockReportsService.getSalesReport).toHaveBeenCalledTimes(1);
      expect(mockReportsService.getSalesReport).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-01-31',
        groupBy: 'day',
      });
      expect(result).toEqual(mockReport);
    });

    it('calls reports.getSalesReport with groupBy undefined when omitted', async () => {
      mockReportsService.getSalesReport.mockResolvedValue({ totals: { orders: 0, revenue: 0 } });

      await getSalesReportTool.handler(
        { from: '2026-02-01', to: '2026-02-28' },
        adminCtx,
      );

      expect(mockReportsService.getSalesReport).toHaveBeenCalledTimes(1);
      expect(mockReportsService.getSalesReport).toHaveBeenCalledWith({
        from: '2026-02-01',
        to: '2026-02-28',
        groupBy: undefined,
      });
    });

    it('has the expected exact description', () => {
      expect(getSalesReportTool.description).toBe(
        'Doanh thu và số đơn theo ngày, tuần hoặc tháng trong khoảng thời gian (tối đa 366 ngày). Múi giờ Việt Nam.',
      );
    });

    it('rejects a groupBy of "year"', () => {
      const res = getSalesReportTool.schema.safeParse({
        from: '2026-01-01',
        to: '2026-12-31',
        groupBy: 'year',
      });
      expect(res.success).toBe(false);
    });

    it('rejects a from that is not YYYY-MM-DD', () => {
      const invalidFromList = [
        '2026/01/01',
        '01-01-2026',
        '2026-1-1',
        '2026-01-1',
        '2026-1-01',
        'invalid-date',
        '',
      ];
      for (const from of invalidFromList) {
        const res = getSalesReportTool.schema.safeParse({
          from,
          to: '2026-01-31',
        });
        expect(res.success).toBe(false);
      }
    });

    it('rejects a to that is not YYYY-MM-DD', () => {
      const invalidToList = [
        '2026/01/31',
        '31-01-2026',
        '2026-1-31',
        'invalid',
        '',
      ];
      for (const to of invalidToList) {
        const res = getSalesReportTool.schema.safeParse({
          from: '2026-01-01',
          to,
        });
        expect(res.success).toBe(false);
      }
    });

    it('accepts valid groupBy enum values: day, week, month', () => {
      for (const groupBy of ['day', 'week', 'month']) {
        const res = getSalesReportTool.schema.safeParse({
          from: '2026-01-01',
          to: '2026-01-31',
          groupBy,
        });
        expect(res.success).toBe(true);
      }
    });

    it('summarize returns a Vietnamese string containing dates', () => {
      const summary = getSalesReportTool.summarize({
        from: '2026-01-01',
        to: '2026-01-31',
      });
      expect(summary).toContain('2026-01-01');
      expect(summary).toContain('2026-01-31');
    });

    it('project() trims periods list to at most 20 items', () => {
      const report = {
        from: '2026-01-01',
        to: '2026-01-31',
        periods: Array.from({ length: 31 }, (_, i) => ({
          period: `2026-01-${String(i + 1).padStart(2, '0')}`,
          orders: i,
          revenue: i * 1000,
        })),
        totals: { orders: 465, revenue: 465000 },
      };

      const projected = getSalesReportTool.project!(report) as typeof report;
      expect(projected.periods).toHaveLength(20);
      expect(projected.periods[0].period).toBe('2026-01-01');
      expect(projected.periods[19].period).toBe('2026-01-20');
      expect(projected.totals.orders).toBe(465);
    });
  });

  describe('get_top_products', () => {
    it('has risk READ, auth admin, and calls reports.getTopProducts with expected arguments', async () => {
      expect(getTopProductsTool.risk).toBe('READ');
      expect(getTopProductsTool.auth).toBe('admin');

      const mockProducts = [
        { productId: 'prod-1', name: 'Nước hoa 1', soldQuantity: 50, revenue: 15000000 },
        { productId: 'prod-2', name: 'Nước hoa 2', soldQuantity: 30, revenue: 9000000 },
      ];
      mockReportsService.getTopProducts.mockResolvedValue(mockProducts);

      const result = await getTopProductsTool.handler(
        { from: '2026-01-01', to: '2026-01-31', limit: 10 },
        adminCtx,
      );

      expect(mockReportsService.getTopProducts).toHaveBeenCalledTimes(1);
      expect(mockReportsService.getTopProducts).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 10,
      });
      expect(result).toEqual(mockProducts);
    });

    it('calls reports.getTopProducts with limit undefined when omitted', async () => {
      mockReportsService.getTopProducts.mockResolvedValue([]);

      await getTopProductsTool.handler(
        { from: '2026-01-01', to: '2026-01-31' },
        adminCtx,
      );

      expect(mockReportsService.getTopProducts).toHaveBeenCalledTimes(1);
      expect(mockReportsService.getTopProducts).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-01-31',
        limit: undefined,
      });
    });

    it('has the expected exact description', () => {
      expect(getTopProductsTool.description).toBe(
        'Sản phẩm bán chạy nhất trong khoảng thời gian, tính trên đơn đã giao.',
      );
    });

    it('rejects a limit of 0 and 51', () => {
      const res0 = getTopProductsTool.schema.safeParse({
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 0,
      });
      expect(res0.success).toBe(false);

      const res51 = getTopProductsTool.schema.safeParse({
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 51,
      });
      expect(res51.success).toBe(false);
    });

    it('accepts valid limits (1, 50, and optional)', () => {
      expect(
        getTopProductsTool.schema.safeParse({
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 1,
        }).success,
      ).toBe(true);

      expect(
        getTopProductsTool.schema.safeParse({
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 50,
        }).success,
      ).toBe(true);

      expect(
        getTopProductsTool.schema.safeParse({
          from: '2026-01-01',
          to: '2026-01-31',
        }).success,
      ).toBe(true);
    });

    it('rejects non-integer limits', () => {
      expect(
        getTopProductsTool.schema.safeParse({
          from: '2026-01-01',
          to: '2026-01-31',
          limit: 5.5,
        }).success,
      ).toBe(false);
    });

    it('rejects invalid date format for from or to', () => {
      expect(
        getTopProductsTool.schema.safeParse({
          from: 'invalid',
          to: '2026-01-31',
        }).success,
      ).toBe(false);

      expect(
        getTopProductsTool.schema.safeParse({
          from: '2026-01-01',
          to: 'invalid',
        }).success,
      ).toBe(false);
    });

    it('summarize returns a Vietnamese string with dates', () => {
      const summary = getTopProductsTool.summarize({
        from: '2026-01-01',
        to: '2026-01-31',
        limit: 5,
      });
      expect(summary).toContain('2026-01-01');
      expect(summary).toContain('2026-01-31');
    });

    it('project() trims top products list to at most 20 items', () => {
      const twentyFiveProducts = Array.from({ length: 25 }, (_, i) => ({
        productId: `prod-${i + 1}`,
        name: `Product ${i + 1}`,
        soldQuantity: 100 - i,
        revenue: (100 - i) * 1000,
      }));

      const projected = getTopProductsTool.project!(
        twentyFiveProducts,
      ) as typeof twentyFiveProducts;
      expect(projected).toHaveLength(20);
      expect(projected[0].productId).toBe('prod-1');
      expect(projected[19].productId).toBe('prod-20');
    });
  });

  describe('list_customers', () => {
    it('has risk READ, auth admin, and calls customers.getCustomers with expected arguments', async () => {
      expect(listCustomersTool.risk).toBe('READ');
      expect(listCustomersTool.auth).toBe('admin');

      const mockResponse = {
        data: [{ id: 'cust-1', name: 'Nguyễn Văn A', email: 'a@example.com' }],
        total: 1,
        page: 2,
        limit: 15,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: true,
      };
      mockCustomersService.getCustomers.mockResolvedValue(mockResponse);

      const result = await listCustomersTool.handler(
        { search: 'nguyen', page: 2, limit: 15 },
        adminCtx,
      );

      expect(mockCustomersService.getCustomers).toHaveBeenCalledTimes(1);
      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith({
        search: 'nguyen',
        page: 2,
        limit: 15,
      });
      expect(result).toEqual(mockResponse);
    });

    it('calls customers.getCustomers with undefined optional arguments when omitted', async () => {
      mockCustomersService.getCustomers.mockResolvedValue({ data: [], total: 0 });

      await listCustomersTool.handler({}, adminCtx);

      expect(mockCustomersService.getCustomers).toHaveBeenCalledTimes(1);
      expect(mockCustomersService.getCustomers).toHaveBeenCalledWith({
        search: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('has the expected exact description', () => {
      expect(listCustomersTool.description).toBe(
        'Danh sách khách hàng, tìm theo tên, số điện thoại hoặc email. Chỉ đọc.',
      );
    });

    it('validates search, page, and limit bounds', () => {
      expect(
        listCustomersTool.schema.safeParse({ search: 'a'.repeat(101) }).success,
      ).toBe(false);
      expect(
        listCustomersTool.schema.safeParse({ page: 0 }).success,
      ).toBe(false);
      expect(
        listCustomersTool.schema.safeParse({ page: 51 }).success,
      ).toBe(false);
      expect(
        listCustomersTool.schema.safeParse({ limit: 0 }).success,
      ).toBe(false);
      expect(
        listCustomersTool.schema.safeParse({ limit: 51 }).success,
      ).toBe(false);

      expect(
        listCustomersTool.schema.safeParse({
          search: 'Alex',
          page: 1,
          limit: 50,
        }).success,
      ).toBe(true);
    });

    it('project() of list_customers keeps at most 20 items and never returns password or token fields (the input mock includes them)', () => {
      const mockResultWithSensitiveFields = {
        data: Array.from({ length: 25 }, (_, i) => ({
          id: `cust-${i + 1}`,
          name: `Khách hàng ${i + 1}`,
          phone: `090123456${i}`,
          email: `cust${i + 1}@example.com`,
          password: `secret_hash_${i + 1}`,
          passwordHash: `$2b$10$xyz_${i + 1}`,
          token: `bearer_token_${i + 1}`,
          refreshToken: `refresh_token_${i + 1}`,
          accessToken: `access_token_${i + 1}`,
          resetToken: `reset_token_${i + 1}`,
          orderCount: i + 1,
          totalSpent: (i + 1) * 500000,
          createdAt: new Date('2026-01-01'),
        })),
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      };

      const projected = listCustomersTool.project!(
        mockResultWithSensitiveFields,
      ) as typeof mockResultWithSensitiveFields;

      expect(projected.data).toHaveLength(20);
      expect(projected.total).toBe(25);
      expect(projected.page).toBe(1);

      for (const customer of projected.data) {
        expect(customer).not.toHaveProperty('password');
        expect(customer).not.toHaveProperty('passwordHash');
        expect(customer).not.toHaveProperty('token');
        expect(customer).not.toHaveProperty('refreshToken');
        expect(customer).not.toHaveProperty('accessToken');
        expect(customer).not.toHaveProperty('resetToken');

        expect(customer).toHaveProperty('id');
        expect(customer).toHaveProperty('name');
        expect(customer).toHaveProperty('phone');
        expect(customer).toHaveProperty('email');
        expect(customer).toHaveProperty('orderCount');
        expect(customer).toHaveProperty('totalSpent');
        expect(customer).toHaveProperty('createdAt');
      }
    });

    it('project() handles raw array mock input with 25 items and strips password and token fields', () => {
      const rawArray = Array.from({ length: 25 }, (_, i) => ({
        id: `cust-${i + 1}`,
        name: `Customer ${i + 1}`,
        password: 'password123',
        token: 'token123',
      }));

      const projected = listCustomersTool.project!(rawArray) as Array<
        Record<string, unknown>
      >;

      expect(projected).toHaveLength(20);
      for (const item of projected) {
        expect(item).not.toHaveProperty('password');
        expect(item).not.toHaveProperty('token');
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
      }
    });

    it('summarize returns a Vietnamese string with search or page', () => {
      expect(
        listCustomersTool.summarize({ search: 'Nguyen' }),
      ).toContain('Nguyen');
      expect(listCustomersTool.summarize({ page: 2 })).toContain('trang 2');
      expect(listCustomersTool.summarize({})).toBe('Xem danh sách khách hàng');
    });
  });

  describe('get_customer', () => {
    it('has risk READ, auth admin, and calls customers.getCustomerById with expected id', async () => {
      expect(getCustomerTool.risk).toBe('READ');
      expect(getCustomerTool.auth).toBe('admin');

      const mockCustomer = {
        id: 'cust-123',
        name: 'Nguyễn Văn B',
        phone: '0912345678',
        email: 'b@example.com',
        createdAt: new Date('2026-01-01'),
        orderCount: 3,
        totalSpent: 1500000,
        addresses: [
          {
            id: 'addr-1',
            fullName: 'Nguyễn Văn B',
            phone: '0912345678',
            province: 'Hà Nội',
            district: 'Cầu Giấy',
            ward: 'Dịch Vọng',
            line1: '123 Cầu Giấy',
            isDefault: true,
          },
        ],
      };
      mockCustomersService.getCustomerById.mockResolvedValue(mockCustomer);

      const result = await getCustomerTool.handler({ id: 'cust-123' }, adminCtx);

      expect(mockCustomersService.getCustomerById).toHaveBeenCalledTimes(1);
      expect(mockCustomersService.getCustomerById).toHaveBeenCalledWith('cust-123');
      expect(result).toEqual(mockCustomer);
    });

    it('validates id length constraints (1..64)', () => {
      expect(getCustomerTool.schema.safeParse({ id: '' }).success).toBe(false);
      expect(getCustomerTool.schema.safeParse({ id: 'a'.repeat(65) }).success).toBe(
        false,
      );
      expect(getCustomerTool.schema.safeParse({ id: 'cust-ok' }).success).toBe(
        true,
      );
    });

    it('project() strips password and token fields and trims addresses to at most 20', () => {
      const mockRawCustomer = {
        id: 'cust-123',
        name: 'Nguyễn Văn B',
        password: 'hash_secret',
        token: 'auth_token',
        addresses: Array.from({ length: 25 }, (_, i) => ({
          id: `addr-${i + 1}`,
          line1: `Address ${i + 1}`,
        })),
      };

      const projected = getCustomerTool.project!(mockRawCustomer) as typeof mockRawCustomer;

      expect(projected).not.toHaveProperty('password');
      expect(projected).not.toHaveProperty('token');
      expect(projected.id).toBe('cust-123');
      expect(projected.name).toBe('Nguyễn Văn B');
      expect(projected.addresses).toHaveLength(20);
    });

    it('summarize returns a Vietnamese string with id', () => {
      expect(getCustomerTool.summarize({ id: 'cust-123' })).toContain('cust-123');
    });
  });
});
