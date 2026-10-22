import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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
  afterEach(() => {
    cleanup();
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
    it('renders div with default styling', () => {
      render(<Card data-testid="card-default">Card Content</Card>);
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
      expect(card).toHaveTextContent('Card Content');
    });

    it('merges custom className with default classes', () => {
      render(
        <Card className="custom-card-class" data-testid="card-custom-class" />,
      );
      const card = screen.getByTestId('card-custom-class');

      expect(card).toHaveClass('custom-card-class', 'rounded-lg', 'border');
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
          aria-label="Summary"
          onClick={handleClick}
        />,
      );

      const card = screen.getByTestId('card-click');
      expect(card).toHaveAttribute('role', 'region');
      expect(card).toHaveAttribute('aria-label', 'Summary');

      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('CardHeader', () => {
    it('renders div with default header styling', () => {
      render(<CardHeader data-testid="header-default">Header text</CardHeader>);
      const header = screen.getByTestId('header-default');

      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('DIV');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
      expect(header).toHaveTextContent('Header text');
    });

    it('merges custom className', () => {
      render(
        <CardHeader
          className="custom-header-class"
          data-testid="header-custom-class"
        />,
      );
      const header = screen.getByTestId('header-custom-class');

      expect(header).toHaveClass(
        'custom-header-class',
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
  });

  describe('CardTitle', () => {
    it('renders h3 with default styling and children', () => {
      render(<CardTitle data-testid="title-default">Tiêu đề thẻ</CardTitle>);
      const title = screen.getByTestId('title-default');

      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight',
      );
      expect(title).toHaveTextContent('Tiêu đề thẻ');
    });

    it('merges custom className and extra props', () => {
      render(
        <CardTitle
          className="text-primary text-xl"
          id="custom-card-title-id"
          data-testid="title-custom-class"
        >
          Title
        </CardTitle>,
      );
      const title = screen.getByTestId('title-custom-class');

      expect(title).toHaveClass('text-primary', 'text-xl', 'font-semibold');
      expect(title).toHaveAttribute('id', 'custom-card-title-id');
    });

    it('forwards ref to HTMLHeadingElement', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(
        <CardTitle ref={ref} data-testid="title-ref">
          Title
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
          Mô tả chi tiết nội dung
        </CardDescription>,
      );
      const desc = screen.getByTestId('desc-default');

      expect(desc).toBeInTheDocument();
      expect(desc.tagName).toBe('P');
      expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
      expect(desc).toHaveTextContent('Mô tả chi tiết nội dung');
    });

    it('merges custom className', () => {
      render(
        <CardDescription
          className="custom-desc-class"
          data-testid="desc-custom-class"
        >
          Desc
        </CardDescription>,
      );
      const desc = screen.getByTestId('desc-custom-class');

      expect(desc).toHaveClass(
        'custom-desc-class',
        'text-sm',
        'text-muted-foreground',
      );
    });

    it('forwards ref to HTMLParagraphElement', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <CardDescription ref={ref} data-testid="desc-ref">
          Desc
        </CardDescription>,
      );

      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
      expect(ref.current).toBe(screen.getByTestId('desc-ref'));
    });
  });

  describe('CardContent', () => {
    it('renders div with default content styling', () => {
      render(
        <CardContent data-testid="content-default">Nội dung chính</CardContent>,
      );
      const content = screen.getByTestId('content-default');

      expect(content).toBeInTheDocument();
      expect(content.tagName).toBe('DIV');
      expect(content).toHaveClass('p-6', 'pt-0');
      expect(content).toHaveTextContent('Nội dung chính');
    });

    it('merges custom className', () => {
      render(
        <CardContent
          className="custom-content-class"
          data-testid="content-custom-class"
        />,
      );
      const content = screen.getByTestId('content-custom-class');

      expect(content).toHaveClass('custom-content-class', 'p-6', 'pt-0');
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
      render(<CardFooter data-testid="footer-default">Chân thẻ</CardFooter>);
      const footer = screen.getByTestId('footer-default');

      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe('DIV');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
      expect(footer).toHaveTextContent('Chân thẻ');
    });

    it('merges custom className', () => {
      render(
        <CardFooter
          className="justify-between"
          data-testid="footer-custom-class"
        />,
      );
      const footer = screen.getByTestId('footer-custom-class');

      expect(footer).toHaveClass(
        'justify-between',
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
        <Card className="w-[350px]" data-testid="composite-card">
          <CardHeader data-testid="composite-card-header">
            <CardTitle>Thông tin tài khoản</CardTitle>
            <CardDescription>Cập nhật chi tiết hồ sơ cá nhân</CardDescription>
          </CardHeader>
          <CardContent data-testid="composite-card-content">
            <form
              id="profile-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <input
                aria-label="Họ và tên"
                defaultValue="Nguyễn Văn A"
                readOnly
              />
            </form>
          </CardContent>
          <CardFooter
            className="flex justify-between"
            data-testid="composite-card-footer"
          >
            <button type="button">Hủy</button>
            <button type="submit" form="profile-form">
              Lưu thay đổi
            </button>
          </CardFooter>
        </Card>,
      );

      expect(screen.getByTestId('composite-card')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 3, name: 'Thông tin tài khoản' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Cập nhật chi tiết hồ sơ cá nhân'),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: 'Lưu thay đổi' });
      await user.click(saveButton);
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
