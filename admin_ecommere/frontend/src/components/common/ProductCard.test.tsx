import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { getImageUrl } from '@/lib/utils';
import { formatDiscount } from '@/lib/formatters';

describe('ProductCard', () => {
  const defaultProps = {
    id: 'prod-123',
    name: 'Máy Khuếch Tán Tinh Dầu',
    slug: 'may-khuech-tan-tinh-dau',
    images: ['/images/diffuser.jpg'],
    price: 350000,
  };

  const renderProductCard = (props = {}) =>
    render(
      <MemoryRouter>
        <ProductCard {...defaultProps} {...props} />
      </MemoryRouter>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information with default rating, review count and no discount', () => {
    renderProductCard();

    expect(screen.getByText('Máy Khuếch Tán Tinh Dầu')).toBeInTheDocument();
    expect(screen.getByText('(0)')).toBeInTheDocument();
    expect(screen.getByText(/350\.000/)).toBeInTheDocument();

    // Discount badge and original strikethrough price should not be displayed
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it('renders image with getImageUrl source and product links pointing to /p/:slug', () => {
    renderProductCard();

    const image = screen.getByRole('img', { name: 'Máy Khuếch Tán Tinh Dầu' });
    expect(image).toHaveAttribute('src', getImageUrl('/images/diffuser.jpg'));
    expect(image).toHaveAttribute('alt', 'Máy Khuếch Tán Tinh Dầu');

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/p/may-khuech-tan-tinh-dau');
    });
  });

  it('renders fallback image when images array is empty', () => {
    renderProductCard({ images: [] });

    const image = screen.getByRole('img', { name: 'Máy Khuếch Tán Tinh Dầu' });
    expect(image).toHaveAttribute('src', getImageUrl(undefined));
  });

  it('renders discount badge and strikethrough price when salePrice is less than price', () => {
    renderProductCard({ price: 400000, salePrice: 300000 });

    expect(screen.getByText(/300\.000/)).toBeInTheDocument();
    const strikethroughPrice = screen.getByText(/400\.000/);
    expect(strikethroughPrice).toBeInTheDocument();
    expect(strikethroughPrice).toHaveClass('line-through');

    const discountBadge = screen.getByText(formatDiscount(400000, 300000));
    expect(discountBadge).toBeInTheDocument();
    expect(discountBadge).toHaveTextContent('-25%');
  });

  it('does not render discount badge or strikethrough price when salePrice is equal to price', () => {
    renderProductCard({ price: 300000, salePrice: 300000 });

    expect(screen.getByText(/300\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it('does not render discount badge or strikethrough price when salePrice is greater than price', () => {
    renderProductCard({ price: 300000, salePrice: 350000 });

    expect(screen.getByText(/350\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it('does not render discount badge or strikethrough price when salePrice is undefined', () => {
    renderProductCard({ price: 250000, salePrice: undefined });

    expect(screen.getByText(/250\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
  });

  it('renders custom rating and review count', () => {
    renderProductCard({ rating: 4.5, reviewCount: 88 });

    expect(screen.getByText('(88)')).toBeInTheDocument();
  });

  it('calls onAddToCart handler when "Thêm vào giỏ" button is clicked', () => {
    const handleAddToCart = vi.fn();
    renderProductCard({ onAddToCart: handleAddToCart });

    const addToCartButton = screen.getByRole('button', {
      name: /thêm vào giỏ/i,
    });
    expect(addToCartButton).toBeInTheDocument();

    fireEvent.click(addToCartButton);
    expect(handleAddToCart).toHaveBeenCalledTimes(1);
  });

  it('does not throw an error when clicking "Thêm vào giỏ" button without onAddToCart callback', () => {
    renderProductCard({ onAddToCart: undefined });

    const addToCartButton = screen.getByRole('button', {
      name: /thêm vào giỏ/i,
    });
    expect(() => fireEvent.click(addToCartButton)).not.toThrow();
  });
});
