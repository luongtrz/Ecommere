import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WishlistPage } from './WishlistPage';
import { useWishlist } from '../hooks/useWishlist';
import { getImageUrl } from '@/lib/utils';

vi.mock('@/lib/seo', () => ({
  SEO: vi.fn(({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  )),
}));

vi.mock('../hooks/useWishlist', () => ({
  useWishlist: vi.fn(),
}));

describe('WishlistPage', () => {
  const mockRemoveItem = vi.fn();

  const mockItem1 = {
    productId: 'prod-001',
    name: 'Xịt Thơm Phòng Hoa Sen',
    slug: 'xit-thom-phong-hoa-sen',
    image: '/images/spray-lotus.jpg',
    price: 150000,
  };

  const mockItem2 = {
    productId: 'prod-002',
    name: 'Xịt Khoáng Tinh Dầu Sả Chanh',
    slug: 'xit-khoang-tinh-dau-sa-chanh',
    image: '/images/lemongrass.jpg',
    price: 220000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderWishlistPage = () =>
    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>,
    );

  describe('Empty wishlist state', () => {
    beforeEach(() => {
      vi.mocked(useWishlist).mockReturnValue({
        items: [],
        addItem: vi.fn(),
        removeItem: mockRemoveItem,
        isInWishlist: vi.fn().mockReturnValue(false),
        toggleItem: vi.fn(),
        clearWishlist: vi.fn(),
      });
    });

    it('renders header with 0 items count and SEO title', () => {
      renderWishlistPage();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Danh sách yêu thích (0)',
        }),
      ).toBeInTheDocument();

      const seo = screen.getByTestId('seo-title');
      expect(seo).toBeInTheDocument();
      expect(seo).toHaveAttribute('data-title', 'Danh sách yêu thích');
    });

    it('renders empty state UI with title, description, and link to catalog', () => {
      renderWishlistPage();

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Danh sách trống',
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByText('Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.'),
      ).toBeInTheDocument();

      const exploreLink = screen.getByRole('link', {
        name: 'Khám phá sản phẩm ngay',
      });
      expect(exploreLink).toBeInTheDocument();
      expect(exploreLink).toHaveAttribute('href', '/catalog');
    });

    it('does not render any product cards when empty', () => {
      renderWishlistPage();

      expect(screen.queryByText('Xem chi tiết')).not.toBeInTheDocument();
    });
  });

  describe('Populated wishlist state', () => {
    beforeEach(() => {
      vi.mocked(useWishlist).mockReturnValue({
        items: [mockItem1, mockItem2],
        addItem: vi.fn(),
        removeItem: mockRemoveItem,
        isInWishlist: vi.fn().mockReturnValue(true),
        toggleItem: vi.fn(),
        clearWishlist: vi.fn(),
      });
    });

    it('renders header with total number of items', () => {
      renderWishlistPage();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Danh sách yêu thích (2)',
        }),
      ).toBeInTheDocument();

      expect(screen.queryByText('Danh sách trống')).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          'Bạn chưa lưu sản phẩm nào vào danh sách yêu thích.',
        ),
      ).not.toBeInTheDocument();
    });

    it('renders each product card with image, title, price, and detail link', () => {
      renderWishlistPage();

      // Product 1
      expect(screen.getByText(mockItem1.name)).toBeInTheDocument();
      expect(screen.getByText(/150\.000/)).toBeInTheDocument();

      const img1 = screen.getByRole('img', { name: mockItem1.name });
      expect(img1).toHaveAttribute('src', getImageUrl(mockItem1.image));
      expect(img1).toHaveAttribute('alt', mockItem1.name);

      // Product 2
      expect(screen.getByText(mockItem2.name)).toBeInTheDocument();
      expect(screen.getByText(/220\.000/)).toBeInTheDocument();

      const img2 = screen.getByRole('img', { name: mockItem2.name });
      expect(img2).toHaveAttribute('src', getImageUrl(mockItem2.image));
      expect(img2).toHaveAttribute('alt', mockItem2.name);

      // Detail links for each product
      const detailButtons = screen.getAllByRole('link', {
        name: /xem chi tiết/i,
      });
      expect(detailButtons).toHaveLength(2);
      expect(detailButtons[0]).toHaveAttribute('href', `/p/${mockItem1.slug}`);
      expect(detailButtons[1]).toHaveAttribute('href', `/p/${mockItem2.slug}`);
    });

    it('calls removeItem with exact productId and prevents default event when remove button is clicked', () => {
      const { container } = renderWishlistPage();

      const removeButtons = container.querySelectorAll(
        'button.absolute.top-2.right-2',
      );
      expect(removeButtons).toHaveLength(2);

      const firstRemoveBtn = removeButtons[0];
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');

      firstRemoveBtn.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
      expect(mockRemoveItem).toHaveBeenCalledWith(mockItem1.productId);
      expect(mockRemoveItem).toHaveBeenCalledTimes(1);
    });

    it('calls removeItem for the second product when its remove button is clicked via fireEvent', () => {
      const { container } = renderWishlistPage();

      const removeButtons = container.querySelectorAll(
        'button.absolute.top-2.right-2',
      );
      const secondRemoveBtn = removeButtons[1];

      fireEvent.click(secondRemoveBtn);

      expect(mockRemoveItem).toHaveBeenCalledWith(mockItem2.productId);
      expect(mockRemoveItem).toHaveBeenCalledTimes(1);
    });

    it('interacts with remove button using userEvent', async () => {
      const user = userEvent.setup();
      const { container } = renderWishlistPage();

      const removeButtons = container.querySelectorAll(
        'button.absolute.top-2.right-2',
      );
      await user.click(removeButtons[0]);

      expect(mockRemoveItem).toHaveBeenCalledWith(mockItem1.productId);
    });
  });

  describe('Single item wishlist state', () => {
    it('renders header with single item count (1)', () => {
      vi.mocked(useWishlist).mockReturnValue({
        items: [mockItem1],
        addItem: vi.fn(),
        removeItem: mockRemoveItem,
        isInWishlist: vi.fn().mockReturnValue(true),
        toggleItem: vi.fn(),
        clearWishlist: vi.fn(),
      });

      renderWishlistPage();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Danh sách yêu thích (1)',
        }),
      ).toBeInTheDocument();
      expect(screen.getByText(mockItem1.name)).toBeInTheDocument();
      expect(screen.queryByText(mockItem2.name)).not.toBeInTheDocument();
    });
  });
});
