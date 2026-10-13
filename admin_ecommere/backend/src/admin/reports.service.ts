import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';
import { SalesReportQueryDto } from './dtos/sales-report-query.dto';
import { TopProductsQueryDto } from './dtos/top-products-query.dto';

interface SalesReportRawRow {
  period: string;
  orders: bigint | number;
  revenue: bigint | number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phân tích và kiểm tra tính hợp lệ của khoảng ngày
   */
  private parseAndValidateDateRange(from: string, to: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new BadRequestException('Định dạng ngày phải là YYYY-MM-DD');
    }

    const [fromY, fromM, fromD] = from.split('-').map(Number);
    const [toY, toM, toD] = to.split('-').map(Number);

    const fromDate = new Date(Date.UTC(fromY, fromM - 1, fromD));
    const toDate = new Date(Date.UTC(toY, toM - 1, toD));

    if (
      isNaN(fromDate.getTime()) ||
      fromDate.getUTCFullYear() !== fromY ||
      fromDate.getUTCMonth() !== fromM - 1 ||
      fromDate.getUTCDate() !== fromD
    ) {
      throw new BadRequestException('Ngày bắt đầu không hợp lệ');
    }

    if (
      isNaN(toDate.getTime()) ||
      toDate.getUTCFullYear() !== toY ||
      toDate.getUTCMonth() !== toM - 1 ||
      toDate.getUTCDate() !== toD
    ) {
      throw new BadRequestException('Ngày kết thúc không hợp lệ');
    }

    if (from > to) {
      throw new BadRequestException('Ngày bắt đầu không được lớn hơn ngày kết thúc');
    }

    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (diffDays > 366) {
      throw new BadRequestException('Khoảng thời gian không được vượt quá 366 ngày');
    }

    // Time zone Asia/Ho_Chi_Minh is UTC+7 with no DST.
    // Range is [from 00:00:00.000 in VN time, to 23:59:59.999 in VN time].
    // Shift by -7 hours to obtain UTC range for DB query.
    const startDateUtc = new Date(Date.UTC(fromY, fromM - 1, fromD, 0, 0, 0, 0) - 7 * 60 * 60 * 1000);
    const endDateUtc = new Date(Date.UTC(toY, toM - 1, toD, 23, 59, 59, 999) - 7 * 60 * 60 * 1000);

