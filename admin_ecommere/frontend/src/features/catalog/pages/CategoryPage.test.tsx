import React from 'react';
import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { CategoryPage } from './CategoryPage';
import { useCategoryBySlug } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { SEO } from '@/lib/seo';
import { useCartStore } from '@/features/cart/store/cartStore';

// Mock axios and API modules so axios never runs
vi.mock('axios');

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('../api/products.api', () => ({
  productsApi: {
    getAll: vi.fn(),
    search: vi.fn(),
    getAllAdmin: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../hooks/useCategories', () => ({
  useCategoryBySlug: vi.fn(),
  useCategories: vi.fn(),
}));

vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(),
  useProductSearch: vi.fn(),
  useInfiniteProducts: vi.fn(),
  useInfiniteAdminProducts: vi.fn(),
}));

const mockAddItem = vi.fn();
vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: vi.fn(() => ({
    addItem: mockAddItem,
    items: [],
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    totalPrice: 0,
    totalItems: 0,
  })),
}));

vi.mock('@/lib/seo', () => ({
  SEO: vi.fn(
    ({ title, description }: { title?: string; description?: string }) => (
      <div
        data-testid="mock-seo"
        data-title={title}
        data-description={description}
      />
    ),
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock Radix Select UI to provide deterministic and portal-free option selection in JSDOM
vi.mock('@/components/ui/select', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  const Context = ReactModule.createContext({
    value: '',
    onValueChange: (_val: string) => {},
  });

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string;
      onValueChange?: (val: string) => void;
      children: React.ReactNode;
    }) => (
      <Context.Provider
        value={{
          value: value || '',
          onValueChange: onValueChange || (() => {}),
        }}
      >
        <div data-testid="mock-select" data-value={value}>
          {children}
        </div>
      </Context.Provider>
    ),
    SelectTrigger: ({
      children,
      className,
      ...props
    }: React.HTMLAttributes<HTMLButtonElement>) => (
      <button
        type="button"
        data-testid="select-trigger"
        className={className}
        {...props}
      >
        {children}
      </button>
    ),
    SelectValue: ({ placeholder }: { placeholder?: string }) => {
      const { value } = ReactModule.useContext(Context);
      return <span data-testid="select-value">{value || placeholder}</span>;
    },
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="select-content">{children}</div>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => {
      const { value: selectedValue, onValueChange } =
        ReactModule.useContext(Context);
      return (
        <button
          type="button"
          role="option"
          aria-selected={value === selectedValue}
          data-value={value}
          onClick={() => onValueChange(value)}
        >
          {children}
        </button>
      );
    },
  };
});

// Polyfill pointer capture and scrollIntoView in JSDOM environment
beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockCategoryWithDescription = {
  id: 'cat-1',
  name: 'Nước hoa nam',
  slug: 'nuoc-hoa-nam',
  description: 'Bộ sưu tập nước hoa nam cao cấp chính hãng từ Thái Lan',
};

const mockCategoryWithoutDescription = {
  id: 'cat-2',
  name: 'Xịt phòng khử mùi',
  slug: 'xit-phong-khu-mui',
  description: undefined,
};

const mockProductWithSalePrice = {
  id: 'prod-1',
  name: 'Nước hoa nam Charme King 100ml',
  slug: 'nuoc-hoa-nam-charme-king-100ml',
  description: 'Mùi hương nam tính mạnh mẽ và quyến rũ lâu dài',
  images: ['/images/king-1.jpg', '/images/king-2.jpg'],
  categoryId: 'cat-1',
  basePrice: 550000,
  rating: 4.8,
  reviewCount: 24,
  variants: [
    {
      id: 'var-1',
      scent: 'Hương gỗ trầm',
      volumeMl: 100,
      price: 600000,
      salePrice: 550000,
      stock: 15,
      sku: 'CK-100',
    },
  ],
};

const mockProductWithoutSalePrice = {
  id: 'prod-2',
  name: 'Nước hoa nam Charme Iris 50ml',
  slug: 'nuoc-hoa-nam-charme-iris-50ml',
  description: 'Hương thơm thanh lịch, tao nhã',
  images: ['/images/iris-1.jpg'],
  categoryId: 'cat-1',
  basePrice: 380000,
  rating: 4.2,
  reviewCount: 10,
  variants: [
    {
      id: 'var-2',
      scent: 'Hoa Iris',
      volumeMl: 50,
      price: 380000,
      salePrice: undefined,
      stock: 8,
      sku: 'CI-50',
    },
  ],
};

