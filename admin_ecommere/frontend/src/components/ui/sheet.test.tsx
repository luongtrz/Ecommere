import * as React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './sheet';

describe('Sheet components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('has correct displayNames', () => {
    expect(SheetOverlay.displayName).toBe(SheetPrimitive.Overlay.displayName);
    expect(SheetContent.displayName).toBe(SheetPrimitive.Content.displayName);
    expect(SheetHeader.displayName).toBe('SheetHeader');
    expect(SheetFooter.displayName).toBe('SheetFooter');
    expect(SheetTitle.displayName).toBe(SheetPrimitive.Title.displayName);
    expect(SheetDescription.displayName).toBe(
      SheetPrimitive.Description.displayName,
    );
  });

  it('renders a full Sheet and handles open/close user interactions via Trigger and Close', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Sheet onOpenChange={handleOpenChange}>
        <SheetTrigger>Mở bảng điều khiển</SheetTrigger>
        <SheetContent data-testid="sheet-content">
          <SheetHeader>
            <SheetTitle>Bảng điều khiển giỏ hàng</SheetTitle>
            <SheetDescription>
              Chi tiết các mặt hàng bạn đã chọn
            </SheetDescription>
          </SheetHeader>
          <div>Nội dung giỏ hàng</div>
          <SheetFooter>
            <SheetClose data-testid="custom-close-btn">Đóng lại</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    // Initially sheet content is not rendered
    expect(
      screen.queryByText('Bảng điều khiển giỏ hàng'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();

    // Click trigger to open
    const trigger = screen.getByRole('button', { name: 'Mở bảng điều khiển' });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Bảng điều khiển giỏ hàng')).toBeInTheDocument();
    expect(
      screen.getByText('Chi tiết các mặt hàng bạn đã chọn'),
    ).toBeInTheDocument();
    expect(screen.getByText('Nội dung giỏ hàng')).toBeInTheDocument();

    // Click custom close button
    const customCloseBtn = screen.getByTestId('custom-close-btn');
    await user.click(customCloseBtn);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when clicking the built-in close button inside SheetContent', () => {
    const handleOpenChange = vi.fn();

    render(
      <Sheet defaultOpen={true} onOpenChange={handleOpenChange}>
        <SheetContent>
          <SheetTitle>Tiêu đề</SheetTitle>
          <SheetDescription>Mô tả</SheetDescription>
        </SheetContent>
      </Sheet>,
    );

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  describe('SheetContent variants and props', () => {
    it('applies default right side variant when side is not provided', () => {
      render(
        <Sheet open={true}>
          <SheetContent data-testid="content-default">
            <SheetTitle>Mặc định</SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const content = screen.getByTestId('content-default');
      expect(content).toHaveClass('inset-y-0 right-0 h-full w-3/4 border-l');
    });

    it('applies right side variant when explicitly set', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="right" data-testid="content-right">
            <SheetTitle>Phía phải</SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const content = screen.getByTestId('content-right');
      expect(content).toHaveClass('inset-y-0 right-0 h-full w-3/4 border-l');
    });

    it('applies top side variant', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="top" data-testid="content-top">
            <SheetTitle>Phía trên</SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const content = screen.getByTestId('content-top');
      expect(content).toHaveClass('inset-x-0 top-0 border-b');
    });

    it('applies bottom side variant', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="bottom" data-testid="content-bottom">
            <SheetTitle>Phía dưới</SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const content = screen.getByTestId('content-bottom');
      expect(content).toHaveClass('inset-x-0 bottom-0 border-t');
    });

    it('applies left side variant', () => {
      render(
        <Sheet open={true}>
          <SheetContent side="left" data-testid="content-left">
            <SheetTitle>Phía trái</SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const content = screen.getByTestId('content-left');
      expect(content).toHaveClass('inset-y-0 left-0 h-full w-3/4 border-r');
    });

    it('merges custom className on SheetContent and forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Sheet open={true}>
          <SheetContent
            ref={ref}
            className="custom-sheet-class"
            data-testid="content-custom"
          >
            <SheetTitle>Tùy chỉnh</SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const content = screen.getByTestId('content-custom');
      expect(content).toHaveClass('custom-sheet-class');
      expect(ref.current).toBe(content);
    });
  });

  describe('SheetOverlay', () => {
    it('renders with default classes, custom className, and forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Sheet open={true}>
          <SheetPortal>
            <SheetOverlay
              ref={ref}
              className="custom-overlay"
              data-testid="sheet-overlay"
            />
          </SheetPortal>
        </Sheet>,
      );

      const overlay = screen.getByTestId('sheet-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed inset-0 z-50 bg-background/80');
      expect(overlay).toHaveClass('custom-overlay');
      expect(ref.current).toBe(overlay);
    });

    it('renders without custom className', () => {
      render(
        <Sheet open={true}>
          <SheetPortal>
            <SheetOverlay data-testid="sheet-overlay-default" />
          </SheetPortal>
        </Sheet>,
      );

      const overlay = screen.getByTestId('sheet-overlay-default');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed inset-0 z-50 bg-background/80');
    });
  });

  describe('SheetHeader and SheetFooter', () => {
    it('renders SheetHeader with default and custom classes', () => {
      render(
        <SheetHeader className="header-extra" data-testid="sheet-header">
          <span>Tiêu đề phần đầu</span>
        </SheetHeader>,
      );

      const header = screen.getByTestId('sheet-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass(
        'flex flex-col space-y-2 text-center sm:text-left',
      );
      expect(header).toHaveClass('header-extra');
      expect(screen.getByText('Tiêu đề phần đầu')).toBeInTheDocument();
    });

    it('renders SheetHeader without custom className', () => {
      render(
        <SheetHeader data-testid="sheet-header-default">
          <span>Phần đầu</span>
        </SheetHeader>,
      );

      const header = screen.getByTestId('sheet-header-default');
      expect(header).toHaveClass(
        'flex flex-col space-y-2 text-center sm:text-left',
      );
    });

    it('renders SheetFooter with default and custom classes', () => {
      render(
        <SheetFooter className="footer-extra" data-testid="sheet-footer">
          <span>Chân trang</span>
        </SheetFooter>,
      );

      const footer = screen.getByTestId('sheet-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      );
      expect(footer).toHaveClass('footer-extra');
      expect(screen.getByText('Chân trang')).toBeInTheDocument();
    });

    it('renders SheetFooter without custom className', () => {
      render(
        <SheetFooter data-testid="sheet-footer-default">
          <span>Chân trang mặc định</span>
        </SheetFooter>,
      );

      const footer = screen.getByTestId('sheet-footer-default');
      expect(footer).toHaveClass(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      );
    });
  });

  describe('SheetTitle and SheetDescription', () => {
    it('renders SheetTitle with ref, default and custom classes', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle
              ref={ref}
              className="title-extra"
              data-testid="sheet-title"
            >
              Tiêu đề chính
            </SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const title = screen.getByTestId('sheet-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass(
        'text-lg font-semibold text-foreground title-extra',
      );
      expect(ref.current).toBe(title);
    });

    it('renders SheetTitle without custom className', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle data-testid="sheet-title-default">
              Tiêu đề gốc
            </SheetTitle>
          </SheetContent>
        </Sheet>,
      );

      const title = screen.getByTestId('sheet-title-default');
      expect(title).toHaveClass('text-lg font-semibold text-foreground');
    });

    it('renders SheetDescription with ref, default and custom classes', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Tiêu đề</SheetTitle>
            <SheetDescription
              ref={ref}
              className="desc-extra"
              data-testid="sheet-desc"
            >
              Mô tả chi tiết
            </SheetDescription>
          </SheetContent>
        </Sheet>,
      );

      const desc = screen.getByTestId('sheet-desc');
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveClass('text-sm text-muted-foreground desc-extra');
      expect(ref.current).toBe(desc);
    });

    it('renders SheetDescription without custom className', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetTitle>Tiêu đề</SheetTitle>
            <SheetDescription data-testid="sheet-desc-default">
              Mô tả mặc định
            </SheetDescription>
          </SheetContent>
        </Sheet>,
      );

      const desc = screen.getByTestId('sheet-desc-default');
      expect(desc).toHaveClass('text-sm text-muted-foreground');
    });
  });
});
