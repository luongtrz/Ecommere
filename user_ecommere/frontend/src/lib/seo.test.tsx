import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SEO } from './seo';

const mockHelmet = vi.fn();

vi.mock('react-helmet-async', () => ({
  Helmet: (props: { children: React.ReactNode }) => {
    mockHelmet(props);
    return <div data-testid="mock-helmet">{props.children}</div>;
  },
  HelmetProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

function getMeta(container: HTMLElement, selector: string): string | null {
  return container.querySelector(selector)?.getAttribute('content') ?? null;
}

describe('SEO component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default SEO metadata tags when no props are provided', () => {
    const { container } = render(<SEO />);

    expect(screen.getByTestId('mock-helmet')).toBeInTheDocument();
    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );

    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích. Giao hàng nhanh, giá tốt nhất thị trường.',
    );
    expect(getMeta(container, 'meta[name="keywords"]')).toBe(
      'chai xịt, thái lan, nước hoa, khử mùi, spray thailand',
    );

    // Open Graph
    expect(getMeta(container, 'meta[property="og:title"]')).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
    expect(getMeta(container, 'meta[property="og:description"]')).toBe(
      'Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích. Giao hàng nhanh, giá tốt nhất thị trường.',
    );
    expect(getMeta(container, 'meta[property="og:image"]')).toBe(
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=630&fit=crop',
    );
    expect(getMeta(container, 'meta[property="og:url"]')).toBe(
      'https://thaisprayshop.com',
    );
    expect(getMeta(container, 'meta[property="og:type"]')).toBe('website');

    // Twitter Card
    expect(getMeta(container, 'meta[name="twitter:card"]')).toBe(
      'summary_large_image',
    );
    expect(getMeta(container, 'meta[name="twitter:title"]')).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
    expect(getMeta(container, 'meta[name="twitter:description"]')).toBe(
      'Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích. Giao hàng nhanh, giá tốt nhất thị trường.',
    );
    expect(getMeta(container, 'meta[name="twitter:image"]')).toBe(
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=630&fit=crop',
    );
  });

  it('renders custom SEO tags with title formatted with suffix when all props are provided', () => {
    const { container } = render(
      <SEO
        title="Xịt Thơm Phòng Ngủ"
        description="Mang lại cảm giác thư thái với hương hoa tự nhiên nhập khẩu Thái Lan"
        keywords="xịt phòng ngủ, lavender, thư giãn"
        image="https://example.com/custom-bedroom-spray.jpg"
        url="https://thaisprayshop.com/san-pham/xit-phong-ngu"
      />,
    );

    const expectedTitle = 'Xịt Thơm Phòng Ngủ | Thai Spray Shop';
    expect(container.querySelector('title')?.textContent).toBe(expectedTitle);

    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Mang lại cảm giác thư thái với hương hoa tự nhiên nhập khẩu Thái Lan',
    );
    expect(getMeta(container, 'meta[name="keywords"]')).toBe(
      'xịt phòng ngủ, lavender, thư giãn',
    );

    // Open Graph
    expect(getMeta(container, 'meta[property="og:title"]')).toBe(expectedTitle);
    expect(getMeta(container, 'meta[property="og:description"]')).toBe(
      'Mang lại cảm giác thư thái với hương hoa tự nhiên nhập khẩu Thái Lan',
    );
    expect(getMeta(container, 'meta[property="og:image"]')).toBe(
      'https://example.com/custom-bedroom-spray.jpg',
    );
    expect(getMeta(container, 'meta[property="og:url"]')).toBe(
      'https://thaisprayshop.com/san-pham/xit-phong-ngu',
    );
    expect(getMeta(container, 'meta[property="og:type"]')).toBe('website');

    // Twitter Card
    expect(getMeta(container, 'meta[name="twitter:card"]')).toBe(
      'summary_large_image',
    );
    expect(getMeta(container, 'meta[name="twitter:title"]')).toBe(
      expectedTitle,
    );
    expect(getMeta(container, 'meta[name="twitter:description"]')).toBe(
      'Mang lại cảm giác thư thái với hương hoa tự nhiên nhập khẩu Thái Lan',
    );
    expect(getMeta(container, 'meta[name="twitter:image"]')).toBe(
      'https://example.com/custom-bedroom-spray.jpg',
    );
  });

  it('renders custom title with suffix while falling back to default values for other props', () => {
    const { container } = render(<SEO title="Giỏ Hàng" />);

    expect(container.querySelector('title')?.textContent).toBe(
      'Giỏ Hàng | Thai Spray Shop',
    );
    expect(getMeta(container, 'meta[property="og:title"]')).toBe(
      'Giỏ Hàng | Thai Spray Shop',
    );
    expect(getMeta(container, 'meta[name="twitter:title"]')).toBe(
      'Giỏ Hàng | Thai Spray Shop',
    );

    // Defaults for others
    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích. Giao hàng nhanh, giá tốt nhất thị trường.',
    );
    expect(getMeta(container, 'meta[name="keywords"]')).toBe(
      'chai xịt, thái lan, nước hoa, khử mùi, spray thailand',
    );
    expect(getMeta(container, 'meta[property="og:image"]')).toBe(
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=630&fit=crop',
    );
    expect(getMeta(container, 'meta[property="og:url"]')).toBe(
      'https://thaisprayshop.com',
    );
  });

  it('renders custom description while falling back to default title and others', () => {
    const { container } = render(
      <SEO description="Khuyến mãi cực sốc giảm đến 50% hôm nay" />,
    );

    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Khuyến mãi cực sốc giảm đến 50% hôm nay',
    );
    expect(getMeta(container, 'meta[property="og:description"]')).toBe(
      'Khuyến mãi cực sốc giảm đến 50% hôm nay',
    );
    expect(getMeta(container, 'meta[name="twitter:description"]')).toBe(
      'Khuyến mãi cực sốc giảm đến 50% hôm nay',
    );
  });

  it('renders custom keywords while falling back to other defaults', () => {
    const { container } = render(
      <SEO keywords="chai xịt chống muỗi, xịt sả chanh" />,
    );

    expect(getMeta(container, 'meta[name="keywords"]')).toBe(
      'chai xịt chống muỗi, xịt sả chanh',
    );
    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
  });

  it('renders custom image while falling back to other defaults', () => {
    const { container } = render(
      <SEO image="https://cdn.example.com/banners/summer-sale.webp" />,
    );

    expect(getMeta(container, 'meta[property="og:image"]')).toBe(
      'https://cdn.example.com/banners/summer-sale.webp',
    );
    expect(getMeta(container, 'meta[name="twitter:image"]')).toBe(
      'https://cdn.example.com/banners/summer-sale.webp',
    );
    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
  });

  it('renders custom url while falling back to other defaults', () => {
    const { container } = render(
      <SEO url="https://thaisprayshop.com/danh-muc/khuyen-mai" />,
    );

    expect(getMeta(container, 'meta[property="og:url"]')).toBe(
      'https://thaisprayshop.com/danh-muc/khuyen-mai',
    );
    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
  });

  it('falls back to default values when empty strings are passed for all props', () => {
    const { container } = render(
      <SEO title="" description="" keywords="" image="" url="" />,
    );

    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích. Giao hàng nhanh, giá tốt nhất thị trường.',
    );
    expect(getMeta(container, 'meta[name="keywords"]')).toBe(
      'chai xịt, thái lan, nước hoa, khử mùi, spray thailand',
    );
    expect(getMeta(container, 'meta[property="og:image"]')).toBe(
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=630&fit=crop',
    );
    expect(getMeta(container, 'meta[property="og:url"]')).toBe(
      'https://thaisprayshop.com',
    );
  });

  it('updates metadata when props change upon rerender', () => {
    const { container, rerender } = render(<SEO title="Trang Chủ" />);

    expect(container.querySelector('title')?.textContent).toBe(
      'Trang Chủ | Thai Spray Shop',
    );

    rerender(
      <SEO
        title="Trang Thanh Toán"
        description="Hoàn tất đơn hàng của bạn nhanh chóng và an toàn"
      />,
    );

    expect(container.querySelector('title')?.textContent).toBe(
      'Trang Thanh Toán | Thai Spray Shop',
    );
    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Hoàn tất đơn hàng của bạn nhanh chóng và an toàn',
    );
  });
});
