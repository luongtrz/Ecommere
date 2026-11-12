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
      'gap-1',
      'text-sm',
      'text-muted-foreground',
      'overflow-x-auto',
      'whitespace-nowrap',
    );

    const homeLink = within(container).getByRole('link', { name: 'Trang chủ' });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'min-h-11',
      'min-w-11',
      'text-muted-foreground',
      'hover:text-foreground',
      'transition-colors',
    );

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
    expect(categoryLink).toHaveClass(
      'inline-flex',
      'items-center',
      'min-h-11',
      'text-muted-foreground',
      'hover:text-foreground',
      'hover:underline',
      'transition-colors',
    );

    // 2 SVGs: Home icon and 1 ChevronRight icon
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    expect(svgs[1]).toHaveClass('h-4', 'w-4', 'text-muted-foreground/50', 'shrink-0');
  });

  it('renders breadcrumb item without href as a non-clickable span with font-medium class', () => {
    const items = [{ label: 'Chi tiết sản phẩm' }];
    const { container } = renderBreadcrumb(<Breadcrumb items={items} />);

    const activeSpan = within(container).getByText('Chi tiết sản phẩm');
    expect(activeSpan).toBeInTheDocument();
    expect(activeSpan.tagName).toBe('SPAN');
    expect(activeSpan).toHaveAttribute('aria-current', 'page');
    expect(activeSpan).toHaveClass(
      'font-medium',
      'text-foreground',
      'truncate',
      'max-w-[180px]',
      'min-h-11',
    );

    // Only 1 link exists (the Home link)
    expect(within(container).getAllByRole('link')).toHaveLength(1);
    expect(
      within(container).queryByRole('link', { name: 'Chi tiết sản phẩm' }),
    ).not.toBeInTheDocument();
  });

  it('renders multiple mixed items with both links and trailing current page span', () => {
    const items = [
      { label: 'Điện thoại & Phụ kiện', href: '/danh-muc/dien-thoai' },
      { label: 'Apple', href: '/thuong-hieu/apple' },
      { label: 'iPhone 15 Pro Max 256GB' },
    ];

    const { container } = renderBreadcrumb(<Breadcrumb items={items} />);

    // Total links: 1 Home link + 2 intermediate links
    const links = within(container).getAllByRole('link');
    expect(links).toHaveLength(3);

    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[1]).toHaveAttribute('href', '/danh-muc/dien-thoai');
    expect(links[1]).toHaveTextContent('Điện thoại & Phụ kiện');
    expect(links[2]).toHaveAttribute('href', '/thuong-hieu/apple');
    expect(links[2]).toHaveTextContent('Apple');

    // Last item is a span
    const terminalItem = within(container).getByText('iPhone 15 Pro Max 256GB');
    expect(terminalItem.tagName).toBe('SPAN');
    expect(terminalItem).toHaveAttribute('aria-current', 'page');
    expect(terminalItem).toHaveClass('font-medium', 'text-foreground', 'truncate');

    // SVGs: 1 Home + 3 ChevronRight separators
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(4);
    expect(svgs[1]).toHaveClass('h-4', 'w-4', 'text-muted-foreground/50', 'shrink-0');
    expect(svgs[2]).toHaveClass('h-4', 'w-4', 'text-muted-foreground/50', 'shrink-0');
    expect(svgs[3]).toHaveClass('h-4', 'w-4', 'text-muted-foreground/50', 'shrink-0');
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
      'custom-breadcrumb-container',
      'px-4',
      'py-2',
    );
  });

  it('skips leading duplicate "Trang chủ" or "/" link so Home is not duplicated', () => {
    const itemsWithHref = [
      { label: 'Trang chủ', href: '/' },
      { label: 'Sản phẩm', href: '/catalog' },
      { label: 'Xịt phòng Lavender' },
    ];
    const { container } = renderBreadcrumb(<Breadcrumb items={itemsWithHref} />);

    const links = within(container).getAllByRole('link');
    expect(links).toHaveLength(2); // Only Home icon link + 'Sản phẩm'
    expect(links[0]).toHaveAttribute('href', '/');
    expect(links[1]).toHaveTextContent('Sản phẩm');
    expect(links[1]).toHaveAttribute('href', '/catalog');

    // Separators: Home > Sản phẩm > Xịt phòng Lavender
    // SVGs: 1 Home icon + 2 ChevronRight = 3
    expect(container.querySelectorAll('svg')).toHaveLength(3);
  });

  it('skips leading item if label is "Trang chủ" even without href', () => {
    const items = [
      { label: 'Trang chủ' },
      { label: 'Danh mục', href: '/catalog' },
    ];
    const { container } = renderBreadcrumb(<Breadcrumb items={items} />);
    const links = within(container).getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(within(container).queryByText('Trang chủ')).not.toBeInTheDocument();
  });
});
