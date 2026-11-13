import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminProductsPage } from './AdminProductsPage';
import { formatCurrency } from '@/lib/formatters';

// --- IntersectionObserver Mock Setup ---
type ObserverEntry = { isIntersecting: boolean };
type ObserverCallback = (entries: ObserverEntry[]) => void;

let observerInstances: Array<{
  callback: ObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}> = [];

class MockIntersectionObserver {
  callback: ObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ObserverCallback) {
    this.callback = callback;
    observerInstances.push({
      callback,
      observe: this.observe,
      unobserve: this.unobserve,
      disconnect: this.disconnect,
    });
  }
}

// --- Mocks ---
const mockUseInfiniteAdminProducts = vi.fn();
const mockDeleteMutate = vi.fn();
let mockDeleteIsPending = false;
let mockDeleteVariables: any = undefined;
const mockRefetch = vi.fn();

const mockToast = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};

const mockGetTree = vi.fn();

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

vi.mock('../hooks/useAdminProducts', () => ({
  useDeleteProduct: () => ({
    mutate: mockDeleteMutate,
    isPending: mockDeleteIsPending,
    variables: mockDeleteVariables,
  }),
  useAdminProduct: vi.fn(),
  useCreateProduct: vi.fn(),
  useUpdateProduct: vi.fn(),
}));

vi.mock('@/features/catalog/hooks/useProducts', () => ({
  useInfiniteAdminProducts: (params: any) =>
    mockUseInfiniteAdminProducts(params),
  useProducts: vi.fn(),
  useProductSearch: vi.fn(),
  useInfiniteProducts: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../api/categories.api', () => ({
  categoriesApi: {
    getTree: () => mockGetTree(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/admin/api/categories.api', () => ({
  categoriesApi: {
    getTree: () => mockGetTree(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    create: vi.fn().mockReturnThis(),
  },
}));

// Mock DropdownMenu to ensure elements are stably accessible in tests
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <>{children}</>,
  DropdownMenuContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
    align?: string;
  }) => (
    <div data-testid="dropdown-menu-content" className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
    className,
    asChild,
  }: {
    children: React.ReactNode;
    onClick?: (e?: any) => void;
    disabled?: boolean;
    className?: string;
    asChild?: boolean;
  }) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: any) => {
          if (!disabled) {
            (children as any).props.onClick?.(e);
            onClick?.(e);
          }
        },
        'aria-disabled': disabled,
        className:
          `${(children as any).props.className || ''} ${className || ''}`.trim(),
      });
    }
    return (
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        className={className}
      >
        {children}
      </button>
    );
  },
  DropdownMenuLabel: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="dropdown-menu-label" className={className}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: ({ className }: { className?: string }) => (
    <hr data-testid="dropdown-menu-separator" className={className} />
  ),
  DropdownMenuSub: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-sub">{children}</div>
  ),
  DropdownMenuSubTrigger: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="dropdown-menu-sub-trigger" className={className}>
      {children}
    </div>
  ),
  DropdownMenuSubContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="dropdown-menu-sub-content" className={className}>
      {children}
    </div>
  ),
}));

