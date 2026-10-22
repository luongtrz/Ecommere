import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCategories,
  useCategoryBySlug,
  useCategoryTree,
} from './useCategories';
import {
  categoriesApi,
  type Category,
  type CategoryTreeNode,
} from '../api/categories.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
    getTree: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Xịt thơm phòng',
    slug: 'xit-thom-phong',
    description: 'Hương thơm cao cấp',
    parentId: null,
  },
  {
    id: 'cat-2',
    name: 'Đuổi chuột & Côn trùng',
    slug: 'duoi-chuot-con-trung',
    parentId: null,
  },
];

const mockCategory: Category = {
  id: 'cat-1',
  name: 'Xịt thơm phòng',
  slug: 'xit-thom-phong',
  description: 'Hương thơm phòng thư giãn',
  parentId: null,
};

const mockCategoryTree: CategoryTreeNode[] = [
  {
    id: 'cat-1',
    name: 'Xịt thơm phòng',
    slug: 'xit-thom-phong',
    parentId: null,
    productCount: 12,
    isLeaf: false,
    children: [
      {
        id: 'cat-1-1',
        name: 'Xịt phòng tự động',
        slug: 'xit-phong-tu-dong',
        parentId: 'cat-1',
        productCount: 6,
        children: [],
        isLeaf: true,
      },
    ],
  },
];

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches categories list successfully', async () => {
    vi.mocked(categoriesApi.getAll).mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockCategories);
  });

  it('handles error when categoriesApi.getAll fails', async () => {
    const error = new Error('Lỗi tải danh sách danh mục');
    vi.mocked(categoriesApi.getAll).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useCategoryBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches category by slug when a valid slug is provided', async () => {
    vi.mocked(categoriesApi.getBySlug).mockResolvedValueOnce(mockCategory);

    const { result } = renderHook(() => useCategoryBySlug('xit-thom-phong'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.getBySlug).toHaveBeenCalledTimes(1);
    expect(categoriesApi.getBySlug).toHaveBeenCalledWith('xit-thom-phong');
    expect(result.current.data).toEqual(mockCategory);
  });

  it('does not execute query when slug is empty string', () => {
    const { result } = renderHook(() => useCategoryBySlug(''), {
      wrapper: createWrapper(),
    });

    expect(categoriesApi.getBySlug).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('handles error when categoriesApi.getBySlug fails', async () => {
    const error = new Error('Không tìm thấy danh mục');
    vi.mocked(categoriesApi.getBySlug).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCategoryBySlug('khong-ton-tai'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useCategoryTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches category tree successfully', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValueOnce(mockCategoryTree);

    const { result } = renderHook(() => useCategoryTree(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.getTree).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockCategoryTree);
  });

  it('handles error when categoriesApi.getTree fails', async () => {
    const error = new Error('Lỗi lấy cây danh mục');
    vi.mocked(categoriesApi.getTree).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCategoryTree(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
