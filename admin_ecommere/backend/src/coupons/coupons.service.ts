import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MoneyUtil } from '@/common/utils/money.util';
import { CouponType, OrderStatus } from '@prisma/client';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count(),
    ]);

    return {
      data: coupons,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async findOne(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async create(createCouponDto: CreateCouponDto) {
    const { code, type, value, minOrder, maxDiscount, validFrom, validUntil, maxUses, maxUsesPerUser } = createCouponDto;

    // Validate percentage value
    if (type === CouponType.PERCENT && (value < 0 || value > 100)) {
      throw new BadRequestException('Percentage value must be between 0 and 100');
    }

    // Validate date range
    if (validFrom && validUntil && validFrom >= validUntil) {
      throw new BadRequestException('validFrom must be before validUntil');
    }

    const codeUpper = code.toUpperCase();

    // Check if code already exists
    const existing = await this.prisma.coupon.findUnique({
      where: { code: codeUpper },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    try {
      return await this.prisma.coupon.create({
        data: {
          code: codeUpper,
          type,
          value,
          minOrder,
          maxDiscount,
          validFrom,
          validUntil,
          maxUses,
          maxUsesPerUser,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Coupon code already exists');
      }

      throw error;
    }
  }

  async update(code: string, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const { type, value, validFrom, validUntil } = updateCouponDto;
    const effectiveType = type ?? coupon.type;
    const effectiveValue = value ?? coupon.value;

    // Validate percentage value
    if (effectiveType === CouponType.PERCENT && (effectiveValue < 0 || effectiveValue > 100)) {
      throw new BadRequestException('Percentage value must be between 0 and 100');
    }

    // Validate date range
    const newValidFrom = validFrom || coupon.validFrom;
    const newValidUntil = validUntil || coupon.validUntil;
    if (newValidFrom && newValidUntil && newValidFrom >= newValidUntil) {
      throw new BadRequestException('validFrom must be before validUntil');
    }

    try {
      return await this.prisma.coupon.update({
        where: { code: code.toUpperCase() },
        data: updateCouponDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Coupon code already exists');
      }

      throw error;
    }
  }

  async remove(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const normalizedCode = code.toUpperCase();
    const [orderCount, cartCount] = await Promise.all([
      this.prisma.order.count({
        where: { couponCode: normalizedCode },
      }),
      this.prisma.cart.count({
        where: { couponId: normalizedCode },
      }),
    ]);

    if (orderCount > 0) {
      throw new BadRequestException('Cannot delete coupon that has been used in orders');
    }

    if (cartCount > 0) {
      throw new BadRequestException('Cannot delete coupon currently applied to carts');
    }

    try {
      await this.prisma.coupon.delete({
        where: { code: normalizedCode },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Cannot delete coupon currently referenced by another record');
      }

      throw error;
    }

    return { message: 'Coupon deleted successfully' };
  }

  async validateCoupon(code: string, userId: string, orderTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return {
        valid: false,
        message: 'Coupon not found',
      };
    }

    if (!coupon.active) {
      return {
        valid: false,
        message: 'Coupon is inactive',
      };
    }

    // Check if coupon is valid by date
    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return {
        valid: false,
        message: 'Coupon is not yet valid',
      };
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return {
        valid: false,
        message: 'Coupon has expired',
      };
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        message: 'Coupon has reached maximum usage limit',
      };
    }

    // Check max uses per user
    if (coupon.maxUsesPerUser) {
      const userUsageCount = await this.prisma.order.count({
        where: {
          userId,
          couponCode: coupon.code,
          status: { not: OrderStatus.CANCELED },
        },
      });

      if (userUsageCount >= coupon.maxUsesPerUser) {
        return {
          valid: false,
          message: 'You have already used this coupon the maximum number of times',
        };
      }
    }

    // Check minimum order amount
    if (coupon.minOrder && orderTotal < coupon.minOrder) {
      return {
        valid: false,
        message: `Minimum order amount is ${MoneyUtil.format(coupon.minOrder)}`,
      };
    }

    // Calculate discount
    const discountAmount = MoneyUtil.calculateDiscount(
      orderTotal,
      coupon.type,
      coupon.value,
      coupon.maxDiscount,
    );

    return {
      valid: true,
      message: 'Coupon is valid',
      coupon,
      discountAmount,
    };
  }

  // Internal method used by orders service
  async applyCoupon(code: string, userId: string, orderTotal: number) {
    const validation = await this.validateCoupon(code, userId, orderTotal);

    if (!validation.valid) {
      throw new BadRequestException(validation.message);
    }

    return {
      coupon: validation.coupon,
      discountAmount: validation.discountAmount,
    };
  }

  // Internal method used by orders service
  async incrementUsage(code: string) {
    return this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: {
        usedCount: { increment: 1 },
      },
    });
  }
}