// --- Test Data ---
const mockCategoriesTree = [
  {
    id: 'cat-1',
    name: 'Nước hoa Thái',
    children: [
      {
        id: 'cat-1-1',
        name: 'Xịt phòng',
        children: [
          {
            id: 'cat-1-1-1',
            name: 'Hương sả chanh',
            children: [],
          },
        ],
      },
      {
        id: 'cat-1-2',
        name: 'Xịt thơm quần áo',
        // children undefined to test !node.children
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Khử mùi xe hơi',
    children: [],
  },
];

const mockProducts = [
  {
    id: 'prod-1',
    name: 'Chai xịt khử mùi sả chanh',
    slug: 'chai-xit-khu-mui-sa-chanh',
    basePrice: 150000,
    images: ['https://example.com/img1.jpg'],
    category: { id: 'cat-badge-1', name: 'Hương sả tự nhiên' },
    active: true,
    rating: 4.8,
    reviewCount: 25,
    variants: [
      { sku: 'SKU-SC-100', stock: 15 },
      { sku: 'SKU-SC-200', stock: 5 },
    ],
  },
  {
    id: 'prod-2',
    name: 'Chai xịt không mùi không hình',
    slug: 'chai-xit-khong-mui',
    basePrice: 90000,
    images: [], // empty images array
    category: null, // no category
    active: false,
    rating: undefined, // no rating
    reviewCount: undefined, // no reviewCount
    variants: [], // no variants -> stock 0
  },
  {
    id: 'prod-3',
    name: 'Sản phẩm có biến thể không stock',
    slug: 'san-pham-khong-stock',
    basePrice: 120000,
    images: ['https://example.com/img3.jpg'],
    category: { id: 'cat-badge-3', name: 'Khử mùi cao cấp' },
    active: true,
    rating: 3.5,
    reviewCount: 8,
    variants: [
      { sku: '', stock: undefined }, // empty sku, undefined stock -> tests v.stock || 0
    ],
  },
  {
    id: 'prod-4',
    name: 'Sản phẩm không có mảng variants',
    slug: 'san-pham-no-variants',
    basePrice: 200000,
    images: ['https://example.com/img4.jpg'],
    category: { id: 'cat-badge-4', name: 'Nước hoa phòng ngủ' },
    active: true,
    rating: 5.0,
    reviewCount: 1,
    variants: undefined, // undefined variants -> tests product.variants?.reduce || 0
  },
];

const mockDefaultData = {
  pages: [
    {
      products: mockProducts,
      total: 100,
      page: 1,
      totalPages: 5,
    },
  ],
};

function renderAdminProductsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteIsPending = false;
    mockDeleteVariables = undefined;
    observerInstances = [];
    (window as any).IntersectionObserver = MockIntersectionObserver;

    mockUseInfiniteAdminProducts.mockReturnValue({
      data: mockDefaultData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isRefetching: false,
      fetchNextPage: vi.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    mockGetTree.mockResolvedValue(mockCategoriesTree);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Header, SEO and Summary Stats', () => {
    it('renders SEO title, statistics cards, action buttons and search input', async () => {
      renderAdminProductsPage();

      // SEO
      const seo = screen.getByTestId('seo-title');
      expect(seo).toHaveAttribute('data-title', 'Quản lý sản phẩm - Admin');

      // Stats cards
      expect(
        screen.getByRole('heading', { name: 'Tổng sản phẩm' }),
      ).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Sản phẩm có sẵn')).toBeInTheDocument();

      expect(
        screen.getByRole('heading', { name: 'Danh mục' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Danh mục đang hoạt động')).toBeInTheDocument();

      expect(
        screen.getByRole('heading', { name: 'Tồn kho' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Tổng số lượng tồn kho')).toBeInTheDocument();

      // "Thêm sản phẩm" button linking to /admin/products/new
      const addNewLink = screen.getByRole('link', { name: /Thêm sản phẩm/i });
      expect(addNewLink).toBeInTheDocument();
      expect(addNewLink).toHaveAttribute('href', '/admin/products/new');

      // Search input with standardized placeholder
      expect(
        screen.getByPlaceholderText('Tìm kiếm theo tên sản phẩm, SKU...'),
      ).toBeInTheDocument();
    });

    it('renders 0 for total products when data is undefined', () => {
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderAdminProductsPage();
      const totalProductsHeading = screen.getByRole('heading', {
        name: 'Tổng sản phẩm',
      });
      const statCard =
        totalProductsHeading.closest<HTMLElement>('.rounded-xl') ??
        totalProductsHeading.parentElement?.parentElement;
      expect(statCard).toBeInstanceOf(HTMLElement);
      if (!(statCard instanceof HTMLElement)) {
        throw new Error('Không tìm thấy thẻ thống kê');
      }
      expect(within(statCard).getByText('0')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders LoadingSpinner when isLoading is true', () => {
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      const { container } = renderAdminProductsPage();

      // Loading spinner has animate-spin class
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(
        screen.queryByRole('columnheader', { name: 'Tên sản phẩm' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Chưa có sản phẩm nào'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders page header and error card inside container, calls refetch on retry', () => {
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderAdminProductsPage();

      // Page heading and action toolbar remain visible
      expect(
        screen.getByRole('heading', { name: 'Quản lý sản phẩm' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /Thêm sản phẩm/i }),
      ).toBeInTheDocument();

      // Error message
      expect(
        screen.getByText('Không thể tải danh sách sản phẩm'),
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('renders empty message and create product link when products array is empty', () => {
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: {
          pages: [{ products: [], total: 0 }],
        },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderAdminProductsPage();

      expect(screen.getByText('Chưa có sản phẩm nào')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Tạo sản phẩm đầu tiên để bắt đầu xây dựng danh mục bán hàng của cửa hàng.',
        ),
      ).toBeInTheDocument();

      const createLink = screen.getByRole('link', { name: 'Tạo sản phẩm' });
      expect(createLink).toBeInTheDocument();
      expect(createLink).toHaveAttribute('href', '/admin/products/new');
    });

    it('renders filtered empty state with reset button when search is active', () => {
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: {
          pages: [{ products: [], total: 0 }],
        },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderAdminProductsPage();

      const searchInput = screen.getByPlaceholderText(
        'Tìm kiếm theo tên sản phẩm, SKU...',
      );
      fireEvent.change(searchInput, {
        target: { value: 'từ khóa không tồn tại' },
      });

      expect(
        screen.getByText('Không tìm thấy sản phẩm phù hợp'),
      ).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: 'Xóa bộ lọc' });
      expect(resetBtn).toBeInTheDocument();
      fireEvent.click(resetBtn);
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Products Table and Row Variations', () => {
    it('renders table headers and all product row details correctly', () => {
      renderAdminProductsPage();

      // Check Table headers by role columnheader
      expect(
        screen.getByRole('columnheader', { name: 'Hình ảnh' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Tên sản phẩm' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Danh mục' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Giá bán' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Tồn kho' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Trạng thái' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Đánh giá' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('columnheader', { name: 'Thao tác' }),
      ).toBeInTheDocument();

      // Product 1 (Full data)
      const prod1Links = screen.getAllByRole('link', {
        name: 'Chai xịt khử mùi sả chanh',
      });
      expect(prod1Links[0]).toHaveAttribute(
        'href',
        '/admin/products/prod-1/edit',
      );
      const img1 = screen.getAllByAltText('Chai xịt khử mùi sả chanh')[0];
      expect(img1).toHaveAttribute('src', 'https://example.com/img1.jpg');
      expect(screen.getAllByText('SKU: SKU-SC-100').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Hương sả tự nhiên').length).toBeGreaterThan(
        0,
      );
      const expectedPrice = formatCurrency(150000).replace(/\s+/g, ' ');
      expect(
        screen.getAllByText((content) => {
          const normalized = content.replace(/\s+/g, ' ');
          return (
            normalized.includes(expectedPrice) || normalized.includes('150.000')
          );
        }).length,
      ).toBeGreaterThan(0);
      const twentyStockBadges = screen.getAllByText('20 sp');
      expect(twentyStockBadges[0]).toHaveClass(
        'bg-emerald-50 text-emerald-700',
      );
      expect(screen.getAllByText('2 biến thể').length).toBeGreaterThan(0);
      expect(screen.getAllByText('4.8').length).toBeGreaterThan(0);
      expect(screen.getAllByText('(25)').length).toBeGreaterThan(0);

      // Product 1 status badge (active: true -> Đang bán)
      const activeBadges = screen.getAllByText('Đang bán');
      expect(activeBadges[0]).toHaveClass('bg-emerald-50 text-emerald-700');

      // Action links for Product 1
      const detailLinks = screen.getAllByRole('link', {
        name: /Xem chi tiết/i,
      });
      expect(detailLinks[0]).toHaveAttribute(
        'href',
        expect.stringMatching(/\/p\/chai-xit-khu-mui-sa-chanh$/),
      );
      expect(detailLinks[0]).toHaveAttribute('target', '_blank');
      expect(detailLinks[0]).toHaveAttribute('rel', 'noreferrer');

      // Product 2 (No image, no category, no rating, 0 stock, inactive)
      const prod2Links = screen.getAllByRole('link', {
        name: 'Chai xịt không mùi không hình',
      });
      expect(prod2Links[0]).toHaveAttribute(
        'href',
        '/admin/products/prod-2/edit',
      );

      // Fallback package placeholder rendered instead of external placehold.co
      const noImagePlaceholders = screen.getAllByLabelText('Không có hình ảnh');
      expect(noImagePlaceholders.length).toBeGreaterThan(0);

      // Product 2 status badge (active: false -> Tạm ẩn)
      const inactiveBadges = screen.getAllByText('Tạm ẩn');
      expect(inactiveBadges[0]).toHaveClass('bg-slate-100 text-slate-600');

      const zeroStockBadges = screen.getAllByText('0 sp');
      expect(zeroStockBadges.length).toBeGreaterThanOrEqual(3);
      zeroStockBadges.forEach((badge) => {
        expect(badge).toHaveClass('bg-rose-50 text-rose-700');
      });
      const zeroVariants = screen.getAllByText('0 biến thể');
      expect(zeroVariants.length).toBeGreaterThan(0);
      expect(screen.getAllByText('0.0').length).toBeGreaterThan(0);
      expect(screen.getAllByText('(0)').length).toBeGreaterThan(0);

      // Product 3 (Undefined stock on variant)
      expect(
        screen.getAllByText('Sản phẩm có biến thể không stock').length,
      ).toBeGreaterThan(0);
      expect(screen.getAllByText('Khử mùi cao cấp').length).toBeGreaterThan(0);
      expect(screen.getAllByText('3.5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('(8)').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1 biến thể').length).toBeGreaterThan(0);

      // Product 4 (Undefined variants array)
      expect(
        screen.getAllByText('Sản phẩm không có mảng variants').length,
      ).toBeGreaterThan(0);
      expect(screen.getAllByText('Nước hoa phòng ngủ').length).toBeGreaterThan(
        0,
      );
      expect(screen.getAllByText('5.0').length).toBeGreaterThan(0);
      expect(screen.getAllByText('(1)').length).toBeGreaterThan(0);
    });

    it('renders low stock amber warning badge when stock is between 1 and 5', () => {
      const lowStockProduct = {
        id: 'prod-low',
        name: 'Sản phẩm sắp hết hàng',
        slug: 'san-pham-sap-het-hang',
        basePrice: 100000,
        images: ['https://example.com/low.jpg'],
        category: null,
        active: true,
        variants: [{ sku: 'SKU-LOW-1', stock: 3 }],
      };

      mockUseInfiniteAdminProducts.mockReturnValue({
        data: {
          pages: [{ products: [lowStockProduct], total: 1 }],
        },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderAdminProductsPage();

      const amberBadges = screen.getAllByText('3 sp');
      expect(amberBadges[0]).toHaveClass('bg-amber-50 text-amber-700');
    });

    it('supports changing sort option via sort dropdown', () => {
      renderAdminProductsPage();

      const sortTrigger = screen.getByLabelText('Sắp xếp sản phẩm');
      expect(sortTrigger).toBeInTheDocument();

      const priceAscOption = screen.getByRole('menuitem', {
        name: 'Giá: Thấp đến cao',
      });
      fireEvent.click(priceAscOption);

      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ sortBy: 'price_asc' }),
      );
    });
  });

  describe('Search and Debounce Functionality', () => {
    it('debounces search input and updates query params after 500ms', () => {
      vi.useFakeTimers();

      renderAdminProductsPage();

      // Initially search is empty string
      expect(mockUseInfiniteAdminProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: '' }),
      );

      const input = screen.getByPlaceholderText(
        'Tìm kiếm theo tên sản phẩm, SKU...',
      );

      // Type first search query
      fireEvent.change(input, { target: { value: 'chai' } });
      expect(input).toHaveValue('chai');

      // Advance by 200ms (not yet 500ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '' }),
      );

      // Type again before debounce timer finishes (exercises clearTimeout)
      fireEvent.change(input, { target: { value: 'chai xịt thái' } });
      expect(input).toHaveValue('chai xịt thái');

      // Advance another 200ms
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '' }),
      );

      // Advance remaining 300ms to complete 500ms
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'chai xịt thái' }),
      );

      vi.useRealTimers();
    });

    it('clears search input when clicking clear button', () => {
      renderAdminProductsPage();

      const input = screen.getByPlaceholderText(
        'Tìm kiếm theo tên sản phẩm, SKU...',
      );
      fireEvent.change(input, { target: { value: 'sả chanh' } });
      expect(input).toHaveValue('sả chanh');

      const clearBtn = screen.getByLabelText('Xóa tìm kiếm');
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);
      expect(input).toHaveValue('');
    });
  });

  describe('Category Filter and Dynamic API Tree', () => {
    it('fetches categories and flattens tree with hierarchical display names', async () => {
      renderAdminProductsPage();

      // Wait for category loading effect to resolve
      await waitFor(() => {
        expect(mockGetTree).toHaveBeenCalledTimes(1);
      });

      // Initially categoryId is undefined: filter button displays "Lọc"
      expect(screen.getByText('Lọc')).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Tất cả danh mục' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Tất cả danh mục')).toHaveClass('font-bold');

      // Leaf category is rendered in dropdown menu
      expect(
        screen.getByRole('menuitem', { name: 'Khử mùi xe hơi' }),
      ).toBeInTheDocument();

      // Parent category submenu trigger and "Xem tất cả" item are rendered
      expect(screen.getByText('Nước hoa Thái')).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: 'Xem tất cả Nước hoa Thái' }),
      ).toBeInTheDocument();
    });

    it('catches and logs error when category loading fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetTree.mockRejectedValueOnce(new Error('Category fetch failure'));

      renderAdminProductsPage();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load categories',
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('allows selecting a leaf category and clears filter via clear button', async () => {
      renderAdminProductsPage();

      await waitFor(() => {
        expect(mockGetTree).toHaveBeenCalledTimes(1);
      });

      // Click on leaf category "Khử mùi xe hơi" (id: cat-2) in dropdown menu
      const leafItem = screen.getByRole('menuitem', {
        name: 'Khử mùi xe hơi',
      });
      fireEvent.click(leafItem);

      // Hook called with categoryId: 'cat-2'
      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: 'cat-2' }),
      );

      // Filter button now displays "Đã lọc"
      expect(screen.getByText('Đã lọc')).toBeInTheDocument();
      expect(leafItem.querySelector('span')).toHaveClass(
        'font-bold text-teal-600',
      );

      // Clear filter button appears: "Xóa: Khử mùi xe hơi ✕"
      const clearBtn = screen.getByRole('button', {
        name: 'Xóa bộ lọc danh mục',
      });
      expect(clearBtn).toBeInTheDocument();
      expect(clearBtn).toHaveTextContent('Xóa: Khử mùi xe hơi ✕');

      // Click clear button
      fireEvent.click(clearBtn);

      // Resets categoryId to undefined
      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: undefined }),
      );
      expect(screen.getByText('Lọc')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Xóa bộ lọc danh mục' }),
      ).not.toBeInTheDocument();
    });

    it('allows selecting parent category via "Xem tất cả" and nested leaf category', async () => {
      renderAdminProductsPage();

      await waitFor(() => {
        expect(mockGetTree).toHaveBeenCalledTimes(1);
      });

      // Click "Xem tất cả Nước hoa Thái"
      const selectAllParent = screen.getByRole('menuitem', {
        name: 'Xem tất cả Nước hoa Thái',
      });
      fireEvent.click(selectAllParent);

      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: 'cat-1' }),
      );
      const parentClearBtn = screen.getByRole('button', {
        name: 'Xóa bộ lọc danh mục',
      });
      expect(parentClearBtn).toBeInTheDocument();
      expect(parentClearBtn).toHaveTextContent('Xóa: Nước hoa Thái ✕');

      // Select nested child category "Hương sả chanh" (cat-1-1-1)
      const nestedLeaf = screen.getByRole('menuitem', {
        name: 'Hương sả chanh',
      });
      fireEvent.click(nestedLeaf);

      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: 'cat-1-1-1' }),
      );
      // Tests split(' > ').pop() for nested hierarchy: "Nước hoa Thái > Xịt phòng > Hương sả chanh" -> "Hương sả chanh"
      const nestedClearBtn = screen.getByRole('button', {
        name: 'Xóa bộ lọc danh mục',
      });
      expect(nestedClearBtn).toBeInTheDocument();
      expect(nestedClearBtn).toHaveTextContent('Xóa: Hương sả chanh ✕');

      // Clicking "Tất cả danh mục" resets filter
      const allCategoriesItem = screen.getByRole('menuitem', {
        name: 'Tất cả danh mục',
      });
      fireEvent.click(allCategoriesItem);

      expect(mockUseInfiniteAdminProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categoryId: undefined }),
      );
    });
  });

  describe('IntersectionObserver and Infinite Scroll', () => {
    it('observes sentinel element and triggers fetchNextPage when intersecting and hasNextPage is true', () => {
      const mockFetchNextPage = vi.fn();
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: mockDefaultData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
      });

      const { unmount } = renderAdminProductsPage();

      expect(observerInstances.length).toBeGreaterThan(0);
      const latestObserver = observerInstances[observerInstances.length - 1];
      expect(latestObserver.observe).toHaveBeenCalledTimes(1);

      // Trigger intersection with isIntersecting = true and hasNextPage = true
      act(() => {
        latestObserver.callback([{ isIntersecting: true }]);
      });
      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);

      // Trigger intersection with isIntersecting = false -> does not fetch
      mockFetchNextPage.mockClear();
      act(() => {
        latestObserver.callback([{ isIntersecting: false }]);
      });
      expect(mockFetchNextPage).not.toHaveBeenCalled();

      // Unmount unobserves target
      unmount();
      expect(latestObserver.unobserve).toHaveBeenCalledTimes(1);
    });

    it('does not call fetchNextPage when intersecting but hasNextPage is false', () => {
      const mockFetchNextPage = vi.fn();
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: mockDefaultData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      });

      renderAdminProductsPage();

      const latestObserver = observerInstances[observerInstances.length - 1];
      act(() => {
        latestObserver.callback([{ isIntersecting: true }]);
      });
      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it('renders spinner when isFetchingNextPage is true and end indicator when !hasNextPage', () => {
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: mockDefaultData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: true,
      });

      const { container } = renderAdminProductsPage();

      // Spinner is displayed for isFetchingNextPage
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      // "Đã hiển thị hết sản phẩm" is displayed when !hasNextPage and products.length > 0
      expect(screen.getByText('Đã hiển thị hết sản phẩm')).toBeInTheDocument();
    });

    it('does not display "Đã hiển thị hết sản phẩm" when hasNextPage is true', () => {
      mockUseInfiniteAdminProducts.mockReturnValue({
        data: mockDefaultData,
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
        isRefetching: false,
        fetchNextPage: vi.fn(),
        hasNextPage: true,
        isFetchingNextPage: false,
      });

      renderAdminProductsPage();
      expect(
        screen.queryByText('Đã hiển thị hết sản phẩm'),
      ).not.toBeInTheDocument();
    });

    it('displays loaded product count progress indicator', () => {
      renderAdminProductsPage();
      expect(screen.getByText('Hiển thị 4 / 100 sản phẩm')).toBeInTheDocument();
    });
  });

  describe('Product Deletion (handleDelete)', () => {
    it('opens confirmation dialog and calls deleteProduct.mutate with success callback', async () => {
      renderAdminProductsPage();

      const deleteButtons = screen.getAllByRole('menuitem', {
        name: /Xóa sản phẩm/i,
      });
      expect(deleteButtons.length).toBeGreaterThan(0);

      // Click delete for first product
      fireEvent.click(deleteButtons[0]);

      // Verify Dialog opens with title and item name
      expect(
        await screen.findByText('Xác nhận xóa sản phẩm'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Bạn có chắc chắn muốn xóa sản phẩm/),
      ).toBeInTheDocument();
      expect(
        screen.getByText('"Chai xịt khử mùi sả chanh"'),
      ).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận xóa' });
      fireEvent.click(confirmBtn);

      expect(mockDeleteMutate).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
          onSettled: expect.any(Function),
        }),
      );

      // Invoke onSuccess callback
      const options = mockDeleteMutate.mock.calls[0][1];
      options.onSuccess();
      expect(mockToast.success).toHaveBeenCalledWith('Xóa sản phẩm thành công');

      // Invoke onSettled callback
      options.onSettled();
    });

    it('triggers error toast when deleteProduct.mutate fails', async () => {
      renderAdminProductsPage();

      const deleteButtons = screen.getAllByRole('menuitem', {
        name: /Xóa sản phẩm/i,
      });
      fireEvent.click(deleteButtons[0]);

      const confirmBtn = await screen.findByRole('button', {
        name: 'Xác nhận xóa',
      });
      fireEvent.click(confirmBtn);

      const options = mockDeleteMutate.mock.calls[0][1];
      options.onError();
      expect(mockToast.error).toHaveBeenCalledWith(
        'Xóa sản phẩm thất bại. Vui lòng thử lại.',
      );

      options.onSettled();
    });

    it('does not call deleteProduct.mutate when Dialog cancellation is clicked', async () => {
      renderAdminProductsPage();

      const deleteButtons = screen.getAllByRole('menuitem', {
        name: /Xóa sản phẩm/i,
      });
      fireEvent.click(deleteButtons[0]);

      expect(
        await screen.findByText('Xác nhận xóa sản phẩm'),
      ).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
      fireEvent.click(cancelBtn);

      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('prevents multiple delete calls while deletingIdRef is active', async () => {
      renderAdminProductsPage();

      const deleteButtons = screen.getAllByRole('menuitem', {
        name: /Xóa sản phẩm/i,
      });

      // First click: triggers modal and confirm
      fireEvent.click(deleteButtons[0]);
      const confirmBtn = await screen.findByRole('button', {
        name: 'Xác nhận xóa',
      });
      fireEvent.click(confirmBtn);
      expect(mockDeleteMutate).toHaveBeenCalledTimes(1);

      const firstCallOptions = mockDeleteMutate.mock.calls[0][1];

      // Second click before onSettled: guard triggers (deletingIdRef.current === id)
      mockDeleteMutate.mockClear();
      fireEvent.click(confirmBtn);
      expect(mockDeleteMutate).not.toHaveBeenCalled();

      // Settle previous deletion
      firstCallOptions.onSettled();
    });

    it('disables delete button and prevents deletion when deleteProduct is pending for the product', () => {
      mockDeleteIsPending = true;
      mockDeleteVariables = 'prod-1';

      renderAdminProductsPage();

      const deleteButtons = screen.getAllByRole('menuitem', {
        name: /Xóa sản phẩm/i,
      });

      // Product 1 delete button should be disabled
      expect(deleteButtons[0]).toBeDisabled();

      fireEvent.click(deleteButtons[0]);
      expect(mockDeleteMutate).not.toHaveBeenCalled();

      // Product 2 delete button should not be disabled
      expect(deleteButtons[1]).not.toBeDisabled();
    });
  });
});
