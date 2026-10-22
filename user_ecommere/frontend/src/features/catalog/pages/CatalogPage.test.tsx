import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogPage } from './CatalogPage';
import { useCartStore } from '@/features/cart/store/cartStore';
import { getImageUrl } from '@/lib/utils';
import { PAGINATION, PRODUCT_SORT_OPTIONS } from '@/lib/constants';

// --- Mocks ---

const mockAddItem = vi.fn();
vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    addItem: mockAddItem,
  }),
}));

const mockUseProducts = vi.fn();
vi.mock('../hooks/useProducts', () => ({
  useProducts: (filters: any, options: any) =>
    mockUseProducts(filters, options),
}));

const mockUseDebounce = vi.fn((val: any, _delay?: number) => val);
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (val: any, delay?: number) => mockUseDebounce(val, delay),
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title: string }) => (
    <div data-testid="mock-seo" data-title={title}>
      {title}
    </div>
  ),
}));

vi.mock('../components/FilterSidebar', () => ({
  FilterSidebar: ({ currentFilters, onFilterChange }: any) => (
    <div data-testid="mock-filter-sidebar">
      <span data-testid="filter-category">
        {currentFilters.categorySlug ?? 'none'}
      </span>
      <span data-testid="filter-minPrice">
        {currentFilters.minPrice ?? 'none'}
      </span>
      <span data-testid="filter-maxPrice">
        {currentFilters.maxPrice ?? 'none'}
      </span>
      <span data-testid="filter-scent">{currentFilters.scent ?? 'none'}</span>
      <span data-testid="filter-volumeMl">
        {currentFilters.volumeMl ?? 'none'}
      </span>
      <span data-testid="filter-brand">{currentFilters.brand ?? 'none'}</span>
      <button
        type="button"
        data-testid="sidebar-change-category"
        onClick={() => onFilterChange({ categorySlug: 'perfume-home' })}
      >
        Change Category
      </button>
      <button
        type="button"
        data-testid="sidebar-change-other"
        onClick={() =>
          onFilterChange({
            brand: 'Oasis',
            scent: 'Hoa Hồng',
            volumeMl: '150',
            minPrice: '50000',
            maxPrice: '200000',
          })
        }
      >
        Change Other Filters
      </button>
      <button
        type="button"
        data-testid="sidebar-clear-filter"
        onClick={() => onFilterChange({ brand: undefined, scent: '' })}
      >
        Clear Filters
      </button>
    </div>
  ),
}));

vi.mock('@/components/common/ProductCard', () => ({
  ProductCard: ({
    id,
    name,
    slug,
    images,
    price,
    rating,
    reviewCount,
    variants,
    onAddToCart,
  }: any) => (
    <div data-testid={`product-card-${id}`}>
      <span data-testid={`card-name-${id}`}>{name}</span>
      <span data-testid={`card-slug-${id}`}>{slug}</span>
      <span data-testid={`card-price-${id}`}>{price}</span>
      <span data-testid={`card-rating-${id}`}>{rating}</span>
      <span data-testid={`card-reviews-${id}`}>{reviewCount}</span>
      <span data-testid={`card-images-count-${id}`}>
        {images ? images.length : 0}
      </span>
      <span data-testid={`card-variants-count-${id}`}>
        {variants ? variants.length : 0}
      </span>
      <button
        type="button"
        data-testid={`card-add-btn-${id}`}
        onClick={onAddToCart}
      >
        Thêm vào giỏ
      </button>
    </div>
  ),
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => (
    <div data-testid="loading-spinner">Đang tải dữ liệu...</div>
  ),
}));

vi.mock('@/components/common/Pagination', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="mock-pagination">
      <span data-testid="pagination-current">{currentPage}</span>
      <span data-testid="pagination-total">{totalPages}</span>
      <button
        type="button"
        data-testid="pagination-next-btn"
        onClick={() => onPageChange(currentPage + 1)}
      >
        Trang tiếp
      </button>
      <button
        type="button"
        data-testid="pagination-page-3-btn"
        onClick={() => onPageChange(3)}
      >
        Trang 3
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (val: string) => void;
    children: React.ReactNode;
  }) => (
    <div data-testid="mock-select" data-value={value}>
      <select
        data-testid="sort-select"
        value={value}
        aria-label="Sắp xếp"
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value" />,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => (
    <option value={value} data-testid={`select-item-${value}`}>
      {children}
    </option>
  ),
}));