const mockProductManyVariants = {
  id: 'prod-3',
  name: 'Xịt toàn thân đa hương 150ml',
  slug: 'xit-toan-than-da-huong-150ml',
  description: 'Nhiều mùi hương đa dạng cho mọi dịp',
  images: ['/images/multi-1.jpg'],
  categoryId: 'cat-1',
  basePrice: 200000,
  rating: 3.5,
  reviewCount: 5,
  variants: [
    {
      id: 'var-3a',
      scent: 'Cam Chanh',
      volumeMl: 150,
      price: 200000,
      salePrice: null,
      stock: 10,
      sku: 'CC-150',
    },
    {
      id: 'var-3b',
      scent: 'Bạc Hà',
      volumeMl: 150,
      price: 200000,
      salePrice: null,
      stock: 10,
      sku: 'BH-150',
    },
    {
      id: 'var-3c',
      scent: 'Trà Xanh',
      volumeMl: 150,
      price: 200000,
      salePrice: null,
      stock: 10,
      sku: 'TX-150',
    },
    {
      id: 'var-3d',
      scent: 'Hương Biển',
      volumeMl: 150,
      price: 200000,
      salePrice: null,
      stock: 10,
      sku: 'HB-150',
    },
    {
      id: 'var-3e',
      scent: 'Hoa Hồng',
      volumeMl: 150,
      price: 200000,
      salePrice: null,
      stock: 10,
      sku: 'HH-150',
    },
  ],
};

const mockProductNoVariants = {
  id: 'prod-4',
  name: 'Chai xịt mẫu không có biến thể',
  slug: 'chai-xit-mau-khong-co-bien-the',
  description: undefined,
  images: ['/images/sample.jpg'],
  categoryId: 'cat-1',
  basePrice: 100000,
  rating: undefined,
  reviewCount: undefined,
  variants: [],
};

const mockProductUndefinedVariants = {
  id: 'prod-5',
  name: 'Chai xịt biến thể undefined',
  slug: 'chai-xit-bien-the-undefined',
  description: undefined,
  images: ['/images/none.jpg'],
  categoryId: 'cat-1',
  basePrice: 120000,
  rating: 0,
  reviewCount: 0,
  variants: undefined as any,
};

function renderCategoryPage(options?: {
  initialEntries?: string[];
  routePath?: string;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const initialEntries = options?.initialEntries ?? [
    '/categories/nuoc-hoa-nam',
  ];
  const routePath = options?.routePath ?? '/categories/:categorySlug';

  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path={routePath} element={<CategoryPage />} />
            <Route
              path="/catalog"
              element={<div data-testid="catalog-page">Trang sản phẩm</div>}
            />
            <Route
              path="/p/:slug"
              element={
                <div data-testid="product-detail-page">
                  Trang chi tiết sản phẩm
                </div>
              }
            />
          </Routes>
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );
}

