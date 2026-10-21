import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

afterEach(() => {
  cleanup();
});

function renderAdminLayout(initialRoute = '/admin') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<div>Nội dung tổng quan</div>} />
          <Route
            path="/admin/products"
            element={<div>Nội dung sản phẩm</div>}
          />
          <Route path="/admin/orders" element={<div>Nội dung đơn hàng</div>} />
          <Route
            path="/admin/coupons"
            element={<div>Nội dung mã giảm giá</div>}
          />
          <Route
            path="/admin/inventory"
            element={<div>Nội dung kho hàng</div>}
          />
        </Route>
        <Route path="/" element={<div>Nội dung trang chủ</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminLayout', () => {
  it('renders sidebar headings, header, and main container', () => {
    const { container } = renderAdminLayout();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Trang quản trị' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Quản trị' }),
    ).toBeInTheDocument();

    const rootDiv = container.firstElementChild;
    expect(rootDiv).toHaveClass('flex', 'min-h-screen', 'bg-gray-100');

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('w-64', 'bg-white', 'shadow-md');

    const header = container.querySelector('header');
    expect(header).toHaveClass(
      'h-16',
      'bg-white',
      'shadow-sm',
      'flex',
      'items-center',
      'px-8',
    );

    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-1', 'p-8');
  });

  it('renders all navigation links with exact Vietnamese labels and correct href attributes', () => {
    renderAdminLayout();

    const expectedLinks = [
      { name: 'Về trang chủ', href: '/' },
      { name: 'Tổng quan', href: '/admin' },
      { name: 'Sản phẩm', href: '/admin/products' },
      { name: 'Đơn hàng', href: '/admin/orders' },
      { name: 'Mã giảm giá', href: '/admin/coupons' },
      { name: 'Kho hàng', href: '/admin/inventory' },
    ];

    for (const linkInfo of expectedLinks) {
      const link = screen.getByRole('link', {
        name: new RegExp(linkInfo.name, 'i'),
      });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', linkInfo.href);
      expect(link.querySelector('svg')).toBeInTheDocument();
    }
  });

  it('renders nested child content inside main via Outlet', () => {
    renderAdminLayout('/admin');

    const main = screen.getByRole('main');
    const childContent = screen.getByText('Nội dung tổng quan');
    expect(childContent).toBeInTheDocument();
    expect(main).toContainElement(childContent);
  });

  it('navigates to each destination route when navigation links are clicked', async () => {
    const user = userEvent.setup();
    renderAdminLayout('/admin');

    expect(screen.getByText('Nội dung tổng quan')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Sản phẩm/i }));
    expect(screen.getByText('Nội dung sản phẩm')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Đơn hàng/i }));
    expect(screen.getByText('Nội dung đơn hàng')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Mã giảm giá/i }));
    expect(screen.getByText('Nội dung mã giảm giá')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Kho hàng/i }));
    expect(screen.getByText('Nội dung kho hàng')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Tổng quan/i }));
    expect(screen.getByText('Nội dung tổng quan')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Về trang chủ/i }));
    expect(screen.getByText('Nội dung trang chủ')).toBeInTheDocument();
  });
});
