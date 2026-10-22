import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert UI components', () => {
  afterEach(() => {
    cleanup();
  });

  describe('displayName checks', () => {
    it('sets correct displayName for each component', () => {
      expect(Alert.displayName).toBe('Alert');
      expect(AlertTitle.displayName).toBe('AlertTitle');
      expect(AlertDescription.displayName).toBe('AlertDescription');
    });
  });

  describe('Alert', () => {
    it('renders alert div with role="alert" and default variant classes when variant is undefined', () => {
      render(<Alert data-testid="alert-default">Default alert text</Alert>);
      const alert = screen.getByTestId('alert-default');

      expect(alert).toBeInTheDocument();
      expect(alert.tagName).toBe('DIV');
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveClass(
        'relative',
        'w-full',
        'rounded-xl',
        'border',
        'p-4',
        'border-slate-200',
        'bg-white',
        'text-slate-900',
      );
      expect(alert).toHaveTextContent('Default alert text');
    });

    it('renders with explicit default variant', () => {
      render(
        <Alert variant="default" data-testid="alert-variant-default">
          Default variant
        </Alert>,
      );
      const alert = screen.getByTestId('alert-variant-default');

      expect(alert).toHaveClass(
        'border-slate-200',
        'bg-white',
        'text-slate-900',
      );
    });

    it('renders with destructive variant', () => {
      render(
        <Alert variant="destructive" data-testid="alert-variant-destructive">
          Lỗi nghiêm trọng
        </Alert>,
      );
      const alert = screen.getByTestId('alert-variant-destructive');

      expect(alert).toHaveClass(
        'border-rose-200',
        'bg-rose-50',
        'text-rose-700',
        '[&>svg]:text-rose-600',
      );
    });

    it('merges custom className with variant styles', () => {
      render(
        <Alert
          className="custom-alert-class shadow-md"
          data-testid="alert-custom-class"
        />,
      );
      const alert = screen.getByTestId('alert-custom-class');

      expect(alert).toHaveClass(
        'custom-alert-class',
        'shadow-md',
        'relative',
        'rounded-xl',
      );
    });

    it('forwards ref to HTMLDivElement', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Alert ref={ref} data-testid="alert-ref" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('alert-ref'));
    });

    it('passes extra attributes and handles user click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <Alert
          data-testid="alert-click"
          aria-live="assertive"
          onClick={handleClick}
        />,
      );

      const alert = screen.getByTestId('alert-click');
      expect(alert).toHaveAttribute('aria-live', 'assertive');

      await user.click(alert);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('AlertTitle', () => {
    it('renders h5 heading with default styling and children', () => {
      render(
        <AlertTitle data-testid="alert-title-default">
          Tiêu đề cảnh báo
        </AlertTitle>,
      );
      const title = screen.getByTestId('alert-title-default');

      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H5');
      expect(title).toHaveClass(
        'mb-1',
        'font-semibold',
        'leading-none',
        'tracking-tight',
      );
      expect(title).toHaveTextContent('Tiêu đề cảnh báo');
    });

    it('merges custom className and passes extra props', () => {
      render(
        <AlertTitle
          className="custom-title-class"
          id="custom-alert-title-id"
          data-testid="alert-title-custom"
        >
          Title
        </AlertTitle>,
      );
      const title = screen.getByTestId('alert-title-custom');

      expect(title).toHaveClass('custom-title-class', 'mb-1', 'font-semibold');
      expect(title).toHaveAttribute('id', 'custom-alert-title-id');
    });

    it('forwards ref to HTMLParagraphElement / HTMLHeadingElement', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <AlertTitle ref={ref} data-testid="alert-title-ref">
          Title
        </AlertTitle>,
      );

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
      expect(ref.current).toBe(screen.getByTestId('alert-title-ref'));
    });
  });

  describe('AlertDescription', () => {
    it('renders div with default description styling', () => {
      render(
        <AlertDescription data-testid="alert-desc-default">
          <p>Nội dung chi tiết thông báo cảnh báo.</p>
        </AlertDescription>,
      );
      const desc = screen.getByTestId('alert-desc-default');

      expect(desc).toBeInTheDocument();
      expect(desc.tagName).toBe('DIV');
      expect(desc).toHaveClass('text-sm', '[&_p]:leading-relaxed');
      expect(desc).toHaveTextContent('Nội dung chi tiết thông báo cảnh báo.');
    });

    it('merges custom className and passes extra attributes', () => {
      render(
        <AlertDescription
          className="custom-desc-class"
          id="desc-id"
          data-testid="alert-desc-custom"
        >
          Detailed description
        </AlertDescription>,
      );
      const desc = screen.getByTestId('alert-desc-custom');

      expect(desc).toHaveClass('custom-desc-class', 'text-sm');
      expect(desc).toHaveAttribute('id', 'desc-id');
    });

    it('forwards ref to HTMLParagraphElement / HTMLDivElement', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <AlertDescription ref={ref} data-testid="alert-desc-ref">
          Desc
        </AlertDescription>,
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId('alert-desc-ref'));
    });
  });

  describe('Alert full composition', () => {
    it('renders default composite alert with title and description', () => {
      render(
        <Alert data-testid="composite-alert-default">
          <AlertTitle>Thông báo</AlertTitle>
          <AlertDescription>
            Đơn hàng của bạn đã được ghi nhận thành công.
          </AlertDescription>
        </Alert>,
      );

      const alert = screen.getByTestId('composite-alert-default');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(
        screen.getByRole('heading', { level: 5, name: 'Thông báo' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Đơn hàng của bạn đã được ghi nhận thành công.'),
      ).toBeInTheDocument();
    });

    it('renders destructive composite alert with title, description, and interactive element', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <Alert variant="destructive" data-testid="composite-alert-destructive">
          <AlertTitle>Có lỗi xảy ra</AlertTitle>
          <AlertDescription>
            <p>Không thể kết nối đến máy chủ. Vui lòng thử lại.</p>
            <button type="button" onClick={onRetry}>
              Thử lại
            </button>
          </AlertDescription>
        </Alert>,
      );

      const alert = screen.getByTestId('composite-alert-destructive');
      expect(alert).toHaveClass('text-rose-700');
      expect(
        screen.getByRole('heading', { level: 5, name: 'Có lỗi xảy ra' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Không thể kết nối đến máy chủ. Vui lòng thử lại.'),
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: 'Thử lại' });
      await user.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
