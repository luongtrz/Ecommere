import * as React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  type ToastProps,
  type ToastActionElement,
} from './toast';

describe('Toast components', () => {
  afterEach(() => {
    cleanup();
  });

  it('has correct displayNames', () => {
    expect(ToastViewport.displayName).toBe(
      ToastPrimitives.Viewport.displayName,
    );
    expect(Toast.displayName).toBe(ToastPrimitives.Root.displayName);
    expect(ToastAction.displayName).toBe(ToastPrimitives.Action.displayName);
    expect(ToastClose.displayName).toBe(ToastPrimitives.Close.displayName);
    expect(ToastTitle.displayName).toBe(ToastPrimitives.Title.displayName);
    expect(ToastDescription.displayName).toBe(
      ToastPrimitives.Description.displayName,
    );
  });

  it('exports valid TypeScript types', () => {
    const props: ToastProps = {
      variant: 'default',
      className: 'test-class',
    };
    const actionElement: ToastActionElement = (
      <ToastAction altText="Thao tác">Thao tác</ToastAction>
    );

    expect(props.variant).toBe('default');
    expect(actionElement).toBeDefined();
  });

  it('renders a full Toast composition with default variant', () => {
    render(
      <ToastProvider>
        <Toast open={true} data-testid="toast-root">
          <ToastTitle>Thông báo thành công</ToastTitle>
          <ToastDescription>Dữ liệu đã được cập nhật</ToastDescription>
          <ToastAction altText="Hoàn tác">Hoàn tác</ToastAction>
          <ToastClose data-testid="toast-close-composed" />
        </Toast>
        <ToastViewport data-testid="toast-viewport" />
      </ToastProvider>,
    );

    expect(screen.getByText('Thông báo thành công')).toBeInTheDocument();
    expect(screen.getByText('Dữ liệu đã được cập nhật')).toBeInTheDocument();
    expect(screen.getByText('Hoàn tác')).toBeInTheDocument();

    const root = screen.getByTestId('toast-root');
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass('border border-slate-200 bg-white text-slate-900');

    const viewport = screen.getByTestId('toast-viewport');
    expect(viewport).toBeInTheDocument();
  });

  it('renders Toast with destructive variant', () => {
    render(
      <ToastProvider>
        <Toast
          open={true}
          variant="destructive"
          data-testid="toast-destructive"
        >
          <ToastTitle>Đã xảy ra lỗi</ToastTitle>
          <ToastDescription>Vui lòng thử lại sau</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );

    const root = screen.getByTestId('toast-destructive');
    expect(root).toHaveClass(
      'destructive group border-rose-200 bg-rose-50 text-rose-900',
    );
    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng thử lại sau')).toBeInTheDocument();
  });

  it('renders Toast with explicit default variant', () => {
    render(
      <ToastProvider>
        <Toast open={true} variant="default" data-testid="toast-default">
          <ToastTitle>Mặc định</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );

    const root = screen.getByTestId('toast-default');
    expect(root).toHaveClass('border border-slate-200 bg-white text-slate-900');
  });

  it('merges custom className and forwards ref on Toast', () => {
    const ref = React.createRef<HTMLLIElement>();
    render(
      <ToastProvider>
        <Toast
          ref={ref}
          open={true}
          className="custom-toast"
          data-testid="toast-custom"
        >
          <ToastTitle>Tiêu đề</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );

    const root = screen.getByTestId('toast-custom');
    expect(root).toHaveClass('custom-toast');
    expect(ref.current).toBe(root);
  });

  describe('ToastAction', () => {
    it('handles click interaction, custom className, and forwards ref', () => {
      const handleClick = vi.fn();
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <ToastProvider>
          <Toast open={true}>
            <ToastTitle>Thao tác</ToastTitle>
            <ToastAction
              ref={ref}
              altText="Thử lại"
              className="custom-action"
              onClick={handleClick}
              data-testid="toast-action"
            >
              Thử lại
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const action = screen.getByTestId('toast-action');
      expect(action).toHaveClass('custom-action');
      expect(action).toHaveClass(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-lg border',
      );
      expect(ref.current).toBe(action);

      fireEvent.click(action);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders without custom className and supports disabled state', () => {
      render(
        <ToastProvider>
          <Toast open={true}>
            <ToastTitle>Thao tác</ToastTitle>
            <ToastAction
              altText="Vô hiệu hóa"
              disabled
              data-testid="toast-action-disabled"
            >
              Vô hiệu hóa
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const action = screen.getByTestId('toast-action-disabled');
      expect(action).toBeDisabled();
      expect(action).toHaveClass(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-lg border',
      );
    });
  });

  describe('ToastClose', () => {
    it('renders close button, custom className, toast-close attribute, and handles click', () => {
      const handleOpenChange = vi.fn();
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <ToastProvider>
          <Toast open={true} onOpenChange={handleOpenChange}>
            <ToastTitle>Tiêu đề</ToastTitle>
            <ToastClose
              ref={ref}
              className="custom-close"
              data-testid="toast-close"
            />
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const closeBtn = screen.getByTestId('toast-close');
      expect(closeBtn).toHaveAttribute('toast-close', '');
      expect(closeBtn).toHaveClass('custom-close');
      expect(closeBtn).toHaveClass('absolute right-2 top-2 rounded-lg p-1');
      expect(ref.current).toBe(closeBtn);

      fireEvent.click(closeBtn);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('renders without custom className', () => {
      render(
        <ToastProvider>
          <Toast open={true}>
            <ToastTitle>Tiêu đề</ToastTitle>
            <ToastClose data-testid="toast-close-default" />
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const closeBtn = screen.getByTestId('toast-close-default');
      expect(closeBtn).toHaveAttribute('toast-close', '');
      expect(closeBtn).toHaveClass('absolute right-2 top-2 rounded-lg p-1');
    });
  });

  describe('ToastViewport', () => {
    it('renders with custom className and forwards ref', () => {
      const ref = React.createRef<HTMLOListElement>();
      render(
        <ToastProvider>
          <ToastViewport
            ref={ref}
            className="custom-viewport"
            data-testid="viewport-custom"
          />
        </ToastProvider>,
      );

      const viewport = screen.getByTestId('viewport-custom');
      expect(viewport).toHaveClass('custom-viewport');
      expect(viewport).toHaveClass('fixed top-0 z-[100] flex max-h-screen');
      expect(ref.current).toBe(viewport);
    });

    it('renders without custom className', () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport-default" />
        </ToastProvider>,
      );

      const viewport = screen.getByTestId('viewport-default');
      expect(viewport).toHaveClass('fixed top-0 z-[100] flex max-h-screen');
    });
  });

  describe('ToastTitle and ToastDescription', () => {
    it('renders ToastTitle with custom className and forwards ref', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(
        <ToastProvider>
          <Toast open={true}>
            <ToastTitle
              ref={ref}
              className="custom-title"
              data-testid="toast-title-custom"
            >
              Tiêu đề tùy chỉnh
            </ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const title = screen.getByTestId('toast-title-custom');
      expect(title).toHaveClass('text-sm font-semibold custom-title');
      expect(ref.current).toBe(title);
    });

    it('renders ToastTitle without custom className', () => {
      render(
        <ToastProvider>
          <Toast open={true}>
            <ToastTitle data-testid="toast-title-default">
              Tiêu đề mặc định
            </ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const title = screen.getByTestId('toast-title-default');
      expect(title).toHaveClass('text-sm font-semibold');
    });

    it('renders ToastDescription with custom className and forwards ref', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <ToastProvider>
          <Toast open={true}>
            <ToastDescription
              ref={ref}
              className="custom-desc"
              data-testid="toast-desc-custom"
            >
              Mô tả tùy chỉnh
            </ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const desc = screen.getByTestId('toast-desc-custom');
      expect(desc).toHaveClass('text-sm text-slate-500 custom-desc');
      expect(ref.current).toBe(desc);
    });

    it('renders ToastDescription without custom className', () => {
      render(
        <ToastProvider>
          <Toast open={true}>
            <ToastDescription data-testid="toast-desc-default">
              Mô tả mặc định
            </ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );

      const desc = screen.getByTestId('toast-desc-default');
      expect(desc).toHaveClass('text-sm text-slate-500');
    });
  });
});
