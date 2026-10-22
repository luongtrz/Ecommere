import React from 'react';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductDetailPage } from './ProductDetailPage';
import { formatDiscount } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { useCartStore } from '@/features/cart/store/cartStore';

// Mocks
const mockAddItem = vi.fn();
const mockUseProductDetail = vi.fn();

vi.mock('../hooks/useProductDetail', () => ({
  useProductDetail: (slug: string) => mockUseProductDetail(slug),
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

// Polyfills for Radix UI Select in jsdom
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
      stock: 5,
    },
    {
      id: 'var-2',
      scent: 'Chanh Sả',
      volumeMl: 500,
      price: 180000,
      salePrice: null,
      stock: 10,
    },
    {
      id: 'var-3',
      scent: 'Bạc Hà',
      volumeMl: 250,
      price: 130000,
      salePrice: 100000,
      stock: 0,
    },
  ],
  rating: 4.8,
  reviewCount: 25,
};

function renderComponent(
  initialRoute = '/p/chai-xit-phong-lavender',
  routePattern = '/p/:productSlug',
) {
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
          <Route path={routePattern} element={children} />
          <Route path="/catalog" element={<div>Danh mục sản phẩm</div>} />
          <Route path="/c/:categorySlug" element={<div>Trang danh mục</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(<ProductDetailPage />, { wrapper: Wrapper });
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.pointerEvents = 'auto';
    useCartStore.setState({ items: [] });
  });

  describe('Loading and Not Found states', () => {
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
      expect(
        screen.queryByText('Chai Xịt Phòng Lavender'),
      ).not.toBeInTheDocument();
    });

    it('renders not found message and back button when product is null', () => {
      mockUseProductDetail.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('🔍')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Không tìm thấy sản phẩm',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Sản phẩm bạn tìm kiếm có thể đã bị xóa hoặc không tồn tại.',
        ),
      ).toBeInTheDocument();

      const backLink = screen.getByRole('link', {
        name: 'Quay lại danh sách sản phẩm',
      });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/catalog');
    });

    it('passes productSlug route parameter to useProductDetail', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent('/p/thai-spray-green-tea');

      expect(mockUseProductDetail).toHaveBeenCalledWith('thai-spray-green-tea');
    });

    it('handles route without productSlug parameter', () => {
      mockUseProductDetail.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderComponent('/product', '/product');

      expect(mockUseProductDetail).toHaveBeenCalledWith(undefined);
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Không tìm thấy sản phẩm',
        }),
      ).toBeInTheDocument();
    });
  });

  describe('Product Detail Rendering and Structure', () => {
    it('renders SEO metadata with title, description, and primary image', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      const seo = screen.getByTestId('seo-meta');
      expect(seo).toHaveAttribute('data-title', mockProduct.name);
      expect(seo).toHaveAttribute('data-description', mockProduct.description);
      expect(seo).toHaveAttribute(
        'data-image',
        getImageUrl(mockProduct.images[0]),
      );
    });

    it('renders breadcrumbs and category navigation link', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByRole('link', { name: 'Sản phẩm' })).toHaveAttribute(
        'href',
        '/catalog',
      );
      const categoryLinks = screen.getAllByRole('link', {
        name: mockProduct.category.name,
      });
      expect(categoryLinks.length).toBeGreaterThanOrEqual(1);
      expect(categoryLinks[0]).toHaveAttribute(
        'href',
        `/c/${mockProduct.category.slug}`,
      );
      expect(
        screen.getAllByText(mockProduct.name).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('renders fallback when product has no category', () => {
      const productWithoutCategory = {
        ...mockProduct,
        category: undefined,
      };
      mockUseProductDetail.mockReturnValue({
        data: productWithoutCategory,
        isLoading: false,
      });

      const { container } = renderComponent();

      expect(
        screen.getByRole('heading', { level: 1, name: mockProduct.name }),
      ).toBeInTheDocument();
      // Back button link to category falls back to /c/undefined
      const categoryLinks = container.querySelectorAll(
        'a[href="/c/undefined"]',
      );
      expect(categoryLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('renders product name, description, rating, review count, and stock badge', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      expect(
        screen.getByRole('heading', { level: 1, name: mockProduct.name }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(/Hương thơm tự nhiên từ Thái Lan/i).length,
      ).toBe(2);
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('(25 đánh giá)')).toBeInTheDocument();
      expect(screen.getByText('5 còn lại')).toBeInTheDocument();
    });

    it('renders fallback rating and review count when they are missing or zero', () => {
      const productNoRating = {
        ...mockProduct,
        rating: 0,
        reviewCount: 0,
      };
      mockUseProductDetail.mockReturnValue({
        data: productNoRating,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('(0 đánh giá)')).toBeInTheDocument();
    });

    it('renders trust badges and commitment section', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('Cam kết của chúng tôi')).toBeInTheDocument();
      expect(screen.getByText('Giao hàng tận nơi')).toBeInTheDocument();
      expect(
        screen.getByText('Miễn phí giao hàng toàn quốc'),
      ).toBeInTheDocument();
      expect(screen.getByText('Bảo hành chính hãng')).toBeInTheDocument();
      expect(screen.getByText('Đảm bảo chất lượng 100%')).toBeInTheDocument();
      expect(screen.getByText('Đổi trả 7 ngày')).toBeInTheDocument();
      expect(
        screen.getByText('Hoàn tiền nếu không hài lòng'),
      ).toBeInTheDocument();
    });

    it('renders action buttons for wishlist and share', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      const favButton = screen.getByRole('button', { name: /Yêu thích/i });
      const shareButton = screen.getByRole('button', { name: /Chia sẻ/i });
      expect(favButton).toBeInTheDocument();
      expect(shareButton).toBeInTheDocument();

      fireEvent.click(favButton);
      fireEvent.click(shareButton);
    });

    it('renders detailed specifications section', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      expect(
        screen.getByText('Thông tin chi tiết sản phẩm'),
      ).toBeInTheDocument();
      expect(screen.getByText('Thông số kỹ thuật:')).toBeInTheDocument();
      expect(screen.getByText('Dung tích:')).toBeInTheDocument();
      expect(screen.getByText('300ml')).toBeInTheDocument();
      expect(screen.getByText('Mùi hương:')).toBeInTheDocument();
      expect(screen.getByText('Hoa Oải Hương')).toBeInTheDocument();
      expect(screen.getByText('Tồn kho:')).toBeInTheDocument();
      expect(screen.getByText('5 sản phẩm')).toBeInTheDocument();
      expect(screen.getByText('Danh mục:')).toBeInTheDocument();
      const specContainer = screen.getByText('Danh mục:').closest('div');
      expect(specContainer).toHaveTextContent(mockProduct.category.name);
    });
  });

  describe('Pricing and Discount Handling', () => {
    it('renders discounted price, line-through original price, and discount percentage badge', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      // finalPrice: 120,000 VND
      expect(screen.getByText(/120[.,]000/)).toBeInTheDocument();
      // originalPrice: 150,000 VND
      expect(screen.getByText(/150[.,]000/)).toBeInTheDocument();
      // discount badge: -20%
      expect(
        screen.getByText(formatDiscount(150000, 120000)),
      ).toBeInTheDocument();
    });

    it('renders regular price without discount badge when salePrice is null', () => {
      const productNoDiscount = {
        ...mockProduct,
        variants: [
          {
            id: 'var-regular',
            scent: 'Chanh Sả',
            volumeMl: 500,
            price: 180000,
            salePrice: null,
            stock: 10,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: productNoDiscount,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText(/180[.,]000/)).toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });

    it('renders regular price without discount badge when salePrice equals original price', () => {
      const productEqualPrice = {
        ...mockProduct,
        variants: [
          {
            id: 'var-equal',
            scent: 'Bạc Hà',
            volumeMl: 250,
            price: 100000,
            salePrice: 100000,
            stock: 5,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: productEqualPrice,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText(/100[.,]000/)).toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });

    it('handles empty variants gracefully with 0 price and disabled button', () => {
      const productNoVariants = {
        ...mockProduct,
        variants: [],
      };
      mockUseProductDetail.mockReturnValue({
        data: productNoVariants,
        isLoading: false,
      });

      const { container } = renderComponent();

      const priceSpan = container.querySelector('.text-5xl');
      expect(priceSpan).toHaveTextContent(/0/);
      expect(screen.getByText('0 còn lại')).toBeInTheDocument();
      expect(screen.getByText('Còn 0 sản phẩm')).toBeInTheDocument();

      const addToCartButton = screen.getByRole('button', {
        name: /Thêm vào giỏ hàng/i,
      });
      expect(addToCartButton).toBeDisabled();

      // Trigger click to test handleAddToCart early return (!selectedVariant)
      fireEvent.click(addToCartButton);
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });

  describe('Image Gallery Interactions', () => {
    it('renders primary image and thumbnails with active styling', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      const mainImg = screen.getByAltText(mockProduct.name);
      expect(mainImg).toHaveAttribute(
        'src',
        getImageUrl(mockProduct.images[0]),
      );

      const firstThumb = screen
        .getByAltText(`${mockProduct.name} 1`)
        .closest('button');
      const secondThumb = screen
        .getByAltText(`${mockProduct.name} 2`)
        .closest('button');

      expect(firstThumb).toHaveClass('border-blue-500 shadow-md');
      expect(secondThumb).toHaveClass('border-gray-200');
    });

    it('switches displayed image when clicking different thumbnails', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      const mainImg = screen.getByAltText(mockProduct.name);
      const firstThumb = screen
        .getByAltText(`${mockProduct.name} 1`)
        .closest('button')!;
      const secondThumb = screen
        .getByAltText(`${mockProduct.name} 2`)
        .closest('button')!;
      const thirdThumb = screen
        .getByAltText(`${mockProduct.name} 3`)
        .closest('button')!;

      // Click second thumbnail
      fireEvent.click(secondThumb);
      expect(mainImg).toHaveAttribute(
        'src',
        getImageUrl(mockProduct.images[1]),
      );
      expect(secondThumb).toHaveClass('border-blue-500 shadow-md');
      expect(firstThumb).toHaveClass('border-gray-200');

      // Click third thumbnail
      fireEvent.click(thirdThumb);
      expect(mainImg).toHaveAttribute(
        'src',
        getImageUrl(mockProduct.images[2]),
      );
      expect(thirdThumb).toHaveClass('border-blue-500 shadow-md');
      expect(secondThumb).toHaveClass('border-gray-200');
    });
  });

  describe('Variant Selection', () => {
    it('renders variant select options with scent, volume, and out of stock badges', async () => {
      const user = userEvent.setup();
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      const trigger = screen.getByLabelText('Biến thể sản phẩm:');
      expect(trigger).toBeInTheDocument();

      await user.click(trigger);

      expect(
        await screen.findByRole('option', {
          name: /Hoa Oải Hương - 300ml/i,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', {
          name: /Chanh Sả - 500ml/i,
        }),
      ).toBeInTheDocument();

      const outOfStockOption = screen.getByRole('option', {
        name: /Bạc Hà - 250ml.*Hết hàng/i,
      });
      expect(outOfStockOption).toBeInTheDocument();
      expect(outOfStockOption).toHaveAttribute('data-disabled');
    });

    it('updates selected variant, prices, stock, and specs when a new variant is selected', async () => {
      const user = userEvent.setup();
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      // Initially variant 1 is active
      expect(screen.getByText('Hoa Oải Hương')).toBeInTheDocument();
      expect(screen.getByText('300ml')).toBeInTheDocument();
      expect(screen.getByText('5 còn lại')).toBeInTheDocument();
      expect(screen.getByText('Còn 5 sản phẩm')).toBeInTheDocument();

      // Open select dropdown and choose variant 2 (Chanh Sả - 500ml, price: 180000, salePrice: null, stock: 10)
      const trigger = screen.getByLabelText('Biến thể sản phẩm:');
      await user.click(trigger);

      const option2 = await screen.findByRole('option', {
        name: /Chanh Sả - 500ml/i,
      });
      await user.click(option2);

      // Price updates to 180,000 VND and discount badge disappears
      expect(screen.getByText(/180[.,]000/)).toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();

      // Stock updates to 10
      expect(screen.getByText('10 còn lại')).toBeInTheDocument();
      expect(screen.getByText('Còn 10 sản phẩm')).toBeInTheDocument();

      // Specs update
      expect(screen.getByText('500ml')).toBeInTheDocument();
      expect(screen.getByText('Chanh Sả')).toBeInTheDocument();
      expect(screen.getByText('10 sản phẩm')).toBeInTheDocument();

      // Adding to cart now uses variant 2's price (180,000) and details
      const addToCartButton = screen.getByRole('button', {
        name: /Thêm vào giỏ hàng/i,
      });
      await user.click(addToCartButton);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: mockProduct.id,
        variantId: 'var-2',
        name: mockProduct.name,
        image: mockProduct.images[0],
        price: 180000,
        quantity: 1,
        scent: 'Chanh Sả',
        volumeMl: 500,
      });
    });
  });

  describe('Quantity Stepper and Cart Actions', () => {
    it('handles quantity increment, decrement, min limit 1, and max stock limit', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct, // variant 1 has stock: 5
        isLoading: false,
      });

      renderComponent();

      const minusBtn = document.getElementById(
        'product-quantity',
      ) as HTMLButtonElement;
      const plusBtn = minusBtn.parentElement?.querySelectorAll(
        'button',
      )[1] as HTMLButtonElement;

      // Initial quantity: 1, Minus button disabled
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(minusBtn).toBeDisabled();

      // Clicking Minus at 1 does nothing
      fireEvent.click(minusBtn);
      expect(screen.getByText('1')).toBeInTheDocument();

      // Increment to 2
      fireEvent.click(plusBtn);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(minusBtn).not.toBeDisabled();

      // Increment to 3, 4, 5 (max stock is 5)
      fireEvent.click(plusBtn);
      expect(screen.getByText('3')).toBeInTheDocument();
      fireEvent.click(plusBtn);
      expect(screen.getByText('4')).toBeInTheDocument();
      fireEvent.click(plusBtn);
      expect(screen.getByText('5')).toBeInTheDocument();

      // At stock limit 5, Plus button is disabled
      expect(plusBtn).toBeDisabled();
      fireEvent.click(plusBtn);
      expect(screen.getByText('5')).toBeInTheDocument();

      // Decrement back down to 1
      fireEvent.click(minusBtn);
      expect(screen.getByText('4')).toBeInTheDocument();
      fireEvent.click(minusBtn);
      expect(screen.getByText('3')).toBeInTheDocument();
      fireEvent.click(minusBtn);
      expect(screen.getByText('2')).toBeInTheDocument();
      fireEvent.click(minusBtn);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(minusBtn).toBeDisabled();
    });

    it('adds item to cart with sale price and resets quantity back to 1', () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
      });

      renderComponent();

      // Increment quantity to 3
      const minusBtn = document.getElementById(
        'product-quantity',
      ) as HTMLButtonElement;
      const plusBtn = minusBtn.parentElement?.querySelectorAll(
        'button',
      )[1] as HTMLButtonElement;
      fireEvent.click(plusBtn);
      fireEvent.click(plusBtn);
      expect(screen.getByText('3')).toBeInTheDocument();

      // Click Add to Cart
      const addToCartButton = screen.getByRole('button', {
        name: /Thêm vào giỏ hàng/i,
      });
      fireEvent.click(addToCartButton);

      expect(mockAddItem).toHaveBeenCalledTimes(1);
      expect(mockAddItem).toHaveBeenCalledWith({
        productId: mockProduct.id,
        variantId: 'var-1',
        name: mockProduct.name,
        image: mockProduct.images[0],
        price: 120000, // salePrice
        quantity: 3,
        scent: 'Hoa Oải Hương',
        volumeMl: 300,
      });

      // Quantity reset back to 1
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('adds item to cart with regular price when sale price is null', () => {
      const productNoSalePrice = {
        ...mockProduct,
        variants: [
          {
            id: 'var-nosale',
            scent: 'Chanh Sả',
            volumeMl: 500,
            price: 180000,
            salePrice: null,
            stock: 10,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: productNoSalePrice,
        isLoading: false,
      });

      renderComponent();

      const addToCartButton = screen.getByRole('button', {
        name: /Thêm vào giỏ hàng/i,
      });
      fireEvent.click(addToCartButton);

      expect(mockAddItem).toHaveBeenCalledWith({
        productId: mockProduct.id,
        variantId: 'var-nosale',
        name: mockProduct.name,
        image: mockProduct.images[0],
        price: 180000, // price since salePrice is null
        quantity: 1,
        scent: 'Chanh Sả',
        volumeMl: 500,
      });
    });

    it('disables add-to-cart button and shows "Hết hàng" when variant stock is 0', () => {
      const outOfStockProduct = {
        ...mockProduct,
        variants: [
          {
            id: 'var-zero-stock',
            scent: 'Bạc Hà',
            volumeMl: 250,
            price: 130000,
            salePrice: 100000,
            stock: 0,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: outOfStockProduct,
        isLoading: false,
      });

      renderComponent();

      expect(screen.getByText('0 còn lại')).toBeInTheDocument();
      expect(screen.getByText('Còn 0 sản phẩm')).toBeInTheDocument();

      const outOfStockButton = screen.getByRole('button', {
        name: /Hết hàng/i,
      });
      expect(outOfStockButton).toBeInTheDocument();
      expect(outOfStockButton).toBeDisabled();

      // Plus button is also disabled because quantity (1) >= stock (0)
      const minusBtn = document.getElementById(
        'product-quantity',
      ) as HTMLButtonElement;
      const plusBtn = minusBtn.parentElement?.querySelectorAll(
        'button',
      )[1] as HTMLButtonElement;
      expect(plusBtn).toBeDisabled();

      // Clicking out of stock button does not add item
      fireEvent.click(outOfStockButton);
      expect(mockAddItem).not.toHaveBeenCalled();
    });
  });
});
