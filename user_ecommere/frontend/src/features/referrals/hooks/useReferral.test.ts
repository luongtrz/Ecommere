import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useReferralInfo,
  useMyReferrals,
  useReferralCoupons,
} from './useReferral';
import {
  referralsApi,
  type ReferralInfo,
  type ReferralCoupon,
} from '../api/referrals.api';

vi.mock('../api/referrals.api', () => ({
  referralsApi: {
    getMyReferralInfo: vi.fn(),
    getMyReferrals: vi.fn(),
    getMyCouponsFromReferral: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

const mockReferralInfo: ReferralInfo = {
  referralCode: 'REF123456',
  totalReferrals: 5,
  totalCouponsEarned: 3,
};

const mockReferralsPage1 = {
  data: [
    {
      id: 'ref-1',
      refereeName: 'Nguyễn Văn A',
      refereeEmail: 'nguyenvana@example.com',
      couponCode: 'COUPON1',
      createdAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'ref-2',
      refereeName: 'Khách hàng',
      refereeEmail: null,
      couponCode: null,
      createdAt: '2026-03-02T11:00:00.000Z',
    },
  ],
  total: 25,
  page: 1,
  totalPages: 2,
};

const mockReferralsPage2 = {
  data: [
    {
      id: 'ref-3',
      refereeName: 'Lê Văn C',
      refereeEmail: 'levanc@example.com',
      couponCode: 'COUPON2',
      createdAt: '2026-03-03T12:00:00.000Z',
    },
  ],
  total: 25,
  page: 2,
  totalPages: 2,
};

const mockCoupons: ReferralCoupon[] = [
  {
    code: 'GIAM10K',
    type: 'FIXED',
    value: 10000,
    minOrder: 100000,
    maxDiscount: null,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
    maxUses: 10,
    usedCount: 2,
    active: true,
  },
  {
    code: 'FREESHIP',
    type: 'FREESHIP',
    value: 30000,
    minOrder: null,
    maxDiscount: null,
    validFrom: null,
    validUntil: null,
    maxUses: null,
    usedCount: 0,
    active: true,
  },
];

describe('useReferral hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useReferralInfo', () => {
    it('starts in loading state when query is initiated', () => {
      vi.mocked(referralsApi.getMyReferralInfo).mockReturnValue(
        new Promise(() => {}),
      );
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useReferralInfo(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('fetches and returns referral info successfully', async () => {
      vi.mocked(referralsApi.getMyReferralInfo).mockResolvedValue(
        mockReferralInfo,
      );
      const { wrapper, queryClient } = createWrapper();
      const { result } = renderHook(() => useReferralInfo(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(referralsApi.getMyReferralInfo).toHaveBeenCalledTimes(1);
      expect(referralsApi.getMyReferralInfo).toHaveBeenCalledWith();
      expect(result.current.data).toEqual(mockReferralInfo);
      expect(queryClient.getQueryData(['referral-info'])).toEqual(
        mockReferralInfo,
      );
    });

    it('handles error state when API request fails', async () => {
      const error = new Error('Lỗi khi tải thông tin giới thiệu');
      vi.mocked(referralsApi.getMyReferralInfo).mockRejectedValue(error);
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useReferralInfo(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(referralsApi.getMyReferralInfo).toHaveBeenCalledTimes(1);
      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useMyReferrals', () => {
    it('starts in loading state when query is initiated', () => {
      vi.mocked(referralsApi.getMyReferrals).mockReturnValue(
        new Promise(() => {}),
      );
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMyReferrals(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('fetches page 1 by default when no page argument is passed', async () => {
      vi.mocked(referralsApi.getMyReferrals).mockResolvedValue(
        mockReferralsPage1,
      );
      const { wrapper, queryClient } = createWrapper();
      const { result } = renderHook(() => useMyReferrals(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(referralsApi.getMyReferrals).toHaveBeenCalledTimes(1);
      expect(referralsApi.getMyReferrals).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual(mockReferralsPage1);
      expect(queryClient.getQueryData(['my-referrals', 1])).toEqual(
        mockReferralsPage1,
      );
    });

    it('fetches the specified page when page argument is provided', async () => {
      vi.mocked(referralsApi.getMyReferrals).mockResolvedValue(
        mockReferralsPage2,
      );
      const { wrapper, queryClient } = createWrapper();
      const { result } = renderHook(() => useMyReferrals(2), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(referralsApi.getMyReferrals).toHaveBeenCalledTimes(1);
      expect(referralsApi.getMyReferrals).toHaveBeenCalledWith(2);
      expect(result.current.data).toEqual(mockReferralsPage2);
      expect(queryClient.getQueryData(['my-referrals', 2])).toEqual(
        mockReferralsPage2,
      );
    });

    it('updates query key and refetches when page changes', async () => {
      vi.mocked(referralsApi.getMyReferrals)
        .mockResolvedValueOnce(mockReferralsPage1)
        .mockResolvedValueOnce(mockReferralsPage2);

      const { wrapper, queryClient } = createWrapper();
      const { result, rerender } = renderHook(
        ({ page }: { page?: number }) => useMyReferrals(page),
        {
          wrapper,
          initialProps: { page: 1 },
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(referralsApi.getMyReferrals).toHaveBeenLastCalledWith(1);
      expect(result.current.data).toEqual(mockReferralsPage1);

      rerender({ page: 2 });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockReferralsPage2);
      });
      expect(referralsApi.getMyReferrals).toHaveBeenCalledTimes(2);
      expect(referralsApi.getMyReferrals).toHaveBeenLastCalledWith(2);
      expect(queryClient.getQueryData(['my-referrals', 2])).toEqual(
        mockReferralsPage2,
      );
    });

    it('handles empty referrals list response', async () => {
      const emptyResponse = {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
      vi.mocked(referralsApi.getMyReferrals).mockResolvedValue(emptyResponse);
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMyReferrals(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(emptyResponse);
      expect(result.current.data?.data).toHaveLength(0);
    });

    it('handles error state when API request fails', async () => {
      const error = new Error('Lỗi khi tải danh sách bạn bè giới thiệu');
      vi.mocked(referralsApi.getMyReferrals).mockRejectedValue(error);
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMyReferrals(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(referralsApi.getMyReferrals).toHaveBeenCalledWith(1);
      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useReferralCoupons', () => {
    it('starts in loading state when query is initiated', () => {
      vi.mocked(referralsApi.getMyCouponsFromReferral).mockReturnValue(
        new Promise(() => {}),
      );
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useReferralCoupons(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('fetches and returns referral coupons successfully', async () => {
      vi.mocked(referralsApi.getMyCouponsFromReferral).mockResolvedValue(
        mockCoupons,
      );
      const { wrapper, queryClient } = createWrapper();
      const { result } = renderHook(() => useReferralCoupons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(referralsApi.getMyCouponsFromReferral).toHaveBeenCalledTimes(1);
      expect(referralsApi.getMyCouponsFromReferral).toHaveBeenCalledWith();
      expect(result.current.data).toEqual(mockCoupons);
      expect(queryClient.getQueryData(['referral-coupons'])).toEqual(
        mockCoupons,
      );
    });

    it('handles empty coupons list response', async () => {
      vi.mocked(referralsApi.getMyCouponsFromReferral).mockResolvedValue([]);
      const { wrapper, queryClient } = createWrapper();
      const { result } = renderHook(() => useReferralCoupons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(queryClient.getQueryData(['referral-coupons'])).toEqual([]);
    });

    it('handles error state when API request fails', async () => {
      const error = new Error('Lỗi khi tải danh sách mã giảm giá giới thiệu');
      vi.mocked(referralsApi.getMyCouponsFromReferral).mockRejectedValue(error);
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useReferralCoupons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(referralsApi.getMyCouponsFromReferral).toHaveBeenCalledTimes(1);
      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });
  });
});
