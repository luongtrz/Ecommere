import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './constants';
import { categoriesApi } from '@/features/catalog/api/categories.api';

const { mockRegisterQueryCacheClear, capturedCallbacks } = vi.hoisted(() => {
  const callbacks: Array<() => void> = [];
  const fn = vi.fn((clear: () => void) => {
    callbacks.push(clear);
  });
  return {
    mockRegisterQueryCacheClear: fn,
    capturedCallbacks: callbacks,
  };
});

vi.mock('./api', () => ({
  registerQueryCacheClear: (clear: () => void) =>
    mockRegisterQueryCacheClear(clear),
}));

vi.mock('@/lib/api', () => ({
  registerQueryCacheClear: (clear: () => void) =>
    mockRegisterQueryCacheClear(clear),
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('@/features/catalog/api/categories.api', () => ({
  categoriesApi: {
    getAll: vi
      .fn()
      .mockResolvedValue([
        { id: 'cat-1', name: 'Xịt Thơm Phòng', slug: 'xit-thom-phong' },
      ]),
    getBySlug: vi.fn(),
  },
}));

import { queryClient } from './queryClient';

describe('queryClient', () => {
  beforeEach(() => {
    vi.mocked(categoriesApi.getAll).mockClear();
  });

  describe('configuration and defaultOptions', () => {
    it('is an instance of QueryClient', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('sets defaultOptions queries with retry 1, refetch disabled, and custom stale/gc times', () => {
      const queries = queryClient.getDefaultOptions().queries;
      expect(queries?.retry).toBe(1);
      expect(queries?.refetchOnWindowFocus).toBe(false);
      expect(queries?.refetchOnReconnect).toBe(false);
      expect(queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
      expect(queries?.gcTime).toBe(30 * 60 * 1000); // 30 minutes
    });

    it('sets defaultOptions mutations with retry 0', () => {
      const mutations = queryClient.getDefaultOptions().mutations;
      expect(mutations?.retry).toBe(0);
    });
  });

  describe('prefetchQuery execution', () => {
    it('registers prefetch query for categories list with key [QUERY_KEYS.CATEGORIES] and 30m staleTime', () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      expect(query).toBeDefined();
      expect(
        (query?.options as { staleTime?: number } | undefined)?.staleTime,
      ).toBe(30 * 60 * 1000);
    });

    it('executes categories queryFn calling categoriesApi.getAll() and returns category list', async () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      const queryFn = query?.options.queryFn;
      expect(queryFn).toBeDefined();

      const mockData = [
        { id: 'cat-1', name: 'Xịt Thơm Phòng', slug: 'xit-thom-phong' },
        { id: 'cat-2', name: 'Khử Mùi Ô Tô', slug: 'khu-mui-o-to' },
      ];
      vi.mocked(categoriesApi.getAll).mockResolvedValueOnce(mockData);

      const result = await (queryFn as any)();
      expect(categoriesApi.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('propagates error when categoriesApi.getAll() fails', async () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      const queryFn = query?.options.queryFn;
      expect(queryFn).toBeDefined();

      vi.mocked(categoriesApi.getAll).mockRejectedValueOnce(
        new Error('Lỗi kết nối khi tải danh mục'),
      );
      await expect((queryFn as any)()).rejects.toThrow(
        'Lỗi kết nối khi tải danh mục',
      );
    });
  });

  describe('registerQueryCacheClear', () => {
    it('registers a clear callback with registerQueryCacheClear', () => {
      expect(mockRegisterQueryCacheClear).toHaveBeenCalledWith(
        expect.any(Function),
      );
      expect(capturedCallbacks.length).toBeGreaterThan(0);
    });

    it('invokes queryClient.clear() when the registered clear callback is called', () => {
      const clearCallback = capturedCallbacks[0];
      expect(clearCallback).toBeDefined();

      const clearSpy = vi
        .spyOn(queryClient, 'clear')
        .mockImplementation(() => {});

      clearCallback();
      expect(clearSpy).toHaveBeenCalledTimes(1);

      clearSpy.mockRestore();
    });
  });

  describe('module initialization with fresh instance', () => {
    it('creates queryClient, registers cache clear, and triggers prefetch on evaluation', async () => {
      vi.resetModules();
      const freshRegisterClear = vi.fn();
      const mockGetAll = vi
        .fn()
        .mockResolvedValue([
          { id: 'fresh-1', name: 'Danh Mục Mới', slug: 'danh-muc-moi' },
        ]);

      vi.doMock('./api', () => ({
        registerQueryCacheClear: freshRegisterClear,
      }));
      vi.doMock('@/features/catalog/api/categories.api', () => ({
        categoriesApi: {
          getAll: mockGetAll,
          getBySlug: vi.fn(),
        },
      }));

      const { queryClient: freshClient } = await import('./queryClient');
      expect(freshClient).toBeInstanceOf(QueryClient);
      expect(freshRegisterClear).toHaveBeenCalledWith(expect.any(Function));

      // 1. Check prefetch query first while cache is intact
      const catQuery = freshClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      expect(catQuery).toBeDefined();
      expect(
        (catQuery?.options as { staleTime?: number } | undefined)?.staleTime,
      ).toBe(30 * 60 * 1000);

      const res = await (catQuery?.options.queryFn as any)();
      expect(mockGetAll).toHaveBeenCalled();
      expect(res).toEqual([
        { id: 'fresh-1', name: 'Danh Mục Mới', slug: 'danh-muc-moi' },
      ]);

      // 2. Set test query data in freshClient
      freshClient.setQueryData(['test-fresh-item'], { name: 'Item' });
      expect(freshClient.getQueryData(['test-fresh-item'])).toEqual({
        name: 'Item',
      });

      // 3. Invoke the registered callback on fresh instance
      const callback = freshRegisterClear.mock.calls[0][0];
      const clearSpy = vi.spyOn(freshClient, 'clear');
      callback();
      expect(clearSpy).toHaveBeenCalledTimes(1);

      // 4. Verify freshClient cache was cleared by callback
      expect(freshClient.getQueryData(['test-fresh-item'])).toBeUndefined();
      expect(
        freshClient.getQueryCache().find({
          queryKey: [QUERY_KEYS.CATEGORIES],
        }),
      ).toBeUndefined();
    });
  });
});
