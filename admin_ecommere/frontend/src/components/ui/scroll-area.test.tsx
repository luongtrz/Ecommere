import * as React from 'react';
import { describe, expect, it, beforeAll, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { ScrollArea, ScrollBar } from './scroll-area';

beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.ResizeObserver = MockResizeObserver;
  window.ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  cleanup();
});

describe('ScrollArea', () => {
  it('renders children correctly inside the viewport', () => {
    render(
      <ScrollArea data-testid="scroll-area-basic">
        <div>Danh sách đơn hàng cần duyệt</div>
      </ScrollArea>,
    );

    const root = screen.getByTestId('scroll-area-basic');
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass('relative', 'overflow-hidden');
    expect(
      screen.getByText('Danh sách đơn hàng cần duyệt'),
    ).toBeInTheDocument();
  });

  it('merges custom className with default classes', () => {
    render(
      <ScrollArea
        className="h-72 w-48 custom-admin-scroll"
        data-testid="scroll-area-custom"
      >
        <div>Nội dung quản trị viên</div>
      </ScrollArea>,
    );

    const root = screen.getByTestId('scroll-area-custom');
    expect(root).toHaveClass(
      'relative',
      'overflow-hidden',
      'h-72',
      'w-48',
      'custom-admin-scroll',
    );
  });

  it('forwards ref to the underlying root DOM element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollArea ref={ref} data-testid="scroll-area-ref">
        <div>Nội dung với ref</div>
      </ScrollArea>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByTestId('scroll-area-ref'));
  });

  it('has the correct displayName set from Radix Root', () => {
    expect(ScrollArea.displayName).toBe(ScrollAreaPrimitive.Root.displayName);
  });

  it('renders the built-in ScrollBar with vertical orientation by default', () => {
    const { container } = render(
      <ScrollArea type="always" data-testid="scroll-area-builtin-bar">
        <div style={{ height: 1000 }}>Nội dung danh mục sản phẩm dài</div>
      </ScrollArea>,
    );

    const scrollbar = container.querySelector('[data-orientation="vertical"]');
    expect(scrollbar).toBeInTheDocument();
    expect(scrollbar).toHaveClass(
      'flex',
      'touch-none',
      'select-none',
      'transition-colors',
      'h-full',
      'w-2.5',
      'border-l',
      'border-l-transparent',
      'p-[1px]',
    );
  });
});

describe('ScrollBar', () => {
  it('renders with default vertical orientation when orientation prop is omitted', () => {
    render(
      <ScrollAreaPrimitive.Root type="always">
        <ScrollAreaPrimitive.Viewport>
          <div>Nội dung cuộn dọc</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar data-testid="scrollbar-default" />
      </ScrollAreaPrimitive.Root>,
    );

    const bar = screen.getByTestId('scrollbar-default');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('data-orientation', 'vertical');
    expect(bar).toHaveClass(
      'flex',
      'touch-none',
      'select-none',
      'transition-colors',
      'h-full',
      'w-2.5',
      'border-l',
      'border-l-transparent',
      'p-[1px]',
    );
    expect(bar).not.toHaveClass('flex-col', 'border-t');
  });

  it('renders with explicit vertical orientation', () => {
    render(
      <ScrollAreaPrimitive.Root type="always">
        <ScrollAreaPrimitive.Viewport>
          <div>Nội dung dọc rõ ràng</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar orientation="vertical" data-testid="scrollbar-vertical" />
      </ScrollAreaPrimitive.Root>,
    );

    const bar = screen.getByTestId('scrollbar-vertical');
    expect(bar).toHaveAttribute('data-orientation', 'vertical');
    expect(bar).toHaveClass(
      'h-full',
      'w-2.5',
      'border-l',
      'border-l-transparent',
      'p-[1px]',
    );
    expect(bar).not.toHaveClass('flex-col', 'border-t');
  });

  it('renders with horizontal orientation and applies horizontal classes', () => {
    render(
      <ScrollAreaPrimitive.Root type="always">
        <ScrollAreaPrimitive.Viewport>
          <div>Nội dung ngang bảng số liệu</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar
          orientation="horizontal"
          data-testid="scrollbar-horizontal"
        />
      </ScrollAreaPrimitive.Root>,
    );

    const bar = screen.getByTestId('scrollbar-horizontal');
    expect(bar).toHaveAttribute('data-orientation', 'horizontal');
    expect(bar).toHaveClass(
      'flex',
      'touch-none',
      'select-none',
      'transition-colors',
      'h-2.5',
      'flex-col',
      'border-t',
      'border-t-transparent',
      'p-[1px]',
    );
    expect(bar).not.toHaveClass('border-l', 'border-l-transparent');
  });

  it('applies custom className to ScrollBar', () => {
    render(
      <ScrollAreaPrimitive.Root type="always">
        <ScrollAreaPrimitive.Viewport>
          <div>Nội dung tùy chỉnh thanh cuộn</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar
          orientation="horizontal"
          className="custom-bar-class bg-slate-100"
          data-testid="scrollbar-custom"
        />
      </ScrollAreaPrimitive.Root>,
    );

    const bar = screen.getByTestId('scrollbar-custom');
    expect(bar).toHaveClass(
      'custom-bar-class',
      'bg-slate-100',
      'h-2.5',
      'flex-col',
    );
  });

  it('forwards ref to the scrollbar element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollAreaPrimitive.Root type="always">
        <ScrollAreaPrimitive.Viewport>
          <div>Kiểm tra ref thanh cuộn</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar ref={ref} data-testid="scrollbar-ref" />
      </ScrollAreaPrimitive.Root>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByTestId('scrollbar-ref'));
  });

  it('has the correct displayName set from Radix ScrollAreaScrollbar', () => {
    expect(ScrollBar.displayName).toBe(
      ScrollAreaPrimitive.ScrollAreaScrollbar.displayName,
    );
  });
});
