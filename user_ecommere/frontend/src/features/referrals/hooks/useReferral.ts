import { useQuery } from '@tanstack/react-query';
import { referralsApi } from '../api/referrals.api';

export function useReferralInfo() {
    return useQuery({
        queryKey: ['referral-info'],
        queryFn: () => referralsApi.getMyReferralInfo(),
    });
}

export function useMyReferrals(page = 1) {
    return useQuery({
        queryKey: ['my-referrals', page],
        queryFn: () => referralsApi.getMyReferrals(page),
    });
}

export function useReferralCoupons() {
    return useQuery({
        queryKey: ['referral-coupons'],
        queryFn: () => referralsApi.getMyCouponsFromReferral(),
    });
}
