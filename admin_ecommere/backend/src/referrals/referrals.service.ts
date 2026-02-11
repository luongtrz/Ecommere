import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CouponType } from '@prisma/client';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { UpdateReferralConfigDto } from './dtos/update-referral-config.dto';

@Injectable()
export class ReferralsService {
    private readonly logger = new Logger(ReferralsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Lay cau hinh referral hien tai
     */
    async getConfig() {
        let config = await this.prisma.referralConfig.findFirst({
            orderBy: { updatedAt: 'desc' },
        });

        // Tao cau hinh mac dinh neu chua co
        if (!config) {
            config = await this.prisma.referralConfig.create({
                data: {
                    active: true,
                    referrerCouponType: CouponType.PERCENT,
                    referrerCouponValue: 10,
                    refereeCouponType: CouponType.PERCENT,
                    refereeCouponValue: 5,
                    couponValidDays: 30,
                },
            });
        }

        return config;
    }

    /**
     * Cap nhat cau hinh referral
     */
    async updateConfig(dto: UpdateReferralConfigDto) {
        const existing = await this.prisma.referralConfig.findFirst({
            orderBy: { updatedAt: 'desc' },
        });

        if (!existing) {
            // Tao moi neu chua co
            return this.prisma.referralConfig.create({
                data: {
                    active: dto.active ?? true,
                    referrerCouponType: dto.referrerCouponType ?? CouponType.PERCENT,
                    referrerCouponValue: dto.referrerCouponValue ?? 10,
                    referrerMaxDiscount: dto.referrerMaxDiscount,
                    refereeCouponType: dto.refereeCouponType ?? CouponType.PERCENT,
                    refereeCouponValue: dto.refereeCouponValue ?? 5,
                    refereeMaxDiscount: dto.refereeMaxDiscount,
                    minOrderForCoupon: dto.minOrderForCoupon,
                    couponValidDays: dto.couponValidDays ?? 30,
                    maxReferralsPerUser: dto.maxReferralsPerUser,
                },
            });
        }

        return this.prisma.referralConfig.update({
            where: { id: existing.id },
            data: dto,
        });
    }

    /**
     * Thong ke referral
     */
    async getStats() {
        const [totalReferrals, totalCouponsCreated, activeConfig] = await Promise.all([
            this.prisma.referral.count(),
            this.prisma.coupon.count({
                where: {
                    code: { startsWith: 'REF-' },
                },
            }),
            this.prisma.referralConfig.findFirst({
                where: { active: true },
                orderBy: { updatedAt: 'desc' },
            }),
        ]);

        // Top referrers
        const topReferrers = await this.prisma.referral.groupBy({
            by: ['referrerId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        // Lay thong tin user cho top referrers
        const topReferrerUsers = await Promise.all(
            topReferrers.map(async (r) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: r.referrerId },
                    select: { id: true, name: true, email: true, referralCode: true },
                });
                return {
                    user,
                    referralCount: r._count.id,
                };
            }),
        );

        return {
            totalReferrals,
            totalCouponsCreated,
            isActive: !!activeConfig?.active,
            topReferrers: topReferrerUsers,
        };
    }

    /**
     * Danh sach tat ca referrals (phan trang)
     */
    async getAllReferrals(paginationDto: PaginationDto) {
        const { page = 1, limit = 20 } = paginationDto;

        const [referrals, total] = await Promise.all([
            this.prisma.referral.findMany({
                include: {
                    referrer: {
                        select: { id: true, name: true, email: true, referralCode: true },
                    },
                    referee: {
                        select: { id: true, name: true, email: true, createdAt: true },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.referral.count(),
        ]);

        return {
            data: referrals,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1,
        };
    }
}
