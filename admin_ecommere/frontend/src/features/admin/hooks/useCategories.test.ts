import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type QueryObserverOptions,
} from '@tanstack/react-query';
import { useCategories } from './useCategories';
import { categoriesApi, type Category } from '../api/categories.api';
import { QUERY_KEYS } from '@/lib/constants';

vi.mock('../api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    getTree: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
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

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Xịt khử mùi',
    slug: 'xit-khu-mui',
    productCount: 15,
    isLeaf: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'Xịt thơm phòng',
    slug: 'xit-thom-phong',
    parentId: 'cat-1',
    productCount: 8,
    isLeaf: true,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-04T00:00:00.000Z',
  },
];

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading state when query is initiated', () => {
    vi.mocked(categoriesApi.getAll).mockReturnValue(new Promise(() => {}));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns categories list successfully', async () => {
    vi.mocked(categoriesApi.getAll).mockResolvedValue(mockCategories);
    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(categoriesApi.getAll).toHaveBeenCalledTimes(1);
    expect(categoriesApi.getAll).toHaveBeenCalledWith();
    expect(result.current.data).toEqual(mockCategories);
    expect(queryClient.getQueryData([QUERY_KEYS.CATEGORIES])).toEqual(
      mockCategories,
    );
  });

  it('configures staleTime to 30 minutes (1800000ms) and uses QUERY_KEYS.CATEGORIES', async () => {
    vi.mocked(categoriesApi.getAll).mockResolvedValue(mockCategories);
    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const query = queryClient
      .getQueryCache()
      .find({ queryKey: [QUERY_KEYS.CATEGORIES] });

    expect(query).toBeDefined();
    const observer = query?.observers[0];
    expect(observer?.options.staleTime).toBe(30 * 60 * 1000);
    expect(
      (query?.options as QueryObserverOptions | undefined)?.staleTime,
    ).toBe(30 * 60 * 1000);
    expect(query?.queryKey).toEqual([QUERY_KEYS.CATEGORIES]);
  });

  it('handles empty category list response', async () => {
    vi.mocked(categoriesApi.getAll).mockResolvedValue([]);
    const { wrapper, queryClient } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.data).toHaveLength(0);
    expect(queryClient.getQueryData([QUERY_KEYS.CATEGORIES])).toEqual([]);
  });

  it('handles error state when categoriesApi.getAll fails', async () => {
    const error = new Error('Lỗi khi tải danh sách danh mục');
    vi.mocked(categoriesApi.getAll).mockRejectedValue(error);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(categoriesApi.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });
});
