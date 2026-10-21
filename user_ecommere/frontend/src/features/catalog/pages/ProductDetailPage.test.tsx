import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductDetailPage } from './ProductDetailPage';
import { formatDiscount } from '@/lib/formatters';
import { useCartStore } from '@/features/cart/store/cartStore';

// Mocks
const mockAddItem = vi.fn();
const mockOpenCart = vi.fn();
const mockToggleItem = vi.fn();
const mockIsInWishlist = vi.fn();
const mockNavigate = vi.fn();
const mockUseProductDetail = vi.fn();

let currentSlug = 'thai-spray-classic';

vi.mock('../hooks/useProductDetail', () => ({
  useProductDetail: (slug: string) => mockUseProductDetail(slug),
  usePrefetchProduct: () => vi.fn(),
}));

vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart,
    items: [],
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    totalPrice: 0,
    totalItems: 0,
    isOpen: false,
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
    replaceItems: vi.fn(),
  }),
}));

vi.mock('@/features/catalog/hooks/useWishlist', () => ({
  useWishlist: () => ({
    toggleItem: mockToggleItem,
    isInWishlist: mockIsInWishlist,
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    clearWishlist: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ productSlug: currentSlug }),
  };
});

vi.mock('@/lib/seo', () => ({
  SEO: ({
    title,
    description,
    image,
  }: {
    title?: string;
    description?: string;
    image?: string;
  }) => (
    <div
      data-testid="seo-meta"
      data-title={title}
      data-description={description}
      data-image={image}
    />
  ),
}));

