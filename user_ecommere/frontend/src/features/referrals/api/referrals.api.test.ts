import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import {
  referralsApi,
  type ReferralInfo,
  type ReferralCoupon,
} from './referrals.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('referralsApi', () => {
  const mockedApiClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyReferralInfo', () => {
    it('retrieves and parses referral info with wrapped backend response (.data.data)', async () => {
      const mockInfo: ReferralInfo = {
        referralCode: 'REF12345',
        totalReferrals: 10,
        totalCouponsEarned: 3,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockInfo },
      });

      const result = await referralsApi.getMyReferralInfo();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/me');
      expect(result).toEqual(mockInfo);
    });

    it('retrieves and parses referral info with unwrapped backend response (.data)', async () => {
      const mockInfo: ReferralInfo = {
        referralCode: 'DIRECTCODE',
        totalReferrals: 0,
        totalCouponsEarned: 0,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockInfo,
      });

      const result = await referralsApi.getMyReferralInfo();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/me');
      expect(result).toEqual(mockInfo);
    });

    it('throws when network request fails', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      await expect(referralsApi.getMyReferralInfo()).rejects.toThrow(
        'Network error',
      );
    });

    it('throws validation error when backend response violates referralInfoSchema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: { referralCode: 999, totalReferrals: 'invalid' } },
      });

      await expect(referralsApi.getMyReferralInfo()).rejects.toThrow();
    });
  });

  describe('getMyReferrals', () => {
    it('retrieves referrals with default pagination parameters (page=1, limit=20)', async () => {
      const rawReferrals = [
        {
          id: 'ref-1',
          refereeName: 'Nguyễn Văn A',
          refereeEmail: 'nguyenvana@example.com',
          couponCode: 'COUPON_A',
          createdAt: '2026-01-15T08:30:00.000Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: rawReferrals,
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });

      const result = await referralsApi.getMyReferrals();

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/referrals/my-referrals',
        {
          params: { page: 1, limit: 20 },
        },
      );
      expect(result.data).toEqual(rawReferrals);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('retrieves referrals with custom pagination parameters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 45,
            page: 3,
            totalPages: 5,
          },
        },
      });

      const result = await referralsApi.getMyReferrals(3, 10);

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/referrals/my-referrals',
        {
          params: { page: 3, limit: 10 },
        },
      );
      expect(result).toEqual({
        data: [],
        total: 45,
        page: 3,
        totalPages: 5,
      });
    });

    it('transforms null refereeName to "Khách hàng"', async () => {
      const rawReferrals = [
        {
          id: 'ref-2',
          refereeName: null,
          refereeEmail: null,
          couponCode: null,
          createdAt: '2026-02-01T12:00:00.000Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: rawReferrals,
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });

      const result = await referralsApi.getMyReferrals();

      expect(result.data[0].refereeName).toBe('Khách hàng');
      expect(result.data[0].refereeEmail).toBeNull();
      expect(result.data[0].couponCode).toBeNull();
    });

    it('transforms undefined refereeName to "Khách hàng"', async () => {
      const rawReferrals = [
        {
          id: 'ref-3',
          couponCode: null,
          createdAt: '2026-02-10T14:00:00.000Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: rawReferrals,
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });

      const result = await referralsApi.getMyReferrals();

      expect(result.data[0].refereeName).toBe('Khách hàng');
      expect(result.data[0].refereeEmail).toBeUndefined();
    });

    it('throws when getMyReferrals network request fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Connection error'),
      );

      await expect(referralsApi.getMyReferrals()).rejects.toThrow(
        'Connection error',
      );
    });

    it('throws validation error when referralItemSchema is violated', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [{ id: 12345, createdAt: true }],
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });

      await expect(referralsApi.getMyReferrals()).rejects.toThrow();
    });

    it('handles fallback when response.data.data is falsy', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: null,
        },
      });

      await expect(referralsApi.getMyReferrals()).rejects.toThrow();
    });
  });

  describe('getMyCouponsFromReferral', () => {
    it('retrieves and parses coupons of all types (PERCENT, FIXED, FREESHIP)', async () => {
      const mockCoupons: ReferralCoupon[] = [
        {
          code: 'PERCENT15',
          type: 'PERCENT',
          value: 15,
          minOrder: 100000,
          maxDiscount: 30000,
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2026-12-31T23:59:59.000Z',
          maxUses: 50,
          usedCount: 5,
          active: true,
        },
        {
          code: 'FIXED50K',
          type: 'FIXED',
          value: 50000,
          minOrder: null,
          maxDiscount: null,
          validFrom: null,
          validUntil: null,
          maxUses: null,
          usedCount: 0,
          active: true,
        },
        {
          code: 'FREESHIPNOW',
          type: 'FREESHIP',
          value: 0,
          minOrder: 150000,
          maxDiscount: null,
          validFrom: null,
          validUntil: null,
          maxUses: 1,
          usedCount: 1,
          active: false,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: mockCoupons,
          },
        },
      });

      const result = await referralsApi.getMyCouponsFromReferral();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/my-coupons');
      expect(result).toEqual(mockCoupons);
    });

    it('returns empty array when user has no referral coupons', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
          },
        },
      });

      const result = await referralsApi.getMyCouponsFromReferral();

      expect(result).toEqual([]);
    });

    it('throws when getMyCouponsFromReferral network request fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Coupons fetch error'),
      );

      await expect(referralsApi.getMyCouponsFromReferral()).rejects.toThrow(
        'Coupons fetch error',
      );
    });

    it('throws validation error when coupon data fails schema validation', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [
              {
                code: 'INVALID_COUPON',
                type: 'UNKNOWN_TYPE',
                value: 10,
                usedCount: 0,
                active: true,
              },
            ],
          },
        },
      });

      await expect(referralsApi.getMyCouponsFromReferral()).rejects.toThrow();
    });

    it('handles fallback when response.data.data is falsy', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: null,
        },
      });

      await expect(referralsApi.getMyCouponsFromReferral()).rejects.toThrow();
    });
  });
});