describe('CategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [] });
  });

  describe('Loading states', () => {
    it('renders loading spinner when category is loading', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderCategoryPage();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      expect(
        screen.queryByText('Không tìm thấy danh mục'),
      ).not.toBeInTheDocument();
    });

    it('renders loading spinner when products are loading', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      renderCategoryPage();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Nước hoa nam')).not.toBeInTheDocument();
    });

    it('renders loading spinner when both category and products are loading', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      renderCategoryPage();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Not found states', () => {
    it('renders empty state when category data is null', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: null,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderCategoryPage();

      expect(screen.getByText('Không tìm thấy danh mục')).toBeInTheDocument();
      expect(
        screen.getByText('Danh mục bạn tìm kiếm không tồn tại'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Sản phẩm trong danh mục'),
      ).not.toBeInTheDocument();
    });

    it('renders empty state when category data is undefined', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderCategoryPage();

      expect(screen.getByText('Không tìm thấy danh mục')).toBeInTheDocument();
      expect(
        screen.getByText('Danh mục bạn tìm kiếm không tồn tại'),
      ).toBeInTheDocument();
    });
  });

  describe('Category Header, SEO, Breadcrumbs & Stats', () => {
    it('renders category header with name, description, breadcrumb and back link', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage();

      // Check SEO component invocation with expected title and description
      expect(SEO).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockCategoryWithDescription.name,
          description: mockCategoryWithDescription.description,
        }),
        expect.anything(),
      );
      const seoElement = screen.getByTestId('mock-seo');
      expect(seoElement).toHaveAttribute('data-title', 'Nước hoa nam');
      expect(seoElement).toHaveAttribute(
        'data-description',
        'Bộ sưu tập nước hoa nam cao cấp chính hãng từ Thái Lan',
      );

      // Breadcrumb
      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(within(breadcrumb).getByText('Sản phẩm')).toHaveAttribute(
        'href',
        '/catalog',
      );
      expect(within(breadcrumb).getByText('Nước hoa nam')).toBeInTheDocument();

      // Back button
      const backLink = screen.getByRole('link', {
        name: /Quay lại danh sách/i,
      });
      expect(backLink).toHaveAttribute('href', '/catalog');

      // Title & description in header
      expect(
        screen.getByRole('heading', { level: 1, name: 'Nước hoa nam' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Bộ sưu tập nước hoa nam cao cấp chính hãng từ Thái Lan',
        ),
      ).toBeInTheDocument();

      // Header badge and section badge showing product total
      const productBadges = screen.getAllByText('1 sản phẩm');
      expect(productBadges).toHaveLength(2);

      // Category stats card
      const statsCard = screen
        .getByText('Đánh giá')
        .closest<HTMLElement>('.p-4')!;
      expect(within(statsCard).getByText('Sản phẩm')).toBeInTheDocument();
      expect(within(statsCard).getByText('Đánh giá')).toBeInTheDocument();
      expect(within(statsCard).getByText('4.8')).toBeInTheDocument();
    });

    it('navigates back to /catalog when "Quay lại danh sách" is clicked', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: { products: [], total: 0 },
        isLoading: false,
      } as any);

      renderCategoryPage();

      const backLink = screen.getByRole('link', {
        name: /Quay lại danh sách/i,
      });
      fireEvent.click(backLink);

      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });

    it('handles category without description and products with undefined total', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithoutDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: { products: [], total: undefined as any },
        isLoading: false,
      } as any);

      renderCategoryPage();

      expect(
        screen.getByRole('heading', { level: 1, name: 'Xịt phòng khử mùi' }),
      ).toBeInTheDocument();
      // Description paragraph is omitted
      expect(
        screen.queryByText(
          'Bộ sưu tập nước hoa nam cao cấp chính hãng từ Thái Lan',
        ),
      ).not.toBeInTheDocument();
      // Fallback to 0 sản phẩm for products?.total || 0
      const badges = screen.getAllByText('0 sản phẩm');
      expect(badges.length).toBeGreaterThanOrEqual(1);
      // Rating fallback to '0.0'
      expect(screen.getByText('0.0')).toBeInTheDocument();
    });

    it('calculates average rating correctly from products, including items with undefined rating', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [
            { ...mockProductWithSalePrice, rating: 4.0 },
            { ...mockProductWithoutSalePrice, rating: undefined },
          ],
          total: 2,
        },
        isLoading: false,
      } as any);

      renderCategoryPage();

      // (4.0 + 0) / 2 = 2.0
      expect(screen.getByText('2.0')).toBeInTheDocument();
      expect(screen.getByText('Đánh giá')).toBeInTheDocument();
    });

    it('displays 0.0 rating when products object has undefined products array', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: { products: [], total: 0 },
        isLoading: false,
      } as any);

      renderCategoryPage();

      expect(screen.getByText('0.0')).toBeInTheDocument();
    });
  });

  describe('Empty products state', () => {
    it('renders empty products state with call to action when category has no products', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: { products: [], total: 0 },
        isLoading: false,
      } as any);

      renderCategoryPage();

      expect(screen.getByText('Chưa có sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Danh mục này chưa có sản phẩm nào. Hãy quay lại sau!',
        ),
      ).toBeInTheDocument();

      const seeAllLink = screen.getByRole('link', {
        name: /Xem tất cả sản phẩm/i,
      });
      expect(seeAllLink).toHaveAttribute('href', '/catalog');
      fireEvent.click(seeAllLink);

      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });
  });

  describe('Products grid view (default view mode)', () => {
    it('renders products in grid view by default and handles add to cart for variant with salePrice', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductWithSalePrice, mockProductWithoutSalePrice],
          total: 2,
        },
        isLoading: false,
      } as any);

      renderCategoryPage();

      expect(screen.getByText('Sản phẩm trong danh mục')).toBeInTheDocument();
      const productBadges = screen.getAllByText('2 sản phẩm');
      expect(productBadges).toHaveLength(2);
      expect(
        screen.getByText('Nước hoa nam Charme King 100ml'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nước hoa nam Charme Iris 50ml'),
      ).toBeInTheDocument();

      // ProductCard has "Thêm vào giỏ" button
      const addToCartButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      expect(addToCartButtons.length).toBe(2);

      // Click Add to cart for Product 1 (which has salePrice: 550000, price: 600000)
      fireEvent.click(addToCartButtons[0]);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa nam Charme King 100ml',
        image: '/images/king-1.jpg',
        price: 550000, // variant.salePrice is picked
        scent: 'Hương gỗ trầm',
        volumeMl: 100,
      });
    });

    it('handles add to cart in grid view for variant without salePrice (fallback to variant.price)', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductWithoutSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage();

      const addToCartButton = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });

      // Product 2 has salePrice: undefined, price: 380000
      fireEvent.click(addToCartButton);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Nước hoa nam Charme Iris 50ml',
        image: '/images/iris-1.jpg',
        price: 380000, // variant.price is picked
        scent: 'Hoa Iris',
        volumeMl: 50,
      });
    });

    it('does not add to cart in grid view if product has no variants', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductNoVariants],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage();

      const addToCartButton = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });

      fireEvent.click(addToCartButton);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Products list view (viewMode = list)', () => {
    it('switches to list view when list toggle button is clicked and renders list card elements', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage();

      const xemLabel = screen.getByText('Xem:');
      const viewButtons = xemLabel.parentElement?.querySelectorAll('button');
      expect(viewButtons?.length).toBe(2);

      const listButton = viewButtons![1];
      fireEvent.click(listButton);

      // In list view: name, rating, reviews, variant count, description, variant tag, formatted currency
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: 'Nước hoa nam Charme King 100ml',
        }),
      ).toBeInTheDocument();
      const ratings = screen.getAllByText('4.8');
      expect(ratings).toHaveLength(2);
      expect(screen.getByText('(24 đánh giá)')).toBeInTheDocument();
      expect(screen.getByText('1 biến thể')).toBeInTheDocument();
      expect(
        screen.getByText('Mùi hương nam tính mạnh mẽ và quyến rũ lâu dài'),
      ).toBeInTheDocument();
      expect(screen.getByText('Hương gỗ trầm - 100ml')).toBeInTheDocument();
      expect(screen.getByText(/550\.000/)).toBeInTheDocument();
    });

    it('handles add to cart from list view', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage({
        initialEntries: ['/categories/nuoc-hoa-nam?view=list'],
      });

      const addToCartButton = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButton);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa nam Charme King 100ml',
        image: '/images/king-1.jpg',
        price: 550000,
        scent: 'Hương gỗ trầm',
        volumeMl: 100,
      });
    });

    it('switches back from list view to grid view when grid button is clicked', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage({
        initialEntries: ['/categories/nuoc-hoa-nam?view=list'],
      });

      const xemLabel = screen.getByText('Xem:');
      const viewButtons = xemLabel.parentElement?.querySelectorAll('button');
      const gridButton = viewButtons![0];

      fireEvent.click(gridButton);

      // Heading 3 in list view has class leading-tight; in grid view ProductCard it is a Link
      const heading = screen.getByRole('heading', {
        level: 3,
        name: 'Nước hoa nam Charme King 100ml',
      });
      expect(heading.closest('a')).toHaveAttribute(
        'href',
        '/p/nuoc-hoa-nam-charme-king-100ml',
      );
    });

    it('renders list view with more than 3 variants and shows "+X nữa" badge', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductManyVariants],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage({
        initialEntries: ['/categories/nuoc-hoa-nam?view=list'],
      });

      expect(screen.getByText('5 biến thể')).toBeInTheDocument();
      // First 3 are sliced
      expect(screen.getByText('Cam Chanh - 150ml')).toBeInTheDocument();
      expect(screen.getByText('Bạc Hà - 150ml')).toBeInTheDocument();
      expect(screen.getByText('Trà Xanh - 150ml')).toBeInTheDocument();
      // 4th and 5th are not displayed directly
      expect(screen.queryByText('Hương Biển - 150ml')).not.toBeInTheDocument();
      expect(screen.queryByText('Hoa Hồng - 150ml')).not.toBeInTheDocument();
      // +2 nữa badge (5 - 3 = 2)
      expect(screen.getByText('+2 nữa')).toBeInTheDocument();
    });

    it('renders list view for product with undefined description, rating, reviewCount, and empty variants', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductNoVariants, mockProductUndefinedVariants],
          total: 2,
        },
        isLoading: false,
      } as any);

      renderCategoryPage({
        initialEntries: ['/categories/nuoc-hoa-nam?view=list'],
      });

      // Product 4: rating undefined -> '0.0', reviews undefined -> '(0 đánh giá)', variants empty -> '0 biến thể'
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: 'Chai xịt mẫu không có biến thể',
        }),
      ).toBeInTheDocument();
      const zeroVariantsBadges = screen.getAllByText('0 biến thể');
      expect(zeroVariantsBadges.length).toBe(2);

      const zeroReviewTexts = screen.getAllByText('(0 đánh giá)');
      expect(zeroReviewTexts.length).toBe(2);

      // Clicking Add to Cart on product without variants does not call addItem
      const addToCartButtons = screen.getAllByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButtons[0]);
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Sorting and query parameters', () => {
    it('calls useProducts with default newest sort and updates sort on value change', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockImplementation(
        () =>
          ({
            data: {
              products: [mockProductWithSalePrice],
              total: 1,
            },
            isLoading: false,
          }) as any,
      );

      renderCategoryPage();

      expect(useProducts).toHaveBeenCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'newest',
      });

      // Change sort to price_asc
      const sortOptionPriceAsc = screen.getByRole('option', {
        name: 'Giá: Thấp đến cao',
      });
      fireEvent.click(sortOptionPriceAsc);

      expect(useProducts).toHaveBeenLastCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'price_asc',
      });
    });

    it('renders all product sort options from PRODUCT_SORT_OPTIONS and handles other sort options', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockImplementation(
        () =>
          ({
            data: {
              products: [mockProductWithSalePrice],
              total: 1,
            },
            isLoading: false,
          }) as any,
      );

      renderCategoryPage();

      // Check all 5 sort options
      expect(
        screen.getByRole('option', { name: 'Mới nhất' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Giá: Thấp đến cao' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Giá: Cao đến thấp' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Bán chạy nhất' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Đánh giá cao nhất' }),
      ).toBeInTheDocument();

      // Select price_desc
      fireEvent.click(
        screen.getByRole('option', { name: 'Giá: Cao đến thấp' }),
      );
      expect(useProducts).toHaveBeenLastCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'price_desc',
      });

      // Select best_selling
      fireEvent.click(screen.getByRole('option', { name: 'Bán chạy nhất' }));
      expect(useProducts).toHaveBeenLastCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'best_selling',
      });

      // Select rating
      fireEvent.click(
        screen.getByRole('option', { name: 'Đánh giá cao nhất' }),
      );
      expect(useProducts).toHaveBeenLastCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'rating',
      });

      // Select newest
      fireEvent.click(screen.getByRole('option', { name: 'Mới nhất' }));
      expect(useProducts).toHaveBeenLastCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'newest',
      });
    });

    it('preserves existing sort parameter when toggling view mode', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockImplementation(
        () =>
          ({
            data: {
              products: [mockProductWithSalePrice],
              total: 1,
            },
            isLoading: false,
          }) as any,
      );

      renderCategoryPage({
        initialEntries: ['/categories/nuoc-hoa-nam?sort=price_desc'],
      });

      expect(useProducts).toHaveBeenCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'price_desc',
      });

      const xemLabel = screen.getByText('Xem:');
      const viewButtons = xemLabel.parentElement?.querySelectorAll('button');
      const listButton = viewButtons![1];

      fireEvent.click(listButton);

      // Both sort and view are in searchParams
      expect(useProducts).toHaveBeenLastCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'price_desc',
      });
    });

    it('initializes sortBy and viewMode correctly from initial URL parameters', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: mockCategoryWithDescription,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: {
          products: [mockProductWithSalePrice],
          total: 1,
        },
        isLoading: false,
      } as any);

      renderCategoryPage({
        initialEntries: ['/categories/nuoc-hoa-nam?sort=rating&view=list'],
      });

      expect(useCategoryBySlug).toHaveBeenCalledWith('nuoc-hoa-nam');
      expect(useProducts).toHaveBeenCalledWith({
        categorySlug: 'nuoc-hoa-nam',
        sortBy: 'rating',
      });

      // Renders list view directly
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: 'Nước hoa nam Charme King 100ml',
        }),
      ).toBeInTheDocument();
      expect(screen.getByText('1 biến thể')).toBeInTheDocument();
    });
  });

  describe('Route parameter edge cases', () => {
    it('handles missing categorySlug route parameter gracefully', () => {
      vi.mocked(useCategoryBySlug).mockReturnValue({
        data: null,
        isLoading: false,
      } as any);
      vi.mocked(useProducts).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      renderCategoryPage({
        initialEntries: ['/categories'],
        routePath: '/categories',
      });

      expect(useCategoryBySlug).toHaveBeenCalledWith(undefined);
      expect(useProducts).toHaveBeenCalledWith({
        categorySlug: undefined,
        sortBy: 'newest',
      });
      expect(screen.getByText('Không tìm thấy danh mục')).toBeInTheDocument();
    });
  });
});
