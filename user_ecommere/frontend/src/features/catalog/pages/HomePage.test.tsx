import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './HomePage';
import { useCartStore } from '@/features/cart/store/cartStore';

// Mock API modules to ensure axios and real network requests never execute
vi.mock('@/lib/api', () => ({
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
  refreshAccessToken: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/features/catalog/api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
    getTree: vi.fn(),
  },
}));

vi.mock('@/features/catalog/api/products.api', () => ({
  productsApi: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
    search: vi.fn(),
  },
}));

// Mock SEO to verify presence without requiring react-helmet-async provider
vi.mock('@/lib/seo', () => ({
  SEO: vi.fn(() => <div data-testid="mock-seo" />),
}));

// Mock ProductCard to check rendered attributes and onAddToCart callback
vi.mock('@/components/common/ProductCard', () => ({
  ProductCard: vi.fn((props: any) => (
    <div
      data-testid={`product-card-${props.id}`}
      data-product-name={props.name}
      data-product-slug={props.slug}
      data-product-price={props.price}
      data-product-rating={props.rating}
      data-product-review-count={props.reviewCount}
    >
      <span>{props.name}</span>
      <button
        type="button"
        data-testid={`add-to-cart-btn-${props.id}`}
        onClick={props.onAddToCart}
      >
        Thêm vào giỏ {props.name}
      </button>
    </div>
  )),
}));

// Mock useCart hook and spy on addItem
const mockAddItem = vi.fn();
vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    items: [],
    isOpen: false,
    openCart: vi.fn(),
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    replaceItems: vi.fn(),
    totalPrice: 0,
    totalItems: 0,
  }),
}));

// State holders for hook mocking
let mockCategoriesData: any = undefined;
let mockCategoriesLoading = false;

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => ({
    data: mockCategoriesData,
    isLoading: mockCategoriesLoading,
  }),
}));
vi.mock('@/features/catalog/hooks/useCategories', () => ({
  useCategories: () => ({
    data: mockCategoriesData,
    isLoading: mockCategoriesLoading,
  }),
}));

let mockCuratedProductsData: any = undefined;
let mockCuratedProductsLoading = false;
let mockCategoryProductsData: Record<string, any> = {};
let mockCategoryProductsLoading: Record<string, boolean> = {};

const mockUseProducts = vi.fn((...args: any[]) => {
  const [filters] = args;
  if (filters?.categorySlug) {
    const slug = filters.categorySlug;
    return {
      data: mockCategoryProductsData[slug],
      isLoading: mockCategoryProductsLoading[slug] ?? false,
    };
  }
  return {
    data: mockCuratedProductsData,
    isLoading: mockCuratedProductsLoading,
  };
});

vi.mock('../hooks/useProducts', () => ({
  useProducts: (...args: any[]) => mockUseProducts(...args),
}));
vi.mock('@/features/catalog/hooks/useProducts', () => ({
  useProducts: (...args: any[]) => mockUseProducts(...args),
}));

// Mock IntersectionObserver to test scroll-triggered visibility in CategoryProductSection
let intersectionCallbacks: Array<
  (entries: Array<{ isIntersecting: boolean }>) => void
