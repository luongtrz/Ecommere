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
import { useCategories, useCategoryBySlug } from './useCategories';
import { categoriesApi, type Category } from '../api/categories.api';
import { QUERY_KEYS } from '@/lib/constants';

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

vi.mock('../api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Xịt thơm phòng',
    slug: 'xit-thom-phong',
    description: 'Hương thơm cao cấp',
  },
  {
    id: 'cat-2',
    name: 'Đuổi chuột & Côn trùng',
    slug: 'duoi-chuot-con-trung',
  },
];

const mockCategory: Category = {
  id: 'cat-1',
  name: 'Xịt thơm phòng',
  slug: 'xit-thom-phong',
  description: 'Hương thơm phòng thư giãn',
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

describe('useCategories', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches categories list successfully', async () => {
    vi.mocked(categoriesApi.getAll).mockResolvedValueOnce(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockCategories);
    expect(queryClient.getQueryData([QUERY_KEYS.CATEGORIES])).toEqual(
      mockCategories,
    );
  });

  it('handles error when categoriesApi.getAll fails', async () => {
    const error = new Error('Lỗi tải danh sách danh mục');
    vi.mocked(categoriesApi.getAll).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('renders in a component with loading, error, empty, and success states and handles user interaction', async () => {
    const user = userEvent.setup();

    function CategoriesViewer() {
      const { data, isLoading, isError, error, refetch } = useCategories();

      if (isLoading) {
        return createElement(
          'div',
          { 'data-testid': 'loading-state' },
          'Đang tải danh mục...',
        );
      }

      if (isError) {
        return createElement(
          'div',
          { 'data-testid': 'error-state' },
          `Lỗi: ${(error as Error).message}`,
        );
      }

      if (!data || data.length === 0) {
        return createElement(
          'div',
          { 'data-testid': 'empty-state' },
          'Không có danh mục nào',
        );
      }

      return createElement(
        'div',
        { 'data-testid': 'categories-container' },
        createElement(
          'ul',
          { 'data-testid': 'categories-list' },
          data.map((cat) =>
            createElement(
              'li',
              { key: cat.id, 'data-testid': `category-item-${cat.id}` },
              createElement(
                'span',
                { 'data-testid': 'category-name' },
                cat.name,
              ),
              cat.description &&
                createElement(
                  'span',
                  { 'data-testid': 'category-desc' },
                  cat.description,
                ),
            ),
          ),
        ),
        createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'refresh-btn',
            onClick: () => refetch(),
          },
          'Tải lại danh mục',
        ),
      );
    }

    // 1. Success state rendering
    vi.mocked(categoriesApi.getAll).mockResolvedValueOnce(mockCategories);

    const { unmount } = render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(CategoriesViewer),
      ),
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'Đang tải danh mục...',
    );

    await waitFor(() => {
      expect(screen.getByTestId('categories-container')).toBeInTheDocument();
    });

    expect(screen.getByTestId('category-item-cat-1')).toHaveTextContent(
      'Xịt thơm phòng',
    );
    expect(screen.getByTestId('category-item-cat-1')).toHaveTextContent(
      'Hương thơm cao cấp',
    );
    expect(screen.getByTestId('category-item-cat-2')).toHaveTextContent(
      'Đuổi chuột & Côn trùng',
    );

    // User interaction: click refresh button
    vi.mocked(categoriesApi.getAll).mockResolvedValueOnce(mockCategories);
    const refreshButton = screen.getByTestId('refresh-btn');
    await user.click(refreshButton);
    expect(categoriesApi.getAll).toHaveBeenCalledTimes(2);

    unmount();

    // 2. Error state rendering
    const errorClient = createTestQueryClient();
    vi.mocked(categoriesApi.getAll).mockRejectedValueOnce(
      new Error('Lỗi kết nối máy chủ'),
    );

    const { unmount: unmountError } = render(
      createElement(
        QueryClientProvider,
        { client: errorClient },
        createElement(CategoriesViewer),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toHaveTextContent(
        'Lỗi: Lỗi kết nối máy chủ',
      );
    });

    unmountError();

    // 3. Empty state rendering
    const emptyClient = createTestQueryClient();
    vi.mocked(categoriesApi.getAll).mockResolvedValueOnce([]);

    const { unmount: unmountEmpty } = render(
      createElement(
        QueryClientProvider,
        { client: emptyClient },
        createElement(CategoriesViewer),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent(
        'Không có danh mục nào',
      );
    });

    unmountEmpty();
  });
});

