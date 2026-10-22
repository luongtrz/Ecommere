import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  renderHook,
  cleanup,
} from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductDetail, usePrefetchProduct } from './useProductDetail';
import { productsApi, type Product } from '../api/products.api';
import { QUERY_KEYS } from '@/lib/constants';

vi.mock('../api/products.api', () => ({
  productsApi: {
    getBySlug: vi.fn(),
    getAll: vi.fn(),
    search: vi.fn(),
    getFilterOptions: vi.fn(),
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

const mockProduct: Product = {
  id: 'prod-001',
  name: 'Xịt Thơm Phòng Oải Hương',
  slug: 'xit-thom-phong-oai-huong',
  description: 'Hương thơm thư giãn từ tinh dầu lavender thiên nhiên',
  images: ['/images/lavender-1.jpg', '/images/lavender-2.jpg'],
  categoryId: 'cat-01',
  category: {
    id: 'cat-01',
    name: 'Xịt Phòng Tinh Dầu',
    slug: 'xit-phong-tinh-dau',
  },
  variants: [
    {
      id: 'var-001',
      scent: 'Hoa Lavender',
      volumeMl: 100,
      price: 150000,
      salePrice: 129000,
      stock: 50,
      sku: 'LAV-100',
    },
  ],
  basePrice: 150000,
  averageRating: 4.9,
  reviewCount: 38,
  createdAt: '2026-01-15T08:00:00Z',
  rating: 4.9,
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useProductDetail', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches product details successfully for a valid slug', async () => {
    vi.mocked(productsApi.getBySlug).mockResolvedValueOnce(mockProduct);

    const { result } = renderHook(
      () => useProductDetail('xit-thom-phong-oai-huong'),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(productsApi.getBySlug).toHaveBeenCalledTimes(1);
    expect(productsApi.getBySlug).toHaveBeenCalledWith(
      'xit-thom-phong-oai-huong',
    );
    expect(result.current.data).toEqual(mockProduct);
    expect(
      queryClient.getQueryData([
        QUERY_KEYS.PRODUCT_DETAIL,
        'xit-thom-phong-oai-huong',
      ]),
    ).toEqual(mockProduct);
  });

  it('handles API error state when fetching product fails', async () => {
    const errorObj = new Error('Sản phẩm không tồn tại hoặc đã bị ẩn');
    vi.mocked(productsApi.getBySlug).mockRejectedValueOnce(errorObj);

    const { result } = renderHook(() => useProductDetail('san-pham-loi'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(productsApi.getBySlug).toHaveBeenCalledWith('san-pham-loi');
    expect(result.current.error).toEqual(errorObj);
    expect(result.current.data).toBeUndefined();
  });

  it('does not trigger an API request when slug is an empty string (enabled: false)', () => {
    const { result } = renderHook(() => useProductDetail(''), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(productsApi.getBySlug).not.toHaveBeenCalled();
  });

  it('triggers a fetch when slug changes from empty to a valid slug', async () => {
    vi.mocked(productsApi.getBySlug).mockResolvedValueOnce(mockProduct);

    const { result, rerender } = renderHook(
      ({ slug }: { slug: string }) => useProductDetail(slug),
      {
        initialProps: { slug: '' },
        wrapper: createWrapper(queryClient),
      },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(productsApi.getBySlug).not.toHaveBeenCalled();

    rerender({ slug: 'xit-thom-phong-oai-huong' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(productsApi.getBySlug).toHaveBeenCalledWith(
      'xit-thom-phong-oai-huong',
    );
    expect(result.current.data).toEqual(mockProduct);
  });

  it('renders within a React component displaying loading, error, and success states with Vietnamese labels', async () => {
    vi.mocked(productsApi.getBySlug).mockResolvedValueOnce(mockProduct);

    function ProductDetailViewer({ slug }: { slug: string }) {
      const { data, isLoading, isError, error } = useProductDetail(slug);

      if (isLoading) {
        return createElement(
          'div',
          { 'data-testid': 'loading-state' },
          'Đang tải chi tiết sản phẩm...',
        );
      }
      if (isError) {
        return createElement(
          'div',
          { 'data-testid': 'error-state' },
          `Lỗi: ${(error as Error).message}`,
        );
      }
      if (!data) {
        return createElement(
          'div',
          { 'data-testid': 'empty-state' },
          'Không có thông tin sản phẩm',
        );
      }

      return createElement(
        'div',
        { 'data-testid': 'product-detail' },
        createElement('h1', { 'data-testid': 'product-name' }, data.name),
        createElement('p', { 'data-testid': 'product-desc' }, data.description),
        createElement(
          'span',
          { 'data-testid': 'product-price' },
          `${data.basePrice} đ`,
        ),
        createElement(
          'span',
          { 'data-testid': 'product-rating' },
          `Đánh giá: ${data.rating}`,
        ),
      );
    }

    const { rerender } = render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ProductDetailViewer, {
          slug: 'xit-thom-phong-oai-huong',
        }),
      ),
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Đang tải chi tiết sản phẩm...',
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-detail')).toBeInTheDocument();
    });

    expect(screen.getByTestId('product-name')).toHaveTextContent(
      'Xịt Thơm Phòng Oải Hương',
    );
    expect(screen.getByTestId('product-desc')).toHaveTextContent(
      'Hương thơm thư giãn từ tinh dầu lavender thiên nhiên',
    );
    expect(screen.getByTestId('product-price')).toHaveTextContent('150000 đ');
    expect(screen.getByTestId('product-rating')).toHaveTextContent(
      'Đánh giá: 4.9',
    );

    // Test error rendering
    const errorClient = createTestQueryClient();
    vi.mocked(productsApi.getBySlug).mockRejectedValueOnce(
      new Error('Lỗi kết nối máy chủ'),
    );

    rerender(
      createElement(
        QueryClientProvider,
        { client: errorClient },
        createElement(ProductDetailViewer, { slug: 'san-pham-loi' }),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent(
        'Lỗi: Lỗi kết nối máy chủ',
      );
    });

    // Test empty slug state
    rerender(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ProductDetailViewer, { slug: '' }),
      ),
    );

    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'Không có thông tin sản phẩm',
    );
  });
});

describe('usePrefetchProduct', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    cleanup();
  });

  it('prefetches product detail data and stores it in the queryClient cache', async () => {
    vi.mocked(productsApi.getBySlug).mockResolvedValueOnce(mockProduct);
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    const { result } = renderHook(() => usePrefetchProduct(), {
      wrapper: createWrapper(queryClient),
    });

    expect(typeof result.current).toBe('function');

    result.current('xit-thom-phong-oai-huong');

    expect(prefetchSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.PRODUCT_DETAIL, 'xit-thom-phong-oai-huong'],
      queryFn: expect.any(Function),
      staleTime: 5 * 60 * 1000,
    });

    await waitFor(() => {
      expect(productsApi.getBySlug).toHaveBeenCalledTimes(1);
      expect(productsApi.getBySlug).toHaveBeenCalledWith(
        'xit-thom-phong-oai-huong',
      );
    });

    await waitFor(() => {
      expect(
        queryClient.getQueryData([
          QUERY_KEYS.PRODUCT_DETAIL,
          'xit-thom-phong-oai-huong',
        ]),
      ).toEqual(mockProduct);
    });
  });

  it('handles user interaction triggering prefetch from a component', async () => {
    vi.mocked(productsApi.getBySlug).mockResolvedValueOnce(mockProduct);

    function ProductCardItem({ slug }: { slug: string }) {
      const prefetch = usePrefetchProduct();

      return createElement(
        'div',
        {
          'data-testid': 'product-card-item',
          onMouseEnter: () => prefetch(slug),
        },
        createElement(
          'button',
          { type: 'button', onClick: () => prefetch(slug) },
          'Xem nhanh sản phẩm',
        ),
      );
    }

    render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ProductCardItem, { slug: 'xit-thom-phong-oai-huong' }),
      ),
    );

    const card = screen.getByTestId('product-card-item');
    fireEvent.mouseEnter(card);

    await waitFor(() => {
      expect(productsApi.getBySlug).toHaveBeenCalledWith(
        'xit-thom-phong-oai-huong',
      );
    });

    const cached = queryClient.getQueryData([
      QUERY_KEYS.PRODUCT_DETAIL,
      'xit-thom-phong-oai-huong',
    ]);
    expect(cached).toEqual(mockProduct);
  });

  it('preserves callback identity between re-renders when queryClient is unchanged', () => {
    const { result, rerender } = renderHook(() => usePrefetchProduct(), {
      wrapper: createWrapper(queryClient),
    });

    const firstCallback = result.current;
    rerender();
    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });

  it('updates callback reference if queryClient instance changes', () => {
    let activeClient = queryClient;
    const { result, rerender } = renderHook(() => usePrefetchProduct(), {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: activeClient }, children),
    });

    const firstCallback = result.current;

    activeClient = createTestQueryClient();
    rerender();
    const secondCallback = result.current;

    expect(firstCallback).not.toBe(secondCallback);
  });
});