> = [];
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class MockIntersectionObserver {
  callback: (entries: Array<{ isIntersecting: boolean }>) => void;
  options?: IntersectionObserverInit;

  constructor(
    callback: (entries: Array<{ isIntersecting: boolean }>) => void,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    intersectionCallbacks.push(callback);
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
}

const mockScrollBy = vi.fn();

const defaultCategories = [
  {
    id: 'cat-1',
    name: 'Tinh Dầu Tự Nhiên',
    slug: 'tinh-dau-tu-nhien',
  },
  {
    id: 'cat-2',
    name: 'Xịt Thơm Phòng',
    slug: 'xit-thom-phong',
  },
];

const defaultCuratedProducts = [
  {
    id: 'curated-prod-1',
    name: 'Xịt Thơm Ban Mai',
    slug: 'xit-thom-ban-mai',
    basePrice: 199000,
    images: ['/images/curated-1.jpg'],
    rating: 4.9,
    reviewCount: 42,
    variants: [
      {
        id: 'var-curated-1',
        price: 250000,
        salePrice: 199000,
        scent: 'Cam ngọt & Gỗ thông',
        volumeMl: 100,
      },
    ],
  },
  {
    id: 'curated-prod-2',
    name: 'Xịt Phòng Thảo Mộc',
    slug: 'xit-phong-thao-moc',
    basePrice: 150000,
    images: ['/images/curated-2.jpg'],
    rating: 4.7,
    reviewCount: 28,
    variants: [
      {
        id: 'var-curated-2',
        price: 150000,
        salePrice: undefined,
        scent: 'Xô thơm',
        volumeMl: 80,
      },
    ],
  },
];

const defaultCategory1Products = {
  products: [
    {
      id: 'cat-prod-1',
      name: 'Tinh Dầu Quế',
      slug: 'tinh-dau-que',
      basePrice: 120000,
      images: ['/images/que.jpg'],
      rating: 4.8,
      reviewCount: 15,
      variants: [
        {
          id: 'var-cat-1',
          price: 150000,
          salePrice: 120000,
          scent: 'Quế hồi',
          volumeMl: 50,
        },
      ],
    },
    {
      id: 'cat-prod-2',
      name: 'Tinh Dầu Oải Hương',
      slug: 'tinh-dau-oai-huong',
      basePrice: 160000,
      images: ['/images/lavender.jpg'],
      rating: 5.0,
      reviewCount: 50,
      variants: [
        {
          id: 'var-cat-2',
          price: 160000,
          salePrice: undefined,
          scent: 'Lavender',
          volumeMl: 50,
        },
      ],
    },
  ],
};

const defaultCategory2Products = {
  products: [
    {
      id: 'cat2-prod-1',
      name: 'Xịt Phòng Bưởi',
      slug: 'xit-phong-buoi',
      basePrice: 140000,
      images: ['/images/buoi.jpg'],
      rating: 4.6,
      reviewCount: 20,
      variants: [
        {
          id: 'var-cat2-1',
          price: 140000,
          salePrice: undefined,
          scent: 'Vỏ bưởi',
          volumeMl: 100,
        },
      ],
    },
  ],
};

function renderHomePage(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    useCartStore.setState({ items: [], isOpen: false });

    mockScrollBy.mockClear();
    window.HTMLElement.prototype.scrollBy = mockScrollBy;

    intersectionCallbacks = [];
    mockObserve.mockClear();
    mockDisconnect.mockClear();
    mockUnobserve.mockClear();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    mockCategoriesData = defaultCategories;
    mockCategoriesLoading = false;

    mockCuratedProductsData = { products: defaultCuratedProducts };
    mockCuratedProductsLoading = false;

    mockCategoryProductsData = {
      'tinh-dau-tu-nhien': defaultCategory1Products,
      'xit-thom-phong': defaultCategory2Products,
    };
    mockCategoryProductsLoading = {};
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe('Static Content and Hero Section', () => {
    it('renders SEO component', () => {
      renderHomePage();
      expect(screen.getByTestId('mock-seo')).toBeInTheDocument();
    });

    it('renders Hero badge, headline, and body description with Vietnamese copy', () => {
      renderHomePage();

      expect(
        screen.getByText('Hương thơm cho không gian sống hiện đại'),
      ).toBeInTheDocument();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(
        'Chọn mùi hương khiến không gian của bạn trông có gu hơn.',
      );
      expect(screen.getByText('trông có gu hơn')).toHaveClass('text-teal-600');

      expect(
        screen.getByText(
          'Thai Spray tập trung vào những lựa chọn mùi sạch, tinh khiết, gọn và không gắt. Bạn có thể bắt đầu từ mùi bán chạy, hỏi chatbot theo không gian sử dụng hoặc lọc theo ngân sách ngay trên catalog.',
        ),
      ).toBeInTheDocument();
    });

    it('renders Hero action buttons linking to catalog and best sellers', () => {
      renderHomePage();

      const exploreLink = screen.getByRole('link', {
        name: /khám phá bộ sưu tập/i,
      });
      expect(exploreLink).toHaveAttribute('href', '/catalog');

      const bestSellingLink = screen.getByRole('link', {
        name: /xem nhóm bán chạy nhất/i,
      });
      expect(bestSellingLink).toHaveAttribute(
        'href',
        '/catalog?sort=best_selling',
      );
    });

    it('renders Hero product image and scent badges', () => {
      renderHomePage();

      const heroImg = screen.getByAltText('Thai Spray Luxury Fragrance');
      expect(heroImg).toHaveAttribute('src', '/hero-fragrance.png');

      expect(screen.getByText('Premium Scent Collection')).toBeInTheDocument();
      expect(
        screen.getByText('Mùi hương tinh tế cho nhịp sống hiện đại'),
      ).toBeInTheDocument();
      expect(screen.getByText('Khuyên dùng')).toBeInTheDocument();
      expect(screen.getByText('Woody & Fresh')).toBeInTheDocument();

      expect(screen.getByText('Olfactory Notes')).toBeInTheDocument();
      expect(screen.getByText('Gỗ thông rừng')).toBeInTheDocument();
      expect(screen.getByText('Xô thơm quýt')).toBeInTheDocument();
      expect(screen.getByText('Bạc hà lạnh')).toBeInTheDocument();
    });
  });

  describe('Highlights Section', () => {
    it('renders shop highlights with exact Vietnamese labels and numbers', () => {
      renderHomePage();

      expect(screen.getByText('Điểm mạnh của shop')).toBeInTheDocument();

      expect(screen.getByText('120+')).toBeInTheDocument();
      expect(screen.getByText('Mùi hương bán chạy')).toBeInTheDocument();

      expect(screen.getByText('89%')).toBeInTheDocument();
      expect(screen.getByText('Khách quay lại mua')).toBeInTheDocument();

      expect(screen.getByText('1:1')).toBeInTheDocument();
      expect(screen.getByText('Tư vấn theo không gian')).toBeInTheDocument();
    });
  });

  describe('Quick Start Suggestions Section', () => {
    it('renders search suggestions with encoded URLs and explanatory text', () => {
      renderHomePage();

      expect(screen.getByText('Gợi ý bắt đầu nhanh')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Nhấp vào từ khóa để tìm kiếm nhanh sản phẩm phù hợp.',
        ),
      ).toBeInTheDocument();

      const livingRoomLink = screen.getByRole('link', {
        name: 'Xịt phòng khách',
      });
      expect(livingRoomLink).toHaveAttribute(
        'href',
        `/search?q=${encodeURIComponent('Xịt phòng khách')}`,
      );

      const bodyMistLink = screen.getByRole('link', {
        name: 'Body mist nhẹ',
      });
      expect(bodyMistLink).toHaveAttribute(
        'href',
        `/search?q=${encodeURIComponent('Body mist nhẹ')}`,
      );

      const giftLink = screen.getByRole('link', {
        name: 'Quà tặng',
      });
      expect(giftLink).toHaveAttribute(
        'href',
        `/search?q=${encodeURIComponent('Quà tặng')}`,
      );

      const carLink = screen.getByRole('link', {
        name: 'Mùi sạch cho xe',
      });
      expect(carLink).toHaveAttribute(
        'href',
        `/search?q=${encodeURIComponent('Mùi sạch cho xe')}`,
      );
    });
  });

  describe('Benefits Section', () => {
    it('renders customer value propositions with titles and descriptions', () => {
      renderHomePage();

      expect(screen.getByText('Giao nhanh')).toBeInTheDocument();
      expect(
        screen.getByText('Nội thành linh hoạt trong ngày'),
      ).toBeInTheDocument();

      expect(screen.getByText('Chính hãng')).toBeInTheDocument();
      expect(screen.getByText('Danh mục được chọn lọc kỹ')).toBeInTheDocument();

      expect(screen.getByText('Đổi trả rõ ràng')).toBeInTheDocument();
      expect(screen.getByText('Hỗ trợ trong 7 ngày đầu')).toBeInTheDocument();
    });
  });

  describe('Curated Products Section', () => {
    it('calls useProducts with best_selling sort and limit 4', () => {
      renderHomePage();

      expect(mockUseProducts).toHaveBeenCalledWith({
        sortBy: 'best_selling',
        limit: 4,
      });
    });

    it('renders section header and link to best selling catalog', () => {
      renderHomePage();

      expect(screen.getByText('Biên tập bởi Thai Spray')).toBeInTheDocument();
      expect(
        screen.getByText('Những lựa chọn đang được hỏi nhiều'),
      ).toBeInTheDocument();

      const seeMoreLink = screen.getByRole('link', {
        name: /xem thêm trong catalog/i,
      });
      expect(seeMoreLink).toHaveAttribute('href', '/catalog?sort=best_selling');
    });

    it('renders skeleton loading state when curated products are loading', () => {
      mockCuratedProductsLoading = true;
      mockCuratedProductsData = undefined;

      const { container } = renderHomePage();

      const pulses = container.querySelectorAll('.h-\\[360px\\].animate-pulse');
      expect(pulses.length).toBeGreaterThanOrEqual(4);
      expect(
        screen.queryByTestId('product-card-curated-prod-1'),
      ).not.toBeInTheDocument();
    });

    it('renders curated product cards with animation delays', () => {
      const { container } = renderHomePage();

      expect(
        screen.getByTestId('product-card-curated-prod-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('product-card-curated-prod-2'),
      ).toBeInTheDocument();

      const animatedWrappers = container.querySelectorAll('.animate-fade-in');
      expect(animatedWrappers.length).toBeGreaterThanOrEqual(2);
      expect(animatedWrappers[0]).toHaveStyle({ animationDelay: '0ms' });
      expect(animatedWrappers[1]).toHaveStyle({ animationDelay: '80ms' });
    });

    it('adds curated product to cart with salePrice when available', () => {
      renderHomePage();

      const addBtn = screen.getByTestId('add-to-cart-btn-curated-prod-1');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'curated-prod-1',
        variantId: 'var-curated-1',
        name: 'Xịt Thơm Ban Mai',
        image: '/images/curated-1.jpg',
        price: 199000,
        scent: 'Cam ngọt & Gỗ thông',
        volumeMl: 100,
      });
    });

    it('adds curated product to cart with regular price when salePrice is undefined', () => {
      renderHomePage();

      const addBtn = screen.getByTestId('add-to-cart-btn-curated-prod-2');
      fireEvent.click(addBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'curated-prod-2',
        variantId: 'var-curated-2',
        name: 'Xịt Phòng Thảo Mộc',
        image: '/images/curated-2.jpg',
        price: 150000,
        scent: 'Xô thơm',
        volumeMl: 80,
      });
    });

    it('does not add to cart if product variants array is empty', () => {
      mockCuratedProductsData = {
        products: [
          {
            id: 'curated-no-variants',
            name: 'Sản phẩm hết hàng',
            slug: 'san-pham-het-hang',
            basePrice: 100000,
            images: ['/images/empty.jpg'],
            variants: [],
          },
        ],
      };

      renderHomePage();

      const addBtn = screen.getByTestId('add-to-cart-btn-curated-no-variants');
      fireEvent.click(addBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('renders empty grid container when curated products list is empty', () => {
      mockCuratedProductsData = { products: [] };
      mockCuratedProductsLoading = false;

      const { container } = renderHomePage();

      expect(
        screen.queryByTestId('product-card-curated-prod-1'),
      ).not.toBeInTheDocument();
      expect(
        container.querySelectorAll('.h-\\[360px\\].animate-pulse').length,
      ).toBe(0);
    });
  });

  describe('Categories and Featured Sections', () => {
    it('calls useCategories to fetch categories list', () => {
      renderHomePage();

      expect(mockCategoriesData).toEqual(defaultCategories);
      expect(screen.getByText('Tinh Dầu Tự Nhiên')).toBeInTheDocument();
      expect(screen.getByText('Xịt Thơm Phòng')).toBeInTheDocument();
    });

    it('renders LoadingSpinner when categories are loading', () => {
      mockCategoriesLoading = true;
      mockCategoriesData = undefined;

      const { container } = renderHomePage();

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Tinh Dầu Tự Nhiên')).not.toBeInTheDocument();
    });

    it('handles undefined/null categories data safely without crashing', () => {
      mockCategoriesLoading = false;
      mockCategoriesData = undefined;

      renderHomePage();

      expect(screen.queryByText('Tinh Dầu Tự Nhiên')).not.toBeInTheDocument();
      expect(
        screen.getByText('Những lựa chọn đang được hỏi nhiều'),
      ).toBeInTheDocument();
    });

    it('filters out non-root categories with parentId and limits to 4 categories', () => {
      mockCategoriesData = [
        { id: 'cat-root-1', name: 'Root Category 1', slug: 'root-1' },
        {
          id: 'cat-child-1',
          name: 'Child Category 1',
          slug: 'child-1',
          parentId: 'cat-root-1',
        },
        { id: 'cat-root-2', name: 'Root Category 2', slug: 'root-2' },
        { id: 'cat-root-3', name: 'Root Category 3', slug: 'root-3' },
        { id: 'cat-root-4', name: 'Root Category 4', slug: 'root-4' },
        { id: 'cat-root-5', name: 'Root Category 5', slug: 'root-5' },
      ];

      renderHomePage();

      expect(screen.getByText('Root Category 1')).toBeInTheDocument();
      expect(screen.getByText('Root Category 2')).toBeInTheDocument();
      expect(screen.getByText('Root Category 3')).toBeInTheDocument();
      expect(screen.getByText('Root Category 4')).toBeInTheDocument();

      // Child category must be filtered out
      expect(screen.queryByText('Child Category 1')).not.toBeInTheDocument();

      // 5th root category must be sliced out by FEATURED_CATEGORY_LIMIT = 4
      expect(screen.queryByText('Root Category 5')).not.toBeInTheDocument();
    });

    it('renders CategoryProductSection header, description, and link to category page', () => {
      renderHomePage();

      const badges = screen.getAllByText('Danh mục nổi bật');
      expect(badges.length).toBe(2);

      const categoryLinks = screen.getAllByRole('link', {
        name: /xem toàn bộ danh mục/i,
      });
      expect(categoryLinks[0]).toHaveAttribute('href', '/c/tinh-dau-tu-nhien');
      expect(categoryLinks[1]).toHaveAttribute('href', '/c/xit-thom-phong');

      const categoryDescriptions = screen.getAllByText(
        'Những lựa chọn được khách chọn nhiều khi cần mùi thơm gọn, dễ dùng và phù hợp sinh hoạt mỗi ngày.',
      );
      expect(categoryDescriptions.length).toBe(2);
    });
  });

  describe('CategoryProductSection Visibility and Lazy Loading', () => {
    it('sets isVisible to true immediately for categories at index < 2', () => {
      mockCategoriesData = [
        { id: 'cat-0', name: 'Category 0', slug: 'cat-0' },
        { id: 'cat-1', name: 'Category 1', slug: 'cat-1' },
      ];

      renderHomePage();

      // For index 0 and 1, isVisible is true, so useProducts is enabled immediately
      expect(mockUseProducts).toHaveBeenCalledWith(
        { categorySlug: 'cat-0', limit: 8, sortBy: 'best_selling' },
        { enabled: true },
      );
      expect(mockUseProducts).toHaveBeenCalledWith(
        { categorySlug: 'cat-1', limit: 8, sortBy: 'best_selling' },
        { enabled: true },
      );

      // IntersectionObserver should not be created for index < 2
      expect(intersectionCallbacks.length).toBe(0);
    });

    it('sets isVisible to false for index >= 2, hooks IntersectionObserver, and enables query when intersecting', () => {
      mockCategoriesData = [
        { id: 'cat-0', name: 'Category 0', slug: 'cat-0' },
        { id: 'cat-1', name: 'Category 1', slug: 'cat-1' },
        { id: 'cat-2', name: 'Category 2', slug: 'cat-2' },
      ];

      renderHomePage();

      // Category at index 2 starts with isVisible = false
      expect(mockUseProducts).toHaveBeenCalledWith(
        { categorySlug: 'cat-2', limit: 8, sortBy: 'best_selling' },
        { enabled: false },
      );

      // IntersectionObserver was registered for Category 2
      expect(intersectionCallbacks.length).toBe(1);
      expect(mockObserve).toHaveBeenCalledTimes(1);

      // Simulate observer callback where entry is NOT intersecting
      act(() => {
        intersectionCallbacks[0]([{ isIntersecting: false }]);
      });

      // Still disabled
      expect(mockDisconnect).not.toHaveBeenCalled();

      // Simulate observer callback where entry IS intersecting
      act(() => {
        intersectionCallbacks[0]([{ isIntersecting: true }]);
      });

      expect(mockDisconnect).toHaveBeenCalled();

      // Re-renders with isVisible = true, so useProducts receives enabled: true
      expect(mockUseProducts).toHaveBeenCalledWith(
        { categorySlug: 'cat-2', limit: 8, sortBy: 'best_selling' },
        { enabled: true },
      );
    });

    it('disconnects IntersectionObserver on unmount before intersecting', () => {
      mockCategoriesData = [
        { id: 'cat-0', name: 'Category 0', slug: 'cat-0' },
        { id: 'cat-1', name: 'Category 1', slug: 'cat-1' },
        { id: 'cat-2', name: 'Category 2', slug: 'cat-2' },
      ];

      const { unmount } = renderHomePage();

      expect(mockObserve).toHaveBeenCalledTimes(1);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('CategoryProductSection Products Display and Interaction', () => {
    it('renders HomeSectionSkeleton when category products are loading', () => {
      mockCategoryProductsLoading['tinh-dau-tu-nhien'] = true;
      mockCategoryProductsData['tinh-dau-tu-nhien'] = undefined;

      const { container } = renderHomePage();

      const skeletonBlocks = container.querySelectorAll(
        '.h-\\[360px\\].animate-pulse',
      );
      expect(skeletonBlocks.length).toBeGreaterThanOrEqual(4);
    });

    it('renders null when category products are empty', () => {
      mockCategoryProductsLoading['tinh-dau-tu-nhien'] = false;
      mockCategoryProductsData['tinh-dau-tu-nhien'] = { products: [] };

      renderHomePage();

      expect(
        screen.queryByTestId('product-card-cat-prod-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('product-card-cat-prod-2'),
      ).not.toBeInTheDocument();
    });

    it('renders both desktop grid (sliced to 4) and mobile scroll list (all products)', () => {
      mockCategoryProductsData['tinh-dau-tu-nhien'] = {
        products: [
          {
            id: 'cp-1',
            name: 'Prod 1',
            slug: 'prod-1',
            basePrice: 100,
            images: ['/img1.jpg'],
            variants: [{ id: 'v1', price: 100, scent: 'S1', volumeMl: 50 }],
          },
          {
            id: 'cp-2',
            name: 'Prod 2',
            slug: 'prod-2',
            basePrice: 200,
            images: ['/img2.jpg'],
            variants: [{ id: 'v2', price: 200, scent: 'S2', volumeMl: 50 }],
          },
          {
            id: 'cp-3',
            name: 'Prod 3',
            slug: 'prod-3',
            basePrice: 300,
            images: ['/img3.jpg'],
            variants: [{ id: 'v3', price: 300, scent: 'S3', volumeMl: 50 }],
          },
          {
            id: 'cp-4',
            name: 'Prod 4',
            slug: 'prod-4',
            basePrice: 400,
            images: ['/img4.jpg'],
            variants: [{ id: 'v4', price: 400, scent: 'S4', volumeMl: 50 }],
          },
          {
            id: 'cp-5',
            name: 'Prod 5',
            slug: 'prod-5',
            basePrice: 500,
            images: ['/img5.jpg'],
            variants: [{ id: 'v5', price: 500, scent: 'S5', volumeMl: 50 }],
          },
        ],
      };

      renderHomePage();

      // For cp-1 to cp-4, they exist in both desktop and mobile
      const prod1Cards = screen.getAllByTestId('product-card-cp-1');
      expect(prod1Cards.length).toBe(2);

      // For cp-5, it only exists in the mobile list (desktop slices first 4)
      const prod5Cards = screen.getAllByTestId('product-card-cp-5');
      expect(prod5Cards.length).toBe(1);
    });

    it('handles adding product to cart from category desktop grid', () => {
      renderHomePage();

      // Get desktop add-to-cart button (first of the two rendered for cat-prod-1)
      const buttons = screen.getAllByTestId('add-to-cart-btn-cat-prod-1');
      const desktopBtn = buttons[0];

      fireEvent.click(desktopBtn);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'cat-prod-1',
        variantId: 'var-cat-1',
        name: 'Tinh Dầu Quế',
        image: '/images/que.jpg',
        price: 120000,
        scent: 'Quế hồi',
        volumeMl: 50,
      });
    });

    it('handles adding product to cart from category mobile scroll list', () => {
      renderHomePage();

      // Get mobile add-to-cart button (second of the two rendered for cat-prod-2)
      const buttons = screen.getAllByTestId('add-to-cart-btn-cat-prod-2');
      const mobileBtn = buttons[1];

      fireEvent.click(mobileBtn);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'cat-prod-2',
        variantId: 'var-cat-2',
        name: 'Tinh Dầu Oải Hương',
        image: '/images/lavender.jpg',
        price: 160000,
        scent: 'Lavender',
        volumeMl: 50,
      });
    });

    it('does not add category product to cart if variants are empty', () => {
      mockCategoryProductsData['tinh-dau-tu-nhien'] = {
        products: [
          {
            id: 'cat-no-vars',
            name: 'Tinh Dầu Hết Hàng',
            slug: 'tinh-dau-het-hang',
            basePrice: 100000,
            images: ['/img.jpg'],
            variants: [],
          },
        ],
      };

      renderHomePage();

      const buttons = screen.getAllByTestId('add-to-cart-btn-cat-no-vars');
      // Desktop
      fireEvent.click(buttons[0]);
      expect(mockAddItem).not.toHaveBeenCalled();

      // Mobile
      fireEvent.click(buttons[1]);
      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it('scrolls category product list horizontally when clicking left and right buttons', () => {
      const { container } = renderHomePage();

      const leftChevron = container.querySelectorAll('.lucide-chevron-left')[0];
      const rightChevron = container.querySelectorAll(
        '.lucide-chevron-right',
      )[0];

      const leftButton = leftChevron.closest('button')!;
      const rightButton = rightChevron.closest('button')!;

      fireEvent.click(leftButton);
      expect(mockScrollBy).toHaveBeenCalledWith({
        left: -320,
        behavior: 'smooth',
      });

      fireEvent.click(rightButton);
      expect(mockScrollBy).toHaveBeenCalledWith({
        left: 320,
        behavior: 'smooth',
      });
    });
  });

  describe('User Navigation and Interactions', () => {
    it('supports userEvent clicking search suggestion pills', async () => {
      const user = userEvent.setup();
      renderHomePage();

      const tag = screen.getByRole('link', { name: 'Mùi sạch cho xe' });
      await user.hover(tag);
      expect(tag).toBeInTheDocument();
    });
  });
});
