import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  beforeAll,
  afterEach,
} from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useSearchParams, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchPage } from './SearchPage';
import { useProductSearch } from '../hooks/useProducts';
import { useCartStore } from '@/features/cart/store/cartStore';
import { formatCurrency } from '@/lib/formatters';

const mockAddItem = vi.fn();

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

vi.mock('../hooks/useProducts', () => ({
  useProductSearch: vi.fn(),
  useProducts: vi.fn(),
  useInfiniteProducts: vi.fn(),
  useInfiniteAdminProducts: vi.fn(),
}));

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

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
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

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

function LocationTracker() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  return (
    <div data-testid="location-tracker">
      <span data-testid="tracker-search">{location.search}</span>
      <span data-testid="tracker-q">{searchParams.get('q') ?? ''}</span>
      <span data-testid="tracker-sort">{searchParams.get('sort') ?? ''}</span>
      <span data-testid="tracker-view">{searchParams.get('view') ?? ''}</span>
    </div>
  );
}

function getViewToggleButtons() {
  const heading = screen.getByRole('heading', {
    level: 2,
    name: 'Kết quả tìm kiếm',
  });
  const headerContainer = heading.closest('.flex.items-center.justify-between');
  const buttons = headerContainer
    ? Array.from(headerContainer.querySelectorAll('button'))
    : [];
  return {
    gridBtn: buttons[0],
    listBtn: buttons[1],
  };
}

