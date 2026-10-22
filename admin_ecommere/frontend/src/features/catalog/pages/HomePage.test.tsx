import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './HomePage';
import { useCartStore } from '@/features/cart/store/cartStore';

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
}));

vi.mock('@/lib/seo', () => ({
  SEO: () => <div data-testid="mock-seo" />,
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => (
    <div data-testid="mock-loading-spinner">Đang tải...</div>
  ),
}));

vi.mock('@/components/common/ProductCard', () => ({
  ProductCard: (props: any) => (
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
  ),
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
  }),
}));

let mockNewProductsData: any = undefined;
let mockNewProductsLoading = false;
let mockBestSellingData: any = undefined;
let mockBestSellingLoading = false;

const mockUseProducts = vi.fn((filters: any) => {
  if (filters?.sortBy === 'newest') {
    return {
      data: mockNewProductsData,
      isLoading: mockNewProductsLoading,
    };
  }
  if (filters?.sortBy === 'best_selling') {
    return {
      data: mockBestSellingData,
      isLoading: mockBestSellingLoading,
    };
  }
  return { data: undefined, isLoading: false };
});

vi.mock('../hooks/useProducts', () => ({
  useProducts: (filters: any) => mockUseProducts(filters),
}));

const sampleNewProduct1 = {
  id: 'new-prod-1',
  name: 'Nước Hoa Xịt Phòng Hoa Bưởi',
  slug: 'nuoc-hoa-xit-phong-hoa-buoi',
  images: ['/images/buoi.jpg'],
  basePrice: 160000,
  rating: 4.8,
  reviewCount: 15,
  variants: [
    {
      id: 'var-new-1',
      price: 160000,
      salePrice: 135000,
      scent: 'Hoa Bưởi',
      volumeMl: 100,
    },
  ],
};

const sampleNewProduct2 = {
  id: 'new-prod-2',
  name: 'Nước Hoa Xịt Quần Áo Hương Biển',
  slug: 'nuoc-hoa-xit-quan-ao-huong-bien',
  images: ['/images/sea.jpg'],
  basePrice: 180000,
  rating: 4.5,
  reviewCount: 8,
  variants: [
    {
      id: 'var-new-2',
      price: 180000,
      salePrice: undefined,
      scent: 'Hương Biển',
      volumeMl: 150,
    },
  ],
};

const sampleNewProductNoVariants = {
  id: 'new-prod-no-var',
  name: 'Sản phẩm mới hết hàng',
  slug: 'san-pham-moi-het-hang',
  images: ['/images/empty.jpg'],
  basePrice: 200000,
  variants: [],
};

const sampleBestProduct1 = {
  id: 'best-prod-1',
  name: 'Xịt Thơm Khử Mùi Ô Tô Cà Phê',
  slug: 'xit-thom-khu-mui-o-to-ca-phe',
  images: ['/images/coffee.jpg'],
  basePrice: 150000,
  rating: 4.9,
  reviewCount: 88,
  variants: [
    {
      id: 'var-best-1',
      price: 150000,
      salePrice: 129000,
      scent: 'Cà phê rang',
      volumeMl: 100,
    },
  ],
};

const sampleBestProduct2 = {
  id: 'best-prod-2',
  name: 'Xịt Thơm Tinh Dầu Tràm Trà',
  slug: 'xit-thom-tinh-dau-tram-tra',
  images: ['/images/tea-tree.jpg'],
  basePrice: 140000,
  rating: 4.7,
  reviewCount: 30,
  variants: [
    {
      id: 'var-best-2',
      price: 140000,
      salePrice: null,
      scent: 'Tràm Trà',
      volumeMl: 100,
    },
  ],
};

const sampleBestProductNoVariants = {
  id: 'best-prod-no-var',
  name: 'Sản phẩm bán chạy hết hàng',
  slug: 'san-pham-ban-chay-het-hang',
  images: ['/images/empty-best.jpg'],
  basePrice: 120000,
  variants: [],
};

