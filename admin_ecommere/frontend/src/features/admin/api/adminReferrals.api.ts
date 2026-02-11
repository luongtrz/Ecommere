import apiClient from '@/lib/api';
import { z } from 'zod';

// Types
const referralConfigSchema = z.object({
    id: z.string(),
    active: z.boolean(),
    referrerCouponType: z.enum(['PERCENT', 'FIXED', 'FREESHIP']),
    referrerCouponValue: z.number(),
    referrerMaxDiscount: z.number().nullable(),
    refereeCouponType: z.enum(['PERCENT', 'FIXED', 'FREESHIP']),
    refereeCouponValue: z.number(),
    refereeMaxDiscount: z.number().nullable(),
    minOrderForCoupon: z.number().nullable(),
    couponValidDays: z.number(),
    maxReferralsPerUser: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

const referralStatsSchema = z.object({
    totalReferrals: z.number(),
    totalCouponsCreated: z.number(),
    isActive: z.boolean(),
    topReferrers: z.array(z.object({
        user: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
            referralCode: z.string().nullable(),
        }).nullable(),
        referralCount: z.number(),
    })),
});

const referralListItemSchema = z.object({
    id: z.string(),
    referrerId: z.string(),
    refereeId: z.string(),
    referrerCouponCode: z.string().nullable(),
    refereeCouponCode: z.string().nullable(),
    createdAt: z.string(),
    referrer: z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string(),
        referralCode: z.string().nullable(),
    }),
    referee: z.object({
        id: z.string(),
        name: z.string().nullable(),
        email: z.string(),
        createdAt: z.string(),
    }),
});

export type ReferralConfig = z.infer<typeof referralConfigSchema>;
export type ReferralStats = z.infer<typeof referralStatsSchema>;
export type ReferralListItem = z.infer<typeof referralListItemSchema>;

export const adminReferralsApi = {
    async getConfig(): Promise<ReferralConfig> {
        const response = await apiClient.get('/referrals/config');
        const data = response.data.data || response.data;
        return referralConfigSchema.parse(data);
    },

    async updateConfig(config: Partial<ReferralConfig>): Promise<ReferralConfig> {
        const response = await apiClient.put('/referrals/config', config);
        const data = response.data.data || response.data;
        return referralConfigSchema.parse(data);
    },

    async getStats(): Promise<ReferralStats> {
        const response = await apiClient.get('/referrals/stats');
        const data = response.data.data || response.data;
        return referralStatsSchema.parse(data);
    },

    async getReferrals(page = 1, limit = 20) {
        const response = await apiClient.get('/referrals/list', {
            params: { page, limit },
        });
        const data = response.data.data || response.data;
        return {
            data: z.array(referralListItemSchema).parse(data.data),
            total: data.total as number,
            page: data.page as number,
            totalPages: data.totalPages as number,
        };
    },
};