vi.mock('@/features/catalog/api/products.api', () => ({
  productsApi: {
    getAll: vi.fn(),
    getBySlug: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
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

vi.mock('@/components/ui/tabs', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const TabsContext = React.createContext<{
    value: string;
    onValueChange: (v: string) => void;
  }>({
    value: 'description',
    onValueChange: () => {},
  });

  const Tabs = ({
    defaultValue = 'description',
    value,
    onValueChange,
    children,
    ...props
  }: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (v: string) => void;
    children?: React.ReactNode;
    [key: string]: any;
  }) => {
    const [val, setVal] = React.useState(defaultValue || value);
    const activeValue = value !== undefined ? value : val;
    const handleChange = (v: string) => {
      setVal(v);
      onValueChange?.(v);
    };

    return (
      <TabsContext.Provider
        value={{ value: activeValue, onValueChange: handleChange }}
      >
        <div data-testid="tabs" {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  };

  const TabsList = ({ children, ...props }: any) => (
    <div role="tablist" {...props}>
      {children}
    </div>
  );

  const TabsTrigger = ({ value, children, ...props }: any) => {
    const { value: activeValue, onValueChange } = React.useContext(TabsContext);
    const isSelected = activeValue === value;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isSelected}
        data-state={isSelected ? 'active' : 'inactive'}
        onClick={() => onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    );
  };

  const TabsContent = ({ value, children, ...props }: any) => {
    const { value: activeValue } = React.useContext(TabsContext);
    if (activeValue !== value) return null;
    return (
      <div role="tabpanel" data-state="active" {...props}>
        {children}
      </div>
    );
  };

  return { Tabs, TabsList, TabsTrigger, TabsContent };
});

const mockProduct = {
  id: 'prod-1',
  name: 'Chai Xịt Phòng Lavender',
  slug: 'chai-xit-phong-lavender',
  description:
    'Hương thơm tự nhiên từ Thái Lan giúp thư giãn không gian sống.\nKhử mùi và diệt khuẩn hiệu quả.',
  images: [
    'https://example.com/lavender-1.jpg',
    'https://example.com/lavender-2.jpg',
    'https://example.com/lavender-3.jpg',
  ],
  categoryId: 'cat-1',
  category: {
    id: 'cat-1',
    name: 'Xịt Phòng & Khử Mùi',
    slug: 'xit-phong-khu-mui',
  },
  variants: [
    {
      id: 'var-1',
      scent: 'Hoa Oải Hương',
      volumeMl: 300,
      price: 150000,
      salePrice: 120000,
      stock: 20,
      sku: 'LAV-300',
    },
    {
      id: 'var-2',
      scent: 'Chanh Sả',
      volumeMl: 500,
      price: 180000,
      salePrice: null,
      stock: 5,
      sku: 'LEM-500',
    },
    {
      id: 'var-3',
      scent: 'Bạc Hà',
      volumeMl: 250,
      price: 130000,
      salePrice: 100000,
      stock: 0,
      sku: 'MNT-250',
    },
    {
      id: 'var-4',
      scent: 'Không mùi',
      volumeMl: 0,
      price: 90000,
      salePrice: 90000,
      stock: 10,
      sku: 'NON-0',
    },
  ],
  basePrice: 120000,
  rating: 4.8,
  reviewCount: 42,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function renderComponent(initialRoute = '/p/thai-spray-classic') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/p/:productSlug" element={children} />
          <Route path="/catalog" element={<div>Catalog Page</div>} />
          <Route path="/cart" element={<div>Cart Page</div>} />
          <Route path="/c/:categorySlug" element={<div>Category Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(<ProductDetailPage />, { wrapper: Wrapper });
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSlug = 'thai-spray-classic';
    mockIsInWishlist.mockReturnValue(false);
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('renders loading spinner when isLoading is true', () => {
    mockUseProductDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderComponent();

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(
      screen.queryByText('Không tìm thấy sản phẩm'),
    ).not.toBeInTheDocument();
  });

  it('renders not found state when product is null or undefined', () => {
    mockUseProductDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Không tìm thấy sản phẩm',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sản phẩm bạn đang tìm kiếm có thể đã hết hàng hoặc ngừng phân phối.',
      ),
    ).toBeInTheDocument();

    const backButton = screen.getByRole('link', {
      name: 'Quay lại danh mục sản phẩm',
    });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/catalog');
  });

  it('renders full product detail with discount, breadcrumb, SEO and trust badges', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    // SEO
    const seo = screen.getByTestId('seo-meta');
    expect(seo).toHaveAttribute(
      'data-title',
      `${mockProduct.name} - Thai Spray Chính Hãng Thái Lan`,
    );
    expect(seo).toHaveAttribute('data-description', mockProduct.description);

    // Breadcrumb and Back link
    expect(
      screen.getByRole('link', {
        name: `Về danh mục ${mockProduct.category.name}`,
      }),
    ).toHaveAttribute('href', `/c/${mockProduct.category.slug}`);
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument();
    expect(
      screen.getAllByText(mockProduct.category.name).length,
    ).toBeGreaterThanOrEqual(1);

    // Main Showcase Image & floating badges
    const mainImg = screen.getByAltText(mockProduct.name);
    expect(mainImg).toBeInTheDocument();
    expect(
      screen.getByText(`1 / ${mockProduct.images.length}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatDiscount(150000, 120000)),
    ).toBeInTheDocument();
    expect(screen.getByText('Chính Hãng Thái Lan')).toBeInTheDocument();

    // Trust Micro-Row
    expect(screen.getByText('100% Nội Địa')).toBeInTheDocument();
    expect(screen.getByText('Mã vạch chuẩn Thái')).toBeInTheDocument();
    expect(screen.getByText('Chống Vỡ 3 Lớp')).toBeInTheDocument();
    expect(screen.getByText('Đóng gói an toàn')).toBeInTheDocument();
    expect(screen.getByText('Giao Toàn Quốc')).toBeInTheDocument();
    expect(screen.getByText('Freeship từ 250k')).toBeInTheDocument();

    // Title, rating, sold text
    expect(
      screen.getByRole('heading', { level: 1, name: mockProduct.name }),
    ).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(
      screen.getByText(`(${mockProduct.reviewCount} đánh giá)`),
    ).toBeInTheDocument();
    expect(screen.getByText('🔥 Đã bán hơn 1.200 chai')).toBeInTheDocument();

    // Pricing box
    expect(screen.getByText(/120[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/150[.,]000/)).toBeInTheDocument();
    expect(screen.getByText(/Tiết kiệm.*30[.,]000/)).toBeInTheDocument();
    expect(screen.getByText('Còn hàng trong kho')).toBeInTheDocument();
    expect(
      screen.getByText('Đồng kiểm tra hàng trước khi thanh toán COD'),
    ).toBeInTheDocument();

    // 4 Guarantee Badges Card
    expect(screen.getByText('Cam kết chính hãng')).toBeInTheDocument();
    expect(screen.getByText('Đổi trả 7 ngày')).toBeInTheDocument();
    expect(screen.getByText('Đồng kiểm tra hàng')).toBeInTheDocument();
    expect(screen.getByText('Giao nhanh toàn quốc')).toBeInTheDocument();
  });

  it('switches main showcase image when thumbnail button is clicked', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    expect(
      screen.getByText(`1 / ${mockProduct.images.length}`),
    ).toBeInTheDocument();

    const secondThumb = screen.getByRole('button', {
      name: `${mockProduct.name} 2`,
    });
    fireEvent.click(secondThumb);

    expect(
      screen.getByText(`2 / ${mockProduct.images.length}`),
    ).toBeInTheDocument();
    expect(secondThumb).toHaveClass('border-teal-600');

    const thirdThumb = screen.getByRole('button', {
      name: `${mockProduct.name} 3`,
    });
    fireEvent.click(thirdThumb);

    expect(
      screen.getByText(`3 / ${mockProduct.images.length}`),
    ).toBeInTheDocument();
    expect(thirdThumb).toHaveClass('border-teal-600');
  });

  it('handles variant selection, pricing changes, and disabled out-of-stock variants', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    // Default variant is var-1 (Hoa Oải Hương, 300ml, 120000)
    const var1Btn = screen.getByRole('button', { name: /Hoa Oải Hương/i });
    expect(var1Btn).toHaveClass('border-teal-600');
    expect(screen.getByText('(300ml)')).toBeInTheDocument();
    expect(screen.getByText('(Có sẵn 20 sản phẩm)')).toBeInTheDocument();

    // Out of stock variant var-3 is disabled
    const var3Btn = screen.getByRole('button', { name: /Bạc Hà/i });
    expect(var3Btn).toBeDisabled();
    expect(var3Btn).toHaveClass('cursor-not-allowed');
    expect(screen.getByText('(Hết hàng)')).toBeInTheDocument();

    // Select var-2 (Chanh Sả, 500ml, price: 180000, salePrice: null)
    const var2Btn = screen.getByRole('button', { name: /Chanh Sả/i });
    fireEvent.click(var2Btn);

    expect(var2Btn).toHaveClass('border-teal-600');
    expect(screen.getByText(/180[.,]000/)).toBeInTheDocument();
    expect(screen.queryByText(/Tiết kiệm/i)).not.toBeInTheDocument();
    expect(screen.getByText('(Có sẵn 5 sản phẩm)')).toBeInTheDocument();

    // Select var-4 (Không mùi, volumeMl: 0, salePrice === price: 90000)
    const var4Btn = screen.getByRole('button', { name: /Không mùi/i });
    fireEvent.click(var4Btn);

    expect(var4Btn).toHaveClass('border-teal-600');
    expect(screen.getByText(/90[.,]000/)).toBeInTheDocument();
    // volumeMl is 0, so (0ml) shouldn't be rendered
    expect(screen.queryByText('(0ml)')).not.toBeInTheDocument();
    // salePrice === price, so hasDiscount is false
    expect(screen.queryByText(/Tiết kiệm/i)).not.toBeInTheDocument();
  });

  it('increments and decrements quantity stepper, respecting min 1 and max stock limits', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    const quantitySection = screen.getByText('Số lượng mua:').closest('div');
    const minusBtn = quantitySection?.querySelectorAll(
      'button',
    )[0] as HTMLButtonElement;
    const plusBtn = quantitySection?.querySelectorAll(
      'button',
    )[1] as HTMLButtonElement;

    // Initial quantity is 1. Minus button does not go below 1.
    expect(
      screen.getByText('1', { selector: 'span.w-12' }),
    ).toBeInTheDocument();
    fireEvent.click(minusBtn);
    expect(
      screen.getByText('1', { selector: 'span.w-12' }),
    ).toBeInTheDocument();

    // Plus button increments
    fireEvent.click(plusBtn);
    expect(
      screen.getByText('2', { selector: 'span.w-12' }),
    ).toBeInTheDocument();
    fireEvent.click(plusBtn);
    expect(
      screen.getByText('3', { selector: 'span.w-12' }),
    ).toBeInTheDocument();

    // Minus button decrements
    fireEvent.click(minusBtn);
    expect(
      screen.getByText('2', { selector: 'span.w-12' }),
    ).toBeInTheDocument();

    // Switch to var-2 which has stock 5
    fireEvent.click(screen.getByRole('button', { name: /Chanh Sả/i }));
    // Increment until stock 5
    fireEvent.click(plusBtn); // 3
    fireEvent.click(plusBtn); // 4
    fireEvent.click(plusBtn); // 5
    expect(
      screen.getByText('5', { selector: 'span.w-12' }),
    ).toBeInTheDocument();
    // Next click should be capped at stock 5
    fireEvent.click(plusBtn);
    expect(
      screen.getByText('5', { selector: 'span.w-12' }),
    ).toBeInTheDocument();
  });

  it('adds selected variant to cart with salePrice, opens cart, and resets quantity to 1', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    const quantitySection = screen.getByText('Số lượng mua:').closest('div');
    const plusBtn = quantitySection?.querySelectorAll(
      'button',
    )[1] as HTMLButtonElement;
    fireEvent.click(plusBtn); // quantity = 2

    const addToCartBtn = screen.getByRole('button', {
      name: /Thêm Vào Giỏ Hàng/i,
    });
    fireEvent.click(addToCartBtn);

    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith({
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Chai Xịt Phòng Lavender',
      image: 'https://example.com/lavender-1.jpg',
      price: 120000,
      quantity: 2,
      scent: 'Hoa Oải Hương',
      volumeMl: 300,
    });
    expect(mockOpenCart).toHaveBeenCalledTimes(1);
    // Quantity resets to 1 after adding to cart
    expect(
      screen.getByText('1', { selector: 'span.w-12' }),
    ).toBeInTheDocument();
  });

  it('adds selected variant to cart with regular price when salePrice is null', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    // Select var-2 where salePrice is null
    fireEvent.click(screen.getByRole('button', { name: /Chanh Sả/i }));

    const addToCartBtn = screen.getByRole('button', {
      name: /Thêm Vào Giỏ Hàng/i,
    });
    fireEvent.click(addToCartBtn);

    expect(mockAddItem).toHaveBeenCalledWith({
      productId: 'prod-1',
      variantId: 'var-2',
      name: 'Chai Xịt Phòng Lavender',
      image: 'https://example.com/lavender-1.jpg',
      price: 180000,
      quantity: 1,
      scent: 'Chanh Sả',
      volumeMl: 500,
    });
    expect(mockOpenCart).toHaveBeenCalledTimes(1);
  });

  it('calls addItem and navigates to /cart when Mua Ngay (Buy Now) is clicked', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    const buyNowBtn = screen.getByRole('button', { name: /Mua Ngay/i });
    fireEvent.click(buyNowBtn);

    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith({
      productId: 'prod-1',
      variantId: 'var-1',
      name: 'Chai Xịt Phòng Lavender',
      image: 'https://example.com/lavender-1.jpg',
      price: 120000,
      quantity: 1,
      scent: 'Hoa Oải Hương',
      volumeMl: 300,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
  });

  it('toggles wishlist when item is not in wishlist, and renders correctly when wishlisted', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });
    mockIsInWishlist.mockReturnValue(false);

    const { rerender } = renderComponent();

    const wishlistBtn = screen.getByRole('button', {
      name: 'Lưu vào yêu thích',
    });
    expect(wishlistBtn).toHaveClass('bg-white');

    fireEvent.click(wishlistBtn);

    expect(mockToggleItem).toHaveBeenCalledTimes(1);
    expect(mockToggleItem).toHaveBeenCalledWith({
      productId: 'prod-1',
      name: 'Chai Xịt Phòng Lavender',
      slug: 'chai-xit-phong-lavender',
      image: 'https://example.com/lavender-1.jpg',
      price: 120000,
    });

    // Re-render with isWishlisted = true
    mockIsInWishlist.mockReturnValue(true);
    rerender(<ProductDetailPage />);

    const wishlistedBtn = screen.getByRole('button', {
      name: 'Bỏ khỏi yêu thích',
    });
    expect(wishlistedBtn).toHaveClass('bg-rose-50');
    fireEvent.click(wishlistedBtn);
    expect(mockToggleItem).toHaveBeenCalledTimes(2);
  });

  it('handles out of stock selected variant: disables action buttons with Tạm Hết Hàng label', () => {
    const productOOS = {
      ...mockProduct,
      variants: [
        {
          id: 'var-oos',
          scent: 'Bạc Hà Hết Hàng',
          volumeMl: 250,
          price: 130000,
          salePrice: null,
          stock: 0,
          sku: 'OOS-1',
        },
      ],
    };

    mockUseProductDetail.mockReturnValue({
      data: productOOS,
      isLoading: false,
    });

    renderComponent();

    const addToCartBtn = screen.getByRole('button', { name: /Tạm Hết Hàng/i });
    expect(addToCartBtn).toBeDisabled();

    const buyNowBtn = screen.getByRole('button', { name: /Mua Ngay/i });
    expect(buyNowBtn).toBeDisabled();

    // Clicking disabled button should not trigger actions
    fireEvent.click(addToCartBtn);
    expect(mockAddItem).not.toHaveBeenCalled();
    fireEvent.click(buyNowBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('switches between description tab and usage guide tab', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    renderComponent();

    // Description tab is active by default
    expect(screen.getByText('Chi tiết sản phẩm')).toBeInTheDocument();
    expect(
      screen.getByText(/Hương thơm tự nhiên từ Thái Lan/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Xuất xứ:')).toBeInTheDocument();
    expect(screen.getByText('Thương hiệu:')).toBeInTheDocument();
    expect(screen.getByText('Hạn sử dụng:')).toBeInTheDocument();

    // Switch to Guide tab
    const guideTab = screen.getByRole('tab', { name: /Hướng dẫn & An toàn/i });
    fireEvent.click(guideTab);

    expect(screen.getByText(/Hướng dẫn sử dụng/i)).toBeInTheDocument();
    expect(screen.getByText('Cách sử dụng hiệu quả:')).toBeInTheDocument();
    expect(screen.getByText('Lưu ý an toàn:')).toBeInTheDocument();
    expect(screen.getByText('Bảo quản:')).toBeInTheDocument();

    // Switch back to Description tab
    const descTab = screen.getByRole('tab', { name: /Mô tả sản phẩm/i });
    fireEvent.click(descTab);
    expect(screen.getByText('Chi tiết sản phẩm')).toBeInTheDocument();
  });

  it('renders default fallbacks when category, rating, reviewCount, and multiple images are omitted', () => {
    const productMinimal = {
      ...mockProduct,
      category: undefined,
      rating: undefined,
      reviewCount: undefined,
      images: ['https://example.com/single-only.jpg'],
    };

    mockUseProductDetail.mockReturnValue({
      data: productMinimal,
      isLoading: false,
    });

    renderComponent();

    // Rating falls back to 5.0 and reviewCount falls back to 38
    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('(38 đánh giá)')).toBeInTheDocument();

    // Breadcrumb falls back to "Danh mục"
    expect(screen.getByText('Danh mục')).toBeInTheDocument();

    // Single image means thumbnails grid (images.length > 1) is not rendered
    expect(
      screen.queryByRole('button', { name: `${productMinimal.name} 2` }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('handles product with empty variants gracefully', () => {
    const productNoVariants = {
      ...mockProduct,
      variants: [],
    };

    mockUseProductDetail.mockReturnValue({
      data: productNoVariants,
      isLoading: false,
    });

    renderComponent();

    // finalPrice and originalPrice fall back to 0
    expect(
      screen.getByText((content) => /^0\s*[₫đ]$/.test(content.trim())),
    ).toBeInTheDocument();

    // Buttons are disabled
    const addToCartBtn = screen.getByRole('button', {
      name: /Thêm Vào Giỏ Hàng/i,
    });
    expect(addToCartBtn).toBeDisabled();
    const buyNowBtn = screen.getByRole('button', { name: /Mua Ngay/i });
    expect(buyNowBtn).toBeDisabled();

    // Stock fallback shows (Có sẵn 50 sản phẩm)
    expect(screen.getByText('(Có sẵn 50 sản phẩm)')).toBeInTheDocument();

    // Wishlist price falls back to 0
    const wishlistBtn = screen.getByRole('button', {
      name: 'Lưu vào yêu thích',
    });
    fireEvent.click(wishlistBtn);
    expect(mockToggleItem).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-1',
        price: 0,
      }),
    );
  });

  it('handles product with empty images array', () => {
    const productEmptyImages = {
      ...mockProduct,
      images: [],
    };

    mockUseProductDetail.mockReturnValue({
      data: productEmptyImages,
      isLoading: false,
    });

    renderComponent();

    // Counter uses images.length || 1
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
  });

  it('resets selectedVariantId, quantity, and selectedImage when productSlug changes in useEffect', () => {
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });

    currentSlug = 'slug-first';
    const { rerender } = renderComponent('/p/slug-first');

    // 1. Change variant to var-2 (Chanh Sả)
    const var2Btn = screen.getByRole('button', { name: /Chanh Sả/i });
    fireEvent.click(var2Btn);
    expect(var2Btn).toHaveClass('border-teal-600');

    // 2. Change quantity to 3
    const quantitySection = screen.getByText('Số lượng mua:').closest('div');
    const plusBtn = quantitySection?.querySelectorAll(
      'button',
    )[1] as HTMLButtonElement;
    fireEvent.click(plusBtn);
    fireEvent.click(plusBtn);
    expect(
      screen.getByText('3', { selector: 'span.w-12' }),
    ).toBeInTheDocument();

    // 3. Change image to 2nd thumbnail
    const secondThumb = screen.getByRole('button', {
      name: `${mockProduct.name} 2`,
    });
    fireEvent.click(secondThumb);
    expect(
      screen.getByText(`2 / ${mockProduct.images.length}`),
    ).toBeInTheDocument();

    // Now update slug and rerender
    currentSlug = 'slug-second';
    rerender(<ProductDetailPage />);

    // Quantity should be reset to 1
    expect(
      screen.getByText('1', { selector: 'span.w-12' }),
    ).toBeInTheDocument();
    // Image counter should be reset to 1 / 3
    expect(
      screen.getByText(`1 / ${mockProduct.images.length}`),
    ).toBeInTheDocument();
    // Variant should be reset to default (first variant: Hoa Oải Hương)
    const var1Btn = screen.getByRole('button', { name: /Hoa Oải Hương/i });
    expect(var1Btn).toHaveClass('border-teal-600');
  });
});
