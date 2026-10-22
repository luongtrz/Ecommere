import * as React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

describe('Dialog components', () => {
  afterEach(() => {
    cleanup();
  });
  it('has correct displayNames', () => {
    expect(DialogOverlay.displayName).toBe(DialogPrimitive.Overlay.displayName);
    expect(DialogContent.displayName).toBe(DialogPrimitive.Content.displayName);
    expect(DialogHeader.displayName).toBe('DialogHeader');
    expect(DialogFooter.displayName).toBe('DialogFooter');
    expect(DialogTitle.displayName).toBe(DialogPrimitive.Title.displayName);
    expect(DialogDescription.displayName).toBe(
      DialogPrimitive.Description.displayName,
    );
  });

  it('renders a full Dialog and handles open/close user interactions via Trigger and Close', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Mở hộp thoại</DialogTrigger>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa địa chỉ</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa địa chỉ giao hàng này không?
            </DialogDescription>
          </DialogHeader>
          <div>Thông tin địa chỉ chi tiết</div>
          <DialogFooter>
            <DialogClose data-testid="custom-cancel-btn">Hủy bỏ</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    // Initially dialog content is not in the document
    expect(screen.queryByText('Xác nhận xóa địa chỉ')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();

    // Click trigger to open
    const trigger = screen.getByRole('button', { name: 'Mở hộp thoại' });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Xác nhận xóa địa chỉ')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Bạn có chắc chắn muốn xóa địa chỉ giao hàng này không?',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Thông tin địa chỉ chi tiết')).toBeInTheDocument();

    // Click custom close button
    const customCloseBtn = screen.getByTestId('custom-cancel-btn');
    await user.click(customCloseBtn);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when clicking the built-in close button inside DialogContent', () => {
    const handleOpenChange = vi.fn();

    render(
      <Dialog defaultOpen={true} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogTitle>Tiêu đề hộp thoại</DialogTitle>
          <DialogDescription>Mô tả hộp thoại</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('merges custom className and forwards ref on DialogContent', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Dialog open={true}>
        <DialogContent
          ref={ref}
          className="custom-dialog-class"
          data-testid="dialog-custom"
        >
          <DialogTitle>Tùy chỉnh</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    const content = screen.getByTestId('dialog-custom');
    expect(content).toHaveClass('custom-dialog-class');
    expect(content).toHaveClass(
      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg',
    );
    expect(ref.current).toBe(content);
  });

  describe('DialogOverlay', () => {
    it('renders with default classes, custom className, and forwards ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Dialog open={true}>
          <DialogPortal>
            <DialogOverlay
              ref={ref}
              className="custom-dialog-overlay"
              data-testid="dialog-overlay"
            />
          </DialogPortal>
        </Dialog>,
      );

      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed inset-0 z-50 bg-slate-900/50');
      expect(overlay).toHaveClass('custom-dialog-overlay');
      expect(ref.current).toBe(overlay);
    });

    it('renders without custom className', () => {
      render(
        <Dialog open={true}>
          <DialogPortal>
            <DialogOverlay data-testid="dialog-overlay-default" />
          </DialogPortal>
        </Dialog>,
      );

      const overlay = screen.getByTestId('dialog-overlay-default');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('fixed inset-0 z-50 bg-slate-900/50');
    });
  });

  describe('DialogHeader and DialogFooter', () => {
    it('renders DialogHeader with default and custom classes', () => {
      render(
        <DialogHeader className="header-extra" data-testid="dialog-header">
          <span>Tiêu đề phần đầu</span>
        </DialogHeader>,
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass(
        'flex flex-col space-y-1.5 text-center sm:text-left',
      );
      expect(header).toHaveClass('header-extra');
      expect(screen.getByText('Tiêu đề phần đầu')).toBeInTheDocument();
    });

    it('renders DialogHeader without custom className', () => {
      render(
        <DialogHeader data-testid="dialog-header-default">
          <span>Phần đầu</span>
        </DialogHeader>,
      );

      const header = screen.getByTestId('dialog-header-default');
      expect(header).toHaveClass(
        'flex flex-col space-y-1.5 text-center sm:text-left',
      );
    });

    it('renders DialogFooter with default and custom classes', () => {
      render(
        <DialogFooter className="footer-extra" data-testid="dialog-footer">
          <span>Chân trang</span>
        </DialogFooter>,
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      );
      expect(footer).toHaveClass('footer-extra');
      expect(screen.getByText('Chân trang')).toBeInTheDocument();
    });

    it('renders DialogFooter without custom className', () => {
      render(
        <DialogFooter data-testid="dialog-footer-default">
          <span>Chân trang mặc định</span>
        </DialogFooter>,
      );

      const footer = screen.getByTestId('dialog-footer-default');
      expect(footer).toHaveClass(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      );
    });
  });

  describe('DialogTitle and DialogDescription', () => {
    it('renders DialogTitle with ref, default and custom classes', () => {
      const ref = React.createRef<HTMLHeadingElement>();
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle
              ref={ref}
              className="title-extra"
              data-testid="dialog-title"
            >
              Tiêu đề chính
            </DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      const title = screen.getByTestId('dialog-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass(
        'text-lg font-semibold leading-none tracking-tight title-extra',
      );
      expect(ref.current).toBe(title);
    });

    it('renders DialogTitle without custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle data-testid="dialog-title-default">
              Tiêu đề gốc
            </DialogTitle>
          </DialogContent>
        </Dialog>,
      );

      const title = screen.getByTestId('dialog-title-default');
      expect(title).toHaveClass(
        'text-lg font-semibold leading-none tracking-tight',
      );
    });

    it('renders DialogDescription with ref, default and custom classes', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Tiêu đề</DialogTitle>
            <DialogDescription
              ref={ref}
              className="desc-extra"
              data-testid="dialog-desc"
            >
              Mô tả chi tiết
            </DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      const desc = screen.getByTestId('dialog-desc');
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveClass('text-sm text-slate-500 desc-extra');
      expect(ref.current).toBe(desc);
    });

    it('renders DialogDescription without custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Tiêu đề</DialogTitle>
            <DialogDescription data-testid="dialog-desc-default">
              Mô tả mặc định
            </DialogDescription>
          </DialogContent>
        </Dialog>,
      );

      const desc = screen.getByTestId('dialog-desc-default');
      expect(desc).toHaveClass('text-sm text-slate-500');
    });
  });
});
