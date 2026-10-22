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

vi.mock('@/lib/api', () => ({
  default: {},
  api: {},
}));
vi.mock('axios', () => ({
  default: {},
}));

describe('ProductCard', () => {
  const defaultProps = {
    id: 'prod-001',
    name: 'Xịt Thơm Phòng Thái Lan',
    slug: 'xit-thom-phong-thai-lan',
    images: ['/images/spray-thai.jpg'],
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

  describe('default rendering and product information', () => {
    it('renders default product info, authentic badge, and default rating/sales when omitted', () => {
      renderProductCard();

      expect(screen.getByText('Xịt Thơm Phòng Thái Lan')).toBeInTheDocument();
      expect(screen.getByText('Chính Hãng Thái Lan')).toBeInTheDocument();
      expect(screen.getByText('4.9')).toBeInTheDocument();
      expect(screen.getByText('Đã bán 120+')).toBeInTheDocument();
      expect(screen.getByText(/150\.000/)).toBeInTheDocument();
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
      expect(document.querySelector('.line-through')).not.toBeInTheDocument();
    });

    it('renders image with getImageUrl and links pointing to product slug', () => {
      renderProductCard();

      const image = screen.getByRole('img', {
        name: 'Xịt Thơm Phòng Thái Lan',
      });
      expect(image).toHaveAttribute(
        'src',
        getImageUrl('/images/spray-thai.jpg', { width: 500 }),
      );
      expect(image).toHaveAttribute('alt', 'Xịt Thơm Phòng Thái Lan');

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(2);
      links.forEach((link) => {
        expect(link).toHaveAttribute('href', '/p/xit-thom-phong-thai-lan');
      });
    });
  });

  describe('pricing and discount calculations', () => {
    it('renders discount percentage and strikethrough price when salePrice is less than price', () => {
      renderProductCard({ price: 200000, salePrice: 150000 });

      expect(screen.getByText('-25%')).toBeInTheDocument();
      expect(screen.getByText(/150\.000/)).toBeInTheDocument();
      expect(screen.getByText(/200\.000/)).toBeInTheDocument();
    });

    it('clamps discount percentage to minimum 1% when discount rounds to 0', () => {
      renderProductCard({ price: 100000, salePrice: 99999 });

      expect(screen.getByText('-1%')).toBeInTheDocument();
      expect(screen.getByText(/99\.999/)).toBeInTheDocument();
      expect(screen.getByText(/100\.000/)).toBeInTheDocument();
    });

    it('does not render discount badge or strikethrough price when salePrice equals or exceeds price', () => {
      renderProductCard({ price: 150000, salePrice: 150000 });

      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
      expect(screen.getByText(/150\.000/)).toBeInTheDocument();
      expect(document.querySelector('.line-through')).not.toBeInTheDocument();
    });

    it('does not render discount badge when salePrice is undefined', () => {
      renderProductCard({ price: 180000, salePrice: undefined });

      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
      expect(screen.getByText(/180\.000/)).toBeInTheDocument();
      expect(document.querySelector('.line-through')).not.toBeInTheDocument();
    });
  });

  describe('rating and review count variations', () => {
    it('renders specified rating and review count when both are positive', () => {
      renderProductCard({ rating: 4.8, reviewCount: 42 });

      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('42 đánh giá')).toBeInTheDocument();
      expect(screen.queryByText('4.9')).not.toBeInTheDocument();
      expect(screen.queryByText('Đã bán 120+')).not.toBeInTheDocument();
    });

    it('renders specific rating with default sales text when reviewCount is 0', () => {
      renderProductCard({ rating: 4.5, reviewCount: 0 });

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('Đã bán 120+')).toBeInTheDocument();
    });

    it('renders default rating with specific review count when rating is 0', () => {
      renderProductCard({ rating: 0, reviewCount: 18 });

      expect(screen.getByText('4.9')).toBeInTheDocument();
      expect(screen.getByText('18 đánh giá')).toBeInTheDocument();
    });
  });

  describe('wishlist button interaction', () => {
    it('renders unwishlisted styling and calls toggleItem with finalPrice on click', () => {
      mockIsInWishlist.mockReturnValue(false);
      renderProductCard({ price: 200000, salePrice: 160000 });

      const wishlistBtn = screen.getByRole('button', {
        name: 'Thêm vào yêu thích',
      });
      const heartIcon = wishlistBtn.querySelector('svg')!;

      expect(wishlistBtn).toHaveClass('text-slate-400');
      expect(heartIcon).not.toHaveClass('fill-rose-500');

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
      wishlistBtn.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(mockToggleItem).toHaveBeenCalledWith({
        productId: 'prod-001',
        name: 'Xịt Thơm Phòng Thái Lan',
        slug: 'xit-thom-phong-thai-lan',
        image: '/images/spray-thai.jpg',
        price: 160000,
      });
    });

    it('renders wishlisted styling and toggles with regular price when salePrice is absent', () => {
      mockIsInWishlist.mockReturnValue(true);
      renderProductCard({ price: 150000, salePrice: undefined });

      const wishlistBtn = screen.getByRole('button', {
        name: 'Thêm vào yêu thích',
      });
      const heartIcon = wishlistBtn.querySelector('svg')!;

      expect(wishlistBtn).toHaveClass('text-rose-600');
      expect(heartIcon).toHaveClass('fill-rose-600');

      fireEvent.click(wishlistBtn);

      expect(mockToggleItem).toHaveBeenCalledWith({
        productId: 'prod-001',
        name: 'Xịt Thơm Phòng Thái Lan',
        slug: 'xit-thom-phong-thai-lan',
        image: '/images/spray-thai.jpg',
        price: 150000,
      });
    });
  });

  describe('add to cart button', () => {
    it('calls onAddToCart handler when clicked', () => {
      const handleAddToCart = vi.fn();
      renderProductCard({ onAddToCart: handleAddToCart });

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      fireEvent.click(addToCartButton);

      expect(handleAddToCart).toHaveBeenCalledTimes(1);
    });

    it('safely handles click when onAddToCart is not provided', () => {
      renderProductCard({ onAddToCart: undefined });

      const addToCartButton = screen.getByRole('button', {
        name: /thêm vào giỏ/i,
      });
      expect(() => fireEvent.click(addToCartButton)).not.toThrow();
    });
  });

  describe('quick view modal interaction', () => {
    it('opens ProductQuickView on button click and closes it via onOpenChange', () => {
      renderProductCard();

      expect(
        screen.queryByTestId('product-quick-view'),
      ).not.toBeInTheDocument();

      const quickViewBtn = screen.getByRole('button', { name: /xem nhanh/i });
      fireEvent.click(quickViewBtn);

      expect(screen.getByTestId('product-quick-view')).toBeInTheDocument();
      expect(
        screen.getByText('QuickView: xit-thom-phong-thai-lan'),
      ).toBeInTheDocument();
      expect(screen.getByText('Open: true')).toBeInTheDocument();

      const closeBtn = screen.getByTestId('close-quick-view');
      fireEvent.click(closeBtn);

      expect(
        screen.queryByTestId('product-quick-view'),
      ).not.toBeInTheDocument();
    });
  });

  describe('debounced hover prefetch', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('triggers product prefetch after 200ms debounce on mouse enter', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      fireEvent.mouseEnter(card);
      expect(mockPrefetchProduct).not.toHaveBeenCalled();

      vi.advanceTimersByTime(199);
      expect(mockPrefetchProduct).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockPrefetchProduct).toHaveBeenCalledWith(
        'xit-thom-phong-thai-lan',
      );
      expect(mockPrefetchProduct).toHaveBeenCalledTimes(1);
    });

    it('cancels pending prefetch when mouse leaves before 200ms debounce completes', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(150);

      fireEvent.mouseLeave(card);
      vi.advanceTimersByTime(250);

      expect(mockPrefetchProduct).not.toHaveBeenCalled();
    });

    it('resets prefetch debounce when mouse re-enters before 200ms completes', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(120);

      fireEvent.mouseEnter(card);
      vi.advanceTimersByTime(150);
      expect(mockPrefetchProduct).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockPrefetchProduct).toHaveBeenCalledWith(
        'xit-thom-phong-thai-lan',
      );
      expect(mockPrefetchProduct).toHaveBeenCalledTimes(1);
    });

    it('safely handles mouse leave when no prefetch timeout is active', () => {
      const { container } = renderProductCard();
      const card = container.querySelector('.group')!;

      expect(() => fireEvent.mouseLeave(card)).not.toThrow();
      expect(mockPrefetchProduct).not.toHaveBeenCalled();
    });
  });
});
