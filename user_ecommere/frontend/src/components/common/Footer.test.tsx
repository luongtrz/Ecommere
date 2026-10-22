import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

describe('Footer', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  const renderFooter = () =>
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

  it('renders top value propositions', () => {
    renderFooter();

    expect(screen.getByText('100% Chính Hãng')).toBeInTheDocument();
    expect(
      screen.getByText('Cam kết hàng Thái Lan nội địa'),
    ).toBeInTheDocument();

    expect(screen.getByText('Giao Hàng Toàn Quốc')).toBeInTheDocument();
    expect(screen.getByText('Đóng gói chống sốc an toàn')).toBeInTheDocument();

    expect(screen.getByText('Đổi Trả 7 Ngày')).toBeInTheDocument();
    expect(
      screen.getByText('Miễn phí nếu vỡ hoặc lỗi tem'),
    ).toBeInTheDocument();

    expect(screen.getByText('Kiểm Tra Hàng')).toBeInTheDocument();
    expect(
      screen.getByText('Đồng kiểm trước khi thanh toán'),
    ).toBeInTheDocument();
  });

  it('renders brand identity, description, and trust badges', () => {
    renderFooter();

    expect(screen.getByText('TS')).toBeInTheDocument();
    expect(screen.getByText('Thai')).toBeInTheDocument();
    expect(screen.getByText('Spray')).toBeInTheDocument();
    expect(screen.getByText('Hàng Thái Chính Hãng')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Chuyên phân phối sỉ & lẻ các dòng chai xịt gia dụng, xịt côn trùng, tẩy rửa sinh học và tinh dầu thơm phòng nhập khẩu trực tiếp từ Thái Lan.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Hàng Chuẩn Nội Địa')).toBeInTheDocument();
    expect(screen.getByText('Giá Tốt Nhất Thị Trường')).toBeInTheDocument();
  });

  it('renders product catalog category links', () => {
    renderFooter();

    expect(screen.getByText('Danh Mục Sản Phẩm')).toBeInTheDocument();

    const shoppingLinks = [
      { text: 'Tất cả sản phẩm', href: '/catalog' },
      { text: 'Sản phẩm bán chạy', href: '/catalog?sort=best_selling' },
      {
        text: 'Xịt diệt côn trùng Thái Lan',
        href: '/catalog?category=diet-con-trung',
      },
      {
        text: 'Tẩy rửa & Vệ sinh nhà cửa',
        href: '/catalog?category=tay-rua-nha-bep',
      },
      {
        text: 'Xịt thơm & Khử mùi phòng',
        href: '/catalog?category=thom-phong',
      },
    ];

    shoppingLinks.forEach(({ text, href }) => {
      const link = screen.getByRole('link', { name: text });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('renders customer support and policy links', () => {
    renderFooter();

    expect(screen.getByText('Hỗ Trợ Khách Hàng')).toBeInTheDocument();

    const policyLinks = [
      {
        text: 'Chính sách vận chuyển siêu tốc',
        href: '/policy/shipping',
      },
      { text: 'Chính sách đổi trả 7 ngày', href: '/policy/return' },
      {
        text: 'Chính sách bảo mật thông tin',
        href: '/policy/privacy',
      },
      { text: 'Điều khoản sử dụng dịch vụ', href: '/policy/terms' },
    ];

    policyLinks.forEach(({ text, href }) => {
      const link = screen.getByRole('link', { name: text });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('renders contact details including hotline, email, and address', () => {
    renderFooter();

    expect(screen.getByText('Thông Tin Liên Hệ')).toBeInTheDocument();
    expect(screen.getByText('0987.654.321')).toBeInTheDocument();
    expect(
      screen.getByText('Hỗ trợ tư vấn Zalo / Hotline (8h - 22h)'),
    ).toBeInTheDocument();
    expect(screen.getByText('cskh@thaispray.shop')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Kho tổng: 128 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh (Giao toàn quốc)',
      ),
    ).toBeInTheDocument();
  });

  it('renders bottom copyright year, policy links, and operating status', () => {
    renderFooter();

    const currentYear = new Date().getFullYear();
    const copyrightRegex = new RegExp(
      `©\\s*${currentYear}\\s*Thai Spray Việt Nam - Chuyên Hàng\\s+Gia Dụng & Chai Xịt Thái Lan Cao Cấp\\.`,
    );
    expect(screen.getByText(copyrightRegex)).toBeInTheDocument();

    const privacyLink = screen.getByRole('link', { name: 'Bảo mật' });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/policy/privacy');

    const termsLink = screen.getByRole('link', { name: 'Điều khoản' });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/policy/terms');

    expect(screen.getByText('Hệ thống hoạt động ổn định')).toBeInTheDocument();
  });
});
