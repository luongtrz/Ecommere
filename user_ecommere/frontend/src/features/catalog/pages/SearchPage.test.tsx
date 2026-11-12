import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { SearchPage } from './SearchPage';
import type { Product } from '../api/products.api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('../api/products.api', () => ({
  productsApi: {
    getAll: vi.fn(),
    search: vi.fn(),
    getById: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('@/lib/seo', () => ({
  SEO: vi.fn(({ title }: { title: string }) => (
    <div data-testid="mock-seo" data-title={title} />
  )),
}));

let mockDebouncedValue: string | null = null;
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: vi.fn((val: any) =>
    mockDebouncedValue !== null ? mockDebouncedValue : val,
  ),
}));

const mockAddItem = vi.fn();
vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => ({ addItem: mockAddItem }),
}));

const mockUseProductSearch = vi.fn();
vi.mock('../hooks/useProducts', () => ({
  useProductSearch: (...args: any[]) => mockUseProductSearch(...args),
  useProducts: vi.fn(),
}));

vi.mock('@/components/common/ProductCard', () => ({
  ProductCard: vi.fn(
    ({
      id,
      name,
      slug,
      price,
      rating,
      reviewCount,
      variants,
      onAddToCart,
    }: any) => (
      <div data-testid={`product-card-${id}`}>
        <span>{name}</span>
        <span>{slug}</span>
        <span>{price}</span>
        <span>{rating}</span>
        <span>{reviewCount}</span>
        <span>{variants?.length || 0}</span>
        <button
          type="button"
          data-testid={`add-to-cart-grid-${id}`}
          onClick={onAddToCart}
        >
          Thêm vào giỏ
        </button>
      </div>
    ),
  ),
}));

vi.mock('../components/FilterSidebar', () => ({
  FilterSidebar: ({
    currentFilters,
    onFilterChange,
    hideCategoryFilter,
  }: any) => (
    <div
      data-testid="filter-sidebar"
      data-hide-category={String(hideCategoryFilter)}
    >
      <span data-testid="sidebar-filters">
        {JSON.stringify(currentFilters)}
      </span>
      <button
        data-testid="filter-change-btn"
        onClick={() => onFilterChange({ brand: 'Brand A', minPrice: '100000' })}
      >
        Change Filters
      </button>
      <button
        data-testid="filter-clear-keys-btn"
        onClick={() => onFilterChange({ brand: undefined, scent: '' })}
      >
        Clear Keys
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div data-testid="mock-sheet">{children}</div>,
  SheetTrigger: ({ children }: any) => (
    <div data-testid="mock-sheet-trigger">{children}</div>
  ),
  SheetContent: ({ children, className }: any) => (
    <div className={className} data-testid="mock-sheet-content">
      {children}
    </div>
  ),
  SheetHeader: ({ children }: any) => (
    <div data-testid="mock-sheet-header">{children}</div>
  ),
  SheetTitle: ({ children, className }: any) => (
    <h2 className={className} data-testid="mock-sheet-title">
      {children}
    </h2>
  ),
}));

vi.mock('@/components/common/Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination-mock">
      <span data-testid="pagination-info">
        Page {currentPage} of {totalPages}
      </span>
      <button
        data-testid="pagination-page-2-btn"
        onClick={() => onPageChange(2)}
      >
        Go to Page 2
      </button>
      <button
        data-testid="pagination-next-btn"
        onClick={() => onPageChange(currentPage + 1)}
      >
        Trang sau
      </button>
    </div>
  ),
}));

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (v: string) => void;
}>({});
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div data-testid="mock-select">{children}</div>
    </SelectContext.Provider>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => {
    const { value, onValueChange } = React.useContext(SelectContext);
    return (
      <select
        data-testid="sort-select"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      >
        {children}
      </select>
    );
  },
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const p1: Product = {
  id: 'p1',
  name: 'Nước hoa Rose',
  slug: 'nuoc-hoa-rose',
  description: 'Hương hoa hồng',
  images: ['https://example.com/rose.jpg'],
  categoryId: 'c1',
  variants: [
    {
      id: 'v1',
      scent: 'Hoa Hồng',
      volumeMl: 100,
      price: 250000,
      salePrice: 200000,
      stock: 10,
      sku: 'R1',
    },
    {
      id: 'v2',
      scent: 'Hoa Hồng Đậm',
      volumeMl: 200,
      price: 450000,
      salePrice: null,
      stock: 5,
      sku: 'R2',
    },
  ],
  basePrice: 250000,
  rating: 4.8,
  reviewCount: 24,
  createdAt: '2026-01-01',
};

