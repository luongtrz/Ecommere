import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  beforeAll,
  afterEach,
} from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductQuickView } from './ProductQuickView';
import { getImageUrl } from '@/lib/utils';

const mockUseProductDetail = vi.fn();
vi.mock('../hooks/useProductDetail', () => ({
  useProductDetail: (slug: string) => mockUseProductDetail(slug),
  usePrefetchProduct: () => vi.fn(),
}));

vi.mock('@/features/catalog/hooks/useProductDetail', () => ({
  useProductDetail: (slug: string) => mockUseProductDetail(slug),
  usePrefetchProduct: () => vi.fn(),
}));

const mockAddToCart = vi.fn();
vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    addItem: mockAddToCart,
  }),
}));

const mockToggleWishlist = vi.fn();
const mockIsInWishlist = vi.fn();
vi.mock('@/features/catalog/hooks/useWishlist', () => ({
  useWishlist: () => ({
    toggleItem: mockToggleWishlist,
    isInWishlist: mockIsInWishlist,
  }),
}));

vi.mock('@/lib/api', () => ({
  default: {},
  api: {},
}));
vi.mock('axios', () => ({
  default: {},
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

describe('ProductQuickView', () => {
  const mockProduct = {
    id: 'prod-001',
    name: 'Xịt Thơm Phòng Tự Nhiên',
    slug: 'xit-thom-phong-tu-nhien',
    description: 'Chiết xuất từ hoa cỏ thiên nhiên thơm ngát và dễ chịu.',
    images: [
      '/images/spray-1.jpg',
      '/images/spray-2.jpg',
      '/images/spray-3.jpg',
      '/images/spray-4.jpg',
      '/images/spray-5.jpg',
    ],
    category: {
      id: 'cat-01',
      name: 'Xịt Phòng Tinh Dầu',
      slug: 'xit-phong-tinh-dau',
    },
    variants: [
      {
        id: 'var-01',
        scent: 'Hoa Lài',
        volumeMl: 100,
        price: 200000,
        salePrice: 150000,
        stock: 5,
      },
      {
        id: 'var-02',
        scent: 'Cam Ngọt',
        volumeMl: 150,
        price: 250000,
        salePrice: 220000,
        stock: 8,
      },
      {
        id: 'var-03',
        scent: 'Sả Chanh',
        volumeMl: 200,
        price: 300000,
        salePrice: 300000,
        stock: 0,
      },
    ],
  };

  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

  const renderProductQuickView = (
    props: {
      slug?: string;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    } = {},
  ) => {
    const queryClient = createTestQueryClient();
    const defaultProps = {
      slug: 'xit-thom-phong-tu-nhien',
      open: true,
      onOpenChange: vi.fn(),
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProductQuickView {...defaultProps} {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    document.body.style.pointerEvents = 'auto';
    mockIsInWishlist.mockReturnValue(false);
    mockUseProductDetail.mockReturnValue({
      data: mockProduct,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('dialog visibility and loading states', () => {
    it('does not render dialog content when open is false', () => {
      renderProductQuickView({ open: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Xịt Thơm Phòng Tự Nhiên'),
      ).not.toBeInTheDocument();
    });

    it('renders loading spinner and fallback dialog title when isLoading is true', () => {
      mockUseProductDetail.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderProductQuickView();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Xem nhanh sản phẩm')).toBeInTheDocument();
      expect(
        screen.getByText('Xem nhanh thông tin sản phẩm'),
      ).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      expect(
        screen.queryByText('Xịt Thơm Phòng Tự Nhiên'),
      ).not.toBeInTheDocument();
    });

    it('renders loading spinner when product is null/undefined even if isLoading is false', () => {
      mockUseProductDetail.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderProductQuickView();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.getByText('Xem nhanh sản phẩm')).toBeInTheDocument();
    });
  });

  describe('product details rendering', () => {
    it('renders product information, category, title, description, and discounted price badge', () => {
      renderProductQuickView();

      expect(screen.getByText('Xịt Phòng Tinh Dầu')).toBeInTheDocument();
      expect(
        screen.getByText('Xịt Thơm Phòng Tự Nhiên', {
          selector: 'h2.text-xl',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole('heading', { name: 'Xịt Thơm Phòng Tự Nhiên' }),
      ).toHaveLength(2);
      expect(
        screen.getByText(
          'Chiết xuất từ hoa cỏ thiên nhiên thơm ngát và dễ chịu.',
        ),
      ).toBeInTheDocument();

      // Final price formatted
      expect(screen.getByText(/150\.000/)).toBeInTheDocument();
      // Original price strike-through formatted
      expect(screen.getByText(/200\.000/)).toBeInTheDocument();
      // Discount badge
      expect(screen.getByText('-25%')).toBeInTheDocument();

      // Dialog accessibility titles
      expect(
        screen.getByText('Xem nhanh thông tin sản phẩm'),
      ).toBeInTheDocument();
    });

    it('renders without discount badge or strikethrough price when salePrice is absent or equal to price', () => {
      const productNoDiscount = {
        ...mockProduct,
        variants: [
          {
            id: 'var-nodisc',
            scent: 'Bạc Hà',
            volumeMl: 100,
            price: 180000,
            salePrice: undefined,
            stock: 10,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: productNoDiscount,
        isLoading: false,
      });

      renderProductQuickView();

      expect(screen.getByText(/180\.000/)).toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
      expect(document.querySelector('.line-through')).not.toBeInTheDocument();
    });

    it('renders safely when product category is undefined', () => {
      const productNoCategory = {
        ...mockProduct,
        category: undefined,
      };
      mockUseProductDetail.mockReturnValue({
        data: productNoCategory,
        isLoading: false,
      });

      renderProductQuickView();

      expect(
        screen.getByText('Xịt Thơm Phòng Tự Nhiên', {
          selector: 'h2.text-xl',
        }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Xịt Phòng Tinh Dầu')).not.toBeInTheDocument();
    });
  });

  describe('images and gallery interactions', () => {
    it('renders main image and up to 4 thumbnail images, switching main image on click', () => {
      renderProductQuickView();

      const mainImage = screen.getByAltText('Xịt Thơm Phòng Tự Nhiên');
      expect(mainImage).toHaveAttribute(
        'src',
        getImageUrl('/images/spray-1.jpg'),
      );

      // Slices to max 4 thumbnails
      const thumb1 = screen.getByAltText('Xịt Thơm Phòng Tự Nhiên 1');
      const thumb2 = screen.getByAltText('Xịt Thơm Phòng Tự Nhiên 2');
      const thumb3 = screen.getByAltText('Xịt Thơm Phòng Tự Nhiên 3');
      const thumb4 = screen.getByAltText('Xịt Thơm Phòng Tự Nhiên 4');
      expect(thumb1).toBeInTheDocument();
      expect(thumb2).toBeInTheDocument();
      expect(thumb3).toBeInTheDocument();
      expect(thumb4).toBeInTheDocument();
      expect(
        screen.queryByAltText('Xịt Thơm Phòng Tự Nhiên 5'),
      ).not.toBeInTheDocument();

      const thumbBtn1 = thumb1.closest('button')!;
      const thumbBtn2 = thumb2.closest('button')!;
      expect(thumbBtn1).toHaveClass('border-teal-600');
      expect(thumbBtn2).not.toHaveClass('border-teal-600');

      // Click second thumbnail
      fireEvent.click(thumbBtn2);

      expect(thumbBtn2).toHaveClass('border-teal-600');
      expect(thumbBtn1).not.toHaveClass('border-teal-600');
      expect(mainImage).toHaveAttribute(
        'src',
        getImageUrl('/images/spray-2.jpg'),
      );

      // Click third thumbnail
      const thumbBtn3 = thumb3.closest('button')!;
      fireEvent.click(thumbBtn3);
      expect(thumbBtn3).toHaveClass('border-teal-600');
      expect(mainImage).toHaveAttribute(
        'src',
        getImageUrl('/images/spray-3.jpg'),
      );
    });
  });

  describe('variant selection and availability', () => {
    it('allows changing variant, which updates price and resets quantity to 1', async () => {
      const user = userEvent.setup();
      renderProductQuickView();

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Variant 3 is out of stock with "(Hết hàng)" text and is disabled
      const outOfStockOption = await screen.findByRole('option', {
        name: /Sả Chanh/i,
      });
      expect(outOfStockOption).toHaveAttribute('data-disabled');
      expect(screen.getByText('(Hết hàng)')).toBeInTheDocument();

      // Select variant 2
      const option2 = screen.getByRole('option', { name: /Cam Ngọt/i });
      await user.click(option2);

      // Variant 2 prices
      expect(screen.getByText(/220\.000/)).toBeInTheDocument();
      expect(screen.getByText(/250\.000/)).toBeInTheDocument();
      expect(screen.getByText('-12%')).toBeInTheDocument();
    });

    it('disables add to cart button and displays "Tạm hết hàng" when default variant stock is 0', () => {
      const outOfStockProduct = {
        ...mockProduct,
        variants: [
          {
            id: 'var-oos',
            scent: 'Trầm Hương',
            volumeMl: 100,
            price: 300000,
            salePrice: 300000,
            stock: 0,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: outOfStockProduct,
        isLoading: false,
      });

      renderProductQuickView();

      const addToCartBtn = screen.getByRole('button', {
        name: /Tạm hết hàng/i,
      });
      expect(addToCartBtn).toBeDisabled();

      fireEvent.click(addToCartBtn);
      expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('disables add to cart button when variants list is empty', () => {
      const noVariantsProduct = {
        ...mockProduct,
        variants: [],
      };
      mockUseProductDetail.mockReturnValue({
        data: noVariantsProduct,
        isLoading: false,
      });

      renderProductQuickView();

      const addToCartBtn = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      expect(addToCartBtn).toBeDisabled();
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });
  });

  describe('quantity controls', () => {
    it('increments quantity up to variant stock and decrements down to 1', () => {
      renderProductQuickView();

      const quantityWrapper = screen.getByRole('group', { name: 'Số lượng:' });
      const [decreaseBtn, increaseBtn] =
        quantityWrapper.querySelectorAll('button');

      // Default quantity is 1
      expect(screen.getByText('1')).toBeInTheDocument();

      // Decrement below 1 is prevented
      fireEvent.click(decreaseBtn);
      expect(screen.getByText('1')).toBeInTheDocument();

      // Increment up to stock = 5
      fireEvent.click(increaseBtn); // 2
      expect(screen.getByText('2')).toBeInTheDocument();
      fireEvent.click(increaseBtn); // 3
      expect(screen.getByText('3')).toBeInTheDocument();
      fireEvent.click(increaseBtn); // 4
      expect(screen.getByText('4')).toBeInTheDocument();
      fireEvent.click(increaseBtn); // 5
      expect(screen.getByText('5')).toBeInTheDocument();

      // Increment beyond stock is clamped
      fireEvent.click(increaseBtn);
      expect(screen.getByText('5')).toBeInTheDocument();

      // Decrement works
      fireEvent.click(decreaseBtn);
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('uses fallback max quantity 99 when variant stock is not provided', () => {
      const undefinedStockProduct = {
        ...mockProduct,
        variants: [
          {
            id: 'var-nostock',
            scent: 'Vỏ Quế',
            volumeMl: 100,
            price: 100000,
            stock: undefined as unknown as number,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: undefinedStockProduct,
        isLoading: false,
      });

      renderProductQuickView();

      const quantityWrapper = screen.getByRole('group', { name: 'Số lượng:' });
      const [, increaseBtn] = quantityWrapper.querySelectorAll('button');

      fireEvent.click(increaseBtn);
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('add to cart action', () => {
    it('calls addItem with selected variant details and closes dialog', () => {
      const handleOpenChange = vi.fn();
      renderProductQuickView({ onOpenChange: handleOpenChange });

      const quantityWrapper = screen.getByRole('group', { name: 'Số lượng:' });
      const [, increaseBtn] = quantityWrapper.querySelectorAll('button');
      fireEvent.click(increaseBtn); // quantity = 2

      const addToCartBtn = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addToCartBtn);

      expect(mockAddToCart).toHaveBeenCalledWith({
        productId: 'prod-001',
        variantId: 'var-01',
        name: 'Xịt Thơm Phòng Tự Nhiên',
        image: '/images/spray-1.jpg',
        price: 150000,
        quantity: 2,
        scent: 'Hoa Lài',
        volumeMl: 100,
      });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls addItem with regular price when selected variant has no salePrice', () => {
      const regularPriceProduct = {
        ...mockProduct,
        variants: [
          {
            id: 'var-regular',
            scent: 'Oải Hương',
            volumeMl: 100,
            price: 190000,
            salePrice: undefined,
            stock: 3,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: regularPriceProduct,
        isLoading: false,
      });

      const handleOpenChange = vi.fn();
      renderProductQuickView({ onOpenChange: handleOpenChange });

      const addToCartBtn = screen.getByRole('button', {
        name: /Thêm vào giỏ/i,
      });
      fireEvent.click(addToCartBtn);

      expect(mockAddToCart).toHaveBeenCalledWith({
        productId: 'prod-001',
        variantId: 'var-regular',
        name: 'Xịt Thơm Phòng Tự Nhiên',
        image: '/images/spray-1.jpg',
        price: 190000,
        quantity: 1,
        scent: 'Oải Hương',
        volumeMl: 100,
      });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('wishlist button action', () => {
    it('handles unwishlisted state and calls toggleItem with salePrice when clicked', () => {
      mockIsInWishlist.mockReturnValue(false);
      renderProductQuickView();

      const heartIcon = document.querySelector('svg.lucide-heart')!;
      const wishlistBtn = heartIcon.closest('button')!;

      expect(wishlistBtn).toHaveClass('text-slate-400');
      expect(heartIcon).not.toHaveClass('fill-rose-600');

      fireEvent.click(wishlistBtn);

      expect(mockToggleWishlist).toHaveBeenCalledWith({
        productId: 'prod-001',
        name: 'Xịt Thơm Phòng Tự Nhiên',
        slug: 'xit-thom-phong-tu-nhien',
        image: '/images/spray-1.jpg',
        price: 150000,
      });
    });

    it('renders wishlisted state with fill-rose-500 styling', () => {
      mockIsInWishlist.mockReturnValue(true);
      renderProductQuickView();

      const heartIcon = document.querySelector('svg.lucide-heart')!;
      const wishlistBtn = heartIcon.closest('button')!;

      expect(wishlistBtn).toHaveClass('text-rose-600');
      expect(heartIcon).toHaveClass('fill-rose-600');
    });

    it('calls toggleItem with regular price when salePrice is absent', () => {
      const noSaleProduct = {
        ...mockProduct,
        variants: [
          {
            id: 'var-nosale',
            scent: 'Vani',
            volumeMl: 100,
            price: 210000,
            salePrice: undefined,
            stock: 4,
          },
        ],
      };
      mockUseProductDetail.mockReturnValue({
        data: noSaleProduct,
        isLoading: false,
      });

      renderProductQuickView();
      const wishlistBtn = document
        .querySelector('svg.lucide-heart')!
        .closest('button')!;

      fireEvent.click(wishlistBtn);

      expect(mockToggleWishlist).toHaveBeenCalledWith({
        productId: 'prod-001',
        name: 'Xịt Thơm Phòng Tự Nhiên',
        slug: 'xit-thom-phong-tu-nhien',
        image: '/images/spray-1.jpg',
        price: 210000,
      });
    });

    it('calls toggleItem with price 0 when product has empty variants array', () => {
      const emptyVariantsProduct = {
        ...mockProduct,
        variants: [],
      };
      mockUseProductDetail.mockReturnValue({
        data: emptyVariantsProduct,
        isLoading: false,
      });

      renderProductQuickView();
      const wishlistBtn = document
        .querySelector('svg.lucide-heart')!
        .closest('button')!;

      fireEvent.click(wishlistBtn);

      expect(mockToggleWishlist).toHaveBeenCalledWith({
        productId: 'prod-001',
        name: 'Xịt Thơm Phòng Tự Nhiên',
        slug: 'xit-thom-phong-tu-nhien',
        image: '/images/spray-1.jpg',
        price: 0,
      });
    });
  });

  describe('links and modal close', () => {
    it('renders link to product details page and closes modal when clicked', () => {
      const handleOpenChange = vi.fn();
      renderProductQuickView({ onOpenChange: handleOpenChange });

      const detailLink = screen.getByRole('link', {
        name: 'Xem chi tiết sản phẩm',
      });
      expect(detailLink).toHaveAttribute('href', '/p/xit-thom-phong-tu-nhien');

      fireEvent.click(detailLink);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('closes modal when the built-in dialog close button is clicked', () => {
      const handleOpenChange = vi.fn();
      renderProductQuickView({ onOpenChange: handleOpenChange });

      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
