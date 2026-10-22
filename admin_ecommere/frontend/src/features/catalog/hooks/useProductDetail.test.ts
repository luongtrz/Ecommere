import { createElement, type ReactNode, useState } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  renderHook,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductDetail } from './useProductDetail';
import { productsApi, type Product } from '../api/products.api';
import { QUERY_KEYS } from '@/lib/constants';

vi.mock('../api/products.api', () => ({
  productsApi: {
    getBySlug: vi.fn(),
    getAll: vi.fn(),
    getAllAdmin: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
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
      barcode: null,
    },
  ],
  basePrice: 150000,
  active: true,
  averageRating: 4.9,
  rating: 4.9,
  reviewCount: 38,
  createdAt: '2026-01-15T08:00:00Z',
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

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
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
    expect(result.current.data).toBeUndefined();
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

  it('renders within a React component displaying loading, error, empty, and success states with Vietnamese labels and user interaction', async () => {
    const user = userEvent.setup();

    function ProductDetailViewer() {
      const [slug, setSlug] = useState('');
      const { data, isLoading, isError, error } = useProductDetail(slug);

      return createElement(
        'div',
        { 'data-testid': 'product-detail-wrapper' },
        createElement(
          'div',
          { 'data-testid': 'action-buttons' },
          createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'btn-select-product',
              onClick: () => setSlug('xit-thom-phong-oai-huong'),
            },
            'Chọn sản phẩm',
          ),
          createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'btn-select-error',
              onClick: () => setSlug('san-pham-loi'),
            },
            'Chọn sản phẩm lỗi',
          ),
          createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'btn-clear',
              onClick: () => setSlug(''),
            },
            'Bỏ chọn',
          ),
        ),
        !slug &&
          createElement(
            'div',
            { 'data-testid': 'empty-slug-prompt' },
            'Vui lòng chọn sản phẩm',
          ),
        slug &&
          isLoading &&
          createElement(
            'div',
            { 'data-testid': 'loading-state' },
            'Đang tải chi tiết sản phẩm...',
          ),
        slug &&
          isError &&
          createElement(
            'div',
            { 'data-testid': 'error-state' },
            `Lỗi: ${(error as Error).message}`,
          ),
        slug &&
          !isLoading &&
          !isError &&
          !data &&
          createElement(
            'div',
            { 'data-testid': 'empty-data-state' },
            'Không có thông tin sản phẩm',
          ),
        slug &&
          data &&
          createElement(
            'div',
            { 'data-testid': 'product-detail' },
            createElement('h1', { 'data-testid': 'product-name' }, data.name),
            createElement(
              'p',
              { 'data-testid': 'product-desc' },
              data.description,
            ),
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
            createElement(
              'span',
              { 'data-testid': 'product-category' },
              data.category?.name,
            ),
          ),
      );
    }

    render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ProductDetailViewer),
      ),
    );

    // 1. Initial empty slug prompt
    expect(screen.getByTestId('empty-slug-prompt')).toHaveTextContent(
      'Vui lòng chọn sản phẩm',
    );
    expect(productsApi.getBySlug).not.toHaveBeenCalled();

    // 2. Select product -> Success state
    vi.mocked(productsApi.getBySlug).mockResolvedValueOnce(mockProduct);
    await user.click(screen.getByTestId('btn-select-product'));

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
    expect(screen.getByTestId('product-category')).toHaveTextContent(
      'Xịt Phòng Tinh Dầu',
    );

    // 3. Click clear button -> Return to empty prompt
    await user.click(screen.getByTestId('btn-clear'));
    expect(screen.getByTestId('empty-slug-prompt')).toHaveTextContent(
      'Vui lòng chọn sản phẩm',
    );

    // 4. Select error product -> Error state
    vi.mocked(productsApi.getBySlug).mockRejectedValueOnce(
      new Error('Lỗi kết nối máy chủ'),
    );
    await user.click(screen.getByTestId('btn-select-error'));

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent(
        'Lỗi: Lỗi kết nối máy chủ',
      );
    });
  });
});