function renderHomePage(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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
    vi.clearAllMocks();
    useCartStore.setState({ items: [] });
    mockNewProductsData = undefined;
    mockNewProductsLoading = false;
    mockBestSellingData = undefined;
    mockBestSellingLoading = false;
  });

  describe('Hero Banner & Static Content', () => {
    it('renders SEO component', () => {
      renderHomePage();
      expect(screen.getByTestId('mock-seo')).toBeInTheDocument();
    });

    it('renders Thai Spray Shop badge and heading with Vietnamese copy', () => {
      renderHomePage();

      expect(screen.getByText('Thai Spray Shop')).toBeInTheDocument();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Nước Hoa XịtThái Lan Chính Hãng');
      expect(screen.getByText('Thái Lan Chính Hãng')).toBeInTheDocument();

      expect(
        screen.getByText(
          'Khám phá bộ sưu tập nước hoa xịt thơm đa dạng mùi hương, chất lượng cao cấp với giá tốt nhất thị trường',
        ),
      ).toBeInTheDocument();
    });

    it('renders CTA action buttons with exact link destinations', () => {
      renderHomePage();

      const exploreLink = screen.getByRole('link', { name: /khám phá ngay/i });
      expect(exploreLink).toHaveAttribute('href', '/catalog');

      const searchLink = screen.getByRole('link', {
        name: /tìm kiếm sản phẩm/i,
      });
      expect(searchLink).toHaveAttribute('href', '/search');
    });
  });

  describe('Features Section', () => {
    it('renders all three feature value propositions with Vietnamese descriptions', () => {
      renderHomePage();

      expect(screen.getByText('Giao hàng nhanh')).toBeInTheDocument();
      expect(
        screen.getByText('Giao hàng toàn quốc trong 1-3 ngày'),
      ).toBeInTheDocument();

      expect(screen.getByText('Chính hãng 100%')).toBeInTheDocument();
      expect(
        screen.getByText('Cam kết sản phẩm chính hãng'),
      ).toBeInTheDocument();

      expect(screen.getByText('Đổi trả dễ dàng')).toBeInTheDocument();
      expect(
        screen.getByText('Đổi trả trong 7 ngày nếu có lỗi'),
      ).toBeInTheDocument();
    });
  });

  describe('New Products Section', () => {
    it('queries products with sortBy newest and limit 8', () => {
      renderHomePage();

      expect(mockUseProducts).toHaveBeenCalledWith({
        sortBy: 'newest',
        limit: 8,
      });
    });

    it('renders section title and link to catalog with newest sort', () => {
      renderHomePage();

      expect(screen.getByText('Sản phẩm mới nhất')).toBeInTheDocument();
      const viewAllLinks = screen.getAllByRole('link', { name: 'Xem tất cả' });
      expect(viewAllLinks[0]).toHaveAttribute('href', '/catalog?sort=newest');
    });

    it('renders LoadingSpinner when new products are loading', () => {
      mockNewProductsLoading = true;
      mockNewProductsData = undefined;

      renderHomePage();

      expect(screen.getByTestId('mock-loading-spinner')).toBeInTheDocument();
      expect(
        screen.queryByTestId('product-card-new-prod-1'),
      ).not.toBeInTheDocument();
    });

    it('renders product cards when new products load successfully', () => {
      mockNewProductsLoading = false;
      mockNewProductsData = {
        products: [sampleNewProduct1, sampleNewProduct2],
      };

      renderHomePage();

      expect(screen.getByTestId('product-card-new-prod-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-new-prod-2')).toBeInTheDocument();
      expect(
        screen.getByText('Nước Hoa Xịt Phòng Hoa Bưởi'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nước Hoa Xịt Quần Áo Hương Biển'),
      ).toBeInTheDocument();
    });

    it('handles undefined or empty products array safely without crashing', () => {
      mockNewProductsLoading = false;
      mockNewProductsData = undefined;

      renderHomePage();

      expect(
        screen.queryByTestId('product-card-new-prod-1'),
      ).not.toBeInTheDocument();

      mockNewProductsData = { products: [] };
      const { container } = renderHomePage();
      expect(
        container.querySelector('[data-testid^="product-card-"]'),
      ).toBeNull();
    });

    it('adds product to cart with salePrice when variant has salePrice', () => {
      mockNewProductsLoading = false;
      mockNewProductsData = {
        products: [sampleNewProduct1],
      };

      renderHomePage();

      const addToCartBtn = screen.getByTestId('add-to-cart-btn-new-prod-1');
      fireEvent.click(addToCartBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'new-prod-1',
        variantId: 'var-new-1',
        name: 'Nước Hoa Xịt Phòng Hoa Bưởi',
        image: '/images/buoi.jpg',
        price: 135000,
        scent: 'Hoa Bưởi',
        volumeMl: 100,
      });
    });

    it('adds product to cart with regular price when variant salePrice is undefined', () => {
      mockNewProductsLoading = false;
      mockNewProductsData = {
        products: [sampleNewProduct2],
      };

      renderHomePage();

      const addToCartBtn = screen.getByTestId('add-to-cart-btn-new-prod-2');
      fireEvent.click(addToCartBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'new-prod-2',
        variantId: 'var-new-2',
        name: 'Nước Hoa Xịt Quần Áo Hương Biển',
        image: '/images/sea.jpg',
        price: 180000,
        scent: 'Hương Biển',
        volumeMl: 150,
      });
    });

    it('does not add to cart when product variants array is empty', () => {
      mockNewProductsLoading = false;
      mockNewProductsData = {
        products: [sampleNewProductNoVariants],
      };

      renderHomePage();

      const addToCartBtn = screen.getByTestId(
        'add-to-cart-btn-new-prod-no-var',
      );
      fireEvent.click(addToCartBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Best Selling Section', () => {
    it('queries products with sortBy best_selling and limit 8', () => {
      renderHomePage();

      expect(mockUseProducts).toHaveBeenCalledWith({
        sortBy: 'best_selling',
        limit: 8,
      });
    });

    it('renders section title and link to catalog with best_selling sort', () => {
      renderHomePage();

      expect(screen.getByText('Bán chạy nhất')).toBeInTheDocument();
      const viewAllLinks = screen.getAllByRole('link', { name: 'Xem tất cả' });
      expect(viewAllLinks[1]).toHaveAttribute(
        'href',
        '/catalog?sort=best_selling',
      );
    });

    it('renders LoadingSpinner when best selling products are loading', () => {
      mockBestSellingLoading = true;
      mockBestSellingData = undefined;

      renderHomePage();

      expect(screen.getByTestId('mock-loading-spinner')).toBeInTheDocument();
      expect(
        screen.queryByTestId('product-card-best-prod-1'),
      ).not.toBeInTheDocument();
    });

    it('renders product cards when best selling products load successfully', () => {
      mockBestSellingLoading = false;
      mockBestSellingData = {
        products: [sampleBestProduct1, sampleBestProduct2],
      };

      renderHomePage();

      expect(
        screen.getByTestId('product-card-best-prod-1'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('product-card-best-prod-2'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Xịt Thơm Khử Mùi Ô Tô Cà Phê'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Xịt Thơm Tinh Dầu Tràm Trà'),
      ).toBeInTheDocument();
    });

    it('handles undefined or empty best selling products safely', () => {
      mockBestSellingLoading = false;
      mockBestSellingData = undefined;

      renderHomePage();

      expect(
        screen.queryByTestId('product-card-best-prod-1'),
      ).not.toBeInTheDocument();

      mockBestSellingData = { products: [] };
      renderHomePage();
      expect(
        screen.queryByTestId('product-card-best-prod-1'),
      ).not.toBeInTheDocument();
    });

    it('adds best selling product to cart with salePrice when available', () => {
      mockBestSellingLoading = false;
      mockBestSellingData = {
        products: [sampleBestProduct1],
      };

      renderHomePage();

      const addToCartBtn = screen.getByTestId('add-to-cart-btn-best-prod-1');
      fireEvent.click(addToCartBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'best-prod-1',
        variantId: 'var-best-1',
        name: 'Xịt Thơm Khử Mùi Ô Tô Cà Phê',
        image: '/images/coffee.jpg',
        price: 129000,
        scent: 'Cà phê rang',
        volumeMl: 100,
      });
    });

    it('adds best selling product to cart with regular price when salePrice is null', () => {
      mockBestSellingLoading = false;
      mockBestSellingData = {
        products: [sampleBestProduct2],
      };

      renderHomePage();

      const addToCartBtn = screen.getByTestId('add-to-cart-btn-best-prod-2');
      fireEvent.click(addToCartBtn);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: 'best-prod-2',
        variantId: 'var-best-2',
        name: 'Xịt Thơm Tinh Dầu Tràm Trà',
        image: '/images/tea-tree.jpg',
        price: 140000,
        scent: 'Tràm Trà',
        volumeMl: 100,
      });
    });

    it('does not add to cart when best selling product has empty variants', () => {
      mockBestSellingLoading = false;
      mockBestSellingData = {
        products: [sampleBestProductNoVariants],
      };

      renderHomePage();

      const addToCartBtn = screen.getByTestId(
        'add-to-cart-btn-best-prod-no-var',
      );
      fireEvent.click(addToCartBtn);

      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Combined Loading States', () => {
    it('renders two loading spinners when both new and best selling sections are loading', () => {
      mockNewProductsLoading = true;
      mockBestSellingLoading = true;

      renderHomePage();

      const spinners = screen.getAllByTestId('mock-loading-spinner');
      expect(spinners).toHaveLength(2);
    });

    it('renders spinner in new section and product cards in best selling when only new is loading', () => {
      mockNewProductsLoading = true;
      mockBestSellingLoading = false;
      mockBestSellingData = {
        products: [sampleBestProduct1],
      };

      renderHomePage();

      expect(screen.getAllByTestId('mock-loading-spinner')).toHaveLength(1);
      expect(
        screen.getByTestId('product-card-best-prod-1'),
      ).toBeInTheDocument();
    });

    it('renders product cards in new section and spinner in best selling when only best selling is loading', () => {
      mockNewProductsLoading = false;
      mockNewProductsData = {
        products: [sampleNewProduct1],
      };
      mockBestSellingLoading = true;

      renderHomePage();

      expect(screen.getAllByTestId('mock-loading-spinner')).toHaveLength(1);
      expect(screen.getByTestId('product-card-new-prod-1')).toBeInTheDocument();
    });
  });
});
