import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts, useProductSearch } from './useProducts';
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
}));

vi.mock('../api/products.api', () => ({
  productsApi: {
    getAll: vi.fn(),
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
  name: 'Xịt Thơm Phòng Hoa Nhài',
  slug: 'xit-thom-phong-hoa-nhai',
  description: 'Hương thơm hoa nhài tự nhiên',
  images: ['/images/nhai.jpg'],
  categoryId: 'cat-1',
  category: { id: 'cat-1', name: 'Xịt thơm phòng', slug: 'xit-thom-phong' },
  variants: [
    {
      id: 'var-1',
      scent: 'Hoa Nhài',
      volumeMl: 100,
      price: 150000,
      salePrice: 120000,
      stock: 50,
      sku: 'XTP-HN-100',
    },
  ],
  basePrice: 150000,
  rating: 4.8,
  averageRating: 4.8,
  reviewCount: 12,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockProductsResponse: ProductsResponse = {
  products: [mockProduct],
  total: 1,
  page: 1,
  limit: 12,
  totalPages: 1,
  hasNextPage: false,
};

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products with default filters and options when called without arguments', async () => {
    vi.mocked(productsApi.getAll).mockResolvedValueOnce(mockProductsResponse);

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledTimes(1);
    expect(productsApi.getAll).toHaveBeenCalledWith({});
    expect(result.current.data).toEqual(mockProductsResponse);
  });

  it('fetches products with custom filters when provided', async () => {
    vi.mocked(productsApi.getAll).mockResolvedValueOnce(mockProductsResponse);

    const customFilters: ProductFilters = {
      categorySlug: 'xit-thom-phong',
      page: 2,
      limit: 10,
      sortBy: 'price_asc',
    };

    const { result } = renderHook(() => useProducts(customFilters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledTimes(1);
    expect(productsApi.getAll).toHaveBeenCalledWith(customFilters);
    expect(result.current.data).toEqual(mockProductsResponse);
  });

  it('fetches products when options.enabled is explicitly true', async () => {
    vi.mocked(productsApi.getAll).mockResolvedValueOnce(mockProductsResponse);

    const { result } = renderHook(() => useProducts({}, { enabled: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledWith({});
    expect(result.current.data).toEqual(mockProductsResponse);
  });

  it('defaults enabled to true when options.enabled is undefined', async () => {
    vi.mocked(productsApi.getAll).mockResolvedValueOnce(mockProductsResponse);

    const { result } = renderHook(
      () => useProducts({}, { enabled: undefined }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.getAll).toHaveBeenCalledWith({});
    expect(result.current.data).toEqual(mockProductsResponse);
  });

  it('does not fetch products when options.enabled is false', () => {
    const { result } = renderHook(() => useProducts({}, { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(productsApi.getAll).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('handles API errors when getAll rejects', async () => {
    const error = new Error('Lỗi tải sản phẩm');
    vi.mocked(productsApi.getAll).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('preserves previous data using placeholderData during filter transitions', async () => {
    let resolvePage2: (data: ProductsResponse) => void;
    const page2Promise = new Promise<ProductsResponse>((resolve) => {
      resolvePage2 = resolve;
    });

    vi.mocked(productsApi.getAll)
      .mockResolvedValueOnce(mockProductsResponse)
      .mockImplementationOnce(() => page2Promise);

    const { result, rerender } = renderHook(
      ({ filters }: { filters: ProductFilters }) => useProducts(filters),
      {
        initialProps: { filters: { page: 1 } },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProductsResponse);

    // Trigger filter change to page 2
    rerender({ filters: { page: 2 } });

    // placeholderData preserves previousData while fetching
    expect(result.current.data).toEqual(mockProductsResponse);
    expect(result.current.isPlaceholderData).toBe(true);

    const page2Response: ProductsResponse = {
      ...mockProductsResponse,
      page: 2,
      products: [
        {
          ...mockProduct,
          id: 'prod-2',
          name: 'Xịt Thơm Hoa Hồng',
          slug: 'xit-thom-hoa-hong',
        },
      ],
    };
    resolvePage2!(page2Response);

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data).toEqual(page2Response);
  });
});

describe('useProductSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches products with query and default filters and page', async () => {
    vi.mocked(productsApi.search).mockResolvedValueOnce(mockProductsResponse);

    const { result } = renderHook(() => useProductSearch('hoa nhai'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.search).toHaveBeenCalledTimes(1);
    expect(productsApi.search).toHaveBeenCalledWith('hoa nhai', { page: 1 });
    expect(result.current.data).toEqual(mockProductsResponse);
  });

  it('does not search products when query is empty string', () => {
    const { result } = renderHook(() => useProductSearch(''), {
      wrapper: createWrapper(),
    });

    expect(productsApi.search).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('uses page argument when filters.page is not specified', async () => {
    vi.mocked(productsApi.search).mockResolvedValueOnce(mockProductsResponse);

    const { result } = renderHook(
      () => useProductSearch('hoa', { sortBy: 'price_asc' }, 3),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.search).toHaveBeenCalledWith('hoa', {
      sortBy: 'price_asc',
      page: 3,
    });
    expect(result.current.data).toEqual(mockProductsResponse);
  });

  it('prioritizes filters.page over page argument when filterPage is defined', async () => {
    vi.mocked(productsApi.search).mockResolvedValueOnce(mockProductsResponse);

    const { result } = renderHook(
      () =>
        useProductSearch('hoa', { page: 5, categorySlug: 'xit-thom-phong' }, 2),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(productsApi.search).toHaveBeenCalledWith('hoa', {
      categorySlug: 'xit-thom-phong',
      page: 5,
    });
    expect(result.current.data).toEqual(mockProductsResponse);
  });

  it('handles search API errors when productsApi.search rejects', async () => {
    const error = new Error('Tìm kiếm thất bại');
    vi.mocked(productsApi.search).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useProductSearch('hoa'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('preserves previous search results using placeholderData during query transitions', async () => {
    let resolveSearch2: (data: ProductsResponse) => void;
    const search2Promise = new Promise<ProductsResponse>((resolve) => {
      resolveSearch2 = resolve;
    });

    vi.mocked(productsApi.search)
      .mockResolvedValueOnce(mockProductsResponse)
      .mockImplementationOnce(() => search2Promise);

    const { result, rerender } = renderHook(
      ({ q, p }: { q: string; p: number }) => useProductSearch(q, {}, p),
      {
        initialProps: { q: 'hoa nhai', p: 1 },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProductsResponse);

    // Trigger new search query
    rerender({ q: 'hoa hong', p: 1 });

    expect(result.current.data).toEqual(mockProductsResponse);
    expect(result.current.isPlaceholderData).toBe(true);

    const search2Response: ProductsResponse = {
      ...mockProductsResponse,
      products: [
        {
          ...mockProduct,
          id: 'prod-2',
          name: 'Xịt Thơm Hoa Hồng',
          slug: 'xit-thom-hoa-hong',
        },
      ],
    };
    resolveSearch2!(search2Response);

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data).toEqual(search2Response);
  });
});
