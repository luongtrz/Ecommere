import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MemoryRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryPage } from './CategoryPage';
import { useCartStore } from '@/features/cart/store/cartStore';
import { formatCurrency } from '@/lib/formatters';

// Mocks for data hooks
const mockUseCategoryBySlug = vi.fn();
const mockUseProducts = vi.fn();

vi.mock('../hooks/useCategories', () => ({
  useCategoryBySlug: (slug: string) => mockUseCategoryBySlug(slug),
}));

vi.mock('../hooks/useProducts', () => ({
  useProducts: (filters: any) => mockUseProducts(filters),
}));

const mockAddItem = vi.fn();
vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    items: [],
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    totalPrice: 0,
    totalItems: 0,
    isOpen: false,
    openCart: vi.fn(),
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
    replaceItems: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (val: any) => val,
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title, description }: any) => (
    <div
      data-testid="mock-seo"
      data-title={title}
      data-description={description}
    />
  ),
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => (
    <div data-testid="loading-spinner">Đang tải dữ liệu...</div>
  ),
}));

vi.mock('@/components/common/ProductCard', () => ({
  ProductCard: ({ id, name, price, onAddToCart }: any) => (
    <div data-testid={`product-card-${id}`}>
      <span data-testid={`product-card-name-${id}`}>{name}</span>
      <span data-testid={`product-card-price-${id}`}>{price}</span>
      <button data-testid={`product-card-add-btn-${id}`} onClick={onAddToCart}>
        Thêm vào giỏ
      </button>
    </div>
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
      <button
        data-testid="filter-multi-change-btn"
        onClick={() =>
          onFilterChange({
            brand: 'ThaiBrand',
            minPrice: '50000',
            maxPrice: '200000',
            scent: 'Hoa Lan',
            volumeMl: '50',
          })
        }
      >
        Multi Filter
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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-root" data-value={value}>
      <select
        data-testid="sort-select-native"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="newest">Mới nhất</option>
        <option value="price_asc">Giá: Thấp đến cao</option>
        <option value="price_desc">Giá: Cao đến thấp</option>
        <option value="best_selling">Bán chạy nhất</option>
        <option value="rating">Đánh giá cao nhất</option>
      </select>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <div className={className} data-testid="select-trigger">
      {children}
    </div>
  ),
  SelectValue: ({ children, placeholder }: any) => (
    <span data-testid="select-value">{children || placeholder}</span>
  ),
  SelectContent: ({ children, className }: any) => (
    <div className={className} data-testid="select-content">
      {children}
    </div>
  ),
  SelectItem: ({ children, value, className }: any) => (
    <div
      className={className}
      data-value={value}
      data-testid={`select-item-${value}`}
    >
      {children}
    </div>
  ),
}));

// Helper component to spy on current location in MemoryRouter
function LocationSpy() {
  const location = useLocation();
  return (
    <div
      data-testid="location-spy"
      data-search={location.search}
      data-pathname={location.pathname}
    />
  );
}

// Helper component to test programmatic navigation without infinite loops
function NavigationTestApp() {
  const navigate = useNavigate();
  return (
    <div>
      <button
        data-testid="nav-cat-2-page-3"
        onClick={() => navigate('/category/cat-2?page=3')}
      >
        Nav Cat 2 Page 3
      </button>
      <button
        data-testid="nav-cat-4-page-1"
        onClick={() => navigate('/category/cat-4?page=1')}
      >
        Nav Cat 4 Page 1
      </button>
      <button
        data-testid="nav-cat-3"
        onClick={() => navigate('/category/cat-3')}
      >
        Nav Cat 3
      </button>
      <button
        data-testid="nav-same-cat-same-page"
        onClick={() => navigate('/category/cat-1?page=3')}
      >
        Nav Same Cat Same Page
      </button>
      <LocationSpy />
      <Routes>
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
      </Routes>
    </div>
  );
}

