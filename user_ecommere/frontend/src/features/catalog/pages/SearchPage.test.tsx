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
        screen.getByRole('link', { name: /Quay lại danh sách/i }),
      ).toHaveAttribute('href', '/catalog');
      expect(screen.getByPlaceholderText('Tìm kiếm sản phẩm...')).toHaveValue(
        '',
      );
      expect(screen.getByTestId('sort-select')).toHaveValue('newest');
      expect(
        screen.getByRole('button', { name: /Bộ lọc/i }),
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
      expect(screen.getByText('Tìm kiếm cho:')).toBeInTheDocument();
      expect(screen.getByText('"rose"')).toBeInTheDocument();
      expect(screen.getByText('2 kết quả')).toBeInTheDocument();
      expect(
        screen.getAllByRole('button', { name: 'Xóa tìm kiếm' })[1],
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
        screen.getAllByRole('button', { name: 'Xóa tìm kiếm' })[1],
      );
      expect(screen.getByPlaceholderText('Tìm kiếm sản phẩm...')).toHaveValue(
        '',
      );
      expect(screen.getByTestId('loc').textContent).toBe('');
    });

    it('alerts user when clicking "Bộ lọc"', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      renderPage(['/search']);
      fireEvent.click(screen.getByRole('button', { name: /Bộ lọc/i }));
      expect(alertSpy).toHaveBeenCalledWith(
        'Tính năng bộ lọc đang được phát triển. Hiện tại bạn có thể sử dụng tìm kiếm và sắp xếp.',
      );
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
      expect(screen.queryByText('Kết quả tìm kiếm')).not.toBeInTheDocument();
    });

    it('renders LoadingSpinner when isPlaceholderData is true with active query and empty products', () => {
      mockUseProductSearch.mockReturnValue(placeholderResult);
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

    it('controls visibility of header "xem tất cả sản phẩm" link under various loading conditions', () => {
      // Condition 1: isLoading true -> link hidden
      mockUseProductSearch.mockReturnValue(emptyTotal0Loading);
      const { unmount } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('link', { name: 'xem tất cả sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount();

      // Condition 2: isPlaceholderData true -> link hidden
      mockUseProductSearch.mockReturnValue(emptyTotal0Placeholder);
      const { unmount: unmount2 } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('link', { name: 'xem tất cả sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount2();

      // Condition 3: total > 0 -> link hidden
      mockUseProductSearch.mockReturnValue(backgroundResult);
      const { unmount: unmount3 } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('link', { name: 'xem tất cả sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount3();

      // Condition 4: total === 0 and not loading -> link shown
      mockUseProductSearch.mockReturnValue(emptyWithTotal0);
      renderPage(['/search?q=rose']);
      expect(
        screen.getByRole('link', { name: 'xem tất cả sản phẩm' }),
      ).toBeInTheDocument();
    });

    it('shows 0 kết quả when query is present and data is undefined', () => {
      mockUseProductSearch.mockReturnValue(undefinedDataResult);
      renderPage(['/search?q=rose']);
      expect(screen.getByText('0 kết quả')).toBeInTheDocument();
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

    it('renders EmptyState when query is empty and total is 0, and clears params on button click', () => {
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

      const clearBtn = screen.getByRole('button', { name: 'Xóa tìm kiếm' });
      fireEvent.click(clearBtn);
      expect(screen.getByTestId('loc').textContent).toBe('');
    });

    it('renders search suggestions and updates input on suggestion click', () => {
      renderPage(['/search?q=khong_tim_thay']);
      expect(screen.getByText('Gợi ý tìm kiếm:')).toBeInTheDocument();
      const suggestions = [
        'Nước hoa chanh',
        'Nước hoa dâu',
        'Nước hoa cam',
        'Nước hoa vanilla',
        'Nước hoa lavender',
        'Nước hoa trà xanh',
      ];
      for (const item of suggestions) {
        expect(screen.getByRole('button', { name: item })).toBeInTheDocument();
      }
      const bacHa = screen.getAllByRole('button', { name: 'Nước hoa bạc hà' });
      expect(bacHa).toHaveLength(2);

      const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.click(screen.getByRole('button', { name: 'Nước hoa chanh' }));
      expect(input).toHaveValue('Nước hoa chanh');
    });
  });

  describe('Grid View Actions & Formatting', () => {
    it('renders products and adds to cart with salePrice', () => {
      renderPage(['/search?q=rose&view=grid']);
      expect(screen.getByText('Kết quả tìm kiếm')).toBeInTheDocument();
      expect(screen.getByText('2 sản phẩm')).toBeInTheDocument();

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
      const header = screen
        .getByRole('heading', { level: 2, name: 'Kết quả tìm kiếm' })
        .closest('div')!.parentElement!;
      const buttons = header.querySelectorAll('button');
      const gridBtn = buttons[0];
      const listBtn = buttons[1];

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

  describe('Pagination & Load More Flow', () => {
    // Predefined stable results for pagination tests
    const page1Multi = createStableResult([p1, p2NoVar], 4, 1, 2, 2, true);
    const page2Multi = createStableResult(
      [p2NoVar, p4Regular],
      4,
      2,
      2,
      2,
      false,
    );

    const page1Single = createStableResult([p1], 2, 1, 1, 2, true);
    const page2New = createStableResult([p3MultiVar], 2, 2, 1, 2, false);
    const page2Dup = createStableResult([p1], 2, 2, 1, 2, false);

    const page1Stale = createStableResult([p1], 4, 1, 2, 2, true);
    const page2StaleResp = createStableResult([p4Regular], 4, 1, 2, 2, true);

    it('advances page and merges deduplicated products on clicking "Xem thêm sản phẩm"', () => {
      mockUseProductSearch.mockImplementation((_q, _f, page) =>
        page === 2 ? page2Multi : page1Multi,
      );

      renderPage(['/search?q=perfume']);
      expect(screen.getByText('Hiển thị 2 / 4 sản phẩm')).toBeInTheDocument();

      const loadMoreBtn = screen.getByRole('button', {
        name: 'Xem thêm sản phẩm',
      });
      fireEvent.click(loadMoreBtn);

      expect(screen.getByTestId('product-card-p1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-p2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-p4')).toBeInTheDocument();
    });

    it('appends products when all second page items are new', () => {
      mockUseProductSearch.mockImplementation((_q, _f, page) =>
        page === 2 ? page2New : page1Single,
      );

      renderPage(['/search?q=perfume']);
      fireEvent.click(
        screen.getByRole('button', { name: 'Xem thêm sản phẩm' }),
      );
      expect(screen.getByTestId('product-card-p1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-p3')).toBeInTheDocument();
    });

    it('avoids duplicating items when all second page items already exist', () => {
      mockUseProductSearch.mockImplementation((_q, _f, page) =>
        page === 2 ? page2Dup : page1Single,
      );

      renderPage(['/search?q=perfume']);
      fireEvent.click(
        screen.getByRole('button', { name: 'Xem thêm sản phẩm' }),
      );
      expect(screen.getAllByTestId('product-card-p1')).toHaveLength(1);
    });

    it('disables "Xem thêm sản phẩm" when isFetching is true', () => {
      const fetchingResult = createStableResult(
        [p1],
        5,
        1,
        1,
        5,
        true,
        false,
        true,
      );
      mockUseProductSearch.mockReturnValue(fetchingResult);

      renderPage(['/search?q=rose']);
      const loadMoreBtn = screen.getByRole('button', {
        name: 'Xem thêm sản phẩm',
      });
      expect(loadMoreBtn).toBeDisabled();
      fireEvent.click(loadMoreBtn);
      expect(mockUseProductSearch).not.toHaveBeenCalledWith(
        'rose',
        expect.anything(),
        2,
      );
    });

    it('falls back to evaluating page < totalPages when hasNextPage is undefined', () => {
      const undefinedNext = createStableResult([p1], 10, 1, 1, 10, undefined);
      mockUseProductSearch.mockReturnValue(undefinedNext);

      renderPage(['/search?q=rose']);
      expect(
        screen.getByRole('button', { name: 'Xem thêm sản phẩm' }),
      ).toBeInTheDocument();
    });

    it('hides load more button under various terminal conditions', () => {
      // Condition 1: page >= totalPages with undefined hasNextPage
      const terminalPage = createStableResult([p1], 1, 1, 10, 1, undefined);
      mockUseProductSearch.mockReturnValue(terminalPage);
      const { unmount } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('button', { name: 'Xem thêm sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount();

      // Condition 2: hasNextPage explicitly false
      const falseNext = createStableResult([p1], 10, 1, 1, 10, false);
      mockUseProductSearch.mockReturnValue(falseNext);
      const { unmount: unmount2 } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('button', { name: 'Xem thêm sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount2();

      // Condition 3: hasNextPage is true but products count reached total
      const reachedTotal = createStableResult([p1, p2NoVar], 2, 1, 2, 1, true);
      mockUseProductSearch.mockReturnValue(reachedTotal);
      const { unmount: unmount3 } = renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('button', { name: 'Xem thêm sản phẩm' }),
      ).not.toBeInTheDocument();
      unmount3();

      // Condition 4: hasNextPage undefined, page < totalPages, but products count reached total
      const reachedTotalUndef = createStableResult(
        [p1, p2NoVar],
        2,
        1,
        2,
        2,
        undefined,
      );
      mockUseProductSearch.mockReturnValue(reachedTotalUndef);
      renderPage(['/search?q=rose']);
      expect(
        screen.queryByRole('button', { name: 'Xem thêm sản phẩm' }),
      ).not.toBeInTheDocument();
    });

    it('ignores stale page response when data.page does not match requested page', () => {
      mockUseProductSearch.mockImplementation((_q, _f, page) =>
        page === 2 ? page2StaleResp : page1Stale,
      );

      renderPage(['/search?q=perfume']);
      fireEvent.click(
        screen.getByRole('button', { name: 'Xem thêm sản phẩm' }),
      );
      expect(screen.queryByTestId('product-card-p4')).not.toBeInTheDocument();
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
        screen.getByRole('button', { name: 'Xem thêm sản phẩm' }),
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
        screen.getByRole('button', { name: 'Xem thêm sản phẩm' }),
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
        screen.getByRole('button', { name: 'Xem thêm sản phẩm' }),
      );
      expect(queriedPage).toBe(2);

      fireEvent.click(screen.getByTestId('set-category'));
      expect(queriedPage).toBe(1);
    });

    it('handles undefined data gracefully without crashing results header', () => {
      mockUseProductSearch.mockReturnValue(undefinedDataResult);

      renderPage(['/search']);
      expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
    });
  });
});