const p2NoVar: Product = {
  id: 'p2',
  name: 'Nước hoa NoVar',
  slug: 'nuoc-hoa-novar',
  description: '',
  images: ['https://example.com/novar.jpg'],
  categoryId: 'c1',
  variants: [],
  basePrice: 180000,
  rating: undefined as any,
  reviewCount: undefined as any,
  createdAt: '2026-01-02',
};

const p3MultiVar: Product = {
  id: 'p3',
  name: 'Nước hoa MultiVar',
  slug: 'nuoc-hoa-multivar',
  description: 'Mô tả multi',
  images: ['https://example.com/multi.jpg'],
  categoryId: 'c2',
  variants: [
    {
      id: 'v3-1',
      scent: 'Scent 1',
      volumeMl: 50,
      price: 100000,
      salePrice: null,
      stock: 5,
      sku: 'M1',
    },
    {
      id: 'v3-2',
      scent: 'Scent 2',
      volumeMl: 100,
      price: 180000,
      salePrice: null,
      stock: 5,
      sku: 'M2',
    },
    {
      id: 'v3-3',
      scent: 'Scent 3',
      volumeMl: 150,
      price: 250000,
      salePrice: null,
      stock: 5,
      sku: 'M3',
    },
    {
      id: 'v3-4',
      scent: 'Scent 4',
      volumeMl: 200,
      price: 320000,
      salePrice: null,
      stock: 5,
      sku: 'M4',
    },
    {
      id: 'v3-5',
      scent: 'Scent 5',
      volumeMl: 300,
      price: 400000,
      salePrice: null,
      stock: 5,
      sku: 'M5',
    },
  ],
  basePrice: 100000,
  rating: 4.5,
  reviewCount: 12,
  createdAt: '2026-01-03',
};

const p4Regular: Product = {
  id: 'p4',
  name: 'Nước hoa Regular',
  slug: 'nuoc-hoa-regular',
  description: 'Mô tả regular',
  images: ['https://example.com/reg.jpg'],
  categoryId: 'c1',
  variants: [
    {
      id: 'v4-1',
      scent: 'Hoa Lài',
      volumeMl: 100,
      price: 150000,
      salePrice: undefined,
      stock: 8,
      sku: 'REG1',
    },
  ],
  basePrice: 150000,
  rating: 4.0,
  reviewCount: 2,
  createdAt: '2026-01-04',
};

const p5ThreeVar: Product = {
  id: 'p5',
  name: 'Nước hoa 3 biến thể',
  slug: 'nuoc-hoa-3-bien-the',
  description: 'Mô tả 3',
  images: ['https://example.com/3.jpg'],
  categoryId: 'c1',
  variants: [
    {
      id: 'v5-1',
      scent: 'Scent 1',
      volumeMl: 50,
      price: 100000,
      salePrice: null,
      stock: 5,
      sku: 'T1',
    },
    {
      id: 'v5-2',
      scent: 'Scent 2',
      volumeMl: 100,
      price: 200000,
      salePrice: null,
      stock: 5,
      sku: 'T2',
    },
    {
      id: 'v5-3',
      scent: 'Scent 3',
      volumeMl: 150,
      price: 300000,
      salePrice: null,
      stock: 5,
      sku: 'T3',
    },
  ],
  basePrice: 100000,
  rating: 4.2,
  reviewCount: 8,
  createdAt: '2026-01-05',
};

