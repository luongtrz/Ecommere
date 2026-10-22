import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert UI components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      render(<Alert data-testid="alert-default">Thông báo hệ thống</Alert>);
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
        'bg-white',
        'text-slate-900',
      );
      expect(alert).toHaveTextContent('Thông báo hệ thống');
    });

    it('renders with explicit default variant', () => {
      render(
        <Alert variant="default" data-testid="alert-variant-default">
          Thông báo mặc định
        </Alert>,
      );
      const alert = screen.getByTestId('alert-variant-default');

      expect(alert).toHaveClass('bg-white', 'text-slate-900');
    });

    it('renders with destructive variant', () => {
      render(
        <Alert variant="destructive" data-testid="alert-variant-destructive">
          Lỗi nghiêm trọng khi tải dữ liệu
        </Alert>,
      );
      const alert = screen.getByTestId('alert-variant-destructive');

      expect(alert).toHaveClass(
        'border-rose-200',
        'bg-rose-50',
        'text-rose-700',
        '[&>svg]:text-rose-600',
      );
      expect(alert).toHaveTextContent('Lỗi nghiêm trọng khi tải dữ liệu');
    });

    it('merges custom className with variant styles', () => {
      render(
        <Alert
          className="custom-alert-class shadow-md"
          data-testid="alert-custom-class"
        >
          Thông báo có class tùy biến
        </Alert>,
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
        >
          Nhấp vào đây
        </Alert>,
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
          Cảnh báo tồn kho
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
      expect(title).toHaveTextContent('Cảnh báo tồn kho');
    });

    it('merges custom className and passes extra props', () => {
      render(
        <AlertTitle
          className="custom-title-class text-lg"
          id="custom-alert-title-id"
          data-testid="alert-title-custom"
        >
          Tiêu đề tùy biến
        </AlertTitle>,
      );
      const title = screen.getByTestId('alert-title-custom');

      expect(title).toHaveClass('custom-title-class', 'text-lg', 'font-semibold');
      expect(title).toHaveAttribute('id', 'custom-alert-title-id');
    });

    it('forwards ref to HTMLParagraphElement / HTMLHeadingElement', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <AlertTitle ref={ref} data-testid="alert-title-ref">
          Tiêu đề có ref
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
          <p>Sản phẩm đã hết hàng trong kho trung tâm.</p>
        </AlertDescription>,
      );
      const desc = screen.getByTestId('alert-desc-default');

      expect(desc).toBeInTheDocument();
      expect(desc.tagName).toBe('DIV');
      expect(desc).toHaveClass('text-sm', '[&_p]:leading-relaxed');
      expect(desc).toHaveTextContent(
        'Sản phẩm đã hết hàng trong kho trung tâm.',
      );
    });

    it('merges custom className and passes extra attributes', () => {
      render(
        <AlertDescription
          className="custom-desc-class font-light"
          id="desc-id"
          data-testid="alert-desc-custom"
        >
          Nội dung mô tả bổ sung
        </AlertDescription>,
      );
      const desc = screen.getByTestId('alert-desc-custom');

      expect(desc).toHaveClass('custom-desc-class', 'font-light', 'text-sm');
      expect(desc).toHaveAttribute('id', 'desc-id');
    });

    it('forwards ref to HTMLParagraphElement / HTMLDivElement', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <AlertDescription ref={ref} data-testid="alert-desc-ref">
          Mô tả ref
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
          <AlertTitle>Cập nhật thành công</AlertTitle>
          <AlertDescription>
            Thông tin sản phẩm đã được lưu vào cơ sở dữ liệu.
          </AlertDescription>
        </Alert>,
      );

      const alert = screen.getByTestId('composite-alert-default');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: 'Cập nhật thành công',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Thông tin sản phẩm đã được lưu vào cơ sở dữ liệu.'),
      ).toBeInTheDocument();
    });

    it('renders destructive composite alert with title, description, and interactive action', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <Alert variant="destructive" data-testid="composite-alert-destructive">
          <AlertTitle>Không thể kết nối máy chủ</AlertTitle>
          <AlertDescription>
            <p>Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.</p>
            <button type="button" onClick={onRetry}>
              Thử lại ngay
            </button>
          </AlertDescription>
        </Alert>,
      );

      const alert = screen.getByTestId('composite-alert-destructive');
      expect(alert).toHaveClass('text-rose-700');
      expect(
        screen.getByRole('heading', {
          level: 5,
          name: 'Không thể kết nối máy chủ',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.',
        ),
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: 'Thử lại ngay' });
      await user.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
