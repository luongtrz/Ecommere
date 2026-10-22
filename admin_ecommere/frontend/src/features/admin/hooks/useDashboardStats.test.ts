import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDashboardStats } from '../api/admin.api';
import type { DashboardStats } from '../api/admin.types';
import { useDashboardStats } from './useDashboardStats';

vi.mock('../api/admin.api', () => ({
  getDashboardStats: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { wrapper, queryClient };
}

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStats: DashboardStats = {
    revenue: {
      totalRevenue: 500000000,
      monthlyRevenue: 45000000,
      monthlyChange: 15.2,
    },
    orders: {
      totalOrders: 1250,
      monthlyOrders: 150,
      monthlyChange: -2.4,
      pendingOrders: 18,
      shippingOrders: 32,
    },
    products: {
      totalProducts: 120,
      activeProducts: 110,
      newProductsThisMonth: 8,
      lowStockProducts: 5,
    },
    customers: {
      totalCustomers: 980,
      newCustomersThisMonth: 45,
      monthlyChange: 10.5,
    },
    recentOrders: [
      {
        id: 'ord-1',
        orderNumber: 'ORD-2026-001',
        customerName: 'Nguyễn Văn A',
        totalAmount: 1500000,
        status: 'PAID',
        createdAt: new Date('2026-03-15T09:30:00Z'),
      },
      {
        id: 'ord-2',
        orderNumber: 'ORD-2026-002',
        customerName: 'Trần Thị B',
        totalAmount: 750000,
        status: 'PENDING_PAYMENT',
        createdAt: new Date('2026-03-15T11:00:00Z'),
      },
    ],
    topProducts: [
      {
        id: 'prod-1',
        name: 'Nước hoa Charme King 100ml',
        imageUrl: '/images/charme-king.jpg',
        soldQuantity: 150,
        revenue: 75000000,
      },
      {
        id: 'prod-2',
        name: 'Chai xịt khử mùi phòng 300ml',
        imageUrl: null,
        soldQuantity: 95,
        revenue: 19000000,
      },
    ],
    revenueHistory: [
      { name: 'Tháng 1', total: 38000000 },
      { name: 'Tháng 2', total: 42000000 },
      { name: 'Tháng 3', total: 45000000 },
    ],
  };

  it('indicates pending/loading state while dashboard stats are fetching', () => {
    let resolvePromise: (value: DashboardStats) => void;
    const pendingPromise = new Promise<DashboardStats>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(getDashboardStats).mockReturnValueOnce(pendingPromise);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPending).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();

    // Clean up unresolved promise
    resolvePromise!(mockStats);
  });

  it('fetches and returns dashboard stats successfully', async () => {
    vi.mocked(getDashboardStats).mockResolvedValueOnce(mockStats);

    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(mockStats);
    expect(getDashboardStats).toHaveBeenCalledTimes(1);

    // Verify cache content
    const cachedData = queryClient.getQueryData(['admin', 'dashboard-stats']);
    expect(cachedData).toEqual(mockStats);
  });

  it('handles error state when getDashboardStats rejects', async () => {
    const errorInstance = new Error('Lỗi máy chủ khi tải thống kê');
    vi.mocked(getDashboardStats).mockRejectedValueOnce(errorInstance);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual(errorInstance);
    expect(result.current.data).toBeUndefined();
    expect(getDashboardStats).toHaveBeenCalledTimes(1);
  });

  it('uses the configured queryKey and staleTime options (5 minutes)', async () => {
    vi.mocked(getDashboardStats).mockResolvedValueOnce(mockStats);

    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: ['admin', 'dashboard-stats'] });

    expect(query).toBeDefined();
    expect(
      (query?.options as { staleTime?: number } | undefined)?.staleTime,
    ).toBe(5 * 60 * 1000); // 300,000 ms
    expect(query?.queryKey).toEqual(['admin', 'dashboard-stats']);
  });

  it('triggers a refetch when refetch() is invoked', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue(mockStats);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDashboardStats).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    expect(getDashboardStats).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(mockStats);
  });

  it('handles empty stats state correctly', async () => {
    const emptyStats: DashboardStats = {
      revenue: { totalRevenue: 0, monthlyRevenue: 0, monthlyChange: 0 },
      orders: {
        totalOrders: 0,
        monthlyOrders: 0,
        monthlyChange: 0,
        pendingOrders: 0,
        shippingOrders: 0,
      },
      products: {
        totalProducts: 0,
        activeProducts: 0,
        newProductsThisMonth: 0,
        lowStockProducts: 0,
      },
      customers: {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        monthlyChange: 0,
      },
      recentOrders: [],
      topProducts: [],
      revenueHistory: [],
    };

    vi.mocked(getDashboardStats).mockResolvedValueOnce(emptyStats);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.recentOrders).toHaveLength(0);
    expect(result.current.data?.topProducts).toHaveLength(0);
    expect(result.current.data?.revenueHistory).toHaveLength(0);
    expect(result.current.data?.revenue.totalRevenue).toBe(0);
  });
});
