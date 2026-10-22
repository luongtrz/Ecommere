import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useProducts,
  useProductSearch,
  useInfiniteProducts,
  useInfiniteAdminProducts,
} from './useProducts';
import {
  productsApi,
  type ProductFilters,
  type ProductsResponse,
} from '../api/products.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../api/products.api', () => ({
  productsApi: {
    getAll: vi.fn(),
    getAllAdmin: vi.fn(),
    getBySlug: vi.fn(),
    search: vi.fn(),
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

const mockProduct = {
  id: 'prod-1',
  name: 'Xịt Thơm Quần Áo Hoa Hồng',
  slug: 'xit-thom-quan-ao-hoa-hong',
  description: 'Mùi hương hoa hồng ngọt ngào dịu nhẹ',
  images: ['/images/rose.jpg'],
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Xịt Quần Áo', slug: 'xit-quan-ao' },
  variants: [
    {
      id: 'var-1',
      scent: 'Hoa Hồng',
      volumeMl: 150,
      price: 160000,
      salePrice: 135000,
      stock: 30,
      sku: 'XQA-HH-150',
      barcode: '893111222333',
    },
  ],
  basePrice: 160000,
  active: true,
  rating: 4.8,
  reviewCount: 20,
  createdAt: '2026-01-10T00:00:00.000Z',
};

const mockPage1Response: ProductsResponse = {
  products: [mockProduct],
  total: 2,
  page: 1,
  limit: 20,
  totalPages: 2,
};

const mockPage2Response: ProductsResponse = {
  products: [
    {
      ...mockProduct,
      id: 'prod-2',
      name: 'Xịt Thơm Phòng Bạc Hà',
      slug: 'xit-thom-phong-bac-ha',
    },
  ],
  total: 2,
  page: 2,
  limit: 20,
  totalPages: 2,
};

const mockSinglePageResponse: ProductsResponse = {
  products: [mockProduct],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products with default filters when called without arguments', async () => {
    vi.mocked(productsApi.getAll).mockResolvedValueOnce(mockSinglePageResponse);

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledTimes(1);
    expect(productsApi.getAll).toHaveBeenCalledWith({});
    expect(result.current.data).toEqual(mockSinglePageResponse);
  });

  it('fetches products with custom filters when provided', async () => {
    vi.mocked(productsApi.getAll).mockResolvedValueOnce(mockSinglePageResponse);

    const customFilters: ProductFilters = {
      sortBy: 'best_selling',
      limit: 8,
      categoryId: 'cat-1',
    };

    const { result } = renderHook(() => useProducts(customFilters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledTimes(1);
    expect(productsApi.getAll).toHaveBeenCalledWith(customFilters);
    expect(result.current.data).toEqual(mockSinglePageResponse);
  });

  it('handles error state when productsApi.getAll rejects', async () => {
    const error = new Error('Lỗi tải danh sách sản phẩm');
    vi.mocked(productsApi.getAll).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useProductSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches products with query and default filters when called without filters', async () => {
    vi.mocked(productsApi.search).mockResolvedValueOnce(mockSinglePageResponse);

    const { result } = renderHook(() => useProductSearch('hoa hong'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.search).toHaveBeenCalledTimes(1);
    expect(productsApi.search).toHaveBeenCalledWith('hoa hong', {});
    expect(result.current.data).toEqual(mockSinglePageResponse);
  });

  it('searches products with query and custom filters', async () => {
    vi.mocked(productsApi.search).mockResolvedValueOnce(mockSinglePageResponse);

    const filters: ProductFilters = {
      sortBy: 'price_asc',
      minPrice: 50000,
    };

    const { result } = renderHook(() => useProductSearch('bac ha', filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.search).toHaveBeenCalledWith('bac ha', filters);
    expect(result.current.data).toEqual(mockSinglePageResponse);
  });

  it('disables query and does not call productsApi.search when query is empty string', () => {
    const { result } = renderHook(() => useProductSearch(''), {
      wrapper: createWrapper(),
    });

    expect(productsApi.search).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('handles search error when productsApi.search rejects', async () => {
    const error = new Error('Lỗi tìm kiếm sản phẩm');
    vi.mocked(productsApi.search).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useProductSearch('hoa'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useInfiniteProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches initial page with default filters and paginates to next page when page < totalPages', async () => {
    vi.mocked(productsApi.getAll)
      .mockResolvedValueOnce(mockPage1Response)
      .mockResolvedValueOnce(mockPage2Response);

    const { result } = renderHook(() => useInfiniteProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledTimes(1);
    expect(productsApi.getAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(result.current.hasNextPage).toBe(true);

    // Fetch next page
    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

    expect(productsApi.getAll).toHaveBeenCalledTimes(2);
    expect(productsApi.getAll).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
    // On page 2, page === totalPages, so hasNextPage should be false
    expect(result.current.hasNextPage).toBe(false);
  });

  it('fetches initial page with custom filters and stops pagination when page >= totalPages', async () => {
    vi.mocked(productsApi.getAll).mockResolvedValueOnce(mockSinglePageResponse);

    const filters: ProductFilters = {
      categoryId: 'cat-1',
      sortBy: 'newest',
    };

    const { result } = renderHook(() => useInfiniteProducts(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      sortBy: 'newest',
      page: 1,
      limit: 20,
    });

    // Single page response has page: 1, totalPages: 1 -> next page is undefined
    expect(result.current.hasNextPage).toBe(false);
  });

  it('handles error state when productsApi.getAll rejects in infinite query', async () => {
    const error = new Error('Lỗi infinite query');
    vi.mocked(productsApi.getAll).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useInfiniteProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});

describe('useInfiniteAdminProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches initial page of admin products with default filters and paginates to next page', async () => {
    vi.mocked(productsApi.getAllAdmin)
      .mockResolvedValueOnce(mockPage1Response)
      .mockResolvedValueOnce(mockPage2Response);

    const { result } = renderHook(() => useInfiniteAdminProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAllAdmin).toHaveBeenCalledTimes(1);
    expect(productsApi.getAllAdmin).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
    expect(result.current.hasNextPage).toBe(true);

    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

    expect(productsApi.getAllAdmin).toHaveBeenCalledTimes(2);
    expect(productsApi.getAllAdmin).toHaveBeenLastCalledWith({
      page: 2,
      limit: 20,
    });
    expect(result.current.hasNextPage).toBe(false);
  });

  it('fetches admin products with custom filters and identifies final page', async () => {
    vi.mocked(productsApi.getAllAdmin).mockResolvedValueOnce(
      mockSinglePageResponse,
    );

    const filters: ProductFilters = {
      search: 'hoa',
      sortBy: 'price_desc',
    };

    const { result } = renderHook(() => useInfiniteAdminProducts(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAllAdmin).toHaveBeenCalledWith({
      search: 'hoa',
      sortBy: 'price_desc',
      page: 1,
      limit: 20,
    });
    expect(result.current.hasNextPage).toBe(false);
  });

  it('handles error state when productsApi.getAllAdmin rejects', async () => {
    const error = new Error('Lỗi infinite admin query');
    vi.mocked(productsApi.getAllAdmin).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useInfiniteAdminProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });
});