describe('SearchPage', () => {
  const mockProductWithSalePrice = {
    id: 'prod-1',
    name: 'Nước hoa hoàng gia Thái Lan',
    slug: 'nuoc-hoa-hoang-gia',
    description: 'Mùi hương thơm dịu nhẹ, lưu hương lâu.',
    images: ['https://example.com/img1.jpg'],
    categoryId: 'cat-1',
    basePrice: 250000,
    rating: 4.8,
    reviewCount: 35,
    active: true,
    createdAt: '2026-01-01',
    variants: [
      {
        id: 'var-1',
        scent: 'Hoa hồng',
        volumeMl: 50,
        price: 250000,
        salePrice: 199000,
        stock: 10,
        sku: 'SKU-01',
      },
      {
        id: 'var-2',
        scent: 'Hoa nhài',
        volumeMl: 100,
        price: 350000,
        salePrice: null,
        stock: 5,
        sku: 'SKU-02',
      },
    ],
  };

  const mockProductManyVariants = {
    id: 'prod-2',
    name: 'Chai xịt phòng tự nhiên',
    slug: 'chai-xit-phong-tu-nhien',
    description: 'Khử mùi nhanh chóng hiệu quả cao.',
    images: ['https://example.com/img2.jpg'],
    categoryId: 'cat-1',
    basePrice: 150000,
    rating: 4.0,
    reviewCount: 10,
    active: true,
    createdAt: '2026-01-02',
    variants: [
      {
        id: 'var-2-1',
        scent: 'Chanh',
        volumeMl: 100,
        price: 150000,
        salePrice: null,
        stock: 20,
        sku: 'SKU-2-1',
      },
      {
        id: 'var-2-2',
        scent: 'Bạc hà',
        volumeMl: 100,
        price: 150000,
        salePrice: undefined,
        stock: 20,
        sku: 'SKU-2-2',
      },
      {
        id: 'var-2-3',
        scent: 'Cam',
        volumeMl: 100,
        price: 150000,
        stock: 20,
        sku: 'SKU-2-3',
      },
      {
        id: 'var-2-4',
        scent: 'Lavender',
        volumeMl: 100,
        price: 150000,
        stock: 20,
        sku: 'SKU-2-4',
      },
      {
        id: 'var-2-5',
        scent: 'Dâu',
        volumeMl: 100,
        price: 150000,
        stock: 20,
        sku: 'SKU-2-5',
      },
    ],
  };

  const mockProductThreeVariants = {
    id: 'prod-3',
    name: 'Sản phẩm 3 mùi',
    slug: 'san-pham-3-mui',
    description: 'Ba mùi hương tiêu chuẩn.',
    images: ['https://example.com/img3.jpg'],
    categoryId: 'cat-2',
    basePrice: 120000,
    rating: 3.5,
    reviewCount: 4,
    active: true,
    createdAt: '2026-01-03',
    variants: [
      {
        id: 'v-1',
        scent: 'Hương 1',
        volumeMl: 50,
        price: 120000,
        stock: 5,
        sku: 'S-1',
      },
      {
        id: 'v-2',
        scent: 'Hương 2',
        volumeMl: 50,
        price: 120000,
        stock: 5,
        sku: 'S-2',
      },
      {
        id: 'v-3',
        scent: 'Hương 3',
        volumeMl: 50,
        price: 120000,
        stock: 5,
        sku: 'S-3',
      },
    ],
  };

  const mockProductMinimal = {
    id: 'prod-4',
    name: 'Sản phẩm tối giản',
    slug: 'san-pham-toi-gian',
    description: '',
    images: ['https://example.com/img4.jpg'],
    categoryId: 'cat-2',
    basePrice: 100000,
    rating: undefined,
    reviewCount: undefined,
    active: true,
    createdAt: '2026-01-04',
    variants: [],
  };

  const mockProductNoVariantsProp = {
    id: 'prod-5',
    name: 'Sản phẩm thiếu trường biến thể',
    slug: 'san-pham-thieu-bien-the',
    description: undefined,
    images: ['https://example.com/img5.jpg'],
    categoryId: 'cat-3',
    basePrice: 90000,
    rating: undefined,
    reviewCount: undefined,
    active: true,
    createdAt: '2026-01-05',
    variants: undefined as any,
  };

  const mockUseProductSearch = vi.mocked(useProductSearch);
  let mockAlert: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.pointerEvents = 'auto';
    useCartStore.setState({ items: [] });
    mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    mockUseProductSearch.mockReturnValue({
      data: {
        products: [mockProductWithSalePrice, mockProductManyVariants],
        total: 2,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    cleanup();
    mockAlert.mockRestore();
  });

  const renderComponent = (initialEntries: string[] = ['/search']) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const user = userEvent.setup();

    const result = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <SearchPage />
          <LocationTracker />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    return {
      ...result,
      user,
      queryClient,
    };
  };

  describe('Header, Navigation and SEO', () => {
    it('renders SEO title and header when no query parameters are provided', () => {
      renderComponent(['/search']);

      const seoElement = screen.getByTestId('seo-title');
      expect(seoElement).toHaveAttribute('data-title', 'Tìm kiếm: ');

      const backLink = screen.getByRole('link', {
        name: /Quay lại danh sách/i,
      });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/catalog');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      expect(searchInput).toHaveValue('');

      expect(mockUseProductSearch).toHaveBeenCalledWith('', {
        sortBy: 'newest',
      });
    });

    it('renders SEO title and pre-fills search input when query parameter is provided', () => {
      renderComponent(['/search?q=hoa&sort=price_desc&view=list']);

      const seoElement = screen.getByTestId('seo-title');
      expect(seoElement).toHaveAttribute('data-title', 'Tìm kiếm: hoa');

      const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      expect(searchInput).toHaveValue('hoa');

      expect(mockUseProductSearch).toHaveBeenCalledWith('hoa', {
        sortBy: 'price_desc',
      });
    });

    it('does not render header "Xóa tìm kiếm" button when query is empty', () => {
      renderComponent(['/search']);
      expect(
        screen.queryByRole('button', { name: 'Xóa tìm kiếm' }),
      ).not.toBeInTheDocument();
    });

    it('renders header "Xóa tìm kiếm" button when query is non-empty and clicking it clears search params', async () => {
      const { user } = renderComponent([
        '/search?q=lavender&sort=newest&view=grid',
      ]);

      const clearBtn = screen.getByRole('button', { name: 'Xóa tìm kiếm' });
      expect(clearBtn).toBeInTheDocument();

      await user.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByTestId('tracker-q')).toHaveTextContent('');
        expect(screen.getByTestId('tracker-search')).toBeEmptyDOMElement();
      });
    });
  });

  describe('Search Input and Filter actions', () => {
    it('updates search parameters when typing a non-empty query', () => {
      renderComponent(['/search']);

      const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.change(searchInput, { target: { value: 'chanh xịt' } });

      expect(screen.getByTestId('tracker-q')).toHaveTextContent('chanh xịt');
      expect(screen.getByTestId('tracker-sort')).toHaveTextContent('newest');
      expect(screen.getByTestId('tracker-view')).toHaveTextContent('grid');
    });

    it('does not update search parameters when typing whitespace only', () => {
      renderComponent(['/search']);

      const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.change(searchInput, { target: { value: '    ' } });

      expect(screen.getByTestId('tracker-q')).toHaveTextContent('');
    });

    it('triggers handleSearchChange on Enter key press with non-empty input', () => {
      renderComponent(['/search']);

      const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.change(searchInput, { target: { value: 'bạc hà' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      expect(screen.getByTestId('tracker-q')).toHaveTextContent('bạc hà');
    });

    it('does not trigger handleSearchChange on other key press (e.g. Escape)', () => {
      renderComponent(['/search']);

      const searchInput = screen.getByPlaceholderText('Tìm kiếm sản phẩm...');
      fireEvent.keyDown(searchInput, { key: 'Escape', code: 'Escape' });

      expect(screen.getByTestId('tracker-q')).toHaveTextContent('');
    });

    it('triggers handleFilterClick alert when clicking the filter button', async () => {
      const { user } = renderComponent(['/search']);

      const filterBtn = screen.getByRole('button', { name: /Bộ lọc/i });
      expect(filterBtn).toBeInTheDocument();

      await user.click(filterBtn);

      expect(mockAlert).toHaveBeenCalledWith(
        'Tính năng bộ lọc đang được phát triển. Hiện tại bạn có thể sử dụng tìm kiếm và sắp xếp.',
      );
    });

    it('handles sorting option change correctly', async () => {
      const { user } = renderComponent(['/search?q=cam&sort=newest&view=grid']);

      const sortTrigger = screen.getByRole('combobox');
      expect(sortTrigger).toBeInTheDocument();

      await user.click(sortTrigger);

      const optionPriceAsc = await screen.findByRole('option', {
        name: 'Giá: Thấp đến cao',
      });
      await user.click(optionPriceAsc);

      await waitFor(() => {
        expect(screen.getByTestId('tracker-sort')).toHaveTextContent(
          'price_asc',
        );
        expect(screen.getByTestId('tracker-q')).toHaveTextContent('cam');
        expect(screen.getByTestId('tracker-view')).toHaveTextContent('grid');
      });
    });
  });

  describe('Search Info banner', () => {
    it('does not render search info banner when query is empty', () => {
      renderComponent(['/search']);
      expect(screen.queryByText(/Tìm kiếm cho:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\d+\s+kết quả/i)).not.toBeInTheDocument();
    });

    it('renders search info banner with query and result count when query is present', () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderComponent(['/search?q=thái lan']);

      expect(screen.getByText(/Tìm kiếm cho:/i)).toBeInTheDocument();
      expect(screen.getByText('"thái lan"')).toBeInTheDocument();
      expect(screen.getByText('1 kết quả')).toBeInTheDocument();
      expect(
        screen.queryByText(/Thử tìm với từ khóa khác/i),
      ).not.toBeInTheDocument();
    });

    it('falls back to "0 kết quả" when data.total is undefined', () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: undefined,
        },
        isLoading: false,
      } as any);

      renderComponent(['/search?q=thái lan']);

      expect(screen.getByText('0 kết quả')).toBeInTheDocument();
    });

    it('displays suggestion message and catalog link when not loading and total is 0', () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [],
          total: 0,
        },
        isLoading: false,
      } as any);

      renderComponent(['/search?q=không có']);

      expect(screen.getByText('0 kết quả')).toBeInTheDocument();
      expect(
        screen.getByText(/Thử tìm với từ khóa khác hoặc/i),
      ).toBeInTheDocument();

      const allCatalogLink = screen.getByRole('link', {
        name: 'xem tất cả sản phẩm',
      });
      expect(allCatalogLink).toBeInTheDocument();
      expect(allCatalogLink).toHaveAttribute('href', '/catalog');
    });

    it('does not display suggestion message when loading even if total is 0', () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [],
          total: 0,
        },
        isLoading: true,
      } as any);

      renderComponent(['/search?q=đang tải']);

      expect(
        screen.queryByText(/Thử tìm với từ khóa khác hoặc/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders LoadingSpinner when isLoading is true', () => {
      mockUseProductSearch.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { container } = renderComponent(['/search?q=test']);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy sản phẩm'),
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Kết quả tìm kiếm')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders EmptyState and suggestions when data.products is empty', async () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [],
          total: 0,
        },
        isLoading: false,
      } as any);

      const { user } = renderComponent(['/search?q=sanphamla']);

      expect(screen.getByText('Không tìm thấy sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Không có sản phẩm nào khớp với từ khóa "sanphamla". Hãy thử tìm kiếm với từ khóa khác.',
        ),
      ).toBeInTheDocument();

      const viewCatalogLinks = screen.getAllByRole('link', {
        name: /xem tất cả sản phẩm/i,
      });
      expect(viewCatalogLinks.length).toBeGreaterThanOrEqual(1);
      viewCatalogLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/catalog');
      });

      const clearSearchButtons = screen.getAllByRole('button', {
        name: 'Xóa tìm kiếm',
      });
      expect(clearSearchButtons.length).toBeGreaterThanOrEqual(1);

      await user.click(clearSearchButtons[clearSearchButtons.length - 1]);
      await waitFor(() => {
        expect(screen.getByTestId('tracker-q')).toHaveTextContent('');
      });
    });

    it('renders search suggestions and clicking a suggestion triggers search change', async () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [],
          total: 0,
        },
        isLoading: false,
      } as any);

      const { user } = renderComponent(['/search?q=rong']);

      expect(screen.getByText('Gợi ý tìm kiếm:')).toBeInTheDocument();

      const chanhSuggestion = screen.getByRole('button', {
        name: 'Nước hoa chanh',
      });
      expect(chanhSuggestion).toBeInTheDocument();

      await user.click(chanhSuggestion);

      await waitFor(() => {
        expect(screen.getByTestId('tracker-q')).toHaveTextContent(
          'Nước hoa chanh',
        );
      });
    });
  });

  describe('Results Section - Grid View (Default)', () => {
    it('renders results header, total count badge, and product cards in grid mode', () => {
      renderComponent(['/search?q=nuoc-hoa']);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kết quả tìm kiếm' }),
      ).toBeInTheDocument();
      expect(screen.getByText('2 sản phẩm')).toBeInTheDocument();

      const productsContainer = screen
        .getByText('Nước hoa hoàng gia Thái Lan')
        .closest('.grid');
      expect(productsContainer).toBeInTheDocument();
      expect(productsContainer).toHaveClass('grid-cols-1');

      expect(
        screen.getByText('Nước hoa hoàng gia Thái Lan'),
      ).toBeInTheDocument();
      expect(screen.getByText('Chai xịt phòng tự nhiên')).toBeInTheDocument();

      const { gridBtn, listBtn } = getViewToggleButtons();
      expect(gridBtn).toBeInTheDocument();
      expect(listBtn).toBeInTheDocument();
      expect(gridBtn).toHaveClass('bg-primary');
      expect(listBtn).toHaveClass('border');
      expect(gridBtn!.querySelector('svg')).toBeInTheDocument();
      expect(listBtn!.querySelector('svg')).toBeInTheDocument();
    });

    it('switches to list view when clicking list view toggle button in results header', async () => {
      const { user } = renderComponent(['/search?q=nuoc-hoa&view=grid']);

      const { listBtn } = getViewToggleButtons();
      expect(listBtn).toBeInTheDocument();

      await user.click(listBtn!);

      await waitFor(() => {
        expect(screen.getByTestId('tracker-view')).toHaveTextContent('list');
      });
    });

    it('adds product to cart with salePrice when salePrice is defined', async () => {
      const { user } = renderComponent(['/search?q=nuoc-hoa']);

      const addToCartButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      expect(addToCartButtons.length).toBeGreaterThanOrEqual(2);

      await user.click(addToCartButtons[0]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa hoàng gia Thái Lan',
        image: 'https://example.com/img1.jpg',
        price: 199000,
        scent: 'Hoa hồng',
        volumeMl: 50,
      });
    });

    it('adds product to cart with regular price when salePrice is null or undefined', async () => {
      const { user } = renderComponent(['/search?q=nuoc-hoa']);

      const addToCartButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      await user.click(addToCartButtons[1]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-2',
        variantId: 'var-2-1',
        name: 'Chai xịt phòng tự nhiên',
        image: 'https://example.com/img2.jpg',
        price: 150000,
        scent: 'Chanh',
        volumeMl: 100,
      });
    });

    it('does not call addItem when product has no variants in grid mode', async () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductMinimal],
          total: 1,
        },
        isLoading: false,
      } as any);

      const { user } = renderComponent(['/search?q=toi-gian']);

      const addToCartBtn = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      await user.click(addToCartBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Results Section - List View', () => {
    it('renders list view cards with details, formatted prices and variant badges', () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [
            mockProductWithSalePrice,
            mockProductManyVariants,
            mockProductThreeVariants,
            mockProductMinimal,
            mockProductNoVariantsProp,
          ],
          total: 5,
        },
        isLoading: false,
      } as any);

      renderComponent(['/search?q=tat-ca&view=list']);

      const listContainer = screen
        .getByText('Nước hoa hoàng gia Thái Lan')
        .closest('.space-y-4');
      expect(listContainer).toBeInTheDocument();

      const { gridBtn, listBtn } = getViewToggleButtons();
      expect(gridBtn).toBeInTheDocument();
      expect(listBtn).toBeInTheDocument();
      expect(gridBtn).toHaveClass('border');
      expect(listBtn).toHaveClass('bg-primary');
      expect(gridBtn!.querySelector('svg')).toBeInTheDocument();
      expect(listBtn!.querySelector('svg')).toBeInTheDocument();

      // Product 1
      expect(
        screen.getByText('Nước hoa hoàng gia Thái Lan'),
      ).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('(35 đánh giá)')).toBeInTheDocument();
      expect(screen.getByText('2 biến thể')).toBeInTheDocument();
      expect(
        screen.getByText('Mùi hương thơm dịu nhẹ, lưu hương lâu.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Hoa hồng - 50ml')).toBeInTheDocument();
      expect(screen.getByText('Hoa nhài - 100ml')).toBeInTheDocument();
      const expectedPrice = formatCurrency(250000).replace(/\s+/g, ' ');
      expect(
        screen.getByText((content) =>
          content.replace(/\s+/g, ' ').includes(expectedPrice),
        ),
      ).toBeInTheDocument();

      // Product 2: has 5 variants -> shows first 3 + badge for remaining 2
      expect(screen.getByText('Chai xịt phòng tự nhiên')).toBeInTheDocument();
      expect(screen.getByText('5 biến thể')).toBeInTheDocument();
      expect(screen.getByText('Chanh - 100ml')).toBeInTheDocument();
      expect(screen.getByText('Bạc hà - 100ml')).toBeInTheDocument();
      expect(screen.getByText('Cam - 100ml')).toBeInTheDocument();
      expect(screen.getByText('+2 nữa')).toBeInTheDocument();

      // Product 3: exactly 3 variants -> no +X nữa
      expect(screen.getByText('Sản phẩm 3 mùi')).toBeInTheDocument();
      expect(screen.getByText('3 biến thể')).toBeInTheDocument();
      expect(screen.getByText('Hương 1 - 50ml')).toBeInTheDocument();
      expect(screen.getByText('Hương 2 - 50ml')).toBeInTheDocument();
      expect(screen.getByText('Hương 3 - 50ml')).toBeInTheDocument();
      expect(screen.queryByText('+0 nữa')).not.toBeInTheDocument();

      // Product 4: minimal (no rating, no reviewCount, empty description, 0 variants)
      expect(screen.getByText('Sản phẩm tối giản')).toBeInTheDocument();
      expect(screen.getAllByText('0.0').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('(0 đánh giá)').length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getAllByText('0 biến thể').length).toBeGreaterThanOrEqual(
        1,
      );

      // Product 5: undefined variants property
      expect(
        screen.getByText('Sản phẩm thiếu trường biến thể'),
      ).toBeInTheDocument();
    });

    it('switches to grid view when clicking grid toggle button in list mode', async () => {
      const { user } = renderComponent(['/search?q=test&view=list']);

      const { gridBtn } = getViewToggleButtons();
      expect(gridBtn).toBeInTheDocument();

      await user.click(gridBtn!);

      await waitFor(() => {
        expect(screen.getByTestId('tracker-view')).toHaveTextContent('grid');
      });
    });

    it('adds product to cart from list view', async () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      const { user } = renderComponent(['/search?q=test&view=list']);

      const addToCartBtn = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      await user.click(addToCartBtn);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa hoàng gia Thái Lan',
        image: 'https://example.com/img1.jpg',
        price: 199000,
        scent: 'Hoa hồng',
        volumeMl: 50,
      });
    });

    it('does not call addItem from list view when product has empty variants array', async () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductMinimal],
          total: 1,
        },
        isLoading: false,
      } as any);

      const { user } = renderComponent(['/search?q=test&view=list']);

      const addToCartBtn = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      await user.click(addToCartBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Pagination / Load More Section', () => {
    it('renders "Hiển thị X / Y sản phẩm" and "Xem thêm sản phẩm" button when total > products.length', async () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductWithSalePrice, mockProductManyVariants],
          total: 20,
        },
        isLoading: false,
      } as any);

      const { user } = renderComponent(['/search?q=nhieu']);

      expect(screen.getByText('Hiển thị 2 / 20 sản phẩm')).toBeInTheDocument();
      const loadMoreBtn = screen.getByRole('button', {
        name: 'Xem thêm sản phẩm',
      });
      expect(loadMoreBtn).toBeInTheDocument();

      await user.click(loadMoreBtn);
    });

    it('does not render load more section when total <= products.length', () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductWithSalePrice, mockProductManyVariants],
          total: 2,
        },
        isLoading: false,
      } as any);

      renderComponent(['/search?q=du']);

      expect(
        screen.queryByText(/Hiển thị 2 \/ 2 sản phẩm/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Xem thêm sản phẩm' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Undefined or null data handling', () => {
    it('handles undefined data gracefully without crashing and displays 0 sản phẩm in header', () => {
      mockUseProductSearch.mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderComponent(['/search?q=khong-co-data']);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Kết quả tìm kiếm' }),
      ).toBeInTheDocument();
      expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
      expect(screen.queryByText('Xem thêm sản phẩm')).not.toBeInTheDocument();
    });

    it('handles data with undefined total in results header', () => {
      mockUseProductSearch.mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: undefined,
        },
        isLoading: false,
      } as any);

      renderComponent(['/search?q=test']);

      expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
    });
  });
});