describe('CategoryPage', () => {
  const mockCategory = {
    id: 'cat-1',
    name: 'Xịt thơm phòng',
    slug: 'xit-thom-phong',
    description: 'Các loại xịt thơm phòng cao cấp Thái Lan',
    image: '/images/category.jpg',
  };

  const mockProductsData = {
    products: [
      {
        id: 'prod-1',
        name: 'Nước hoa xịt phòng Lavender',
        slug: 'nuoc-hoa-xit-phong-lavender',
        images: ['/images/lavender.jpg'],
        basePrice: 150000,
        rating: 4.8,
        reviewCount: 120,
        variants: [
          {
            id: 'var-1',
            name: 'Lavender 100ml',
            price: 150000,
            salePrice: 120000,
            scent: 'Lavender',
            volumeMl: 100,
            stock: 10,
          },
        ],
      },
      {
        id: 'prod-2',
        name: 'Nước hoa xịt phòng Sả Chanh',
        slug: 'nuoc-hoa-xit-phong-sa-chanh',
        images: ['/images/sachanh.jpg'],
        basePrice: 180000,
        rating: 4.5,
        reviewCount: 85,
        variants: [
          {
            id: 'var-2',
            name: 'Sả Chanh 150ml',
            price: 180000,
            salePrice: undefined,
            scent: 'Sả chanh',
            volumeMl: 150,
            stock: 5,
          },
        ],
      },
      {
        id: 'prod-3',
        name: 'Chai xịt không có biến thể',
        slug: 'chai-xit-khong-co-bien-the',
        images: ['/images/empty-var.jpg'],
        basePrice: 90000,
        rating: undefined,
        reviewCount: 0,
        variants: [],
      },
      {
        id: 'prod-4',
        name: 'Xịt phòng đa hương',
        slug: 'xit-phong-da-huong',
        images: ['/images/multi-var.jpg'],
        basePrice: 200000,
        rating: 5.0,
        reviewCount: 10,
        variants: [
          { id: 'v1', scent: 'Hương Hoa Hồng', price: 200000 },
          { id: 'v2', scent: 'Hương Hoa Cúc', price: 200000 },
          { id: 'v3', scent: 'Hương Bạc Hà', price: 200000 },
          { id: 'v4', scent: 'Hương Gỗ Trầm', price: 200000 },
        ],
      },
      {
        id: 'prod-5',
        name: 'Xịt phòng Trà Trắng',
        slug: 'xit-phong-tra-trang',
        images: ['/images/white-tea.jpg'],
        basePrice: 160000,
        rating: 4.0,
        reviewCount: 5,
        variants: [
          {
            id: 'var-5',
            name: 'Trà Trắng 100ml',
            price: 160000,
            salePrice: null,
            scent: 'Trà trắng',
            volumeMl: 100,
          },
        ],
      },
      {
        id: 'prod-6',
        name: 'Xịt phòng Quà Tặng 0đ',
        slug: 'xit-phong-qua-tang-0d',
        images: ['/images/gift.jpg'],
        basePrice: 100000,
        rating: 0,
        reviewCount: 1,
        variants: [
          {
            id: 'var-6',
            name: 'Quà tặng 50ml',
            price: 100000,
            salePrice: 0,
            scent: 'Quà tặng',
            volumeMl: 50,
          },
        ],
      },
      {
        id: 'prod-7',
        name: 'Xịt phòng biến thể rỗng',
        slug: 'xit-phong-bien-the-rong',
        images: ['/images/none.jpg'],
        basePrice: 50000,
        rating: null,
        reviewCount: 0,
        variants: [],
      },
    ],
    total: 7,
    page: 1,
    limit: 12,
    totalPages: 2,
  };

  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

  const renderCategoryPage = (route = '/category/xit-thom-phong') => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <LocationSpy />
          <Routes>
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/category" element={<CategoryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const renderNavigationPage = (initialRoute = '/category/cat-1?page=3') => {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <NavigationTestApp />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const getLocationSearch = () => {
    const spy = screen.getByTestId('location-spy');
    return spy.getAttribute('data-search') || '';
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], isOpen: false });

    mockUseCategoryBySlug.mockImplementation((slug: string) => {
      if (slug === 'non-existent') {
        return { data: null, isLoading: false };
      }
      return {
        data: {
          ...mockCategory,
          slug,
          name:
            slug === 'cat-2'
              ? 'Danh mục 2'
              : slug === 'cat-4'
                ? 'Danh mục 4'
                : mockCategory.name,
        },
        isLoading: false,
      };
    });

    mockUseProducts.mockReturnValue({
      data: mockProductsData,
      isLoading: false,
    });
  });

  describe('Loading and Error States', () => {
    it('renders loading spinner when category is loading', () => {
      mockUseCategoryBySlug.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderCategoryPage();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Xịt thơm phòng')).not.toBeInTheDocument();
    });

    it('renders empty state when category is not found (null)', () => {
      mockUseCategoryBySlug.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderCategoryPage('/category/non-existent');

      expect(screen.getByText('Không tìm thấy danh mục')).toBeInTheDocument();
      expect(screen.getByText('Danh mục không tồn tại')).toBeInTheDocument();
      expect(screen.queryByText('Xịt thơm phòng')).not.toBeInTheDocument();
    });

    it('renders empty state when category data is undefined', () => {
      mockUseCategoryBySlug.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderCategoryPage('/category/non-existent');

      expect(screen.getByText('Không tìm thấy danh mục')).toBeInTheDocument();
      expect(screen.getByText('Danh mục không tồn tại')).toBeInTheDocument();
    });

    it('renders loading spinner in products area when products are loading', () => {
      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderCategoryPage();

      expect(
        screen.getByRole('heading', { level: 1, name: 'Xịt thơm phòng' }),
      ).toBeInTheDocument();
      expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders empty state with clear filters button when products list is empty', () => {
      mockUseProducts.mockReturnValue({
        data: { products: [], total: 0, totalPages: 0 },
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText('Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Xóa bộ lọc' }),
      ).toBeInTheDocument();
    });

    it('clears filters and keeps current viewMode in grid mode when clicking clear filters button', () => {
      mockUseProducts.mockReturnValue({
        data: { products: [], total: 0, totalPages: 0 },
        isLoading: false,
      });

      renderCategoryPage(
        '/category/xit-thom-phong?view=grid&sort=price_desc&brand=BrandA',
      );

      const clearBtn = screen.getByRole('button', { name: 'Xóa bộ lọc' });
      fireEvent.click(clearBtn);

      expect(getLocationSearch()).toBe('?view=grid');
    });

    it('clears filters and keeps current viewMode in list mode when clicking clear filters button', () => {
      mockUseProducts.mockReturnValue({
        data: { products: [], total: 0, totalPages: 0 },
        isLoading: false,
      });

      renderCategoryPage(
        '/category/xit-thom-phong?view=list&sort=price_desc&brand=BrandB',
      );

      const clearBtn = screen.getByRole('button', { name: 'Xóa bộ lọc' });
      fireEvent.click(clearBtn);

      expect(getLocationSearch()).toBe('?view=list');
    });

    it('handles products being undefined when isProductsLoading is false', () => {
      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy sản phẩm'),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId('pagination-mock')).not.toBeInTheDocument();
    });
  });

  describe('Category Header, SEO and Breadcrumbs', () => {
    it('renders SEO component with category title and description', () => {
      renderCategoryPage();

      const seo = screen.getByTestId('mock-seo');
      expect(seo).toHaveAttribute('data-title', 'Xịt thơm phòng');
      expect(seo).toHaveAttribute(
        'data-description',
        'Các loại xịt thơm phòng cao cấp Thái Lan',
      );
    });

    it('handles category without description in SEO', () => {
      mockUseCategoryBySlug.mockReturnValue({
        data: { id: 'cat-1', name: 'Danh mục không mô tả', slug: 'no-desc' },
        isLoading: false,
      });

      renderCategoryPage('/category/no-desc');

      const seo = screen.getByTestId('mock-seo');
      expect(seo).toHaveAttribute('data-title', 'Danh mục không mô tả');
      expect(seo).not.toHaveAttribute('data-description');
    });

    it('renders breadcrumbs with link to catalog and current category name', () => {
      renderCategoryPage();

      const catalogLink = screen.getByRole('link', { name: 'Sản phẩm' });
      expect(catalogLink).toHaveAttribute('href', '/catalog');
      expect(
        screen.getAllByText('Xịt thơm phòng').length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('renders category heading and product count', () => {
      renderCategoryPage();

      expect(
        screen.getByRole('heading', { level: 1, name: 'Xịt thơm phòng' }),
      ).toBeInTheDocument();
      expect(screen.getByText('7 sản phẩm')).toBeInTheDocument();
    });

    it('renders 0 sản phẩm when products total is 0', () => {
      mockUseProducts.mockReturnValue({
        data: { products: [], total: 0, totalPages: 0 },
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
    });

    it('renders 0 sản phẩm when products total is undefined', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: mockProductsData.products,
          total: undefined as any,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
    });
  });

  describe('URL Parameter Parsing and Default Values', () => {
    it('parses default query parameters (page 1, sort newest, view grid, no search or filters)', () => {
      renderCategoryPage('/category/xit-thom-phong');

      expect(mockUseCategoryBySlug).toHaveBeenCalledWith('xit-thom-phong');
      expect(mockUseProducts).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
        categorySlug: 'xit-thom-phong',
        sortBy: 'newest',
        search: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        scent: undefined,
        volumeMl: undefined,
        brand: undefined,
      });
    });

    it('parses all search and filter query parameters from URL', () => {
      renderCategoryPage(
        '/category/xit-thom-phong?page=3&sort=rating&view=list&q=spray&minPrice=50000&maxPrice=300000&scent=Lavande&volumeMl=100&brand=ThaiCo',
      );

      expect(mockUseProducts).toHaveBeenCalledWith({
        page: 3,
        limit: 12,
        categorySlug: 'xit-thom-phong',
        sortBy: 'rating',
        search: 'spray',
        minPrice: 50000,
        maxPrice: 300000,
        scent: 'Lavande',
        volumeMl: '100',
        brand: 'ThaiCo',
      });
    });

    it('parses individual filters independently (minPrice only, maxPrice only, scent only, etc.)', () => {
      renderCategoryPage('/category/xit-thom-phong?minPrice=70000');
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 70000, maxPrice: undefined }),
      );

      renderCategoryPage('/category/xit-thom-phong?maxPrice=150000');
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: undefined, maxPrice: 150000 }),
      );

      renderCategoryPage('/category/xit-thom-phong?scent=Cam');
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          scent: 'Cam',
          volumeMl: undefined,
          brand: undefined,
        }),
      );

      renderCategoryPage('/category/xit-thom-phong?volumeMl=250');
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ volumeMl: '250', scent: undefined }),
      );

      renderCategoryPage('/category/xit-thom-phong?brand=ThaiAroma');
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ brand: 'ThaiAroma' }),
      );
    });

    it('handles empty string filter params in URL (treating them as undefined)', () => {
      renderCategoryPage(
        '/category/xit-thom-phong?scent=&volumeMl=&brand=&q=&sort=&view=',
      );

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          scent: undefined,
          volumeMl: undefined,
          brand: undefined,
          search: undefined,
          sortBy: 'newest',
        }),
      );
    });

    it('handles invalid page parameter: defaults to 1 when NaN', () => {
      renderCategoryPage('/category/xit-thom-phong?page=invalid-page');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });

    it('handles non-positive page parameter: defaults to 1 when page is 0', () => {
      renderCategoryPage('/category/xit-thom-phong?page=0');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });

    it('handles negative page parameter: defaults to 1 when page < 1', () => {
      renderCategoryPage('/category/xit-thom-phong?page=-5');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
    });

    it('handles route without categorySlug param', () => {
      renderCategoryPage('/category');

      expect(mockUseCategoryBySlug).toHaveBeenCalledWith(undefined);
      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ categorySlug: undefined }),
      );
    });
  });

  describe('Category Slug Change and Page Reset', () => {
    it('resets page to 1 in URL when navigating to a different category with page > 1', () => {
      renderNavigationPage('/category/cat-1?page=3');

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({ categorySlug: 'cat-1', page: 3 }),
      );

      const navBtn = screen.getByTestId('nav-cat-2-page-3');
      fireEvent.click(navBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('page')).toBe('1');
    });

    it('does not reset URL if category changes and page is already 1', () => {
      renderNavigationPage('/category/cat-1?page=1');

      const navBtn = screen.getByTestId('nav-cat-4-page-1');
      fireEvent.click(navBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('page')).toBe('1');
    });

    it('does not reset URL if category changes but page is not present in URL', () => {
      renderNavigationPage('/category/cat-1');

      const navBtn = screen.getByTestId('nav-cat-3');
      fireEvent.click(navBtn);

      expect(getLocationSearch()).toBe('');
    });

    it('does not trigger page reset effect when categorySlug does not change', () => {
      renderNavigationPage('/category/cat-1?page=3');

      const navBtn = screen.getByTestId('nav-same-cat-same-page');
      fireEvent.click(navBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('page')).toBe('3');
    });
  });

  describe('Search Input, Clear Button, and Debounce', () => {
    it('updates searchInput on change and debounces URL query update with page reset', () => {
      renderCategoryPage('/category/xit-thom-phong?page=2');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm...');
      expect(searchInput).toHaveValue('');

      fireEvent.change(searchInput, { target: { value: 'quế' } });

      expect(searchInput).toHaveValue('quế');
      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('q')).toBe('quế');
      expect(params.get('page')).toBe('1');
    });

    it('shows clear button when searchInput has value, and clicking it clears search and deletes q from URL', () => {
      renderCategoryPage('/category/xit-thom-phong?q=rose');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm...');
      expect(searchInput).toHaveValue('rose');

      const clearBtn = searchInput.parentElement?.querySelector('button');
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn!);

      expect(searchInput).toHaveValue('');
      const params = new URLSearchParams(getLocationSearch());
      expect(params.has('q')).toBe(false);
      expect(params.get('page')).toBe('1');
    });

    it('does not render clear button when search input is empty', () => {
      renderCategoryPage('/category/xit-thom-phong');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm...');
      const clearBtn = searchInput.parentElement?.querySelector('button');
      expect(clearBtn).toBeNull();
    });

    it('deletes q from URL when debouncedSearch is empty string', () => {
      renderCategoryPage('/category/xit-thom-phong?q=initial');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm...');
      fireEvent.change(searchInput, { target: { value: '' } });

      const params = new URLSearchParams(getLocationSearch());
      expect(params.has('q')).toBe(false);
    });

    it('does not trigger updateParams when debouncedSearch equals searchQuery', () => {
      renderCategoryPage('/category/xit-thom-phong?q=matched');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm...');
      expect(searchInput).toHaveValue('matched');
      expect(getLocationSearch()).toBe('?q=matched');
    });
  });

  describe('Sorting and Sort Options', () => {
    it('renders sort options with exact Vietnamese labels', () => {
      renderCategoryPage();

      expect(screen.getByTestId('select-item-newest')).toHaveTextContent(
        'Mới nhất',
      );
      expect(screen.getByTestId('select-item-price_asc')).toHaveTextContent(
        'Giá: Thấp đến cao',
      );
      expect(screen.getByTestId('select-item-price_desc')).toHaveTextContent(
        'Giá: Cao đến thấp',
      );
      expect(screen.getByTestId('select-item-best_selling')).toHaveTextContent(
        'Bán chạy nhất',
      );
      expect(screen.getByTestId('select-item-rating')).toHaveTextContent(
        'Đánh giá cao nhất',
      );
    });

    it('updates sort parameter and resets page to 1 for all sort options', () => {
      renderCategoryPage('/category/xit-thom-phong?page=3');
      const sortSelect = screen.getByTestId('sort-select-native');

      fireEvent.change(sortSelect, { target: { value: 'price_asc' } });
      let params = new URLSearchParams(getLocationSearch());
      expect(params.get('sort')).toBe('price_asc');
      expect(params.get('page')).toBe('1');

      fireEvent.change(sortSelect, { target: { value: 'price_desc' } });
      params = new URLSearchParams(getLocationSearch());
      expect(params.get('sort')).toBe('price_desc');
      expect(params.get('page')).toBe('1');

      fireEvent.change(sortSelect, { target: { value: 'best_selling' } });
      params = new URLSearchParams(getLocationSearch());
      expect(params.get('sort')).toBe('best_selling');
      expect(params.get('page')).toBe('1');

      fireEvent.change(sortSelect, { target: { value: 'rating' } });
      params = new URLSearchParams(getLocationSearch());
      expect(params.get('sort')).toBe('rating');
      expect(params.get('page')).toBe('1');

      fireEvent.change(sortSelect, { target: { value: 'newest' } });
      params = new URLSearchParams(getLocationSearch());
      expect(params.get('sort')).toBe('newest');
      expect(params.get('page')).toBe('1');
    });
  });

  describe('View Mode Toggling and Rendering', () => {
    it('renders products in grid view by default with ProductCard', () => {
      const { container } = renderCategoryPage('/category/xit-thom-phong');

      const gridBtn = container
        .querySelector('svg.lucide-grid3x3')
        ?.closest('button');
      const listBtn = container
        .querySelector('svg.lucide-list')
        ?.closest('button');
      expect(gridBtn).toHaveClass('bg-white');
      expect(listBtn).toHaveClass('text-slate-500');

      expect(screen.getByTestId('product-card-prod-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-prod-2')).toBeInTheDocument();
    });

    it('allows clicking grid toggle button while in grid mode', () => {
      const { container } = renderCategoryPage(
        '/category/xit-thom-phong?view=grid',
      );

      const gridBtn = container
        .querySelector('svg.lucide-grid3x3')
        ?.closest('button');
      fireEvent.click(gridBtn!);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('view')).toBe('grid');
    });

    it('switches to list view when list toggle button is clicked', () => {
      const { container } = renderCategoryPage('/category/xit-thom-phong');

      const listBtn = container
        .querySelector('svg.lucide-list')
        ?.closest('button');
      fireEvent.click(listBtn!);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('view')).toBe('list');
      expect(params.get('page')).toBe('1');
    });

    it('allows clicking list toggle button while in list mode', () => {
      const { container } = renderCategoryPage(
        '/category/xit-thom-phong?view=list',
      );

      const listBtn = container
        .querySelector('svg.lucide-list')
        ?.closest('button');
      fireEvent.click(listBtn!);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('view')).toBe('list');
    });

    it('switches back to grid view when grid toggle button is clicked from list mode', () => {
      const { container } = renderCategoryPage(
        '/category/xit-thom-phong?view=list',
      );

      const gridBtn = container
        .querySelector('svg.lucide-grid3x3')
        ?.closest('button');
      fireEvent.click(gridBtn!);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('view')).toBe('grid');
      expect(params.get('page')).toBe('1');
    });

    it('renders products in list view with name, rating, review count, badges, and formatted price', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      expect(
        screen.getByText('Nước hoa xịt phòng Lavender'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nước hoa xịt phòng Sả Chanh'),
      ).toBeInTheDocument();

      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('0.0')).toBeInTheDocument();

      expect(screen.getByText('120 đánh giá')).toBeInTheDocument();
      expect(screen.getByText('85 đánh giá')).toBeInTheDocument();
      expect(screen.getAllByText('0 đánh giá').length).toBeGreaterThanOrEqual(
        1,
      );

      expect(screen.getByText('Lavender')).toBeInTheDocument();
      expect(screen.getByText('Sả chanh')).toBeInTheDocument();

      expect(
        screen.getByText(formatCurrency(150000).replace(/\u00a0/g, ' ')),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatCurrency(180000).replace(/\u00a0/g, ' ')),
      ).toBeInTheDocument();
    });

    it('limits scent badges to maximum 3 variants in list view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      expect(screen.getByText('Hương Hoa Hồng')).toBeInTheDocument();
      expect(screen.getByText('Hương Hoa Cúc')).toBeInTheDocument();
      expect(screen.getByText('Hương Bạc Hà')).toBeInTheDocument();
      expect(screen.queryByText('Hương Gỗ Trầm')).not.toBeInTheDocument();
    });

    it('handles undefined or null product rating gracefully in list view without crashing', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      expect(
        screen.getByText('Chai xịt không có biến thể'),
      ).toBeInTheDocument();
      expect(screen.getByText('Xịt phòng biến thể rỗng')).toBeInTheDocument();
    });
  });

  describe('Add to Cart Interactions', () => {
    it('adds product with variant salePrice to cart in grid view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=grid');

      const addBtn = screen.getByTestId('product-card-add-btn-prod-1');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa xịt phòng Lavender',
        image: '/images/lavender.jpg',
        price: 120000,
        scent: 'Lavender',
        volumeMl: 100,
      });
    });

    it('adds product with salePrice: undefined falling back to variant.price in grid view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=grid');

      const addBtn = screen.getByTestId('product-card-add-btn-prod-2');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Nước hoa xịt phòng Sả Chanh',
        image: '/images/sachanh.jpg',
        price: 180000,
        scent: 'Sả chanh',
        volumeMl: 150,
      });
    });

    it('adds product with salePrice: null falling back to variant.price in grid view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=grid');

      const addBtn = screen.getByTestId('product-card-add-btn-prod-5');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-5',
        variantId: 'var-5',
        name: 'Xịt phòng Trà Trắng',
        image: '/images/white-tea.jpg',
        price: 160000,
        scent: 'Trà trắng',
        volumeMl: 100,
      });
    });

    it('adds product with salePrice: 0 preserving 0 in grid view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=grid');

      const addBtn = screen.getByTestId('product-card-add-btn-prod-6');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-6',
        variantId: 'var-6',
        name: 'Xịt phòng Quà Tặng 0đ',
        image: '/images/gift.jpg',
        price: 0,
        scent: 'Quà tặng',
        volumeMl: 50,
      });
    });

    it('does not call addItem when product has empty variants array in grid view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=grid');

      const addBtn = screen.getByTestId('product-card-add-btn-prod-3');
      fireEvent.click(addBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('does not call addItem when product variants[0] is undefined in grid view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=grid');

      const addBtn = screen.getByTestId('product-card-add-btn-prod-7');
      fireEvent.click(addBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('adds product with variant salePrice to cart in list view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addButtons[0]);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa xịt phòng Lavender',
        image: '/images/lavender.jpg',
        price: 120000,
        scent: 'Lavender',
        volumeMl: 100,
      });
    });

    it('falls back to variant.price when salePrice is undefined in list view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addButtons[1]);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Nước hoa xịt phòng Sả Chanh',
        image: '/images/sachanh.jpg',
        price: 180000,
        scent: 'Sả chanh',
        volumeMl: 150,
      });
    });

    it('falls back to variant.price when salePrice is null in list view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addButtons[4]);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-5',
        variantId: 'var-5',
        name: 'Xịt phòng Trà Trắng',
        image: '/images/white-tea.jpg',
        price: 160000,
        scent: 'Trà trắng',
        volumeMl: 100,
      });
    });

    it('preserves salePrice: 0 in list view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addButtons[5]);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-6',
        variantId: 'var-6',
        name: 'Xịt phòng Quà Tặng 0đ',
        image: '/images/gift.jpg',
        price: 0,
        scent: 'Quà tặng',
        volumeMl: 50,
      });
    });

    it('does not call addItem when product has no variants in list view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addButtons[2]);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('does not call addItem when product variants[0] is undefined in list view', () => {
      renderCategoryPage('/category/xit-thom-phong?view=list');

      const addButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addButtons[6]);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Filter Changes and updateParams', () => {
    it('updates URL filter parameters and resets page to 1 when FilterSidebar changes', () => {
      renderCategoryPage('/category/xit-thom-phong?page=2');

      const filterChangeBtn = screen.getAllByTestId('filter-change-btn')[0];
      fireEvent.click(filterChangeBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('brand')).toBe('Brand A');
      expect(params.get('minPrice')).toBe('100000');
      expect(params.get('page')).toBe('1');
    });

    it('applies multiple filter keys simultaneously from FilterSidebar', () => {
      renderCategoryPage('/category/xit-thom-phong?page=3');

      const multiBtn = screen.getAllByTestId('filter-multi-change-btn')[0];
      fireEvent.click(multiBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('brand')).toBe('ThaiBrand');
      expect(params.get('minPrice')).toBe('50000');
      expect(params.get('maxPrice')).toBe('200000');
      expect(params.get('scent')).toBe('Hoa Lan');
      expect(params.get('volumeMl')).toBe('50');
      expect(params.get('page')).toBe('1');
    });

    it('removes URL filter parameters when values are undefined or empty string', () => {
      renderCategoryPage(
        '/category/xit-thom-phong?brand=OldBrand&scent=OldScent&page=2',
      );

      const clearKeysBtn = screen.getAllByTestId('filter-clear-keys-btn')[0];
      fireEvent.click(clearKeysBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.has('brand')).toBe(false);
      expect(params.has('scent')).toBe(false);
      expect(params.get('page')).toBe('1');
    });

    it('passes hideCategoryFilter true and current filter params to FilterSidebar', () => {
      renderCategoryPage(
        '/category/xit-thom-phong?minPrice=50000&maxPrice=150000&brand=ThaiBrand',
      );

      const sidebars = screen.getAllByTestId('filter-sidebar');
      expect(sidebars[0]).toHaveAttribute('data-hide-category', 'true');

      const filters = JSON.parse(
        sidebars[0].querySelector('[data-testid="sidebar-filters"]')
          ?.textContent || '{}',
      );
      expect(filters).toEqual({
        minPrice: 50000,
        maxPrice: 150000,
        brand: 'ThaiBrand',
      });
    });
  });

  describe('Mobile Filter Sheet', () => {
    it('renders mobile filter sheet and allows filter changes', () => {
      const { container } = renderCategoryPage();

      const mobileTrigger = container.querySelector('button.lg\\:hidden');
      expect(mobileTrigger).toBeInTheDocument();
      fireEvent.click(mobileTrigger!);

      expect(screen.getByText('Bộ lọc')).toBeInTheDocument();

      const sidebars = screen.getAllByTestId('filter-sidebar');
      expect(sidebars.length).toBe(2);

      // Trigger filter change from inside the mobile sheet
      const mobileFilterChangeBtn =
        screen.getAllByTestId('filter-change-btn')[1];
      fireEvent.click(mobileFilterChangeBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('brand')).toBe('Brand A');
      expect(params.get('minPrice')).toBe('100000');
    });
  });

  describe('Pagination', () => {
    it('renders Pagination when totalPages > 1 and handles onPageChange', () => {
      renderCategoryPage('/category/xit-thom-phong?page=1');

      expect(screen.getByTestId('pagination-mock')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-info')).toHaveTextContent(
        'Page 1 of 2',
      );

      const page2Btn = screen.getByTestId('pagination-page-2-btn');
      fireEvent.click(page2Btn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('page')).toBe('2');
    });

    it('handles clicking next button on Pagination', () => {
      renderCategoryPage('/category/xit-thom-phong?page=1');

      const nextBtn = screen.getByTestId('pagination-next-btn');
      fireEvent.click(nextBtn);

      const params = new URLSearchParams(getLocationSearch());
      expect(params.get('page')).toBe('2');
    });

    it('does not render Pagination when totalPages is 1', () => {
      mockUseProducts.mockReturnValue({
        data: { ...mockProductsData, totalPages: 1 },
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.queryByTestId('pagination-mock')).not.toBeInTheDocument();
    });

    it('does not render Pagination when totalPages is 0', () => {
      mockUseProducts.mockReturnValue({
        data: { ...mockProductsData, totalPages: 0 },
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.queryByTestId('pagination-mock')).not.toBeInTheDocument();
    });

    it('does not render Pagination when products data is undefined', () => {
      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.queryByTestId('pagination-mock')).not.toBeInTheDocument();
    });

    it('does not render Pagination when products data is null', () => {
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderCategoryPage();

      expect(screen.queryByTestId('pagination-mock')).not.toBeInTheDocument();
    });
  });
});
