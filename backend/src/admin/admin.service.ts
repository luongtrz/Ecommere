import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import {
  DashboardStatsDto,
  RevenueStatsDto,
  OrderStatsDto,
  ProductStatsDto,
  CustomerStatsDto,
  RecentOrderDto,
  TopProductDto,
} from './dtos/dashboard-stats.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy tất cả thống kê cho dashboard admin
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Chạy tất cả queries song song
    const [
      revenue,
      orders,
      products,
      customers,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      this.getRevenueStats(firstDayOfMonth, firstDayOfLastMonth, lastDayOfLastMonth),
      this.getOrderStats(firstDayOfMonth, firstDayOfLastMonth, lastDayOfLastMonth),
      this.getProductStats(firstDayOfMonth),
      this.getCustomerStats(firstDayOfMonth, firstDayOfLastMonth, lastDayOfLastMonth),
      this.getRecentOrders(),
      this.getTopProducts(),
    ]);

    return {
      revenue,
      orders,
      products,
      customers,
      recentOrders,
      topProducts,
    };
  }

  /**
   * Thống kê doanh thu
   */
  private async getRevenueStats(
    firstDayOfMonth: Date,
    firstDayOfLastMonth: Date,
    lastDayOfLastMonth: Date,
  ): Promise<RevenueStatsDto> {
    // Doanh thu tổng (chỉ tính đơn đã thanh toán, không bao gồm CANCELED/REFUNDED)
    const totalRevenueData = await this.prisma.order.aggregate({
      where: {
        status: {
          in: [OrderStatus.PAID, OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
      },
      _sum: {
        total: true,
      },
    });

    // Doanh thu tháng này
    const monthlyRevenueData = await this.prisma.order.aggregate({
      where: {
        status: {
          in: [OrderStatus.PAID, OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Doanh thu tháng trước
    const lastMonthRevenueData = await this.prisma.order.aggregate({
      where: {
        status: {
          in: [OrderStatus.PAID, OrderStatus.PACKING, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
        },
        createdAt: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    const totalRevenue = totalRevenueData._sum.total || 0;
    const monthlyRevenue = monthlyRevenueData._sum.total || 0;
    const lastMonthRevenue = lastMonthRevenueData._sum.total || 0;

    // Tính % thay đổi
    const monthlyChange = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : monthlyRevenue > 0 ? 100 : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      monthlyChange: Number(monthlyChange.toFixed(2)),
    };
  }

  /**
   * Thống kê đơn hàng
   */
  private async getOrderStats(
    firstDayOfMonth: Date,
    firstDayOfLastMonth: Date,
    lastDayOfLastMonth: Date,
  ): Promise<OrderStatsDto> {
    // Tổng đơn hàng
    const totalOrders = await this.prisma.order.count();

    // Đơn hàng tháng này
    const monthlyOrders = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    // Đơn hàng tháng trước
    const lastMonthOrders = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
    });

    // Đơn chờ xử lý
    const pendingOrders = await this.prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID],
        },
      },
    });

    // Đơn đang giao
    const shippingOrders = await this.prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.PACKING, OrderStatus.SHIPPED],
        },
      },
    });

    const monthlyChange = lastMonthOrders > 0
      ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders) * 100
      : monthlyOrders > 0 ? 100 : 0;

    return {
      totalOrders,
      monthlyOrders,
      monthlyChange: Number(monthlyChange.toFixed(2)),
      pendingOrders,
      shippingOrders,
    };
  }

  /**
   * Thống kê sản phẩm
   */
  private async getProductStats(firstDayOfMonth: Date): Promise<ProductStatsDto> {
    // Tổng sản phẩm
    const totalProducts = await this.prisma.product.count();

    // Sản phẩm active
    const activeProducts = await this.prisma.product.count({
      where: {
        active: true,
      },
    });

    // Sản phẩm mới tháng này
    const newProductsThisMonth = await this.prisma.product.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    // Sản phẩm sắp hết hàng (kiểm tra variants có stock < 10)
    const lowStockVariants = await this.prisma.productVariant.findMany({
      where: {
        stock: {
          lt: 10,
        },
        product: {
          active: true,
        },
      },
      select: {
        productId: true,
      },
      distinct: ['productId'],
    });

    return {
      totalProducts,
      activeProducts,
      newProductsThisMonth,
      lowStockProducts: lowStockVariants.length,
    };
  }

  /**
   * Thống kê khách hàng
   */
  private async getCustomerStats(
    firstDayOfMonth: Date,
    firstDayOfLastMonth: Date,
    lastDayOfLastMonth: Date,
  ): Promise<CustomerStatsDto> {
    // Tổng khách hàng (không tính admin)
    const totalCustomers = await this.prisma.user.count({
      where: {
        role: Role.CUSTOMER,
      },
    });

    // Khách hàng mới tháng này
    const newCustomersThisMonth = await this.prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    // Khách hàng mới tháng trước
    const lastMonthCustomers = await this.prisma.user.count({
      where: {
        role: Role.CUSTOMER,
        createdAt: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
    });

    const monthlyChange = lastMonthCustomers > 0
      ? ((newCustomersThisMonth - lastMonthCustomers) / lastMonthCustomers) * 100
      : newCustomersThisMonth > 0 ? 100 : 0;

    return {
      totalCustomers,
      newCustomersThisMonth,
      monthlyChange: Number(monthlyChange.toFixed(2)),
    };
  }

  /**
   * 5 đơn hàng gần nhất
   */
  private async getRecentOrders(): Promise<RecentOrderDto[]> {
    const orders = await this.prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.code,
      customerName: order.user.name || order.user.email,
      totalAmount: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));
  }

  /**
   * 5 sản phẩm bán chạy nhất
   */
  private async getTopProducts(): Promise<TopProductDto[]> {
    // Tính tổng quantity đã bán theo product (từ OrderItem với status DELIVERED)
    const topProductsData = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: OrderStatus.DELIVERED,
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Lấy thông tin chi tiết của các sản phẩm
    const productIds = topProductsData.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        images: true,
      },
    });

    // Tính doanh thu cho từng sản phẩm
    const revenueData = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: {
          in: productIds,
        },
        order: {
          status: OrderStatus.DELIVERED,
        },
      },
      _sum: {
        lineTotal: true,
      },
    });

    // Map dữ liệu
    const productMap = new Map(products.map((p) => [p.id, p]));
    const revenueMap = new Map(
      revenueData.map((r) => [
        r.productId,
        r._sum.lineTotal || 0,
      ])
    );

    return topProductsData.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Unknown Product',
        imageUrl: product?.images?.[0] || null,
        soldQuantity: item._sum.quantity || 0,
        revenue: revenueMap.get(item.productId) || 0,
      };
    });
  }
}
