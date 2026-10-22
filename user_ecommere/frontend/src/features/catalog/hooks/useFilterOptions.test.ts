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
import { useFilterOptions } from './useFilterOptions';
import { productsApi, type FilterOptions } from '../api/products.api';
import { QUERY_KEYS } from '@/lib/constants';

vi.mock('../api/products.api', () => ({
  productsApi: {
    getFilterOptions: vi.fn(),
    getAll: vi.fn(),
    getBySlug: vi.fn(),
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
}));

const mockFilterOptions: FilterOptions = {
  brands: ['Hương Sắc Việt', 'Thảo Mộc Xanh', 'Tinh Dầu Thiên Nhiên'],
  scents: ['Hoa Nhài', 'Hoa Hồng', 'Hoa Lavender', 'Cam Chanh', 'Bạc Hà'],
  volumes: [50, 100, 200, 300],
  priceRange: {
    min: 50000,
    max: 650000,
  },
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

describe('useFilterOptions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches filter options successfully', async () => {
    vi.mocked(productsApi.getFilterOptions).mockResolvedValueOnce(
      mockFilterOptions,
    );

    const { result } = renderHook(() => useFilterOptions(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(productsApi.getFilterOptions).toHaveBeenCalledTimes(1);
    expect(productsApi.getFilterOptions).toHaveBeenCalledWith();
    expect(result.current.data).toEqual(mockFilterOptions);
    expect(
      queryClient.getQueryData([QUERY_KEYS.PRODUCTS, 'filter-options']),
    ).toEqual(mockFilterOptions);
  });

  it('handles error state when getFilterOptions fails', async () => {
    const errorObj = new Error('Lỗi máy chủ khi lấy tùy chọn bộ lọc');
    vi.mocked(productsApi.getFilterOptions).mockRejectedValueOnce(errorObj);

    const { result } = renderHook(() => useFilterOptions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(productsApi.getFilterOptions).toHaveBeenCalledTimes(1);
    expect(result.current.error).toEqual(errorObj);
    expect(result.current.data).toBeUndefined();
  });

  it('caches data with 30-minute staleTime so subsequent renders do not refetch immediately', async () => {
    vi.mocked(productsApi.getFilterOptions).mockResolvedValueOnce(
      mockFilterOptions,
    );

    const { result: firstResult } = renderHook(() => useFilterOptions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(firstResult.current.isSuccess).toBe(true);
    });

    expect(productsApi.getFilterOptions).toHaveBeenCalledTimes(1);

    // Render hook again with the same query client
    const { result: secondResult } = renderHook(() => useFilterOptions(), {
      wrapper: createWrapper(queryClient),
    });

    expect(secondResult.current.isSuccess).toBe(true);
    expect(secondResult.current.data).toEqual(mockFilterOptions);
    expect(productsApi.getFilterOptions).toHaveBeenCalledTimes(1);
  });

  it('handles empty filter options response correctly', async () => {
    const emptyOptions: FilterOptions = {
      brands: [],
      scents: [],
      volumes: [],
      priceRange: { min: 0, max: 0 },
    };
    vi.mocked(productsApi.getFilterOptions).mockResolvedValueOnce(emptyOptions);

    const { result } = renderHook(() => useFilterOptions(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(emptyOptions);
    expect(result.current.data?.brands).toHaveLength(0);
    expect(result.current.data?.scents).toHaveLength(0);
    expect(result.current.data?.volumes).toHaveLength(0);
  });

  it('renders within a React component with loading, error, success states and user interactions', async () => {
    function FilterComponent() {
      const { data, isLoading, isError, error, refetch } = useFilterOptions();

      if (isLoading) {
        return createElement(
          'div',
          { 'data-testid': 'loading-state' },
          'Đang tải bộ lọc...',
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
          'Không tìm thấy bộ lọc',
        );
      }

      return createElement(
        'div',
        { 'data-testid': 'filter-container' },
        createElement('h2', null, 'Bộ lọc sản phẩm'),
        createElement(
          'div',
          { 'data-testid': 'brand-list' },
          data.brands.map((brand) =>
            createElement(
              'span',
              { key: brand, 'data-testid': 'brand-item' },
              brand,
            ),
          ),
        ),
        createElement(
          'div',
          { 'data-testid': 'scent-list' },
          data.scents.map((scent) =>
            createElement(
              'span',
              { key: scent, 'data-testid': 'scent-item' },
              scent,
            ),
          ),
        ),
        createElement(
          'div',
          { 'data-testid': 'price-range' },
          `Giá từ ${data.priceRange.min} đ đến ${data.priceRange.max} đ`,
        ),
        createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'reload-btn',
            onClick: () => refetch(),
          },
          'Tải lại bộ lọc',
        ),
      );
    }

    // 1. Error state rendering
    const errorClient = createTestQueryClient();
    vi.mocked(productsApi.getFilterOptions).mockRejectedValueOnce(
      new Error('Máy chủ không phản hồi'),
    );

    const { unmount } = render(
      createElement(
        QueryClientProvider,
        { client: errorClient },
        createElement(FilterComponent, null),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent(
        'Lỗi: Máy chủ không phản hồi',
      );
    });

    unmount();

    // 2. Loading and success states rendering
    vi.mocked(productsApi.getFilterOptions).mockResolvedValueOnce(
      mockFilterOptions,
    );

    render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(FilterComponent, null),
      ),
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Đang tải bộ lọc...',
    );

    await waitFor(() => {
      expect(screen.getByTestId('filter-container')).toBeInTheDocument();
    });

    expect(screen.getByText('Bộ lọc sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Hoa Nhài')).toBeInTheDocument();
    expect(screen.getByText('Hoa Hồng')).toBeInTheDocument();
    expect(screen.getByText('Hương Sắc Việt')).toBeInTheDocument();
    expect(screen.getByTestId('price-range')).toHaveTextContent(
      'Giá từ 50000 đ đến 650000 đ',
    );

    // 3. User interaction (refetch on button click)
    vi.mocked(productsApi.getFilterOptions).mockResolvedValueOnce({
      ...mockFilterOptions,
      brands: ['Hương Mới'],
    });

    const reloadBtn = screen.getByTestId('reload-btn');
    fireEvent.click(reloadBtn);

    await waitFor(() => {
      expect(productsApi.getFilterOptions).toHaveBeenCalledTimes(3);
    });

    await waitFor(() => {
      expect(screen.getByText('Hương Mới')).toBeInTheDocument();
    });
  });
});