const p6FourVar: Product = {
  id: 'p6',
  name: 'Nước hoa 4 biến thể',
  slug: 'nuoc-hoa-4-bien-the',
  description: 'Mô tả 4',
  images: ['https://example.com/4.jpg'],
  categoryId: 'c1',
  variants: [
    {
      id: 'v6-1',
      scent: 'S1',
      volumeMl: 50,
      price: 100000,
      salePrice: null,
      stock: 5,
      sku: 'F1',
    },
    {
      id: 'v6-2',
      scent: 'S2',
      volumeMl: 100,
      price: 200000,
      salePrice: null,
      stock: 5,
      sku: 'F2',
    },
    {
      id: 'v6-3',
      scent: 'S3',
      volumeMl: 150,
      price: 300000,
      salePrice: null,
      stock: 5,
      sku: 'F3',
    },
    {
      id: 'v6-4',
      scent: 'S4',
      volumeMl: 200,
      price: 400000,
      salePrice: null,
      stock: 5,
      sku: 'F4',
    },
  ],
  basePrice: 100000,
  rating: 4.2,
  reviewCount: 8,
  createdAt: '2026-01-06',
};

// Pre-create stable query return objects to prevent React useEffect re-render loops
function createStableResult(
  products: Product[],
  total: number,
  page = 1,
  limit = 20,
  totalPages = 1,
  hasNextPage?: boolean,
  isLoading = false,
  isFetching = false,
  isPlaceholderData = false,
) {
  return {
    data: isLoading
      ? undefined
      : {
          products,
          total,
          page,
          limit,
          totalPages,
          ...(hasNextPage !== undefined ? { hasNextPage } : {}),
        },
    isLoading,
    isFetching,
    isPlaceholderData,
  };
}

const defaultStableResult = createStableResult(
  [p1, p2NoVar],
  2,
  1,
  20,
  1,
  false,
);
const undefinedDataResult = {
  data: undefined,
  isLoading: false,
  isFetching: false,
  isPlaceholderData: false,
};

function LocationDisplay() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.search}</div>;
}

function RouterHelper() {
  const [, setParams] = useSearchParams();
  return (
    <div>
      <button
        data-testid="set-category"
        onClick={() => setParams({ q: 'rose', category: 'new-cat' })}
      >
        Category
      </button>
      <button
        data-testid="set-compact"
        onClick={() => setParams({ q: 'rose', view: 'compact' })}
      >
        Compact
      </button>
    </div>
  );
}

