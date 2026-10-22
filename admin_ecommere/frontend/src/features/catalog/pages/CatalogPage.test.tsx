import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogPage } from './CatalogPage';
import { useCartStore } from '@/features/cart/store/cartStore';
import { PRODUCT_SORT_OPTIONS, PAGINATION } from '@/lib/constants';

// Mock API client and Axios to prevent any network activity
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
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn().mockReturnThis(),
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

// Mock SEO component
vi.mock('@/lib/seo', () => ({
  SEO: vi.fn(({ title }: { title?: string }) => (
    <div data-testid="mock-seo" data-title={title} />
  )),
}));

// Mock Select components with accessible HTML elements and React Context
vi.mock('@/components/ui/select', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');
  const SelectContext = ReactActual.createContext<{
    value?: string;
    onValueChange?: (val: string) => void;
  }>({});

  const Select = ({ value, onValueChange, children }: any) => (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div data-testid="mock-select" data-value={value}>
        {children}
      </div>
    </SelectContext.Provider>
  );

  const SelectTrigger = ({ children, className }: any) => (
    <button
      type="button"
      className={className}
      data-testid="mock-select-trigger"
    >
      {children}
    </button>
  );

  const SelectValue = () => {
    const { value } = ReactActual.useContext(SelectContext);
    const selected = PRODUCT_SORT_OPTIONS.find((opt) => opt.value === value);
    return (
      <span data-testid="mock-select-value">{selected?.label || value}</span>
    );
  };

  const SelectContent = ({ children, className }: any) => (
    <div className={className} data-testid="mock-select-content">
      {children}
    </div>
  );

  const SelectItem = ({ value, children, className }: any) => {
    const { onValueChange, value: selectedValue } =
      ReactActual.useContext(SelectContext);
    return (
      <button
        type="button"
        role="option"
        aria-selected={selectedValue === value}
        className={className}
        data-value={value}
        onClick={() => onValueChange?.(value)}
      >
        {children}
      </button>
    );
  };

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  };
});

// Mock useProducts hook
const mockUseProducts = vi.fn();
vi.mock('../hooks/useProducts', () => ({
  useProducts: (params: any) => mockUseProducts(params),
}));
vi.mock('@/features/catalog/hooks/useProducts', () => ({
  useProducts: (params: any) => mockUseProducts(params),
}));

// Mock useCart hook
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
  }),
}));

const sampleProducts = [
  {
    id: 'prod-1',
    name: 'Xịt Thơm Phòng Hoa Nhài',
    slug: 'xit-thom-phong-hoa-nhai',
    description: 'Hương hoa nhài tinh khiết, nhẹ nhàng cho phòng ngủ',
    images: ['https://example.com/jasmine.jpg'],
    basePrice: 120000,
    rating: 4.8,
    reviewCount: 25,
    categoryId: 'cat-1',
    variants: [
      {
        id: 'var-1',
        scent: 'Hoa Nhài',
        volumeMl: 100,
        price: 150000,
        salePrice: 120000,
        stock: 50,
        sku: 'JAS-100',
      },
      {
        id: 'var-2',
        scent: 'Hoa Nhài Đậm Đặc',
        volumeMl: 200,
        price: 220000,
        salePrice: null,
        stock: 30,
        sku: 'JAS-200',
      },
    ],
  },
  {
    id: 'prod-2',
    name: 'Xịt Khử Mùi Bạc Hà',
    slug: 'xit-khu-mui-bac-ha',
    description: 'Khử mùi nhanh chóng, the mát sảng khoái',
    images: ['https://example.com/mint.jpg'],
    basePrice: 180000,
    rating: 4.2,
    reviewCount: 10,
    categoryId: 'cat-1',
    variants: [
      {
        id: 'var-3',
        scent: 'Bạc Hà Lạnh',
        volumeMl: 150,
        price: 180000,
        salePrice: undefined,
        stock: 20,
        sku: 'MNT-150',
      },
      {
        id: 'var-4',
        scent: 'Bạc Hà Chanh',
        volumeMl: 150,
        price: 190000,
        salePrice: null,
        stock: 15,
        sku: 'MNT-LEM-150',
      },
      {
        id: 'var-5',
        scent: 'Bạc Hà Quế',
        volumeMl: 150,
        price: 190000,
        salePrice: null,
        stock: 15,
        sku: 'MNT-CIN-150',
      },
      {
        id: 'var-6',
        scent: 'Bạc Hà Trầm',
        volumeMl: 150,
        price: 200000,
        salePrice: null,
        stock: 10,
        sku: 'MNT-WOO-150',
      },
    ],
  },
];