    return {
      fromY,
      fromM,
      fromD,
      toY,
      toM,
      toD,
      startDateUtc,
      endDateUtc,
    };
  }

  /**
   * Lấy ngày thứ Hai của tuần ISO tương ứng (YYYY-MM-DD)
   */
  private getMondayOfIsoWeek(year: number, month: number, day: number): string {
    const d = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d.getTime() + diffToMonday * 24 * 60 * 60 * 1000);
    const mYear = monday.getUTCFullYear();
    const mMonth = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const mDay = String(monday.getUTCDate()).padStart(2, '0');
    return `${mYear}-${mMonth}-${mDay}`;
  }

  /**
   * Sinh danh sách tất cả các kỳ trong khoảng ngày theo groupBy
   */
  private generatePeriods(
    fromY: number,
    fromM: number,
    fromD: number,
    toY: number,
    toM: number,
    toD: number,
    groupBy: 'day' | 'week' | 'month',
  ): string[] {
    const periods: string[] = [];

    if (groupBy === 'day') {
      let cur = new Date(Date.UTC(fromY, fromM - 1, fromD));
      const end = new Date(Date.UTC(toY, toM - 1, toD));
      while (cur <= end) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
        const d = String(cur.getUTCDate()).padStart(2, '0');
        periods.push(`${y}-${m}-${d}`);
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
      }
      return periods;
    }

    if (groupBy === 'week') {
      const startMonStr = this.getMondayOfIsoWeek(fromY, fromM, fromD);
      const endMonStr = this.getMondayOfIsoWeek(toY, toM, toD);
      const [smY, smM, smD] = startMonStr.split('-').map(Number);
      const [emY, emM, emD] = endMonStr.split('-').map(Number);

      let cur = new Date(Date.UTC(smY, smM - 1, smD));
      const end = new Date(Date.UTC(emY, emM - 1, emD));
      while (cur <= end) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
        const d = String(cur.getUTCDate()).padStart(2, '0');
        periods.push(`${y}-${m}-${d}`);
        cur = new Date(cur.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      return periods;
    }

    if (groupBy === 'month') {
      let curYear = fromY;
      let curMonth = fromM;
      while (curYear < toY || (curYear === toY && curMonth <= toM)) {
        const y = curYear;
        const m = String(curMonth).padStart(2, '0');
        periods.push(`${y}-${m}-01`);
        curMonth++;
        if (curMonth > 12) {
          curMonth = 1;
          curYear++;
        }
      }
      return periods;
    }

    return periods;
  }

  /**
   * Feature A: Báo cáo doanh thu bán hàng
   */
  async getSalesReport(query: SalesReportQueryDto) {
    const { from, to } = query;
    const groupBy = query.groupBy || 'day';

    if (groupBy !== 'day' && groupBy !== 'week' && groupBy !== 'month') {
      throw new BadRequestException('groupBy phải là day, week hoặc month');
    }

    const { startDateUtc, endDateUtc, fromY, fromM, fromD, toY, toM, toD } =
      this.parseAndValidateDateRange(from, to);

    const periods = this.generatePeriods(fromY, fromM, fromD, toY, toM, toD, groupBy);

    // Revenue orders: status in PAID, PACKING, SHIPPED, DELIVERED
    const statuses = [
      OrderStatus.PAID,
      OrderStatus.PACKING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const rawRows = await this.prisma.$queryRaw<SalesReportRawRow[]>(Prisma.sql`
      SELECT
        to_char(date_trunc(${groupBy}, "createdAt" + INTERVAL '7 hours'), 'YYYY-MM-DD') AS "period",
        COUNT(*)::bigint AS "orders",
        COALESCE(SUM("total"), 0)::bigint AS "revenue"
      FROM "orders"
      WHERE "status"::text IN (${Prisma.join(statuses)})
        AND "createdAt" >= ${startDateUtc.toISOString()}::timestamp
        AND "createdAt" <= ${endDateUtc.toISOString()}::timestamp
      GROUP BY 1
    `);

    const periodMap = new Map<string, { orders: number; revenue: number }>();
    for (const p of periods) {
      periodMap.set(p, { orders: 0, revenue: 0 });
    }

    for (const row of rawRows) {
      const item = periodMap.get(row.period);
      if (item) {
        item.orders = Number(row.orders ?? 0);
        item.revenue = Number(row.revenue ?? 0);
      }
    }

    const resultPeriods = periods.map((period) => {
      const item = periodMap.get(period)!;
      return {
        period,
        orders: item.orders,
        revenue: item.revenue,
      };
    });

    const totals = {
      orders: resultPeriods.reduce((sum, p) => sum + p.orders, 0),
      revenue: resultPeriods.reduce((sum, p) => sum + p.revenue, 0),
    };

    return {
      from,
      to,
      groupBy,
      timezone: 'Asia/Ho_Chi_Minh',
      periods: resultPeriods,
      totals,
    };
  }

  /**
   * Feature B: Báo cáo sản phẩm bán chạy nhất
   */
  async getTopProducts(query: TopProductsQueryDto) {
    const { from, to } = query;
    const limit = query.limit ?? 5;

    const { startDateUtc, endDateUtc } = this.parseAndValidateDateRange(from, to);

    // Orders counted: DELIVERED only (same rule as the dashboard topProducts)
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: OrderStatus.DELIVERED,
          createdAt: {
            gte: startDateUtc,
            lte: endDateUtc,
          },
        },
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
    });

    // Sắp xếp theo soldQuantity desc, sau đó revenue desc
    grouped.sort((a, b) => {
      const qtyDiff = (b._sum.quantity || 0) - (a._sum.quantity || 0);
      if (qtyDiff !== 0) {
        return qtyDiff;
      }
      return (b._sum.lineTotal || 0) - (a._sum.lineTotal || 0);
    });

    const topItems = grouped.slice(0, limit);

    if (topItems.length === 0) {
      return [];
    }

    const productIds = topItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p.name]));

    return topItems.map((item) => ({
      productId: item.productId,
      name: productMap.get(item.productId) || 'Unknown Product',
      soldQuantity: item._sum.quantity || 0,
      revenue: item._sum.lineTotal || 0,
    }));
  }
}
