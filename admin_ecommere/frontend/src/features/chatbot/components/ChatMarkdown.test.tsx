import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DefaultChatMarkdown, { ChatMarkdown } from './ChatMarkdown';

describe('ChatMarkdown', () => {
  const renderWithRouter = (content: string) => {
    return render(
      <MemoryRouter>
        <ChatMarkdown content={content} />
      </MemoryRouter>,
    );
  };

  it('exports default component identical to named component', () => {
    expect(DefaultChatMarkdown).toBe(ChatMarkdown);
  });

  it('renders paragraph with expected styling', () => {
    const { container } = renderWithRouter('Đây là đoạn văn bản chào mừng.');
    const paragraph = screen.getByText('Đây là đoạn văn bản chào mừng.');

    expect(paragraph.tagName).toBe('P');
    expect(paragraph).toHaveClass('mb-2', 'last:mb-0', 'leading-relaxed');
    expect(container.firstChild).toHaveClass(
      'text-sm',
      'break-words',
      'leading-relaxed',
      'space-y-2.5',
      'text-slate-700',
    );
  });

  it('renders bold/strong text with correct styles', () => {
    renderWithRouter('Sản phẩm **chính hãng 100%** từ Thái Lan.');
    const strong = screen.getByText('chính hãng 100%');

    expect(strong.tagName).toBe('STRONG');
    expect(strong).toHaveClass('font-semibold', 'text-slate-900');
  });

  it('renders unordered list with custom styles', () => {
    const markdown = `
- Chai xịt phòng hương sả
- Nước lau sàn organic
`;
    renderWithRouter(markdown);

    const item1 = screen.getByText('Chai xịt phòng hương sả');
    const item2 = screen.getByText('Nước lau sàn organic');

    expect(item1.tagName).toBe('LI');
    expect(item1).toHaveClass('leading-relaxed');
    expect(item2.tagName).toBe('LI');

    const ul = item1.closest('ul');
    expect(ul).not.toBeNull();
    expect(ul).toHaveClass('my-2', 'list-disc', 'pl-5', 'space-y-1');
  });

  it('renders ordered list with custom styles', () => {
    const markdown = `
1. Kiểm tra tồn kho
2. Tạo đơn giao hàng
`;
    renderWithRouter(markdown);

    const item1 = screen.getByText('Kiểm tra tồn kho');
    const item2 = screen.getByText('Tạo đơn giao hàng');

    expect(item1.tagName).toBe('LI');
    expect(item1).toHaveClass('leading-relaxed');
    expect(item2.tagName).toBe('LI');
    expect(item2).toHaveClass('leading-relaxed');

    const ol = item1.closest('ol');
    expect(ol).not.toBeNull();
    expect(ol).toHaveClass('my-2', 'list-decimal', 'pl-5', 'space-y-1');
  });

  it('renders headings h1, h2, and h3 with appropriate classes', () => {
    const markdown = `
# Tiêu đề cấp 1: Báo cáo doanh thu
## Tiêu đề cấp 2: Chi tiết theo tuần
### Tiêu đề cấp 3: Đơn hàng thành công
`;
    renderWithRouter(markdown);

    const h1 = screen.getByRole('heading', {
      level: 1,
      name: 'Tiêu đề cấp 1: Báo cáo doanh thu',
    });
    expect(h1).toHaveClass(
      'text-base',
      'font-bold',
      'text-slate-900',
      'mt-3',
      'mb-1.5',
      'tracking-tight',
    );

    const h2 = screen.getByRole('heading', {
      level: 2,
      name: 'Tiêu đề cấp 2: Chi tiết theo tuần',
    });
    expect(h2).toHaveClass(
      'text-sm',
      'font-bold',
      'text-slate-900',
      'mt-2.5',
      'mb-1',
      'tracking-tight',
    );

    const h3 = screen.getByRole('heading', {
      level: 3,
      name: 'Tiêu đề cấp 3: Đơn hàng thành công',
    });
    expect(h3).toHaveClass(
      'text-xs',
      'font-semibold',
      'uppercase',
      'tracking-wider',
      'text-slate-500',
      'mt-2',
      'mb-1',
    );
  });

  it('renders table with remark-gfm formatting and responsive container', () => {
    const markdown = `
| Tên sản phẩm | Số lượng | Đơn giá |
| :--- | :--- | :--- |
| Xịt phòng bạc hà | 15 | 85.000₫ |
| Sáp thơm lavender | 8 | 120.000₫ |
`;
    renderWithRouter(markdown);

    const table = screen.getByRole('table');
    expect(table).toHaveClass(
      'w-full',
      'border-collapse',
      'text-left',
      'text-xs',
      'tabular-nums',
    );

    const tableWrapper = table.parentElement;
    expect(tableWrapper).toHaveClass(
      'my-3',
      'overflow-x-auto',
      'rounded-xl',
      'border',
      'border-slate-200',
      'bg-white',
      'shadow-sm',
    );

    const th = screen.getByRole('columnheader', { name: 'Tên sản phẩm' });
    expect(th).toHaveClass(
      'sticky',
      'top-0',
      'border-b',
      'border-slate-200',
      'bg-slate-50',
      'px-4',
      'py-3',
      'font-semibold',
      'text-slate-900',
      'text-xs',
      'whitespace-nowrap',
    );

    const td = screen.getByRole('cell', { name: 'Xịt phòng bạc hà' });
    expect(td).toHaveClass(
      'border-b',
      'border-slate-100',
      'px-4',
      'py-3',
      'text-slate-700',
    );
  });

  it('renders inline code with monospace styling', () => {
    renderWithRouter('Sử dụng mã giảm giá `SALE50` khi thanh toán.');
    const code = screen.getByText('SALE50');

    expect(code.tagName).toBe('CODE');
    expect(code).toHaveClass(
      'rounded-md',
      'border',
      'border-slate-200',
      'bg-slate-100',
      'px-1.5',
      'py-0.5',
      'font-mono',
      'text-xs',
      'text-teal-700',
      'font-medium',
    );
  });

  it('renders preformatted code block with container styling', () => {
    const markdown = '```ts\nconst adminStatus = "ACTIVE";\n```';
    renderWithRouter(markdown);

    const code = screen.getByText(/adminStatus = "ACTIVE"/);
    const pre = code.closest('pre');

    expect(pre).not.toBeNull();
    expect(pre).toHaveClass(
      'my-3',
      'overflow-x-auto',
      'rounded-xl',
      'border',
      'border-slate-200',
      'bg-slate-50',
      'p-3.5',
      'font-mono',
      'text-xs',
      'text-slate-800',
      'shadow-sm',
      '[&>code]:bg-transparent',
      '[&>code]:p-0',
      '[&>code]:rounded-none',
      '[&>code]:border-0',
      '[&>code]:text-inherit',
    );
  });

  it('renders image alt text inside a styled span instead of an img tag', () => {
    const markdown =
      '![Ảnh minh họa đơn hàng số 1024](https://example.com/order-1024.png)';
    const { container } = renderWithRouter(markdown);

    expect(container.querySelector('img')).toBeNull();

    const altSpan = screen.getByText('Ảnh minh họa đơn hàng số 1024');
    expect(altSpan.tagName).toBe('SPAN');
    expect(altSpan).toHaveClass('text-slate-400');
  });

  describe('links (a component)', () => {
    it('renders internal router Link for relative paths starting with a single slash', () => {
      renderWithRouter(
        '[Xem đơn hàng /admin/orders](/admin/orders?status=PENDING)',
      );
      const link = screen.getByRole('link', {
        name: 'Xem đơn hàng /admin/orders',
      });

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/admin/orders?status=PENDING');
      expect(link).toHaveClass(
        'font-medium',
        'text-teal-600',
        'underline',
        'underline-offset-4',
        'decoration-teal-600/40',
        'hover:text-teal-700',
        'hover:decoration-teal-700',
        'transition-colors',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-teal-500',
        'rounded-sm',
      );
      expect(link).not.toHaveAttribute('target');
      expect(link).not.toHaveAttribute('rel');
    });

    it('renders external anchor tag for https links with security attributes', () => {
      renderWithRouter('[Cổng thanh toán](https://payment.example.vn/gateway)');
      const link = screen.getByRole('link', { name: 'Cổng thanh toán' });

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        'href',
        'https://payment.example.vn/gateway',
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
      expect(link).toHaveClass(
        'font-medium',
        'text-teal-600',
        'underline',
        'underline-offset-4',
        'decoration-teal-600/40',
        'hover:text-teal-700',
        'hover:decoration-teal-700',
        'transition-colors',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-teal-500',
        'rounded-sm',
      );
    });

    it('renders external anchor tag for http and uppercase HTTP links', () => {
      const markdown = `
[Trang web HTTP](http://test.example.vn)
[Trang web HTTPS hoa](HTTPS://SECURE.EXAMPLE.VN)
`;
      renderWithRouter(markdown);

      const httpLink = screen.getByRole('link', { name: 'Trang web HTTP' });
      expect(httpLink).toHaveAttribute('href', 'http://test.example.vn');
      expect(httpLink).toHaveAttribute('target', '_blank');
      expect(httpLink).toHaveAttribute('rel', 'noopener noreferrer nofollow');

      const upperLink = screen.getByRole('link', {
        name: 'Trang web HTTPS hoa',
      });
      expect(upperLink).toHaveAttribute('href', 'HTTPS://SECURE.EXAMPLE.VN');
      expect(upperLink).toHaveAttribute('target', '_blank');
      expect(upperLink).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    });

    it('renders span fallback for protocol-relative links starting with //', () => {
      renderWithRouter('[Liên kết CDN](//cdn.example.com/asset.js)');
      expect(screen.queryByRole('link', { name: 'Liên kết CDN' })).toBeNull();

      const span = screen.getByText('Liên kết CDN');
      expect(span.tagName).toBe('SPAN');
    });

    it('renders span fallback for unsafe javascript: protocols', () => {
      renderWithRouter('[Hành động nguy hiểm](javascript:alert("hack"))');
      expect(
        screen.queryByRole('link', { name: 'Hành động nguy hiểm' }),
      ).toBeNull();

      const span = screen.getByText('Hành động nguy hiểm');
      expect(span.tagName).toBe('SPAN');
    });

    it('renders span fallback for mailto, relative path without leading slash, and empty href', () => {
      const markdown = `
[Gửi email hỗ trợ](mailto:support@thaisprayshop.vn)
[Xem tài liệu nội bộ](docs/admin-guide.md)
[Liên kết không có địa chỉ]()
`;
      renderWithRouter(markdown);

      expect(
        screen.queryByRole('link', { name: 'Gửi email hỗ trợ' }),
      ).toBeNull();
      expect(screen.getByText('Gửi email hỗ trợ').tagName).toBe('SPAN');

      expect(
        screen.queryByRole('link', { name: 'Xem tài liệu nội bộ' }),
      ).toBeNull();
      expect(screen.getByText('Xem tài liệu nội bộ').tagName).toBe('SPAN');

      expect(
        screen.queryByRole('link', { name: 'Liên kết không có địa chỉ' }),
      ).toBeNull();
      expect(screen.getByText('Liên kết không có địa chỉ').tagName).toBe(
        'SPAN',
      );
    });
  });
});