// Mock Sheet as a controlled/open-aware dialog so that mobile SheetContent is
// only rendered when opened via SheetTrigger, preventing duplicate filter sidebars
vi.mock('@/components/ui/sheet', () => {
  const SheetContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
  }>({
    open: false,
    setOpen: () => {},
  });

  return {
    Sheet: ({ children }: { children: React.ReactNode }) => {
      const [open, setOpen] = React.useState(false);
      return (
        <SheetContext.Provider value={{ open, setOpen }}>
          <div data-testid="mock-sheet" data-state={open ? 'open' : 'closed'}>
            {children}
          </div>
        </SheetContext.Provider>
      );
    },
    SheetTrigger: ({
      children,
      asChild: _asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => {
      const { setOpen } = React.useContext(SheetContext);
      return (
        <button
          type="button"
          data-testid="mock-sheet-trigger"
          onClick={() => setOpen(true)}
        >
          {children}
        </button>
      );
    },
    SheetContent: ({
      children,
      side,
      className,
    }: {
      children: React.ReactNode;
      side?: string;
      className?: string;
    }) => {
      const { open } = React.useContext(SheetContext);
      if (!open) return null;
      return (
        <div
          data-testid="mock-sheet-content"
          data-side={side}
          className={className}
        >
          {children}
        </div>
      );
    },
    SheetHeader: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-sheet-header">{children}</div>
    ),
    SheetTitle: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <h2 data-testid="mock-sheet-title" className={className}>
        {children}
      </h2>
    ),
  };
});

// Helper probe component to observe search params inside MemoryRouter
function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="search-params-probe">{params.toString()}</div>;
}

// Sample product dataset exercising all variant/price/stock combinations
const mockProducts = [
  {
    id: 'prod-1',
    name: 'Chai Xịt Phòng Tinh Dầu Bưởi',
    slug: 'chai-xit-phong-tinh-dau-buoi',
    images: ['/images/product1.jpg'],
    basePrice: 120000,
    rating: 4.8,
    reviewCount: 32,
    variants: [
      {
        id: 'var-1',
        name: 'Bưởi 100ml',
        scent: 'Cam Chanh',
        volumeMl: 100,
        price: 150000,
        salePrice: 120000,
        stock: 10,
      },
    ],
  },
  {
    id: 'prod-2',
    name: 'Xịt Thơm Phòng Lavender',
    slug: 'xit-thom-phong-lavender',
    images: ['/images/product2.jpg'],
    basePrice: 95000,
    rating: 4.5,
    reviewCount: 15,
    variants: [
      {
        id: 'var-2',
        name: 'Lavender 50ml',
        scent: 'Hoa Lavender',
        volumeMl: 50,
        price: 95000,
        salePrice: undefined,
        stock: 5,
      },
    ],
  },
  {
    id: 'prod-3',
    name: 'Xịt Khử Mùi Hương Gỗ Hết Hàng',
    slug: 'xit-khu-mui-huong-go-het-hang',
    images: ['/images/product3.jpg'],
    basePrice: 180000,
    rating: 4.0,
    reviewCount: 8,
    variants: [
      {
        id: 'var-3',
        name: 'Hương Gỗ 200ml',
        scent: 'Hương Gỗ',
        volumeMl: 200,
        price: 180000,
        stock: 0,
      },
    ],
  },
  {
    id: 'prod-4',
    name: 'Sản Phẩm Không Có Biến Thể',
    slug: 'san-pham-khong-co-bien-the',
    images: ['/images/product4.jpg'],
    basePrice: 200000,
    rating: undefined,
    reviewCount: 0,
    variants: [],
  },
  {
    id: 'prod-5',
    name: 'Nước Hoa Đa Mùi Hương',
    slug: 'nuoc-hoa-da-mui-huong',
    images: ['/images/product5.jpg'],
    basePrice: 250000,
    rating: 4.9,
    reviewCount: 120,
    variants: [
      {
        id: 'var-5-1',
        scent: 'Hoa Hồng',
        volumeMl: 50,
        price: 250000,
        stock: 5,
      },
      {
        id: 'var-5-2',
        scent: 'Hoa Nhài',
        volumeMl: 50,
        price: 250000,
        stock: 5,
      },
      {
        id: 'var-5-3',
        scent: 'Trà Xanh',
        volumeMl: 50,
        price: 250000,
        stock: 5,
      },
      {
        id: 'var-5-4',
        scent: 'Hương Biển',
        volumeMl: 50,
        price: 250000,
        stock: 5,
      },
    ],
  },
];

