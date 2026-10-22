import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';

describe('Card UI components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('displayName checks', () => {
    it('sets correct displayName for each component', () => {
      expect(Card.displayName).toBe('Card');
      expect(CardHeader.displayName).toBe('CardHeader');
      expect(CardTitle.displayName).toBe('CardTitle');
      expect(CardDescription.displayName).toBe('CardDescription');
      expect(CardContent.displayName).toBe('CardContent');
      expect(CardFooter.displayName).toBe('CardFooter');
    });
  });

  describe('Card', () => {
    it('renders div with default styling when no className is provided', () => {
      render(<Card data-testid="card-default">Nội dung thẻ</Card>);
      const card = screen.getByTestId('card-default');

      expect(card).toBeInTheDocument();
      expect(card.tagName).toBe('DIV');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm',
      );
      expect(card).toHaveTextContent('Nội dung thẻ');
    });

    it('merges custom className with default classes', () => {
      render(
        <Card
          className="custom-card-class max-w-sm"
          data-testid="card-custom"
        />,
      );
      const card = screen.getByTestId('card-custom');

      expect(card).toHaveClass(
        'custom-card-class',
        'max-w-sm',
        'rounded-lg',
        'border',
      );
    });

    it('forwards ref to HTMLDivElement', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref} data-testid="card-ref" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('card-ref'));
    });

    it('passes extra attributes and handles click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Card
          data-testid="card-click"
          role="region"
          aria-label="Khu vực thông tin"
          onClick={handleClick}
        />,
      );

      const card = screen.getByTestId('card-click');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Khu vực thông tin');

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('CardHeader', () => {
    it('renders div with default header styling', () => {
      render(
        <CardHeader data-testid="header-default">Phần đầu thẻ</CardHeader>,
      );
      const header = screen.getByTestId('header-default');

      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('DIV');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
      expect(header).toHaveTextContent('Phần đầu thẻ');
    });

    it('merges custom className', () => {
      render(
        <CardHeader
          className="custom-header-class border-b"
          data-testid="header-custom"
        />,
      );
      const header = screen.getByTestId('header-custom');

      expect(header).toHaveClass(
        'custom-header-class',
        'border-b',
        'flex',
        'flex-col',
        'p-6',
      );
    });

    it('forwards ref to HTMLDivElement', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardHeader ref={ref} data-testid="header-ref" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('header-ref'));
    });

    it('passes additional props to the root element', () => {
      render(
        <CardHeader
          data-testid="header-props"
          id="header-unique-id"
          tabIndex={0}
        />,
      );
      const header = screen.getByTestId('header-props');
      expect(header).toHaveAttribute('id', 'header-unique-id');
      expect(header).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('CardTitle', () => {
    it('renders h3 with default styling and children', () => {
      render(
        <CardTitle data-testid="title-default">Tiêu đề thống kê</CardTitle>,
      );
      const title = screen.getByTestId('title-default');

      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight',
      );
      expect(title).toHaveTextContent('Tiêu đề thống kê');
    });

    it('merges custom className and extra props', () => {
      render(
        <CardTitle
          className="text-primary text-xl"
          id="custom-title-id"
          data-testid="title-custom"
        >
          Tiêu đề tùy chỉnh
        </CardTitle>,
      );
      const title = screen.getByTestId('title-custom');

      expect(title).toHaveClass('text-primary', 'text-xl', 'font-semibold');
      expect(title).toHaveAttribute('id', 'custom-title-id');
    });

    it('forwards ref to HTMLHeadingElement', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(
        <CardTitle ref={ref} data-testid="title-ref">
          Tiêu đề có ref
        </CardTitle>,
      );

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
      expect(ref.current).toBe(screen.getByTestId('title-ref'));
    });
  });

  describe('CardDescription', () => {
    it('renders p with default description styling', () => {
      render(
        <CardDescription data-testid="desc-default">
          Mô tả chi tiết báo cáo doanh thu
        </CardDescription>,
      );
      const desc = screen.getByTestId('desc-default');

      expect(desc).toBeInTheDocument();
      expect(desc.tagName).toBe('P');
      expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
      expect(desc).toHaveTextContent('Mô tả chi tiết báo cáo doanh thu');
    });

    it('merges custom className', () => {
      render(
        <CardDescription
          className="custom-desc text-xs"
          data-testid="desc-custom"
        >
          Mô tả ngắn gọn
        </CardDescription>,
      );
      const desc = screen.getByTestId('desc-custom');

      expect(desc).toHaveClass(
        'custom-desc',
        'text-xs',
        'text-muted-foreground',
      );
    });

    it('forwards ref to HTMLParagraphElement', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <CardDescription ref={ref} data-testid="desc-ref">
          Mô tả ref
        </CardDescription>,
      );

      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
      expect(ref.current).toBe(screen.getByTestId('desc-ref'));
    });
  });

  describe('CardContent', () => {
    it('renders div with default content styling', () => {
      render(
        <CardContent data-testid="content-default">
          Nội dung quản trị sản phẩm
        </CardContent>,
      );
      const content = screen.getByTestId('content-default');

      expect(content).toBeInTheDocument();
      expect(content.tagName).toBe('DIV');
      expect(content).toHaveClass('p-6', 'pt-0');
      expect(content).toHaveTextContent('Nội dung quản trị sản phẩm');
    });

    it('merges custom className', () => {
      render(
        <CardContent
          className="custom-content space-y-4"
          data-testid="content-custom"
        />,
      );
      const content = screen.getByTestId('content-custom');

      expect(content).toHaveClass('custom-content', 'space-y-4', 'p-6', 'pt-0');
    });

    it('forwards ref to HTMLDivElement', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardContent ref={ref} data-testid="content-ref" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('content-ref'));
    });
  });

  describe('CardFooter', () => {
    it('renders div with default footer styling', () => {
      render(
        <CardFooter data-testid="footer-default">Phần chân thẻ</CardFooter>,
      );
      const footer = screen.getByTestId('footer-default');

      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe('DIV');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
      expect(footer).toHaveTextContent('Phần chân thẻ');
    });

    it('merges custom className', () => {
      render(
        <CardFooter
          className="justify-between border-t"
          data-testid="footer-custom"
        />,
      );
      const footer = screen.getByTestId('footer-custom');

      expect(footer).toHaveClass(
        'justify-between',
        'border-t',
        'flex',
        'items-center',
        'p-6',
        'pt-0',
      );
    });

    it('forwards ref to HTMLDivElement', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<CardFooter ref={ref} data-testid="footer-ref" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('footer-ref'));
    });
  });

  describe('Full Card composition', () => {
    it('renders complete composite card structure and handles interaction', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();

      render(
        <Card className="w-[400px]" data-testid="composite-card">
          <CardHeader data-testid="composite-card-header">
            <CardTitle>Tổng quan đơn hàng</CardTitle>
            <CardDescription>Danh sách đơn hàng cần xử lý</CardDescription>
          </CardHeader>
          <CardContent data-testid="composite-card-content">
            <form
              id="order-filter-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <input
                aria-label="Mã đơn hàng"
                defaultValue="DH-100234"
                readOnly
              />
            </form>
          </CardContent>
          <CardFooter
            className="flex justify-between"
            data-testid="composite-card-footer"
          >
            <button type="button">Đặt lại</button>
            <button type="submit" form="order-filter-form">
              Tìm kiếm
            </button>
          </CardFooter>
        </Card>,
      );

      expect(screen.getByTestId('composite-card')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: 'Tổng quan đơn hàng' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Danh sách đơn hàng cần xử lý'),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('DH-100234')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Đặt lại' }),
      ).toBeInTheDocument();

      const submitButton = screen.getByRole('button', { name: 'Tìm kiếm' });
      await user.click(submitButton);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
