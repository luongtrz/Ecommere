import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { getImageUrl } from '@/lib/utils';

const mockToggleItem = vi.fn();
const mockIsInWishlist = vi.fn();

vi.mock('@/features/catalog/hooks/useWishlist', () => ({
  useWishlist: () => ({
    toggleItem: mockToggleItem,
    isInWishlist: mockIsInWishlist,
  }),
}));

const mockPrefetchProduct = vi.fn();

vi.mock('@/features/catalog/hooks/useProductDetail', () => ({
  usePrefetchProduct: () => mockPrefetchProduct,
}));

vi.mock('@/features/catalog/components/ProductQuickView', () => ({
  ProductQuickView: vi.fn(
    ({
      slug,
      open,
      onOpenChange,
    }: {
      slug: string;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }) => (
      <div data-testid="product-quick-view">
        <span>QuickView: {slug}</span>
        <span>Open: {open ? 'true' : 'false'}</span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          data-testid="close-quick-view"
        >
          Đóng
        </button>
      </div>
    ),
  ),
}));

describe('ProductCard', () => {
  const defaultProps = {
    id: 'prod-001',
    name: 'Xịt Thơm Phòng Cao Cấp',
    slug: 'xit-thom-phong-cao-cap',
    images: ['/images/spray1.jpg'],
    price: 150000,
  };

  const renderProductCard = (props = {}) =>
    render(
      <MemoryRouter>
        <ProductCard {...defaultProps} {...props} />
      </MemoryRouter>,
    );

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockIsInWishlist.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders default product card info, fragrance badge, and curated badge without discount', () => {
    renderProductCard();

    expect(screen.getByText('Xịt Thơm Phòng Cao Cấp')).toBeInTheDocument();
    expect(screen.getByText('Được chọn lọc')).toBeInTheDocument();
    expect(screen.getByText('Mùi hương nổi bật')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Phù hợp cho nhịp sống hằng ngày và không gian gọn gàng.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/Giảm/)).not.toBeInTheDocument();
  });

  it('renders image with getImageUrl source and product links pointing to slug', () => {
    renderProductCard();

    const image = screen.getByRole('img', { name: 'Xịt Thơm Phòng Cao Cấp' });
    expect(image).toHaveAttribute(
      'src',
      getImageUrl('/images/spray1.jpg', { width: 500 }),
    );
    expect(image).toHaveAttribute('alt', 'Xịt Thơm Phòng Cao Cấp');

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/p/xit-thom-phong-cao-cap');
    });
  });

  it('renders discount percentage and strikethrough price when salePrice is less than price', () => {
    renderProductCard({ price: 200000, salePrice: 150000 });

    expect(screen.getByText('Giảm 25%')).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    expect(screen.getByText(/200\.000/)).toBeInTheDocument();
    expect(screen.queryByText('Được chọn lọc')).not.toBeInTheDocument();
  });

  it('renders minimum 1% discount badge when discount calculation rounds to 0', () => {
    renderProductCard({ price: 100000, salePrice: 99999 });

    expect(screen.getByText('Giảm 1%')).toBeInTheDocument();
  });

  it('renders "Được chọn lọc" badge when salePrice is equal to or greater than price', () => {
    renderProductCard({ price: 150000, salePrice: 150000 });

    expect(screen.getByText('Được chọn lọc')).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/Giảm/)).not.toBeInTheDocument();
  });

  it('renders rating and review count when reviewCount > 0', () => {
    renderProductCard({ rating: 4.8, reviewCount: 32 });

    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('32 đánh giá')).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Phù hợp cho nhịp sống hằng ngày và không gian gọn gàng.',
      ),
    ).not.toBeInTheDocument();
  });

  describe('wishlist button', () => {
    it('handles toggle when product is not currently in wishlist', () => {
      mockIsInWishlist.mockReturnValue(false);
      const { container } = renderProductCard({
        price: 200000,
        salePrice: 160000,
      });

      const wishlistButton = container.querySelector(
        'button.absolute',
      ) as HTMLButtonElement;
      const heartIcon = container.querySelector('svg.lucide-heart');

      expect(wishlistButton).toHaveClass('text-slate-400');
      expect(heartIcon).not.toHaveClass('fill-rose-600');

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      wishlistButton.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockToggleItem).toHaveBeenCalledWith({
        productId: 'prod-001',
        name: 'Xịt Thơm Phòng Cao Cấp',
        slug: 'xit-thom-phong-cao-cap',
        image: '/images/spray1.jpg',
        price: 160000,
      });
    });

    it('renders wishlisted styling and toggles with regular price when salePrice is undefined', () => {
      mockIsInWishlist.mockReturnValue(true);
      const { container } = renderProductCard({
        price: 150000,
        salePrice: undefined,
      });

      const wishlistButton = container.querySelector(
        'button.absolute',
      ) as HTMLButtonElement;
      const heartIcon = container.querySelector('svg.lucide-heart');

      expect(wishlistButton).toHaveClass('text-rose-600');
      expect(heartIcon).toHaveClass('fill-rose-600');

      fireEvent.click(wishlistButton);

      expect(mockToggleItem).toHaveBeenCalledWith({
        productId: 'prod-001',
        name: 'Xịt Thơm Phòng Cao Cấp',
        slug: 'xit-thom-phong-cao-cap',
        image: '/images/spray1.jpg',
        price: 150000,
      });
    });
  });

  describe('add to cart button', () => {
    it('calls onAddToCart when clicked and variants are undefined', () => {
      const onAddToCart = vi.fn();
      renderProductCard({ onAddToCart });

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      expect(addToCartButton).not.toBeDisabled();

      fireEvent.click(addToCartButton);
      expect(onAddToCart).toHaveBeenCalledTimes(1);
    });

    it('calls onAddToCart when in-stock variant exists', () => {
      const onAddToCart = vi.fn();
      renderProductCard({
        variants: [{ stock: 12 }],
        onAddToCart,
      });

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      expect(addToCartButton).not.toBeDisabled();

      fireEvent.click(addToCartButton);
      expect(onAddToCart).toHaveBeenCalledTimes(1);
    });

    it('disables add to cart button when selectedVariant has 0 stock', () => {
      const onAddToCart = vi.fn();
      renderProductCard({
        variants: [{ stock: 0 }],
        onAddToCart,
      });

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      expect(addToCartButton).toBeDisabled();

      fireEvent.click(addToCartButton);
      expect(onAddToCart).not.toHaveBeenCalled();
    });

    it('disables add to cart button when variants array is empty', () => {
      renderProductCard({ variants: [] });

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      expect(addToCartButton).toBeDisabled();
    });
  });

  describe('quick view modal', () => {
    it('opens ProductQuickView on button click and closes it via onOpenChange', () => {
      renderProductCard();

      expect(
        screen.queryByTestId('product-quick-view'),
      ).not.toBeInTheDocument();

      const quickViewBtn = screen.getByRole('button', { name: /xem nhanh/i });
      fireEvent.click(quickViewBtn);

      expect(screen.getByTestId('product-quick-view')).toBeInTheDocument();
      expect(
        screen.getByText('QuickView: xit-thom-phong-cao-cap'),
      ).toBeInTheDocument();
      expect(screen.getByText('Open: true')).toBeInTheDocument();

      const closeBtn = screen.getByTestId('close-quick-view');
      fireEvent.click(closeBtn);

      expect(
        screen.queryByTestId('product-quick-view'),
      ).not.toBeInTheDocument();
    });
  });

  describe('prefetch on mouse enter and mouse leave', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('prefetches product after 200ms debounce on mouse enter', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      fireEvent.mouseEnter(card);
      expect(mockPrefetchProduct).not.toHaveBeenCalled();

      vi.advanceTimersByTime(199);
      expect(mockPrefetchProduct).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockPrefetchProduct).toHaveBeenCalledWith(
        'xit-thom-phong-cao-cap',
      );
      expect(mockPrefetchProduct).toHaveBeenCalledTimes(1);
    });

    it('cancels prefetch when mouse leaves before 200ms timeout', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(120);

      fireEvent.mouseLeave(card);
      vi.advanceTimersByTime(250);

      expect(mockPrefetchProduct).not.toHaveBeenCalled();
    });

    it('resets prefetch debounce when mouse re-enters card before 200ms', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(100);

      // Re-enter before 200ms
      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(150);
      expect(mockPrefetchProduct).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockPrefetchProduct).toHaveBeenCalledWith(
        'xit-thom-phong-cao-cap',
      );
      expect(mockPrefetchProduct).toHaveBeenCalledTimes(1);
    });

    it('handles mouse leave when no prefetch timeout is pending', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      // Directly mouse leave without enter
      fireEvent.mouseLeave(card);
      expect(mockPrefetchProduct).not.toHaveBeenCalled();

      // Mouse enter, wait for debounce to finish, then mouse leave
      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(200);
      expect(mockPrefetchProduct).toHaveBeenCalledTimes(1);

      fireEvent.mouseLeave(card);
    });
  });
});
