import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderStatus, Role } from '@prisma/client';
import { CustomerQueryDto } from './dtos/customer-query.dto';

const REVENUE_ORDER_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PACKING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Feature C: Lấy danh sách khách hàng phân trang, tìm kiếm và thống kê đơn hàng
   */
  async getCustomers(query: CustomerQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const where: any = {
      role: Role.CUSTOMER,
    };

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Một truy vấn phân trang lấy danh sách user kèm orderCount (đơn không bị hủy)
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              orders: {
                where: {
                  status: { not: OrderStatus.CANCELED },
                },
              },
            },
          },
        },
      }),
    ]);

    const userIds = users.map((u) => u.id);
    const spentMap = new Map<string, number>();

    // Một truy vấn aggregate duy nhất tính tổng chi tiêu cho các user trên trang
    if (userIds.length > 0) {
      const spentData = await this.prisma.order.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          status: { in: REVENUE_ORDER_STATUSES },
        },
        _sum: {
          total: true,
        },
      });

      for (const item of spentData) {
        spentMap.set(item.userId, item._sum.total || 0);
      }
    }

    const data = users.map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      orderCount: user._count.orders,
      totalSpent: spentMap.get(user.id) || 0,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Feature C: Lấy chi tiết khách hàng và danh sách địa chỉ
   */
  async getCustomerById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: Role.CUSTOMER,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            orders: {
              where: {
                status: { not: OrderStatus.CANCELED },
              },
            },
          },
        },
        addresses: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            province: true,
            district: true,
            ward: true,
            line1: true,
            isDefault: true,
          },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const spentData = await this.prisma.order.aggregate({
      where: {
        userId: id,
        status: { in: REVENUE_ORDER_STATUSES },
      },
      _sum: {
        total: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      orderCount: user._count.orders,
      totalSpent: spentData._sum.total || 0,
      addresses: user.addresses,
    };
  }
}
