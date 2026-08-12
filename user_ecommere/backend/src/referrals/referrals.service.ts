import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, CouponType } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

@Injectable()
export class ReferralsService {
    private readonly logger = new Logger(ReferralsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Lấy thông tin referral của user hiện tại
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

        // Tạo referral code nếu chưa có
        let referralCode = user.referralCode;
        if (!referralCode) {
            referralCode = await this.generateReferralCode(userId);
        }

        // Đếm số lượng referral
        const totalReferrals = await this.prisma.referral.count({
            where: { referrerId: userId },
        });

        // Đếm số coupon đã nhận từ referral
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
     * Danh sách bạn bè đã mời (phân trang)
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
     * Danh sách coupon đã nhận từ referral
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
     * Xử lý khi user mới đăng ký bằng mã giới thiệu
     */
    async processReferral(referralCode: string, newUserId: string) {
        const normalizedReferralCode = referralCode.trim().toUpperCase();
        if (!normalizedReferralCode) {
            return null;
        }

        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                const referral = await this.prisma.$transaction(async (tx) => {
                    const referrer = await tx.user.findUnique({
                        where: { referralCode: normalizedReferralCode },
                    });

                    if (!referrer || referrer.id === newUserId) {
                        return null;
                    }

                    const existingReferral = await tx.referral.findUnique({
                        where: { refereeId: newUserId },
                    });

                    if (existingReferral) {
                        return null;
                    }

                    const config = await tx.referralConfig.findFirst({
                        where: { active: true },
                        orderBy: { updatedAt: 'desc' },
                    });

                    if (!config) {
                        this.logger.warn('No active referral config found');
                        return null;
                    }

                    if (config.maxReferralsPerUser) {
                        const currentCount = await tx.referral.count({
                            where: { referrerId: referrer.id },
                        });
                        if (currentCount >= config.maxReferralsPerUser) {
                            this.logger.log(`Referrer ${referrer.id} reached max referrals limit`);
                            return null;
                        }
                    }

                    this.validateCouponConfig(
                        config.referrerCouponType,
                        config.referrerCouponValue,
                        config.couponValidDays,
                    );
                    this.validateCouponConfig(
                        config.refereeCouponType,
                        config.refereeCouponValue,
                        config.couponValidDays,
                    );

                    const suffix = randomBytes(8).toString('hex').toUpperCase();
                    const referrerCouponCode = await this.createReferralCoupon(
                        tx,
                        `REF-ER-${suffix}`,
                        config.referrerCouponType,
                        config.referrerCouponValue,
                        config.referrerMaxDiscount,
                        config.minOrderForCoupon,
                        config.couponValidDays,
                    );
                    const refereeCouponCode = await this.createReferralCoupon(
                        tx,
                        `REF-EE-${suffix}`,
                        config.refereeCouponType,
                        config.refereeCouponValue,
                        config.refereeMaxDiscount,
                        config.minOrderForCoupon,
                        config.couponValidDays,
                    );

                    const createdReferral = await tx.referral.create({
                        data: {
                            referrerId: referrer.id,
                            refereeId: newUserId,
                            referrerCouponCode,
                            refereeCouponCode,
                        },
                    });

                    await tx.user.update({
                        where: { id: newUserId },
                        data: { referredById: referrer.id },
                    });

                    this.logger.log(
                        `Referral processed: ${referrer.email} -> user ${newUserId}`,
                    );

                    return createdReferral;
                }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

                return referral;
            } catch (error) {
                if (this.isSerializationConflict(error) && attempt < 2) {
                    continue;
                }

                throw error;
            }
        }

        return null;
    }

    /**
     * Tạo mã giới thiệu cho user
     */
    async generateReferralCode(userId: string): Promise<string> {
        const currentUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { referralCode: true },
        });

        if (!currentUser) {
            throw new BadRequestException('User not found');
        }

        if (currentUser.referralCode) {
            return currentUser.referralCode;
        }

        for (let attempt = 0; attempt < 10; attempt += 1) {
            const code = `REF-${randomBytes(4).toString('hex').toUpperCase()}`;

            try {
                const assigned = await this.prisma.user.updateMany({
                    where: { id: userId, referralCode: null },
                    data: { referralCode: code },
                });

                if (assigned.count === 1) {
                    return code;
                }

                const updatedUser = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { referralCode: true },
                });
                if (updatedUser?.referralCode) {
                    return updatedUser.referralCode;
                }
            } catch (error) {
                if (!this.isUniqueConstraintConflict(error)) {
                    throw error;
                }
            }
        }

        throw new BadRequestException('Unable to generate referral code');
    }

    /**
     * Tạo coupon cho referral
     */
    private async createReferralCoupon(
        transactionClient: any,
        code: string,
        type: CouponType,
        value: number,
        maxDiscount: number | null,
        minOrder: number | null,
        validDays: number,
    ): Promise<string> {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);

        await transactionClient.coupon.create({
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

    private validateCouponConfig(type: CouponType, value: number, validDays: number) {
        if (value < 0 || (type === CouponType.PERCENT && value > 100)) {
            throw new BadRequestException('Invalid referral coupon value');
        }

        if (validDays < 1) {
            throw new BadRequestException('Referral coupon validity must be at least one day');
        }
    }

    private isUniqueConstraintConflict(error: unknown) {
        return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    }

    private isSerializationConflict(error: unknown) {
        return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
    }
}
