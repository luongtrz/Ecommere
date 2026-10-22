import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './constants';
import { categoriesApi } from '@/features/catalog/api/categories.api';
import { queryClient } from './queryClient';

vi.mock('@/lib/api', () => ({
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
    getTree: vi.fn().mockResolvedValue([
      {
        id: 'tree-1',
        name: 'Xịt Thơm Phòng',
        slug: 'xit-thom-phong',
        parentId: null,
        productCount: 15,
        children: [],
        isLeaf: true,
      },
    ]),
    getBySlug: vi.fn(),
  },
}));

describe('queryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('configuration and defaultOptions', () => {
    it('is an instance of QueryClient', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('sets defaultOptions queries with retry 1 and window/reconnect refetch disabled', () => {
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
    it('registers prefetch query for categories list with key [QUERY_KEYS.CATEGORIES]', () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      expect(query).toBeDefined();
      expect(
        (query?.options as { staleTime?: number } | undefined)?.staleTime,
      ).toBe(30 * 60 * 1000);
    });

    it('registers prefetch query for categories tree with key [QUERY_KEYS.CATEGORIES, "tree"]', () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES, 'tree'],
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

      const result = await (queryFn as any)();
      expect(categoriesApi.getAll).toHaveBeenCalled();
      expect(result).toEqual([
        { id: 'cat-1', name: 'Xịt Thơm Phòng', slug: 'xit-thom-phong' },
      ]);
    });

    it('executes categories tree queryFn calling categoriesApi.getTree() and returns category tree', async () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES, 'tree'],
      });
      const queryFn = query?.options.queryFn;
      expect(queryFn).toBeDefined();

      const result = await (queryFn as any)();
      expect(categoriesApi.getTree).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'tree-1',
          name: 'Xịt Thơm Phòng',
          slug: 'xit-thom-phong',
          parentId: null,
          productCount: 15,
          children: [],
          isLeaf: true,
        },
      ]);
    });

    it('propagates error when categoriesApi.getAll() fails', async () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      const queryFn = query?.options.queryFn;

      vi.mocked(categoriesApi.getAll).mockRejectedValueOnce(
        new Error('Lỗi kết nối khi tải danh mục'),
      );
      await expect((queryFn as any)()).rejects.toThrow(
        'Lỗi kết nối khi tải danh mục',
      );
    });

    it('propagates error when categoriesApi.getTree() fails', async () => {
      const query = queryClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES, 'tree'],
      });
      const queryFn = query?.options.queryFn;

      vi.mocked(categoriesApi.getTree).mockRejectedValueOnce(
        new Error('Lỗi kết nối khi tải cây danh mục'),
      );
      await expect((queryFn as any)()).rejects.toThrow(
        'Lỗi kết nối khi tải cây danh mục',
      );
    });
  });

  describe('module initialization with fresh instance', () => {
    it('creates queryClient and triggers prefetch queries during module evaluation', async () => {
      vi.resetModules();
      const mockGetAll = vi.fn().mockResolvedValue([]);
      const mockGetTree = vi.fn().mockResolvedValue([]);

      vi.doMock('@/features/catalog/api/categories.api', () => ({
        categoriesApi: {
          getAll: mockGetAll,
          getTree: mockGetTree,
          getBySlug: vi.fn(),
        },
      }));

      const { queryClient: freshClient } = await import('./queryClient');
      expect(freshClient).toBeInstanceOf(QueryClient);

      const catQuery = freshClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      const treeQuery = freshClient.getQueryCache().find({
        queryKey: [QUERY_KEYS.CATEGORIES, 'tree'],
      });

      expect(catQuery).toBeDefined();
      expect(treeQuery).toBeDefined();

      await (catQuery?.options.queryFn as any)();
      expect(mockGetAll).toHaveBeenCalled();

      await (treeQuery?.options.queryFn as any)();
      expect(mockGetTree).toHaveBeenCalled();
    });
  });
});
