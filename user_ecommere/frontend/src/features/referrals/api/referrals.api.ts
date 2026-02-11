import apiClient from '@/lib/api';
import { z } from 'zod';

// Types
const referralInfoSchema = z.object({
    referralCode: z.string(),
    totalReferrals: z.number(),
    totalCouponsEarned: z.number(),
});

const referralItemSchema = z.object({
    id: z.string(),
    refereeName: z.string(),
    refereeEmail: z.string(),
    couponCode: z.string().nullable(),
    createdAt: z.string(),
});

const couponSchema = z.object({
    code: z.string(),
    type: z.enum(['PERCENT', 'FIXED', 'FREESHIP']),
    value: z.number(),
    minOrder: z.number().nullable(),
    maxDiscount: z.number().nullable(),
    validFrom: z.string().nullable(),
    validUntil: z.string().nullable(),
    maxUses: z.number().nullable(),
    usedCount: z.number(),
    active: z.boolean(),
});

export type ReferralInfo = z.infer<typeof referralInfoSchema>;
export type ReferralItem = z.infer<typeof referralItemSchema>;
export type ReferralCoupon = z.infer<typeof couponSchema>;

export const referralsApi = {
    async getMyReferralInfo(): Promise<ReferralInfo> {
        const response = await apiClient.get('/referrals/me');
        const data = response.data.data || response.data;
        return referralInfoSchema.parse(data);
    },

    async getMyReferrals(page = 1, limit = 20) {
        const response = await apiClient.get('/referrals/my-referrals', {
            params: { page, limit },
        });
        const data = response.data.data || response.data;
        return {
            data: z.array(referralItemSchema).parse(data.data),
            total: data.total as number,
            page: data.page as number,
            totalPages: data.totalPages as number,
        };
    },

    async getMyCouponsFromReferral(): Promise<ReferralCoupon[]> {
        const response = await apiClient.get('/referrals/my-coupons');
        const data = response.data.data || response.data;
        return z.array(couponSchema).parse(data.data);
    },
};