const sampleProductNoVariants = {
  id: 'prod-3',
  name: 'Xịt Thơm Hết Hàng',
  slug: 'xit-thom-het-hang',
  description: '',
  images: ['https://example.com/empty.jpg'],
  basePrice: 90000,
  rating: undefined,
  reviewCount: undefined,
  categoryId: 'cat-1',
  variants: [],
};

function renderCatalogPage(initialRoute = '/catalog') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <CatalogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CatalogPage', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [] });
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    mockUseProducts.mockReturnValue({
      data: {
        products: sampleProducts,
        total: 2,
        page: 1,
        limit: PAGINATION.DEFAULT_LIMIT,
        totalPages: 1,
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  describe('Initial Rendering & SEO', () => {
    it('renders the SEO component with Vietnamese title "Sản phẩm"', () => {
      renderCatalogPage();

      const seo = screen.getByTestId('mock-seo');
      expect(seo).toBeInTheDocument();
      expect(seo).toHaveAttribute('data-title', 'Sản phẩm');
    });

    it('renders header section with main title and description in Vietnamese', () => {
      renderCatalogPage();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Bộ sưu tập sản phẩm',
      );
      expect(
        screen.getByText('Khám phá các loại nước hoa xịt thơm chất lượng cao'),
      ).toBeInTheDocument();
    });

    it('invokes useProducts with default query params when route has no search params', () => {
      renderCatalogPage('/catalog');

      expect(mockUseProducts).toHaveBeenCalledWith({
        page: 1,
        limit: PAGINATION.DEFAULT_LIMIT,
        sortBy: 'newest',
        search: undefined,
      });
    });

    it('parses URL search parameters correctly for page, sort, search query, and viewMode', () => {
      renderCatalogPage('/catalog?page=3&sort=price_desc&q=lavender&view=list');

      expect(mockUseProducts).toHaveBeenCalledWith({
        page: 3,
        limit: PAGINATION.DEFAULT_LIMIT,
        sortBy: 'price_desc',
        search: 'lavender',
      });

      const searchInput = screen.getByPlaceholderText(
        'Tìm kiếm sản phẩm...',
      ) as HTMLInputElement;
      expect(searchInput.value).toBe('lavender');
    });
  });

  describe('Loading State', () => {
    it('renders LoadingSpinner and "Đang tải..." when isLoading is true', () => {
      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      const { container } = renderCatalogPage();

      expect(
        screen.getByRole('heading', { level: 2, name: 'Đang tải...' }),
      ).toBeInTheDocument();
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(
        screen.queryByText('Xịt Thơm Phòng Hoa Nhài'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy sản phẩm'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('renders EmptyState with category default message when product list is empty without search query', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: [],
          total: 0,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 0,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog');

      expect(
        screen.getByRole('heading', { level: 2, name: '0 sản phẩm' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText('Chưa có sản phẩm nào trong danh mục này'),
      ).toBeInTheDocument();
    });

    it('renders EmptyState with search-specific message when product list is empty with search query', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: [],
          total: 0,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 0,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?q=khong-tim-thay');

      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText('Không có sản phẩm nào khớp với tìm kiếm của bạn'),
      ).toBeInTheDocument();
    });
  });

  describe('Grid View Mode (default viewMode = "grid")', () => {
    it('renders products in a grid container with ProductCard items', () => {
      const { container } = renderCatalogPage('/catalog?view=grid');

      const gridContainer = container.querySelector('.grid.grid-cols-1');
      expect(gridContainer).toBeInTheDocument();

      expect(screen.getByText('Xịt Thơm Phòng Hoa Nhài')).toBeInTheDocument();
      expect(screen.getByText('Xịt Khử Mùi Bạc Hà')).toBeInTheDocument();
    });

    it('adds product with salePrice to cart when "Thêm vào giỏ" button is clicked in grid view', () => {
      renderCatalogPage('/catalog?view=grid');

      const addToCartButtons = screen.getAllByRole('button', {
        name: /thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButtons[0]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Xịt Thơm Phòng Hoa Nhài',
        image: 'https://example.com/jasmine.jpg',
        price: 120000, // variant.salePrice is used
        scent: 'Hoa Nhài',
        volumeMl: 100,
      });
    });

    it('adds product with regular price to cart when salePrice is undefined in grid view', () => {
      renderCatalogPage('/catalog?view=grid');

      const addToCartButtons = screen.getAllByRole('button', {
        name: /thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButtons[1]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-2',
        variantId: 'var-3',
        name: 'Xịt Khử Mùi Bạc Hà',
        image: 'https://example.com/mint.jpg',
        price: 180000, // variant.price is used because salePrice is undefined
        scent: 'Bạc Hà Lạnh',
        volumeMl: 150,
      });
    });

    it('does not add to cart in grid view when product has an empty variants array', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: [sampleProductNoVariants],
          total: 1,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?view=grid');

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButton);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('List View Mode (viewMode = "list")', () => {
    it('renders products in list container with full detail card layouts', () => {
      const { container } = renderCatalogPage('/catalog?view=list');

      const listContainer = container.querySelector('.space-y-3');
      expect(listContainer).toBeInTheDocument();

      // Product titles
      expect(screen.getByText('Xịt Thơm Phòng Hoa Nhài')).toBeInTheDocument();
      expect(screen.getByText('Xịt Khử Mùi Bạc Hà')).toBeInTheDocument();

      // Ratings & review counts
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('(25 đánh giá)')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('(10 đánh giá)')).toBeInTheDocument();

      // Variant count badges
      expect(screen.getByText('2 biến thể')).toBeInTheDocument();
      expect(screen.getByText('4 biến thể')).toBeInTheDocument();

      // Descriptions
      expect(
        screen.getByText('Hương hoa nhài tinh khiết, nhẹ nhàng cho phòng ngủ'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Khử mùi nhanh chóng, the mát sảng khoái'),
      ).toBeInTheDocument();

      // Scent tags
      expect(screen.getByText('Hoa Nhài - 100ml')).toBeInTheDocument();
      expect(screen.getByText('Hoa Nhài Đậm Đặc - 200ml')).toBeInTheDocument();

      // Overflow scent badge (+1 nữa for prod-2 which has 4 variants)
      expect(screen.getByText('+1 nữa')).toBeInTheDocument();

      // Formatted prices (matching Vietnamese currency on leaf price element regardless of non-breaking space encoding)
      expect(
        screen.getByText((_content, element) => {
          if (!element || element.children.length > 0) return false;
          const text =
            element.textContent?.replace(/\u00a0/g, ' ').trim() || '';
          return (
            text.includes('120.000') &&
            (text.includes('₫') || text.includes('đ'))
          );
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText((_content, element) => {
          if (!element || element.children.length > 0) return false;
          const text =
            element.textContent?.replace(/\u00a0/g, ' ').trim() || '';
          return (
            text.includes('180.000') &&
            (text.includes('₫') || text.includes('đ'))
          );
        }),
      ).toBeInTheDocument();

      // Product images
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute(
        'src',
        'https://example.com/jasmine.jpg',
      );
      expect(images[0]).toHaveAttribute('alt', 'Xịt Thơm Phòng Hoa Nhài');
    });

    it('adds product to cart when "Thêm vào giỏ" button is clicked in list view', () => {
      renderCatalogPage('/catalog?view=list');

      const addToCartButtons = screen.getAllByRole('button', {
        name: /thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButtons[0]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Xịt Thơm Phòng Hoa Nhài',
        image: 'https://example.com/jasmine.jpg',
        price: 120000,
        scent: 'Hoa Nhài',
        volumeMl: 100,
      });
    });

    it('does not add to cart in list view when product has an empty variants array', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: [sampleProductNoVariants],
          total: 1,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?view=list');

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButton);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('renders fallback values in list view when rating, reviewCount, and description are omitted', () => {
      const minimalProduct = {
        id: 'prod-min',
        name: 'Xịt Thơm Cơ Bản',
        slug: 'xit-thom-co-ban',
        description: '',
        images: ['https://example.com/min.jpg'],
        basePrice: 50000,
        rating: undefined,
        reviewCount: undefined,
        variants: undefined,
      };

      mockUseProducts.mockReturnValue({
        data: {
          products: [minimalProduct as any],
          total: 1,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?view=list');

      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('(0 đánh giá)')).toBeInTheDocument();
      expect(screen.getByText('0 biến thể')).toBeInTheDocument();
      expect(screen.queryByText('+0 nữa')).not.toBeInTheDocument();
    });
  });

  describe('Search and Filter User Interactions', () => {
    it('updates query parameter and resets page to 1 when user types in search input', () => {
      renderCatalogPage('/catalog?page=2');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.change(searchInput, { target: { value: 'quế' } });

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          search: 'quế',
        }),
      );
    });

    it('updates sort option and resets page to 1 when sort dropdown value changes', () => {
      renderCatalogPage('/catalog?page=2');

      const sortOption = screen.getByRole('option', {
        name: 'Giá: Thấp đến cao',
      });
      fireEvent.click(sortOption);

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          sortBy: 'price_asc',
        }),
      );
    });

    it('renders active filter badges and clear filter button when filters are active', () => {
      renderCatalogPage('/catalog?sort=price_desc&q=oải hương');

      expect(screen.getByText('Bộ lọc đang áp dụng:')).toBeInTheDocument();
      expect(screen.getByText('Tìm kiếm: "oải hương"')).toBeInTheDocument();
      expect(
        screen.getByText('Sắp xếp: Giá: Cao đến thấp'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Xóa bộ lọc' }),
      ).toBeInTheDocument();
    });

    it('does not render active filter badges or clear filter button when on default filters', () => {
      renderCatalogPage('/catalog');

      expect(
        screen.queryByText('Bộ lọc đang áp dụng:'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Xóa bộ lọc' }),
      ).not.toBeInTheDocument();
    });

    it('clears search query when clicking the remove button on search filter badge', () => {
      renderCatalogPage('/catalog?q=bạc hà');

      const searchBadge = screen.getByText('Tìm kiếm: "bạc hà"');
      const removeButton = searchBadge.querySelector('button');
      expect(removeButton).toBeInTheDocument();
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          search: undefined,
        }),
      );
    });

    it('clears sort option back to "newest" when clicking remove button on sort filter badge', () => {
      renderCatalogPage('/catalog?sort=best_selling');

      const sortBadge = screen.getByText('Sắp xếp: Bán chạy nhất');
      const removeButton = sortBadge.querySelector('button');
      expect(removeButton).toBeInTheDocument();
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          sortBy: 'newest',
        }),
      );
    });

    it('clears all active filters when clicking "Xóa bộ lọc" button', () => {
      renderCatalogPage('/catalog?sort=rating&q=chanh sả&page=2');

      const clearAllButton = screen.getByRole('button', {
        name: 'Xóa bộ lọc',
      });
      fireEvent.click(clearAllButton);

      expect(mockUseProducts).toHaveBeenCalledWith({
        page: 1,
        limit: PAGINATION.DEFAULT_LIMIT,
        sortBy: 'newest',
        search: undefined,
      });
    });

    it('triggers window alert when clicking the "Bộ lọc" button', () => {
      renderCatalogPage('/catalog');

      const filterButton = screen.getByRole('button', { name: /bộ lọc/i });
      fireEvent.click(filterButton);

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith(
        'Tính năng bộ lọc đang được phát triển. Hiện tại bạn có thể sử dụng tìm kiếm và sắp xếp.',
      );
    });
  });

  describe('View Mode Toggling', () => {
    it('switches to list view when list view button is clicked', () => {
      const { container } = renderCatalogPage('/catalog?view=grid');

      const listIcon = container.querySelector(
        'svg.lucide-list, svg[class*="list"]',
      );
      const listButton = listIcon ? listIcon.closest('button') : null;
      expect(listButton).toBeInTheDocument();

      if (listButton) {
        fireEvent.click(listButton);
      }

      const listContainer = container.querySelector('.space-y-3');
      expect(listContainer).toBeInTheDocument();
    });

    it('switches to grid view when grid view button is clicked from list view', () => {
      const { container } = renderCatalogPage('/catalog?view=list');

      const gridIcon = container.querySelector(
        'svg.lucide-grid3x3, svg.lucide-grid-3x3, svg[class*="grid"]',
      );
      const gridButton = gridIcon ? gridIcon.closest('button') : null;
      expect(gridButton).toBeInTheDocument();

      if (gridButton) {
        fireEvent.click(gridButton);
      }

      const gridContainer = container.querySelector('.grid.grid-cols-1');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Pagination & Page Info', () => {
    it('renders total pages info in header when totalPages > 1 and not loading', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: sampleProducts,
          total: 20,
          page: 2,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 4,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?page=2');

      expect(screen.getByText('Trang 2 / 4')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 2, name: '20 sản phẩm' }),
      ).toBeInTheDocument();
    });

    it('does not render total pages info when totalPages <= 1', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: sampleProducts,
          total: 2,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog');

      expect(screen.queryByText(/Trang 1 \//)).not.toBeInTheDocument();
    });

    it('renders Pagination component and changes page when a page button is clicked', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: sampleProducts,
          total: 30,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 3,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog?page=1');

      const page2Button = screen.getByRole('button', { name: '2' });
      fireEvent.click(page2Button);

      expect(mockUseProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    it('does not render Pagination component when totalPages is 1', () => {
      mockUseProducts.mockReturnValue({
        data: {
          products: sampleProducts,
          total: 2,
          page: 1,
          limit: PAGINATION.DEFAULT_LIMIT,
          totalPages: 1,
        },
        isLoading: false,
      });

      renderCatalogPage('/catalog');

      expect(
        screen.queryByRole('button', { name: '2' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined data safely without crashing', () => {
      mockUseProducts.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      renderCatalogPage('/catalog');

      expect(
        screen.getByRole('heading', { level: 2, name: '0 sản phẩm' }),
      ).toBeInTheDocument();
    });
  });
});