function renderPage(entries = ['/search'], helper = false) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={entries}>
        <LocationDisplay />
        {helper && <RouterHelper />}
        <SearchPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDebouncedValue = null;
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Use stable return value
    mockUseProductSearch.mockReturnValue(defaultStableResult);
  });

  describe('Parameters & Initial Render', () => {
    it('handles default empty route parameters', () => {
      renderPage(['/search']);
      expect(mockUseProductSearch).toHaveBeenCalledWith(
        '',
        { sortBy: 'newest' },
        1,
      );
      expect(
        screen.getByRole('link', { name: 'Sản phẩm' }),
      ).toHaveAttribute('href', '/catalog');
      expect(screen.getByPlaceholderText('Tìm kiếm sản phẩm...')).toHaveValue(
        '',
      );
      expect(screen.getByTestId('sort-select')).toHaveValue('newest');
      expect(
        screen.getAllByRole('button', { name: /Bộ lọc/i })[0],
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Xóa tìm kiếm' }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-seo')).toHaveAttribute(
        'data-title',
        'Tìm kiếm: ',
      );
    });

    it('parses q, sort, view, and category from URL', () => {
      renderPage(['/search?q=rose&sort=price_desc&view=list&category=cat1']);
      expect(mockUseProductSearch).toHaveBeenCalledWith(
        'rose',
        { sortBy: 'price_desc', categorySlug: 'cat1' },
        1,
      );
      expect(screen.getByPlaceholderText('Tìm kiếm sản phẩm...')).toHaveValue(
        'rose',
      );
      expect(screen.getByTestId('mock-seo')).toHaveAttribute(
        'data-title',
        'Tìm kiếm: rose',
      );
      expect(
        screen.getByRole('heading', { level: 1, name: /Kết quả tìm kiếm cho "rose"/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText((_, el) => el?.textContent?.trim() === '2 sản phẩm'),
      ).toBeInTheDocument();
      expect(screen.getByText('Danh mục: cat1')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Xóa tìm kiếm' }),
      ).toBeInTheDocument();
    });

    it('falls back to categorySlug when category is absent', () => {
      renderPage(['/search?q=rose&categorySlug=slug1']);
      expect(mockUseProductSearch).toHaveBeenCalledWith(
        'rose',
        { sortBy: 'newest', categorySlug: 'slug1' },
        1,
      );
    });

    it('prioritizes category when both category and categorySlug are provided', () => {
      renderPage(['/search?q=rose&category=c-main&categorySlug=c-slug']);
      expect(mockUseProductSearch).toHaveBeenCalledWith(
        'rose',
        { sortBy: 'newest', categorySlug: 'c-main' },
        1,
      );
    });
  });

  describe('Search Input, Header & Filter Actions', () => {
    it('updates q parameter when search input changes', () => {
      renderPage(['/search?q=rose']);
      const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.change(input, { target: { value: 'mint' } });
      expect(screen.getByTestId('loc')).toHaveTextContent('q=mint');
    });

    it('deletes q parameter when typing empty string', () => {
      renderPage(['/search?q=rose&sort=price_asc']);
      const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByTestId('loc')).not.toHaveTextContent('q=');
      expect(screen.getByTestId('loc')).toHaveTextContent('sort=price_asc');
    });

    it('clears input and resets parameters on clicking header "Xóa tìm kiếm"', () => {
      renderPage(['/search?q=rose&sort=price_desc']);
      fireEvent.click(
        screen.getByRole('button', { name: 'Xóa tìm kiếm' }),
      );
      expect(screen.getByPlaceholderText('Tìm kiếm sản phẩm...')).toHaveValue(
        '',
      );
      expect(screen.getByTestId('loc')).not.toHaveTextContent('q=');
      expect(screen.getByTestId('loc')).toHaveTextContent('sort=price_desc');
    });

    it('toggles filter sidebar when clicking desktop "Bộ lọc"', () => {
      const { container } = renderPage(['/search?q=rose']);
      expect(container.querySelector('aside')).toBeInTheDocument();
      expect(screen.getAllByTestId('filter-sidebar')).toHaveLength(2);
      const filterBtns = screen.getAllByRole('button', { name: /Bộ lọc/i });
      const desktopFilterBtn =
        filterBtns.find((b) => b.className.includes('hidden lg:flex')) ||
        filterBtns[0];
      fireEvent.click(desktopFilterBtn);
      expect(container.querySelector('aside')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('filter-sidebar')).toHaveLength(1);
    });

    it('cycles through sort options', () => {
      renderPage(['/search?q=rose']);
      const select = screen.getByTestId('sort-select');
      for (const opt of ['price_asc', 'price_desc', 'best_selling', 'rating']) {
        fireEvent.change(select, { target: { value: opt } });
        expect(screen.getByTestId('loc')).toHaveTextContent(`sort=${opt}`);
      }
    });

    it('ignores effect when debounced value equals query', () => {
      mockDebouncedValue = 'rose';
      renderPage(['/search?q=rose']);
      expect(screen.getByTestId('loc')).toHaveTextContent('?q=rose');
    });
  });

  describe('Loading States & Search Info Branching', () => {
    const loadingResult = createStableResult(
      [],
      0,
      1,
      20,
      0,
      false,
      true,
      false,
      false,
    );
    const placeholderResult = createStableResult(
      [p1],
      1,
      1,
      10,
      1,
      false,
      false,
      true,
      true,
    );
    const emptyWithTotal0 = createStableResult(
      [],
      0,
      1,
      10,
      0,
      false,
      false,
      false,
      false,
    );
    const emptyTotal0Loading = createStableResult(
      [],
      0,
      1,
      10,
      0,
      false,
      true,
      false,
      false,
    );
    const emptyTotal0Placeholder = createStableResult(
      [],
      0,
      1,
      10,
      0,
      false,
      false,
      true,
      true,
    );
    const backgroundResult = createStableResult(
      [p1],
      1,
      1,
      10,
      1,
      false,
      false,
      true,
      false,
    );

    it('renders LoadingSpinner when isLoading is true with active query', () => {
      mockUseProductSearch.mockReturnValue(loadingResult);
      const { container } = renderPage(['/search?q=rose']);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 2, name: 'Kết quả tìm kiếm' })).not.toBeInTheDocument();
    });

    it('renders LoadingSpinner when isPlaceholderData is true with active query and empty products', () => {
      mockUseProductSearch.mockReturnValue(emptyTotal0Placeholder);
      const { container } = renderPage(['/search?q=rose']);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('does not render LoadingSpinner when query is empty despite loading states', () => {
      mockUseProductSearch.mockReturnValue(loadingResult);
      const { container } = renderPage(['/search']);
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    it('does not render LoadingSpinner when query is empty despite isPlaceholderData', () => {
      mockUseProductSearch.mockReturnValue(placeholderResult);
      const { container } = renderPage(['/search']);
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    it('does not render LoadingSpinner on background fetch when products are already displayed', () => {
      mockUseProductSearch.mockReturnValue(backgroundResult);
      const { container } = renderPage(['/search?q=rose']);
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
      expect(screen.getByTestId('product-card-p1')).toBeInTheDocument();
    });

    it('controls visibility of EmptyState "Xem tất cả sản phẩm" CTA under various loading conditions', () => {
      // Condition 1: isLoading true -> link hidden
      mockUseProductSearch.mockReturnValue(emptyTotal0Loading);
      const { unmount } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('link', { name: 'Xem tất cả sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount();

      // Condition 2: isPlaceholderData true -> link hidden
      mockUseProductSearch.mockReturnValue(emptyTotal0Placeholder);
      const { unmount: unmount2 } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('link', { name: 'Xem tất cả sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount2();

      // Condition 3: total > 0 -> link hidden
      mockUseProductSearch.mockReturnValue(backgroundResult);
      const { unmount: unmount3 } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('link', { name: 'Xem tất cả sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount3();

      // Condition 4: total === 0 and not loading -> link shown
      mockUseProductSearch.mockReturnValue(emptyWithTotal0);
      renderPage(['/search?q=rose']);
      expect(
        screen.getByRole('link', { name: 'Xem tất cả sản phẩm' }),
      ).toBeInTheDocument();
    });

    it('shows 0 sản phẩm when query is present and data is undefined', () => {
      mockUseProductSearch.mockReturnValue(undefinedDataResult);
      renderPage(['/search?q=rose']);
      expect(
        screen.getByText((_, el) => el?.textContent?.trim() === '0 sản phẩm'),
      ).toBeInTheDocument();
    });
  });

  describe('Empty Results & Suggestions', () => {
    const emptyResult = createStableResult(
      [],
      0,
      1,
      10,
      0,
      false,
      false,
      false,
      false,
    );

    beforeEach(() => {
      mockUseProductSearch.mockReturnValue(emptyResult);
    });

    it('renders EmptyState with query description when products total is 0', () => {
      renderPage(['/search?q=khong_tim_thay']);
      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Không có sản phẩm nào khớp với từ khóa "khong_tim_thay". Hãy thử tìm kiếm với từ khóa khác.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Xem tất cả sản phẩm' }),
      ).toHaveAttribute('href', '/catalog');
    });

    it('renders EmptyState when query is empty and total is 0', () => {
      renderPage(['/search']);
      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Không có sản phẩm nào khớp với từ khóa "". Hãy thử tìm kiếm với từ khóa khác.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Xem tất cả sản phẩm' }),
      ).toHaveAttribute('href', '/catalog');
    });

    it('renders search suggestions with min 44px touch targets and updates input on suggestion click', () => {
      renderPage(['/search?q=khong_tim_thay']);
      expect(screen.getByText('Gợi ý tìm kiếm:')).toBeInTheDocument();
      const suggestions = [
        'Nước hoa chanh',
        'Nước hoa bạc hà',
        'Nước hoa dâu',
        'Nước hoa cam',
        'Nước hoa vanilla',
        'Nước hoa lavender',
        'Nước hoa trà xanh',
      ];
      for (const item of suggestions) {
        const btn = screen.getByRole('button', { name: item });
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveClass('min-h-11');
      }

      const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.click(screen.getByRole('button', { name: 'Nước hoa chanh' }));
      expect(input).toHaveValue('Nước hoa chanh');
    });

    it('hides sort, filter, and view toggles when total is 0', () => {
      renderPage(['/search?q=khong_tim_thay']);
      expect(screen.queryByTestId('sort-select')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Xem dạng danh sách' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Grid View Actions & Formatting', () => {
    it('renders products and adds to cart with salePrice', () => {
      renderPage(['/search?q=rose&view=grid']);
      expect(
        screen.getByRole('heading', { level: 1, name: /Kết quả tìm kiếm cho "rose"/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText((_, el) => el?.textContent?.trim() === '2 sản phẩm'),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('add-to-cart-grid-p1'));
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'p1',
        variantId: 'v1',
        name: 'Nước hoa Rose',
        image: 'https://example.com/rose.jpg',
        price: 200000,
        scent: 'Hoa Hồng',
        volumeMl: 100,
      });
    });

    it('adds to cart in grid view using regular price when salePrice is absent', () => {
      const regularResult = createStableResult([p4Regular], 1, 1, 10, 1, false);
      mockUseProductSearch.mockReturnValue(regularResult);
      renderPage(['/search?q=regular&view=grid']);
      fireEvent.click(screen.getByTestId('add-to-cart-grid-p4'));
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'p4',
        variantId: 'v4-1',
        name: 'Nước hoa Regular',
        image: 'https://example.com/reg.jpg',
        price: 150000,
        scent: 'Hoa Lài',
        volumeMl: 100,
      });
    });

    it('does not call addItem when product has empty variants in grid view', () => {
      renderPage(['/search?q=rose&view=grid']);
      fireEvent.click(screen.getByTestId('add-to-cart-grid-p2'));
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('switches view mode between grid and list', () => {
      renderPage(['/search?q=rose&view=grid']);
      const listBtn = screen.getByRole('button', { name: 'Xem dạng danh sách' });
      const gridBtn = screen.getByRole('button', { name: 'Xem dạng lưới' });

      fireEvent.click(listBtn);
      expect(screen.getByTestId('loc')).toHaveTextContent('view=list');

      fireEvent.click(gridBtn);
      expect(screen.getByTestId('loc')).toHaveTextContent('view=grid');
    });
  });

  describe('List View Layout & Operations', () => {
    it('renders list layout with ratings, review count, descriptions, variant badges and overflow tag', () => {
      const listResult = createStableResult(
        [p1, p2NoVar, p3MultiVar, p5ThreeVar, p6FourVar],
        5,
        1,
        10,
        1,
      );
      mockUseProductSearch.mockReturnValue(listResult);
      renderPage(['/search?q=test&view=list']);

      // p1: rating 4.8, 24 reviews, 2 variants, description
      expect(
        screen.getByRole('heading', { level: 3, name: 'Nước hoa Rose' }),
      ).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('(24 đánh giá)')).toBeInTheDocument();
      expect(screen.getByText('2 biến thể')).toBeInTheDocument();
      expect(screen.getByText('Hương hoa hồng')).toBeInTheDocument();
      expect(screen.getByText('Hoa Hồng - 100ml')).toBeInTheDocument();
      expect(screen.getByText(/250\.000/)).toBeInTheDocument();

      // p2NoVar: fallback 0.0, 0 reviews, 0 variants, omitted description
      expect(
        screen.getByRole('heading', { level: 3, name: 'Nước hoa NoVar' }),
      ).toBeInTheDocument();
      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('(0 đánh giá)')).toBeInTheDocument();
      expect(screen.getByText('0 biến thể')).toBeInTheDocument();

      // p3MultiVar: >3 variants shows '+2 nữa'
      expect(screen.getByText('+2 nữa')).toBeInTheDocument();

      // p5ThreeVar: exactly 3 variants shows no overflow tag
      expect(
        screen.getByRole('heading', { level: 3, name: 'Nước hoa 3 biến thể' }),
      ).toBeInTheDocument();

      // p6FourVar: 4 variants shows '+1 nữa'
      expect(screen.getByText('+1 nữa')).toBeInTheDocument();
    });

    it('adds item to cart in list view with salePrice', () => {
      const p1Result = createStableResult([p1], 1, 1, 10, 1);
      mockUseProductSearch.mockReturnValue(p1Result);
      renderPage(['/search?q=rose&view=list']);
      fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ/i }));
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'p1',
        variantId: 'v1',
        name: 'Nước hoa Rose',
        image: 'https://example.com/rose.jpg',
        price: 200000,
        scent: 'Hoa Hồng',
        volumeMl: 100,
      });
    });

    it('adds item to cart in list view with regular price when salePrice is null', () => {
      const p3Result = createStableResult([p3MultiVar], 1, 1, 10, 1);
      mockUseProductSearch.mockReturnValue(p3Result);
      renderPage(['/search?q=multi&view=list']);
      fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ/i }));
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'p3',
        variantId: 'v3-1',
        name: 'Nước hoa MultiVar',
        image: 'https://example.com/multi.jpg',
        price: 100000,
        scent: 'Scent 1',
        volumeMl: 50,
      });
    });

    it('does not add to cart in list view when product variants array is empty', () => {
      const p2Result = createStableResult([p2NoVar], 1, 1, 10, 1);
      mockUseProductSearch.mockReturnValue(p2Result);
      renderPage(['/search?q=novar&view=list']);
      fireEvent.click(screen.getByRole('button', { name: /Thêm vào giỏ/i }));
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('supports non-standard compact viewMode', () => {
      renderPage(['/search?q=rose'], true);
      fireEvent.click(screen.getByTestId('set-compact'));
      expect(screen.getByTestId('loc')).toHaveTextContent('view=compact');
    });
  });

  describe('Active Filter Chips', () => {
    it('renders active filter chips for category, price, scent, volumeMl, brand and handles removals', () => {
      renderPage([
        '/search?q=rose&category=xit-thom&minPrice=50000&maxPrice=150000&scent=Hoa%20H%E1%BB%93ng&volumeMl=100&brand=ThaiBrand',
      ]);

      expect(screen.getByText('Danh mục: xit-thom')).toBeInTheDocument();
      expect(screen.getByText('Hoa Hồng')).toBeInTheDocument();
      expect(screen.getByText('100ml')).toBeInTheDocument();
      expect(screen.getByText('ThaiBrand')).toBeInTheDocument();

      // Remove scent chip
      const removeScentBtn = screen.getByRole('button', {
        name: 'Xóa bộ lọc Hoa Hồng',
      });
      fireEvent.click(removeScentBtn);
      expect(screen.getByTestId('loc')).not.toHaveTextContent('scent=');

      // Clear all filters
      const clearAllBtn = screen.getByRole('button', { name: 'Xóa tất cả' });
      fireEvent.click(clearAllBtn);
      const loc = screen.getByTestId('loc');
      expect(loc).not.toHaveTextContent('category=');
      expect(loc).not.toHaveTextContent('minPrice=');
      expect(loc).not.toHaveTextContent('maxPrice=');
      expect(loc).not.toHaveTextContent('brand=');
      expect(loc).not.toHaveTextContent('volumeMl=');
    });
  });

  describe('Pagination Flow', () => {
    it('renders Pagination component when totalPages > 1', () => {
      const pageMulti = createStableResult([p1, p2NoVar], 4, 1, 2, 2, true);
      mockUseProductSearch.mockReturnValue(pageMulti);

      renderPage(['/search?q=perfume']);
      expect(screen.getByTestId('pagination-mock')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-info')).toHaveTextContent('Page 1 of 2');

      fireEvent.click(screen.getByTestId('pagination-page-2-btn'));
      expect(screen.getByTestId('loc')).toHaveTextContent('page=2');
    });

    it('does not render Pagination when totalPages is 1', () => {
      const singlePage = createStableResult([p1], 1, 1, 10, 1, false);
      mockUseProductSearch.mockReturnValue(singlePage);

      renderPage(['/search?q=perfume']);
      expect(screen.queryByTestId('pagination-mock')).not.toBeInTheDocument();
    });
  });

  describe('Filter & URL Parameter Reset Effects', () => {
    const resetP1 = createStableResult([p1], 4, 1, 1, 4, true);
    const resetP2 = createStableResult([p1], 4, 2, 1, 4, true);

    it('resets page to 1 when sort changes', () => {
      let queriedPage = 1;
      mockUseProductSearch.mockImplementation((_q, _f, page) => {
        queriedPage = page;
        return page === 2 ? resetP2 : resetP1;
      });

      renderPage(['/search?q=rose']);
      fireEvent.click(
        screen.getByTestId('pagination-page-2-btn'),
      );
      expect(queriedPage).toBe(2);

      fireEvent.change(screen.getByTestId('sort-select'), {
        target: { value: 'price_desc' },
      });
      expect(queriedPage).toBe(1);
    });

    it('resets page to 1 when search input changes', () => {
      let queriedPage = 1;
      mockUseProductSearch.mockImplementation((_q, _f, page) => {
        queriedPage = page;
        return page === 2 ? resetP2 : resetP1;
      });

      renderPage(['/search?q=rose']);
      fireEvent.click(
        screen.getByTestId('pagination-page-2-btn'),
      );
      expect(queriedPage).toBe(2);

      fireEvent.change(screen.getByPlaceholderText('Tìm kiếm sản phẩm...'), {
        target: { value: 'mint' },
      });
      expect(queriedPage).toBe(1);
    });

    it('resets page to 1 when category changes via URL', () => {
      let queriedPage = 1;
      mockUseProductSearch.mockImplementation((_q, _f, page) => {
        queriedPage = page;
        return page === 2 ? resetP2 : resetP1;
      });

      renderPage(['/search?q=rose'], true);
      fireEvent.click(
        screen.getByTestId('pagination-page-2-btn'),
      );
      expect(queriedPage).toBe(2);

      fireEvent.click(screen.getByTestId('set-category'));
      expect(queriedPage).toBe(1);
    });

    it('handles undefined data gracefully without crashing results header', () => {
      mockUseProductSearch.mockReturnValue(undefinedDataResult);

      renderPage(['/search']);
      expect(
        screen.getByText((_, el) => el?.textContent?.trim() === '0 sản phẩm'),
      ).toBeInTheDocument();
    });
  });
});
