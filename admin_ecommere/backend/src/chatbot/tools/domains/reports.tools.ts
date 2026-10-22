import { z } from 'zod';
import { AgentToolDef, ToolContext } from '../tool.types';
import type { AdminService } from '../../../admin/admin.service';
import type { ReportsService } from '../../../admin/reports.service';
import type { CustomersService } from '../../../admin/customers.service';

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const GROUP_BY_OPTIONS = ['day', 'week', 'month'] as const;

export type ReportsToolDeps = {
  admin: AdminService;
  reports: ReportsService;
  customers: CustomersService;
};

export function projectCustomer(
  customer: any,
): Record<string, unknown> | unknown {
  if (!customer || typeof customer !== 'object') {
    return customer;
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(customer)) {
    const lower = key.toLowerCase();
    if (lower.includes('password') || lower.includes('token')) {
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export function projectCustomerDetails(result: any): unknown {
  if (!result || typeof result !== 'object') {
    return result;
  }
  const clean = projectCustomer(result) as Record<string, unknown>;
  if (Array.isArray(clean.addresses)) {
    clean.addresses = clean.addresses.slice(0, 20);
  }
  return clean;
}

export function projectDashboardStats(result: any): unknown {
  if (!result || typeof result !== 'object') {
    return result;
  }
  return {
    ...result,
    recentOrders: Array.isArray(result.recentOrders)
      ? result.recentOrders.slice(0, 20)
      : result.recentOrders,
    topProducts: Array.isArray(result.topProducts)
      ? result.topProducts.slice(0, 20)
      : result.topProducts,
    revenueHistory: Array.isArray(result.revenueHistory)
      ? result.revenueHistory.slice(0, 20)
      : result.revenueHistory,
  };
}

export function projectList<T>(
  result: T,
  itemProjector?: (item: any) => any,
  maxItems = 20,
): unknown {
  if (!result || typeof result !== 'object') {
    return result;
  }
  if (Array.isArray(result)) {
    const sliced = result.slice(0, maxItems);
    return itemProjector ? sliced.map(itemProjector) : sliced;
  }
  if (Array.isArray((result as any).data)) {
    const sliced = (result as any).data.slice(0, maxItems);
    return {
      ...result,
      data: itemProjector ? sliced.map(itemProjector) : sliced,
    };
  }
  if (Array.isArray((result as any).periods)) {
    const rawPeriods = (result as any).periods;
    if (rawPeriods.length > maxItems) {
      const sliced = rawPeriods.slice(0, maxItems);
      return {
        ...result,
        periods: itemProjector ? sliced.map(itemProjector) : sliced,
        periodsTotal: rawPeriods.length,
        periodsShown: sliced.length,
        truncated: true,
      };
    }
    const sliced = rawPeriods.slice(0, maxItems);
    return {
      ...result,
      periods: itemProjector ? sliced.map(itemProjector) : sliced,
    };
  }
  return result;
}

export function createReportsTools(deps: ReportsToolDeps): AgentToolDef[] {
  // 1. get_dashboard_stats
  const getDashboardStatsTool: AgentToolDef = {
    name: 'get_dashboard_stats',
    domain: 'reports',
    description:
      'Số liệu tổng quan của cửa hàng: doanh thu và đơn hàng của tháng này và tháng trước, 6 tháng gần nhất, top sản phẩm. Không nhận khoảng thời gian tùy chọn; dùng get_sales_report cho khoảng thời gian khác.',
    schema: z.object({}).strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (_args: Record<string, never>, _ctx: ToolContext) => {
      return deps.admin.getDashboardStats();
    },
    summarize: () => 'Xem số liệu thống kê tổng quan của cửa hàng',
    project: (result: unknown) => projectDashboardStats(result),
  };

  // 2. get_sales_report
  const getSalesReportSchema = z
    .object({
      from: z.string().regex(DATE_REGEX, 'Định dạng ngày phải là YYYY-MM-DD'),
      to: z.string().regex(DATE_REGEX, 'Định dạng ngày phải là YYYY-MM-DD'),
      groupBy: z.enum(GROUP_BY_OPTIONS).optional(),
    })
    .strict();

  const getSalesReportTool: AgentToolDef = {
    name: 'get_sales_report',
    domain: 'reports',
    description:
      'Doanh thu và số đơn theo ngày, tuần hoặc tháng trong khoảng thời gian (tối đa 366 ngày). Múi giờ Việt Nam.',
    schema: getSalesReportSchema,
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: {
        from: string;
        to: string;
        groupBy?: 'day' | 'week' | 'month';
      },
      _ctx: ToolContext,
    ) => {
      return deps.reports.getSalesReport({
        from: args.from,
        to: args.to,
        groupBy: args.groupBy,
      });
    },
    summarize: (args) =>
      args?.from && args?.to
        ? `Xem báo cáo doanh thu từ ${args.from} đến ${args.to}`
        : 'Xem báo cáo doanh thu',
    project: (result: unknown) => projectList(result, undefined, 20),
  };

  // 3. get_top_products
  const getTopProductsSchema = z
    .object({
      from: z.string().regex(DATE_REGEX, 'Định dạng ngày phải là YYYY-MM-DD'),
      to: z.string().regex(DATE_REGEX, 'Định dạng ngày phải là YYYY-MM-DD'),
      limit: z.number().int().min(1).max(50).optional(),
    })
    .strict();

  const getTopProductsTool: AgentToolDef = {
    name: 'get_top_products',
    domain: 'reports',
    description:
      'Sản phẩm bán chạy nhất trong khoảng thời gian, tính trên đơn đã giao.',
    schema: getTopProductsSchema,
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: {
        from: string;
        to: string;
        limit?: number;
      },
      _ctx: ToolContext,
    ) => {
      return deps.reports.getTopProducts({
        from: args.from,
        to: args.to,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.from && args?.to
        ? `Xem sản phẩm bán chạy từ ${args.from} đến ${args.to}`
        : 'Xem top sản phẩm bán chạy',
    project: (result: unknown) => projectList(result, undefined, 20),
  };

  // 4. list_customers
  const listCustomersSchema = z
    .object({
      search: z.string().min(1).max(100).optional(),
      page: z.number().int().min(1).max(50).optional(),
      limit: z.number().int().min(1).max(50).optional(),
    })
    .strict();

  const listCustomersTool: AgentToolDef = {
    name: 'list_customers',
    domain: 'reports',
    description:
      'Danh sách khách hàng, tìm theo tên, số điện thoại hoặc email. Chỉ đọc.',
    schema: listCustomersSchema,
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: {
        search?: string;
        page?: number;
        limit?: number;
      },
      _ctx: ToolContext,
    ) => {
      return deps.customers.getCustomers({
        search: args.search,
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.search
        ? `Tìm kiếm khách hàng theo từ khóa "${args.search}"`
        : args?.page
          ? `Xem danh sách khách hàng (trang ${args.page})`
          : 'Xem danh sách khách hàng',
    project: (result: unknown) => projectList(result, projectCustomer, 20),
  };

  // 5. get_customer
  const getCustomerSchema = z
    .object({
      id: z.string().min(1).max(64),
    })
    .strict();

  const getCustomerTool: AgentToolDef = {
    name: 'get_customer',
    domain: 'reports',
    description:
      'Xem thông tin chi tiết khách hàng và địa chỉ theo ID. Chỉ đọc.',
    schema: getCustomerSchema,
    auth: 'admin',
    risk: 'READ',
    handler: async (
      args: {
        id: string;
      },
      _ctx: ToolContext,
    ) => {
      return deps.customers.getCustomerById(args.id);
    },
    summarize: (args) =>
      args?.id
        ? `Xem chi tiết khách hàng ${args.id}`
        : 'Xem chi tiết khách hàng',
    project: (result: unknown) => projectCustomerDetails(result),
  };

  return [
    getDashboardStatsTool,
    getSalesReportTool,
    getTopProductsTool,
    listCustomersTool,
    getCustomerTool,
  ];
}
