import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatMarkdown, type ChatMarkdownProps } from './ChatMarkdown';
import ChatMarkdownDefault from './ChatMarkdown';

function renderChatMarkdown(content: string) {
  return render(
    <MemoryRouter>
      <ChatMarkdown content={content} />
    </MemoryRouter>,
  );
}

describe('ChatMarkdown', () => {
  it('exports ChatMarkdown as named export and default export', () => {
    expect(ChatMarkdown).toBeDefined();
    expect(ChatMarkdownDefault).toBe(ChatMarkdown);
  });

  it('renders root container with proper styling classes and handles empty content', () => {
    const { container } = renderChatMarkdown('');
    const root = container.firstElementChild;

    expect(root).toBeInTheDocument();
    expect(root).toHaveClass(
      'text-sm',
      'break-words',
      'leading-relaxed',
      'space-y-2',
    );
  });

  it('renders paragraphs with correct styling', () => {
    const { container } = renderChatMarkdown('Đoạn văn một.\n\nĐoạn văn hai.');
    const paragraphs = container.querySelectorAll('p');

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveClass('mb-2', 'last:mb-0', 'leading-relaxed');
    expect(paragraphs[0]).toHaveTextContent('Đoạn văn một.');
    expect(paragraphs[1]).toHaveClass('mb-2', 'last:mb-0', 'leading-relaxed');
    expect(paragraphs[1]).toHaveTextContent('Đoạn văn hai.');
  });

  it('renders bold text using strong component with correct classes', () => {
    renderChatMarkdown('Chào bạn, **tôi là trợ lý ảo** hân hạnh phục vụ.');
    const boldElement = screen.getByText('tôi là trợ lý ảo');

    expect(boldElement.tagName).toBe('STRONG');
    expect(boldElement).toHaveClass('font-semibold', 'text-slate-900');
  });

  it('renders unordered lists and list items with correct styles', () => {
    const markdown = '- Sản phẩm A\n- Sản phẩm B';
    const { container } = renderChatMarkdown(markdown);

    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul).toHaveClass('my-2', 'list-disc', 'pl-5', 'space-y-1');

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveClass('leading-relaxed');
    expect(listItems[0]).toHaveTextContent('Sản phẩm A');
    expect(listItems[1]).toHaveClass('leading-relaxed');
    expect(listItems[1]).toHaveTextContent('Sản phẩm B');
  });

  it('renders ordered lists and list items with correct styles', () => {
    const markdown = '1. Bước 1\n2. Bước 2';
    const { container } = renderChatMarkdown(markdown);

    const ol = container.querySelector('ol');
    expect(ol).toBeInTheDocument();
    expect(ol).toHaveClass('my-2', 'list-decimal', 'pl-5', 'space-y-1');

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveClass('leading-relaxed');
    expect(listItems[0]).toHaveTextContent('Bước 1');
    expect(listItems[1]).toHaveClass('leading-relaxed');
    expect(listItems[1]).toHaveTextContent('Bước 2');
  });

  it('renders h1, h2, and h3 headings with corresponding typography classes', () => {
    const markdown = '# Tiêu đề 1\n## Tiêu đề 2\n### Tiêu đề 3';
    renderChatMarkdown(markdown);

    const h1 = screen.getByRole('heading', { level: 1, name: 'Tiêu đề 1' });
    expect(h1).toHaveClass(
      'font-sans',
      'text-base',
      'md:text-lg',
      'font-bold',
      'text-slate-900',
      'mt-3',
      'mb-1',
      'tracking-tight',
    );

    const h2 = screen.getByRole('heading', { level: 2, name: 'Tiêu đề 2' });
    expect(h2).toHaveClass(
      'font-sans',
      'text-sm',
      'md:text-base',
      'font-bold',
      'text-slate-900',
      'mt-2.5',
      'mb-1',
      'tracking-tight',
    );

    const h3 = screen.getByRole('heading', { level: 3, name: 'Tiêu đề 3' });
    expect(h3).toHaveClass(
      'font-sans',
      'text-xs',
      'md:text-sm',
      'font-semibold',
      'text-slate-900',
      'mt-2',
      'mb-1',
      'tracking-tight',
    );
  });

  it('renders tables with wrapper div, table, th, and td styles via remark-gfm', () => {
    const markdown = `
| Tên hàng | Số lượng | Đơn giá |
| :--- | :--- | :--- |
| Áo sơ mi | 2 | 250.000đ |
| Quần jeans | 1 | 450.000đ |
    `.trim();

    const { container } = renderChatMarkdown(markdown);

    const tableWrapper = container.querySelector('div.overflow-x-auto');
    expect(tableWrapper).toBeInTheDocument();
    expect(tableWrapper).toHaveClass('my-2', 'overflow-x-auto');

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass(
      'w-full',
      'border-collapse',
      'text-left',
      'text-xs',
    );

    const thElements = container.querySelectorAll('th');
    expect(thElements.length).toBeGreaterThanOrEqual(3);
    expect(thElements[0]).toHaveClass(
      'border-b',
      'border-slate-200',
      'bg-slate-50',
      'px-3',
      'py-2',
      'font-semibold',
      'text-slate-900',
      'tracking-wider',
      'text-[11px]',
      'uppercase',
    );
    expect(thElements[0]).toHaveTextContent('Tên hàng');

    const tdElements = container.querySelectorAll('td');
    expect(tdElements.length).toBeGreaterThanOrEqual(6);
    expect(tdElements[0]).toHaveClass(
      'border-b',
      'border-slate-100',
      'px-3',
      'py-2',
      'text-slate-700',
    );
    expect(tdElements[0]).toHaveTextContent('Áo sơ mi');
  });

  it('renders inline code with custom styling', () => {
    renderChatMarkdown('Sử dụng mã `GIAM50K` để nhận ưu đãi');
    const codeElement = screen.getByText('GIAM50K');

    expect(codeElement.tagName).toBe('CODE');
    expect(codeElement).toHaveClass(
      'rounded',
      'border',
      'border-slate-200',
      'bg-slate-100',
      'px-1.5',
      'py-0.5',
      'font-mono',
      'text-xs',
      'text-slate-800',
    );
  });

  it('renders preformatted code blocks with custom styling', () => {
    const markdown = '```json\n{"status": "ok"}\n```';
    const { container } = renderChatMarkdown(markdown);

    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveClass(
      'my-2',
      'overflow-x-auto',
      'rounded-lg',
      'border',
      'border-slate-200',
      'bg-slate-50',
      'p-3',
      'font-mono',
      'text-xs',
      'text-slate-800',
      '[&>code]:bg-transparent',
      '[&>code]:p-0',
      '[&>code]:rounded-none',
      '[&>code]:border-0',
    );
  });

  it('renders images as span elements with alt text and no img tags', () => {
    const markdown = '![Ảnh sản phẩm giày chạy](https://example.com/shoes.png)';
    const { container } = renderChatMarkdown(markdown);

    const altSpan = screen.getByText('Ảnh sản phẩm giày chạy');
    expect(altSpan.tagName).toBe('SPAN');
    expect(altSpan).toHaveClass('text-slate-400');
    expect(container.querySelector('img')).toBeNull();
  });

  describe('links (a component)', () => {
    it('renders internal router link when href starts with / and not //', () => {
      renderChatMarkdown('[Xem giỏ hàng](/cart)');

      const link = screen.getByRole('link', { name: 'Xem giỏ hàng' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/cart');
      expect(link).not.toHaveAttribute('target');
      expect(link).toHaveClass(
        'text-teal-600',
        'font-medium',
        'underline',
        'underline-offset-4',
        'decoration-teal-300',
        'hover:text-teal-700',
        'hover:decoration-teal-600',
        'transition-colors',
      );
    });

    it('renders external link with target _blank and rel attributes for https URL', () => {
      renderChatMarkdown('[Trang chủ Google](https://google.com)');

      const link = screen.getByRole('link', { name: 'Trang chủ Google' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://google.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
      expect(link).toHaveClass(
        'text-teal-600',
        'font-medium',
        'underline',
        'underline-offset-4',
        'decoration-teal-300',
        'hover:text-teal-700',
        'hover:decoration-teal-600',
        'transition-colors',
      );
    });

    it('renders external link with target _blank and rel attributes for http URL', () => {
      renderChatMarkdown('[Trang tài liệu HTTP](http://example.org/docs)');

      const link = screen.getByRole('link', { name: 'Trang tài liệu HTTP' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'http://example.org/docs');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    });

    it('handles case-insensitive HTTPS scheme', () => {
      renderChatMarkdown('[Trang bảo mật](HTTPS://SECURE.EXAMPLE.COM)');

      const link = screen.getByRole('link', { name: 'Trang bảo mật' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'HTTPS://SECURE.EXAMPLE.COM');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders span instead of link for protocol-relative URL starting with //', () => {
      renderChatMarkdown('[Giao thức tương đối](//cdn.example.com/item)');

      expect(
        screen.queryByRole('link', { name: 'Giao thức tương đối' }),
      ).not.toBeInTheDocument();

      const spanElement = screen.getByText('Giao thức tương đối');
      expect(spanElement.tagName).toBe('SPAN');
    });

    it('renders span instead of link for javascript: URL', () => {
      renderChatMarkdown('[Mã độc hại](javascript:alert(1))');

      expect(
        screen.queryByRole('link', { name: 'Mã độc hại' }),
      ).not.toBeInTheDocument();

      const spanElement = screen.getByText('Mã độc hại');
      expect(spanElement.tagName).toBe('SPAN');
    });

    it('renders span instead of link for mailto: URL', () => {
      renderChatMarkdown('[Liên hệ qua mail](mailto:support@shop.com)');

      expect(
        screen.queryByRole('link', { name: 'Liên hệ qua mail' }),
      ).not.toBeInTheDocument();

      const spanElement = screen.getByText('Liên hệ qua mail');
      expect(spanElement.tagName).toBe('SPAN');
    });

    it('renders span instead of link for anchor hash link', () => {
      renderChatMarkdown('[Nhảy đến phần 2](#section-2)');

      expect(
        screen.queryByRole('link', { name: 'Nhảy đến phần 2' }),
      ).not.toBeInTheDocument();

      const spanElement = screen.getByText('Nhảy đến phần 2');
      expect(spanElement.tagName).toBe('SPAN');
    });

    it('renders span when link has empty href', () => {
      renderChatMarkdown('[Không có liên kết]()');

      expect(
        screen.queryByRole('link', { name: 'Không có liên kết' }),
      ).not.toBeInTheDocument();

      const spanElement = screen.getByText('Không có liên kết');
      expect(spanElement.tagName).toBe('SPAN');
    });
  });

  it('renders correctly with default export and ChatMarkdownProps', () => {
    const props: ChatMarkdownProps = { content: 'Thử nghiệm default export' };
    render(
      <MemoryRouter>
        <ChatMarkdownDefault {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Thử nghiệm default export')).toBeInTheDocument();
  });
});
