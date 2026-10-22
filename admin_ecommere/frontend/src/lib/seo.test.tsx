import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SEO } from './seo';

const { mockHelmet } = vi.hoisted(() => ({
  mockHelmet: vi.fn(),
}));

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
    expect(mockHelmet).toHaveBeenCalledTimes(1);

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
        title="Quản Lý Sản Phẩm"
        description="Trang quản trị sản phẩm chai xịt Thái Lan chính hãng"
        keywords="admin, quản lý, sản phẩm, chai xịt"
        image="https://example.com/admin-products-og.jpg"
        url="https://admin.thaisprayshop.com/products"
      />,
    );

    const expectedTitle = 'Quản Lý Sản Phẩm | Thai Spray Shop';
    expect(container.querySelector('title')?.textContent).toBe(expectedTitle);

    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Trang quản trị sản phẩm chai xịt Thái Lan chính hãng',
    );
    expect(getMeta(container, 'meta[name="keywords"]')).toBe(
      'admin, quản lý, sản phẩm, chai xịt',
    );

    // Open Graph
    expect(getMeta(container, 'meta[property="og:title"]')).toBe(expectedTitle);
    expect(getMeta(container, 'meta[property="og:description"]')).toBe(
      'Trang quản trị sản phẩm chai xịt Thái Lan chính hãng',
    );
    expect(getMeta(container, 'meta[property="og:image"]')).toBe(
      'https://example.com/admin-products-og.jpg',
    );
    expect(getMeta(container, 'meta[property="og:url"]')).toBe(
      'https://admin.thaisprayshop.com/products',
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
      'Trang quản trị sản phẩm chai xịt Thái Lan chính hãng',
    );
    expect(getMeta(container, 'meta[name="twitter:image"]')).toBe(
      'https://example.com/admin-products-og.jpg',
    );
  });

  it('renders custom title with suffix while falling back to default values for other props', () => {
    const { container } = render(<SEO title="Quản Lý Đơn Hàng" />);

    expect(container.querySelector('title')?.textContent).toBe(
      'Quản Lý Đơn Hàng | Thai Spray Shop',
    );
    expect(getMeta(container, 'meta[property="og:title"]')).toBe(
      'Quản Lý Đơn Hàng | Thai Spray Shop',
    );
    expect(getMeta(container, 'meta[name="twitter:title"]')).toBe(
      'Quản Lý Đơn Hàng | Thai Spray Shop',
    );

    // Default values for remaining props
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
      <SEO description="Báo cáo phân tích doanh thu và đơn hàng theo thời gian thực" />,
    );

    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Báo cáo phân tích doanh thu và đơn hàng theo thời gian thực',
    );
    expect(getMeta(container, 'meta[property="og:description"]')).toBe(
      'Báo cáo phân tích doanh thu và đơn hàng theo thời gian thực',
    );
    expect(getMeta(container, 'meta[name="twitter:description"]')).toBe(
      'Báo cáo phân tích doanh thu và đơn hàng theo thời gian thực',
    );
  });

  it('renders custom keywords while falling back to other defaults', () => {
    const { container } = render(
      <SEO keywords="thống kê, doanh số, báo cáo admin" />,
    );

    expect(getMeta(container, 'meta[name="keywords"]')).toBe(
      'thống kê, doanh số, báo cáo admin',
    );
    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
  });

  it('renders custom image while falling back to other defaults', () => {
    const { container } = render(
      <SEO image="https://cdn.example.com/admin/dashboard-chart.png" />,
    );

    expect(getMeta(container, 'meta[property="og:image"]')).toBe(
      'https://cdn.example.com/admin/dashboard-chart.png',
    );
    expect(getMeta(container, 'meta[name="twitter:image"]')).toBe(
      'https://cdn.example.com/admin/dashboard-chart.png',
    );
    expect(container.querySelector('title')?.textContent).toBe(
      'Shop Chai Xịt Thái Lan - Chất lượng cao, giá tốt nhất',
    );
  });

  it('renders custom url while falling back to other defaults', () => {
    const { container } = render(
      <SEO url="https://admin.thaisprayshop.com/settings" />,
    );

    expect(getMeta(container, 'meta[property="og:url"]')).toBe(
      'https://admin.thaisprayshop.com/settings',
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
    const { container, rerender } = render(
      <SEO title="Tổng Quan" description="Bảng điều khiển quản trị" />,
    );

    expect(container.querySelector('title')?.textContent).toBe(
      'Tổng Quan | Thai Spray Shop',
    );
    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Bảng điều khiển quản trị',
    );

    rerender(
      <SEO
        title="Chi Tiết Đơn Hàng"
        description="Xem và cập nhật trạng thái đơn hàng"
      />,
    );

    expect(container.querySelector('title')?.textContent).toBe(
      'Chi Tiết Đơn Hàng | Thai Spray Shop',
    );
    expect(getMeta(container, 'meta[name="description"]')).toBe(
      'Xem và cập nhật trạng thái đơn hàng',
    );
  });
});
