import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import {
  adminReferralsApi,
  type ReferralConfig,
  type ReferralStats,
  type ReferralListItem,
} from './adminReferrals.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('adminReferralsApi', () => {
  const mockedApiClient = vi.mocked(apiClient);

  const mockConfig: ReferralConfig = {
    id: 'cfg-001',
    active: true,
    referrerCouponType: 'PERCENT',
    referrerCouponValue: 15,
    referrerMaxDiscount: 100000,
    refereeCouponType: 'FIXED',
    refereeCouponValue: 50000,
    refereeMaxDiscount: null,
    minOrderForCoupon: 200000,
    couponValidDays: 45,
    maxReferralsPerUser: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  };

  const mockStats: ReferralStats = {
    totalReferrals: 120,
    totalCouponsCreated: 240,
    isActive: true,
    topReferrers: [
      {
        user: {
          id: 'user-top-1',
          name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          referralCode: 'REF-NVA-01',
        },
        referralCount: 25,
      },
      {
        user: {
          id: 'user-top-2',
          name: null,
          referralCode: null,
        },
        referralCount: 10,
      },
      {
        user: null,
        referralCount: 4,
      },
    ],
  };

  const mockReferralItems: ReferralListItem[] = [
    {
      id: 'ref-item-001',
      referrerId: 'user-top-1',
      refereeId: 'user-referee-1',
      referrerCouponCode: 'CPN-REF-A',
      refereeCouponCode: 'CPN-FEE-B',
      createdAt: '2026-02-10T10:00:00.000Z',
      referrer: {
        id: 'user-top-1',
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        referralCode: 'REF-NVA-01',
      },
      referee: {
        id: 'user-referee-1',
        name: 'Lê Thị C',
        email: 'lethic@example.com',
        createdAt: '2026-02-10T09:00:00.000Z',
      },
    },
    {
      id: 'ref-item-002',
      referrerId: 'user-top-2',
      refereeId: 'user-referee-2',
      referrerCouponCode: null,
      refereeCouponCode: null,
      createdAt: '2026-02-11T11:00:00.000Z',
      referrer: {
        id: 'user-top-2',
        name: null,
        email: null,
        referralCode: null,
      },
      referee: {
        id: 'user-referee-2',
        name: null,
        createdAt: '2026-02-11T10:30:00.000Z',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('fetches config successfully with wrapped response (.data.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockConfig,
        },
      });

      const result = await adminReferralsApi.getConfig();

      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/config');
      expect(result).toEqual(mockConfig);
    });

    it('fetches config successfully with unwrapped response (.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockConfig,
      });

      const result = await adminReferralsApi.getConfig();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/config');
      expect(result).toEqual(mockConfig);
    });

    it('handles FREESHIP coupon type and nullable fields in config', async () => {
      const freeShipConfig: ReferralConfig = {
        ...mockConfig,
        referrerCouponType: 'FREESHIP',
        refereeCouponType: 'FREESHIP',
        referrerMaxDiscount: null,
        refereeMaxDiscount: null,
        minOrderForCoupon: null,
        maxReferralsPerUser: null,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: freeShipConfig,
        },
      });

      const result = await adminReferralsApi.getConfig();
      expect(result.referrerCouponType).toBe('FREESHIP');
      expect(result.refereeCouponType).toBe('FREESHIP');
      expect(result.referrerMaxDiscount).toBeNull();
      expect(result.maxReferralsPerUser).toBeNull();
    });

    it('propagates error when apiClient.get fails', async () => {
      const networkError = new Error('Lỗi tải cấu hình giới thiệu');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      await expect(adminReferralsApi.getConfig()).rejects.toThrow(
        'Lỗi tải cấu hình giới thiệu',
      );
      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/config');
    });

    it('throws validation error when backend returns invalid config structure', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            id: 'cfg-invalid',
            referrerCouponType: 'UNKNOWN_TYPE',
          },
        },
      });

      await expect(adminReferralsApi.getConfig()).rejects.toThrow();
    });
  });

  describe('updateConfig', () => {
    it('updates config successfully with wrapped response (.data.data)', async () => {
      const updatePayload: Partial<ReferralConfig> = {
        active: false,
        couponValidDays: 60,
      };

      const updatedConfig: ReferralConfig = {
        ...mockConfig,
        active: false,
        couponValidDays: 60,
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: {
          data: updatedConfig,
        },
      });

      const result = await adminReferralsApi.updateConfig(updatePayload);

      expect(mockedApiClient.put).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/referrals/config',
        updatePayload,
      );
      expect(result).toEqual(updatedConfig);
    });

    it('updates config successfully with unwrapped response (.data)', async () => {
      const updatePayload: Partial<ReferralConfig> = {
        referrerCouponValue: 20,
      };

      const updatedConfig: ReferralConfig = {
        ...mockConfig,
        referrerCouponValue: 20,
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: updatedConfig,
      });

      const result = await adminReferralsApi.updateConfig(updatePayload);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/referrals/config',
        updatePayload,
      );
      expect(result).toEqual(updatedConfig);
    });

    it('propagates error when apiClient.put fails', async () => {
      const updateError = new Error('Không thể cập nhật cấu hình');
      vi.mocked(apiClient.put).mockRejectedValueOnce(updateError);

      await expect(
        adminReferralsApi.updateConfig({ active: true }),
      ).rejects.toThrow('Không thể cập nhật cấu hình');

      expect(mockedApiClient.put).toHaveBeenCalledWith('/referrals/config', {
        active: true,
      });
    });

    it('throws validation error when update response data is invalid', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: {
          data: {
            invalidField: true,
          },
        },
      });

      await expect(
        adminReferralsApi.updateConfig({ active: true }),
      ).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('fetches referral stats successfully with wrapped response (.data.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockStats,
        },
      });

      const result = await adminReferralsApi.getStats();

      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/stats');
      expect(result.totalReferrals).toBe(120);
      expect(result.totalCouponsCreated).toBe(240);
      expect(result.isActive).toBe(true);
      expect(result.topReferrers).toHaveLength(3);
      expect(result.topReferrers[0].user?.name).toBe('Nguyễn Văn A');
      expect(result.topReferrers[1].user?.email).toBeUndefined();
      expect(result.topReferrers[2].user).toBeNull();
    });

    it('fetches referral stats successfully with unwrapped response (.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockStats,
      });

      const result = await adminReferralsApi.getStats();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/stats');
      expect(result).toEqual(mockStats);
    });

    it('propagates error when apiClient.get fails for getStats', async () => {
      const statsError = new Error('Lỗi tải thống kê');
      vi.mocked(apiClient.get).mockRejectedValueOnce(statsError);

      await expect(adminReferralsApi.getStats()).rejects.toThrow(
        'Lỗi tải thống kê',
      );
      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/stats');
    });

    it('throws validation error when backend returns invalid stats structure', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            totalReferrals: 'invalid-number',
          },
        },
      });

      await expect(adminReferralsApi.getStats()).rejects.toThrow();
    });
  });

  describe('getReferrals', () => {
    it('fetches referrals list with default pagination params (page = 1, limit = 20) and wrapped data', async () => {
      const rawListResponse = {
        data: mockReferralItems,
        total: 50,
        page: 1,
        totalPages: 3,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: rawListResponse,
        },
      });

      const result = await adminReferralsApi.getReferrals();

      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/list', {
        params: { page: 1, limit: 20 },
      });
      expect(result.total).toBe(50);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].referrerCouponCode).toBe('CPN-REF-A');
      expect(result.data[1].referrerCouponCode).toBeNull();
    });

    it('fetches referrals list with custom pagination parameters and unwrapped data', async () => {
      const rawListResponse = {
        data: mockReferralItems,
        total: 100,
        page: 4,
        totalPages: 10,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: rawListResponse,
        },
      });

      const result = await adminReferralsApi.getReferrals(4, 10);

      expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/list', {
        params: { page: 4, limit: 10 },
      });
      expect(result.total).toBe(100);
      expect(result.page).toBe(4);
      expect(result.totalPages).toBe(10);
      expect(result.data).toHaveLength(2);
    });

    it('propagates error when apiClient.get fails for getReferrals', async () => {
      const listError = new Error('Lỗi tải danh sách người giới thiệu');
      vi.mocked(apiClient.get).mockRejectedValueOnce(listError);

      await expect(adminReferralsApi.getReferrals()).rejects.toThrow(
        'Lỗi tải danh sách người giới thiệu',
      );
      expect(mockedApiClient.get).toHaveBeenCalledWith('/referrals/list', {
        params: { page: 1, limit: 20 },
      });
    });

    it('throws validation error when referral list items have invalid schema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [
              {
                id: 'bad-item',
                // missing required fields: referrerId, refereeId, referrer, referee, etc.
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          },
        },
      });

      await expect(adminReferralsApi.getReferrals()).rejects.toThrow();
    });
  });
});