describe('useCategoryBySlug', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    cleanup();
  });

  it('fetches category by slug when a valid slug is provided', async () => {
    vi.mocked(categoriesApi.getBySlug).mockResolvedValueOnce(mockCategory);

    const { result } = renderHook(() => useCategoryBySlug('xit-thom-phong'), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.getBySlug).toHaveBeenCalledTimes(1);
    expect(categoriesApi.getBySlug).toHaveBeenCalledWith('xit-thom-phong');
    expect(result.current.data).toEqual(mockCategory);
    expect(
      queryClient.getQueryData([QUERY_KEYS.CATEGORIES, 'xit-thom-phong']),
    ).toEqual(mockCategory);
  });

  it('does not execute query when slug is empty string (enabled: false)', () => {
    const { result } = renderHook(() => useCategoryBySlug(''), {
      wrapper: createWrapper(queryClient),
    });

    expect(categoriesApi.getBySlug).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('triggers a fetch when slug changes from empty to valid string', async () => {
    vi.mocked(categoriesApi.getBySlug).mockResolvedValueOnce(mockCategory);

    const { result, rerender } = renderHook(
      ({ slug }: { slug: string }) => useCategoryBySlug(slug),
      {
        initialProps: { slug: '' },
        wrapper: createWrapper(queryClient),
      },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(categoriesApi.getBySlug).not.toHaveBeenCalled();

    rerender({ slug: 'xit-thom-phong' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.getBySlug).toHaveBeenCalledWith('xit-thom-phong');
    expect(result.current.data).toEqual(mockCategory);
  });

  it('handles error when categoriesApi.getBySlug fails', async () => {
    const error = new Error('Không tìm thấy danh mục');
    vi.mocked(categoriesApi.getBySlug).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCategoryBySlug('khong-ton-tai'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('renders in a component with user interaction, empty, loading, error, and success states', async () => {
    const user = userEvent.setup();

    function CategoryDetailViewer() {
      const [slug, setSlug] = useState('');
      const { data, isLoading, isError, error } = useCategoryBySlug(slug);

      return createElement(
        'div',
        { 'data-testid': 'category-detail-container' },
        createElement(
          'div',
          { 'data-testid': 'controls' },
          createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'select-cat-btn',
              onClick: () => setSlug('xit-thom-phong'),
            },
            'Xem xịt thơm',
          ),
          createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'select-invalid-btn',
              onClick: () => setSlug('loi-danh-muc'),
            },
            'Xem lỗi',
          ),
          createElement(
            'button',
            {
              type: 'button',
              'data-testid': 'clear-slug-btn',
              onClick: () => setSlug(''),
            },
            'Xóa chọn',
          ),
        ),
        !slug &&
          createElement(
            'div',
            { 'data-testid': 'empty-slug-prompt' },
            'Vui lòng chọn danh mục',
          ),
        slug &&
          isLoading &&
          createElement(
            'div',
            { 'data-testid': 'detail-loading' },
            'Đang tải thông tin danh mục...',
          ),
        slug &&
          isError &&
          createElement(
            'div',
            { 'data-testid': 'detail-error' },
            `Lỗi tải danh mục: ${(error as Error).message}`,
          ),
        slug &&
          data &&
          createElement(
            'div',
            { 'data-testid': 'category-info' },
            createElement('h2', { 'data-testid': 'info-name' }, data.name),
            createElement('p', { 'data-testid': 'info-slug' }, data.slug),
            createElement(
              'p',
              { 'data-testid': 'info-desc' },
              data.description || 'Không có mô tả',
            ),
          ),
      );
    }

    render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(CategoryDetailViewer),
      ),
    );

    // Initially slug is empty
    expect(screen.getByTestId('empty-slug-prompt')).toHaveTextContent(
      'Vui lòng chọn danh mục',
    );
    expect(categoriesApi.getBySlug).not.toHaveBeenCalled();

    // User clicks button to select category
    vi.mocked(categoriesApi.getBySlug).mockResolvedValueOnce(mockCategory);
    await user.click(screen.getByTestId('select-cat-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('category-info')).toBeInTheDocument();
    });

    expect(categoriesApi.getBySlug).toHaveBeenCalledWith('xit-thom-phong');
    expect(screen.getByTestId('info-name')).toHaveTextContent('Xịt thơm phòng');
    expect(screen.getByTestId('info-slug')).toHaveTextContent('xit-thom-phong');
    expect(screen.getByTestId('info-desc')).toHaveTextContent(
      'Hương thơm phòng thư giãn',
    );

    // User clicks clear button -> returns to empty state
    await user.click(screen.getByTestId('clear-slug-btn'));
    expect(screen.getByTestId('empty-slug-prompt')).toHaveTextContent(
      'Vui lòng chọn danh mục',
    );

    // User clicks select invalid -> triggers error
    vi.mocked(categoriesApi.getBySlug).mockRejectedValueOnce(
      new Error('Không tìm thấy dữ liệu'),
    );
    await user.click(screen.getByTestId('select-invalid-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('detail-error')).toHaveTextContent(
        'Lỗi tải danh mục: Không tìm thấy dữ liệu',
      );
    });
  });
});