const renderCatalogPage = (initialUrl: string = '/catalog') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route
            path="/catalog"
            element={
              <>
                <SearchParamsProbe />
                <CatalogPage />
              </>
            }
          />
          <Route
            path="*"
            element={
              <>
                <SearchParamsProbe />
                <CatalogPage />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CatalogPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useCartStore.setState({ items: [], isOpen: false });
    mockUseDebounce.mockImplementation((val) => val);
    mockUseProducts.mockReturnValue({
      data: {
        products: mockProducts,
        total: mockProducts.length,
        totalPages: 2,
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering and Initial States', () => {
    it('renders SEO, page title, product count, search input, sort options, and filter controls', () => {
      renderCatalogPage('/catalog');

      expect(screen.getByTestId('mock-seo')).toHaveTextContent('Sản phẩm');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Sản phẩm',
      );
      expect(screen.getByText('5 kết quả tìm thấy')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tìm kiếm...')).toHaveValue('');
      expect(screen.getByText('Ẩn bộ lọc')).toBeInTheDocument();
      expect(screen.getByTestId('mock-filter-sidebar')).toBeInTheDocument();

      // Check sort options
      PRODUCT_SORT_OPTIONS.forEach((opt) => {
        expect(
          screen.getByTestId(`select-item-${opt.value}`),
        ).toHaveTextContent(opt.label);
      });
    });

    it('displays 0 kết quả tìm thấy when data is undefined or total is 0', () => {
      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderCatalogPage('/catalog');
      expect(screen.getByText('0 kết quả tìm thấy')).toBeInTheDocument();
    });

    it('renders loading spinner when isLoading is true and hides products and empty state', () => {
      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderCatalogPage('/catalog');

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy sản phẩm'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('product-card-prod-1'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-pagination')).not.toBeInTheDocument();
    });

    it('renders EmptyState when products list is empty, and clicking Xóa bộ lọc resets filters while preserving viewMode', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: [],
          total: 0,
          totalPages: 0,
        },
        isLoading: false,
      });

      renderCatalogPage(
        '/catalog?q=unknown&category=perfume&sort=price_desc&view=list',
      );

      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText('Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc'),
      ).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: 'Xóa bộ lọc' });
      fireEvent.click(clearBtn);

      const probe = screen.getByTestId('search-params-probe');
      // Category and sort filters are removed, view mode is preserved,
      // and debounced search retains the local search query input state
      expect(probe.textContent).toContain('view=list');
      expect(probe.textContent).not.toContain('category=');
      expect(probe.textContent).not.toContain('sort=');
      expect(probe.textContent).toBe('view=list&q=unknown&page=1');
    });

    it('clears filters preserving default grid viewMode when view param is omitted', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: [],
          total: 0,
          totalPages: 0,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?category=citrus&sort=rating');

      const clearBtn = screen.getByRole('button', { name: 'Xóa bộ lọc' });
      fireEvent.click(clearBtn);

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toBe('view=grid');
    });
  });

  describe('Numeric Parameter Parsing (parseNumericParam)', () => {
    it('uses default values when numeric parameters are missing, empty, or whitespace', () => {
      renderCatalogPage('/catalog?page=&minPrice=%20%20&maxPrice=');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          minPrice: undefined,
          maxPrice: undefined,
        }),
        undefined,
      );
    });

    it('uses default values when parameters are non-numeric strings or non-finite', () => {
      renderCatalogPage(
        '/catalog?page=invalid-page&minPrice=abc&maxPrice=Infinity',
      );

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          minPrice: undefined,
          maxPrice: undefined,
        }),
        undefined,
      );
    });

    it('enforces min boundary: page < 1 falls back to 1, minPrice and maxPrice < 0 fall back to undefined', () => {
      renderCatalogPage('/catalog?page=0&minPrice=-100&maxPrice=-50');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          minPrice: undefined,
          maxPrice: undefined,
        }),
        undefined,
      );

      cleanup();
      // Also test negative page
      renderCatalogPage('/catalog?page=-3');
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
        }),
        undefined,
      );
    });

    it('parses valid numeric integers and decimals properly', () => {
      renderCatalogPage(
        '/catalog?page=4&minPrice=50000&maxPrice=250000&volumeMl=200',
      );

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 4,
          minPrice: 50000,
          maxPrice: 250000,
        }),
        undefined,
      );
    });

    it('truncates decimal string for page via parseInt', () => {
      renderCatalogPage('/catalog?page=3.85');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
        }),
        undefined,
      );
    });
  });

  describe('URL Parameters and useProducts Propagation', () => {
    it('passes all search parameters and defaults to useProducts and FilterSidebar', () => {
      renderCatalogPage(
        '/catalog?page=2&sort=rating&q=hoa&category=room-spray&minPrice=40000&maxPrice=160000&scent=Hoa%20Nhài&volumeMl=100&brand=ThaiSpray',
      );

      expect(mockUseProducts).toHaveBeenCalledWith(
        {
          page: 2,
          limit: PAGINATION.DEFAULT_LIMIT,
          sortBy: 'rating',
          search: 'hoa',
          categorySlug: 'room-spray',
          minPrice: 40000,
          maxPrice: 160000,
          scent: 'Hoa Nhài',
          volumeMl: '100',
          brand: 'ThaiSpray',
        },
        undefined,
      );

      expect(screen.getByTestId('filter-category')).toHaveTextContent(
        'room-spray',
      );
      expect(screen.getByTestId('filter-minPrice')).toHaveTextContent('40000');
      expect(screen.getByTestId('filter-maxPrice')).toHaveTextContent('160000');
      expect(screen.getByTestId('filter-scent')).toHaveTextContent('Hoa Nhài');
      expect(screen.getByTestId('filter-volumeMl')).toHaveTextContent('100');
      expect(screen.getByTestId('filter-brand')).toHaveTextContent('ThaiSpray');
    });

    it('passes search as undefined when searchQuery is empty string', () => {
      renderCatalogPage('/catalog');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
          sortBy: 'newest',
        }),
        undefined,
      );
    });
  });

  describe('Search Input and Debouncing', () => {
    it('initializes search input from URL param q and renders clear button', () => {
      renderCatalogPage('/catalog?q=lavender');

      const input = screen.getByPlaceholderText('Tìm kiếm...');
      expect(input).toHaveValue('lavender');

      // The clear button (with X icon) should be present
      const clearBtn = input.parentElement?.querySelector('button');
      expect(clearBtn).toBeInTheDocument();
    });

    it('does not render clear button when search input is empty', () => {
      renderCatalogPage('/catalog');

      const input = screen.getByPlaceholderText('Tìm kiếm...');
      expect(input).toHaveValue('');

      const clearBtn = input.parentElement?.querySelector('button');
      expect(clearBtn).toBeNull();
    });

    it('updates URL param q and resets page to 1 when user types a search term', () => {
      renderCatalogPage('/catalog?page=3');

      const input = screen.getByPlaceholderText('Tìm kiếm...');
      fireEvent.change(input, { target: { value: 'citrus' } });

      expect(input).toHaveValue('citrus');
      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toContain('q=citrus');
      expect(probe.textContent).toContain('page=1');
    });

    it('clears search param and input when clicking the clear (X) button', () => {
      renderCatalogPage('/catalog?q=perfume&page=2');

      const input = screen.getByPlaceholderText('Tìm kiếm...');
      const clearBtn = input.parentElement?.querySelector('button');
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn!);

      expect(input).toHaveValue('');
      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).not.toContain('q=');
      expect(probe.textContent).toContain('page=1');
    });

    it('does not update URL params if debounced value equals existing searchQuery', () => {
      // Mock useDebounce to keep returning the current search query
      mockUseDebounce.mockReturnValue('spray');

      renderCatalogPage('/catalog?q=spray');

      const input = screen.getByPlaceholderText('Tìm kiếm...');
      fireEvent.change(input, { target: { value: 'spray' } });

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toBe('q=spray');
    });
  });

  describe('Sort Selection', () => {
    it('changes sort option and resets page to 1', () => {
      renderCatalogPage('/catalog?page=4&sort=newest');

      const select = screen.getByTestId('sort-select');
      expect(select).toHaveValue('newest');

      fireEvent.change(select, { target: { value: 'price_asc' } });

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toContain('sort=price_asc');
      expect(probe.textContent).toContain('page=1');
    });
  });

  describe('Filter Sidebar and Mobile Sheet', () => {
    it('toggles desktop filter visibility and adjusts grid classes', () => {
      renderCatalogPage('/catalog');

      const toggleBtn = screen.getAllByRole('button', { name: /bộ lọc/i })[0];
      expect(toggleBtn).toHaveTextContent('Ẩn bộ lọc');
      expect(screen.getByTestId('mock-filter-sidebar')).toBeInTheDocument();

      // Click to hide filters
      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent('Bộ lọc');

      // The desktop aside is hidden and mobile sheet is closed, so no filter sidebar is rendered
      expect(
        screen.queryByTestId('mock-filter-sidebar'),
      ).not.toBeInTheDocument();
      expect(toggleBtn.className).toContain('bg-white');

      // Click again to show filters
      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent('Ẩn bộ lọc');
      expect(toggleBtn.className).toContain('bg-teal-50');
      expect(screen.getByTestId('mock-filter-sidebar')).toBeInTheDocument();
    });

    it('maps categorySlug to category param and resets page to 1 on handleFilterChange', () => {
      renderCatalogPage('/catalog?page=3');

      const changeCategoryBtn = screen.getByTestId('sidebar-change-category');
      fireEvent.click(changeCategoryBtn);

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toContain('category=perfume-home');
      expect(probe.textContent).toContain('page=1');
      expect(probe.textContent).not.toContain('categorySlug');
    });

    it('handles multiple filter updates and resets page to 1', () => {
      renderCatalogPage('/catalog?page=5');

      const changeOtherBtn = screen.getByTestId('sidebar-change-other');
      fireEvent.click(changeOtherBtn);

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toContain('brand=Oasis');
      expect(probe.textContent).toContain('scent=Hoa+H%E1%BB%93ng');
      expect(probe.textContent).toContain('volumeMl=150');
      expect(probe.textContent).toContain('minPrice=50000');
      expect(probe.textContent).toContain('maxPrice=200000');
      expect(probe.textContent).toContain('page=1');
    });

    it('deletes URL parameter when filter value is undefined or empty string', () => {
      renderCatalogPage(
        '/catalog?brand=Oasis&scent=Lavender&minPrice=10000&page=2',
      );

      const clearSingleBtn = screen.getByTestId('sidebar-clear-filter');
      fireEvent.click(clearSingleBtn);

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).not.toContain('brand=');
      expect(probe.textContent).not.toContain('scent=');
      expect(probe.textContent).toContain('minPrice=10000');
      expect(probe.textContent).toContain('page=1');
    });

    it('renders mobile sheet with trigger and opens to display title Bộ lọc and filter content', () => {
      renderCatalogPage('/catalog');

      expect(screen.getByTestId('mock-sheet-trigger')).toBeInTheDocument();
      expect(
        screen.queryByTestId('mock-sheet-content'),
      ).not.toBeInTheDocument();

      // Click trigger to open mobile sheet
      fireEvent.click(screen.getByTestId('mock-sheet-trigger'));

      expect(screen.getByTestId('mock-sheet-content')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sheet-title')).toHaveTextContent(
        'Bộ lọc',
      );
      // When mobile sheet is open, two filter sidebars are in the DOM (desktop + mobile)
      expect(screen.getAllByTestId('mock-filter-sidebar').length).toBe(2);
    });
  });

  describe('View Mode Switching (Grid vs List)', () => {
    it('renders products in Grid mode by default with ProductCard and switches to List view', () => {
      renderCatalogPage('/catalog');

      // Grid mode: ProductCard rendered for products
      expect(screen.getByTestId('product-card-prod-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-prod-2')).toBeInTheDocument();

      // Click list mode button
      const buttons = screen.getAllByRole('button');
      // The view mode buttons contain Grid3X3 and List icons
      const listBtn = buttons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-list'),
      );
      expect(listBtn).toBeDefined();

      fireEvent.click(listBtn!);

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toContain('view=list');
    });

    it('renders products in List mode with images, formatted price, rating, review count, and badges', () => {
      renderCatalogPage('/catalog?view=list');

      // Product 1
      expect(
        screen.getByText('Chai Xịt Phòng Tinh Dầu Bưởi'),
      ).toBeInTheDocument();
      expect(screen.getByText('32 đánh giá')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      // Check currency text using regex to tolerate non-breaking spaces
      expect(screen.getByText(/120\.000/)).toBeInTheDocument();

      // Image has getImageUrl source and alt
      const img1 = screen.getByAltText('Chai Xịt Phòng Tinh Dầu Bưởi');
      expect(img1).toHaveAttribute(
        'src',
        getImageUrl('/images/product1.jpg', { width: 200 }),
      );

      // Scents badge (up to 3) for Product 5
      expect(screen.getByText('Hoa Hồng')).toBeInTheDocument();
      expect(screen.getByText('Hoa Nhài')).toBeInTheDocument();
      expect(screen.getByText('Trà Xanh')).toBeInTheDocument();
      // 4th scent from product 5 is sliced out by .slice(0, 3)
      expect(screen.queryByText('Hương Biển')).not.toBeInTheDocument();

      // Switch back to grid mode
      const gridBtn =
        screen
          .getAllByRole('button')
          .find(
            (btn) =>
              btn.querySelector('svg[class*="grid"]') ||
              btn.querySelector('svg.lucide-grid3x3') ||
              btn.querySelector('svg.lucide-grid-3x3'),
          ) || document.querySelector('svg[class*="grid"]')?.closest('button');
      expect(gridBtn).toBeDefined();

      fireEvent.click(gridBtn!);

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toContain('view=grid');
    });

    it('renders rating correctly when product rating is undefined in list mode', () => {
      renderCatalogPage('/catalog?view=list');

      // Product 4 has rating: undefined
      expect(
        screen.getByText('Sản Phẩm Không Có Biến Thể'),
      ).toBeInTheDocument();
      expect(screen.getByText('0 đánh giá')).toBeInTheDocument();
    });
  });

  describe('Add to Cart Interactions', () => {
    it('adds product with salePrice in Grid view', () => {
      renderCatalogPage('/catalog');

      const addBtn = screen.getByTestId('card-add-btn-prod-1');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Chai Xịt Phòng Tinh Dầu Bưởi',
        image: '/images/product1.jpg',
        price: 120000, // variant.salePrice ?? variant.price
        scent: 'Cam Chanh',
        volumeMl: 100,
      });
    });

    it('falls back to regular price when variant salePrice is undefined in Grid view', () => {
      renderCatalogPage('/catalog');

      const addBtn = screen.getByTestId('card-add-btn-prod-2');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Xịt Thơm Phòng Lavender',
        image: '/images/product2.jpg',
        price: 95000, // fallback to variant.price
        scent: 'Hoa Lavender',
        volumeMl: 50,
      });
    });

    it('does not add to cart when variant stock is 0 in Grid view', () => {
      renderCatalogPage('/catalog');

      const addBtn = screen.getByTestId('card-add-btn-prod-3');
      fireEvent.click(addBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('does not add to cart when product variants is empty in Grid view', () => {
      renderCatalogPage('/catalog');

      const addBtn = screen.getByTestId('card-add-btn-prod-4');
      fireEvent.click(addBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('adds product with salePrice in List view when clicking Thêm vào giỏ', () => {
      renderCatalogPage('/catalog?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /thêm vào giỏ/i,
      });
      // First button belongs to prod-1
      fireEvent.click(addButtons[0]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Chai Xịt Phòng Tinh Dầu Bưởi',
        image: '/images/product1.jpg',
        price: 120000,
        scent: 'Cam Chanh',
        volumeMl: 100,
      });
    });

    it('falls back to price in List view when salePrice is undefined', () => {
      renderCatalogPage('/catalog?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /thêm vào giỏ/i,
      });
      // Second button belongs to prod-2
      fireEvent.click(addButtons[1]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Xịt Thơm Phòng Lavender',
        image: '/images/product2.jpg',
        price: 95000,
        scent: 'Hoa Lavender',
        volumeMl: 50,
      });
    });

    it('does not add to cart in List view when variant stock is 0', () => {
      renderCatalogPage('/catalog?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /thêm vào giỏ/i,
      });
      // Third button belongs to prod-3 (stock: 0)
      fireEvent.click(addButtons[2]);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('does not add to cart in List view when product has no variants', () => {
      renderCatalogPage('/catalog?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /thêm vào giỏ/i,
      });
      // Fourth button belongs to prod-4 (variants: [])
      fireEvent.click(addButtons[3]);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('does not render Pagination when totalPages is 1 or less', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: mockProducts,
          total: mockProducts.length,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog');
      expect(screen.queryByTestId('mock-pagination')).not.toBeInTheDocument();
    });

    it('renders Pagination when totalPages > 1 and updates URL page param without resetting to 1', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: mockProducts,
          total: 25,
          totalPages: 5,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?page=1');

      expect(screen.getByTestId('mock-pagination')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-current')).toHaveTextContent('1');
      expect(screen.getByTestId('pagination-total')).toHaveTextContent('5');

      const nextBtn = screen.getByTestId('pagination-next-btn');
      fireEvent.click(nextBtn);

      const probe = screen.getByTestId('search-params-probe');
      expect(probe.textContent).toContain('page=2');

      const page3Btn = screen.getByTestId('pagination-page-3-btn');
      fireEvent.click(page3Btn);

      expect(probe.textContent).toContain('page=3');
    });
  });
});
