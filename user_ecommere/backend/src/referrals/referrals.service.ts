import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CouponType } from '@prisma/client';
import { PaginationDto } from '@/common/dtos/pagination.dto';

@Injectable()
export class ReferralsService {
    private readonly logger = new Logger(ReferralsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Lay thong tin referral cua user hien tai
     */
    async getMyReferralInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                referralCode: true,
                referredById: true,
            },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Tao referral code neu chua co
        let referralCode = user.referralCode;
        if (!referralCode) {
            referralCode = await this.generateReferralCode(userId);
        }

        // Dem so luong referral
        const totalReferrals = await this.prisma.referral.count({
            where: { referrerId: userId },
        });

        // Dem so coupon da nhan tu referral
        const referralRecords = await this.prisma.referral.findMany({
            where: { referrerId: userId },
            select: { referrerCouponCode: true },
        });

        const couponCodes = referralRecords
            .map((r) => r.referrerCouponCode)
            .filter(Boolean) as string[];

        return {
            referralCode,
            totalReferrals,
            totalCouponsEarned: couponCodes.length,
        };
    }

    /**
     * Danh sach ban be da moi (phan trang)
     */
    async getMyReferrals(userId: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 20 } = paginationDto;

        const [referrals, total] = await Promise.all([
            this.prisma.referral.findMany({
                where: { referrerId: userId },
                include: {
                    referee: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.referral.count({ where: { referrerId: userId } }),
        ]);

        return {
            data: referrals.map((r) => ({
                id: r.id,
                refereeName: r.referee.name || r.referee.email,
                refereeEmail: r.referee.email,
                couponCode: r.referrerCouponCode,
                createdAt: r.createdAt,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Danh sach coupon da nhan tu referral
     */
    async getMyCouponsFromReferral(userId: string) {
        const referrals = await this.prisma.referral.findMany({
            where: { referrerId: userId },
            select: { referrerCouponCode: true },
        });

        const couponCodes = referrals
            .map((r) => r.referrerCouponCode)
            .filter(Boolean) as string[];

        if (couponCodes.length === 0) {
            return { data: [] };
        }

        const coupons = await this.prisma.coupon.findMany({
            where: { code: { in: couponCodes } },
            orderBy: { createdAt: 'desc' },
        });

        return { data: coupons };
    }

    /**
     * Xu ly khi user moi dang ky bang ma gioi thieu
     */
    async processReferral(referralCode: string, newUserId: string) {
        // Tim nguoi gioi thieu
        const referrer = await this.prisma.user.findUnique({
            where: { referralCode },
        });

        if (!referrer) {
            this.logger.warn(`Referral code not found: ${referralCode}`);
            return null; // Khong throw loi, chi bo qua
        }

        // Khong cho tu gioi thieu chinh minh
        if (referrer.id === newUserId) {
            return null;
        }

        // Kiem tra da co referral chua
        const existingReferral = await this.prisma.referral.findUnique({
            where: { refereeId: newUserId },
        });

        if (existingReferral) {
            return null; // Da duoc gioi thieu roi
        }

        // Lay cau hinh referral
        const config = await this.prisma.referralConfig.findFirst({
            where: { active: true },
            orderBy: { updatedAt: 'desc' },
        });

        if (!config) {
            this.logger.warn('No active referral config found');
            return null;
        }

        // Kiem tra gioi han referral
        if (config.maxReferralsPerUser) {
            const currentCount = await this.prisma.referral.count({
                where: { referrerId: referrer.id },
            });
            if (currentCount >= config.maxReferralsPerUser) {
                this.logger.log(`Referrer ${referrer.id} reached max referrals limit`);
                return null;
            }
        }

        // Tao coupon cho nguoi gioi thieu
        const referrerCouponCode = await this.createReferralCoupon(
            `REF-ER-${Date.now().toString(36).toUpperCase()}`,
            config.referrerCouponType,
            config.referrerCouponValue,
            config.referrerMaxDiscount,
            config.minOrderForCoupon,
            config.couponValidDays,
        );

        // Tao coupon cho nguoi duoc gioi thieu
        const refereeCouponCode = await this.createReferralCoupon(
            `REF-EE-${Date.now().toString(36).toUpperCase()}`,
            config.refereeCouponType,
            config.refereeCouponValue,
            config.refereeMaxDiscount,
            config.minOrderForCoupon,
            config.couponValidDays,
        );

        // Tao record referral
        const referral = await this.prisma.referral.create({
            data: {
                referrerId: referrer.id,
                refereeId: newUserId,
                referrerCouponCode,
                refereeCouponCode,
            },
        });

        // Cap nhat referredById cho user moi
        await this.prisma.user.update({
            where: { id: newUserId },
            data: { referredById: referrer.id },
        });

        this.logger.log(
            `Referral processed: ${referrer.email} -> user ${newUserId}`,
        );

        return referral;
    }

    /**
     * Tao ma gioi thieu cho user
     */
    async generateReferralCode(userId: string): Promise<string> {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code: string;
        let exists = true;

        // Dam bao code la duy nhat
        while (exists) {
            let random = '';
            for (let i = 0; i < 6; i++) {
                random += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            code = `REF-${random}`;
            const existing = await this.prisma.user.findUnique({
                where: { referralCode: code },
            });
            exists = !!existing;
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { referralCode: code! },
        });

        return code!;
    }

    /**
     * Tao coupon cho referral
     */
    private async createReferralCoupon(
        code: string,
        type: CouponType,
        value: number,
        maxDiscount: number | null,
        minOrder: number | null,
        validDays: number,
    ): Promise<string> {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);

        await this.prisma.coupon.create({
            data: {
                code,
                type,
                value,
                maxDiscount,
                minOrder,
                validFrom: new Date(),
                validUntil,
                maxUses: 1,
                maxUsesPerUser: 1,
                active: true,
            },
        });

        return code;
    }
}
