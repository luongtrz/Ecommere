import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb } from './Breadcrumb';

afterEach(() => {
  cleanup();
});

function renderBreadcrumb(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Breadcrumb', () => {
  it('renders navigation landmark with aria-label and Home icon link when items is empty', () => {
    const { container } = renderBreadcrumb(<Breadcrumb items={[]} />);

    const nav = within(container).getByRole('navigation', {
      name: 'Breadcrumb',
    });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass(
      'flex',
      'items-center',
      'flex-wrap',
      'gap-1.5',
      'sm:gap-2',
      'text-xs',
      'sm:text-sm',
      'font-medium',
    );

    const homeLink = within(container).getByRole('link');
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass('text-slate-500', 'hover:text-teal-600');

    const homeSvg = homeLink.querySelector('svg');
    expect(homeSvg).toBeInTheDocument();
    expect(homeSvg).toHaveClass('h-4', 'w-4');

    // No ChevronRight icons rendered when items is empty
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('renders breadcrumb item with href as a Link alongside chevron separator', () => {
    const items = [{ label: 'Danh mục sản phẩm', href: '/categories' }];
    const { container } = renderBreadcrumb(<Breadcrumb items={items} />);

    const categoryLink = within(container).getByRole('link', {
      name: 'Danh mục sản phẩm',
    });
    expect(categoryLink).toBeInTheDocument();
    expect(categoryLink).toHaveAttribute('href', '/categories');
    expect(categoryLink).toHaveClass('text-slate-500', 'hover:text-teal-600');

    // 2 SVGs: Home icon and 1 ChevronRight icon
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    expect(svgs[1]).toHaveClass('h-3.5', 'w-3.5', 'text-slate-300');
  });

  it('renders breadcrumb item without href as a non-clickable span with font-medium class', () => {
    const items = [{ label: 'Chi tiết sản phẩm' }];
    const { container } = renderBreadcrumb(<Breadcrumb items={items} />);

    const activeSpan = within(container).getByText('Chi tiết sản phẩm');
    expect(activeSpan).toBeInTheDocument();
    expect(activeSpan.tagName).toBe('SPAN');
    expect(activeSpan).toHaveClass('font-semibold', 'text-slate-900');

    // Only 1 link exists (the Home link)
    expect(within(container).getAllByRole('link')).toHaveLength(1);
    expect(
      within(container).queryByRole('link', { name: 'Chi tiết sản phẩm' }),
    ).not.toBeInTheDocument();
  });

  it('renders multiple mixed items with both links and trailing current page span', () => {
    const items = [
      { label: 'Quản lý đơn hàng', href: '/orders' },
      { label: 'Đơn hàng #12345', href: '/orders/12345' },
      { label: 'Chi tiết sản phẩm' },
    ];

    const { container } = renderBreadcrumb(<Breadcrumb items={items} />);

    // Total links: 1 Home link + 2 intermediate links
    const links = within(container).getAllByRole('link');
    expect(links).toHaveLength(3);

    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[1]).toHaveAttribute('href', '/orders');
    expect(links[1]).toHaveTextContent('Quản lý đơn hàng');
    expect(links[2]).toHaveAttribute('href', '/orders/12345');
    expect(links[2]).toHaveTextContent('Đơn hàng #12345');

    // Last item is a span
    const terminalItem = within(container).getByText('Chi tiết sản phẩm');
    expect(terminalItem.tagName).toBe('SPAN');
    expect(terminalItem).toHaveClass('font-semibold', 'text-slate-900');

    // SVGs: 1 Home + 3 ChevronRight separators
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(4);
    expect(svgs[1]).toHaveClass('h-3.5', 'w-3.5', 'text-slate-300');
    expect(svgs[2]).toHaveClass('h-3.5', 'w-3.5', 'text-slate-300');
    expect(svgs[3]).toHaveClass('h-3.5', 'w-3.5', 'text-slate-300');
  });

  it('applies custom className to the nav element', () => {
    const { container } = renderBreadcrumb(
      <Breadcrumb
        items={[]}
        className="custom-breadcrumb-container px-4 py-2"
      />,
    );

    const nav = within(container).getByRole('navigation', {
      name: 'Breadcrumb',
    });
    expect(nav).toHaveClass(
      'flex',
      'items-center',
      'flex-wrap',
      'gap-1.5',
      'sm:gap-2',
      'text-xs',
      'sm:text-sm',
      'font-medium',
      'custom-breadcrumb-container',
      'px-4',
      'py-2',
    );
  });
});
