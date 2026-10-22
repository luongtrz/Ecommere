import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from './button';

afterEach(() => {
  cleanup();
});

describe('Button component', () => {
  it('renders a button element with default variants and children', () => {
    render(<Button>Bấm vào đây</Button>);
    const button = screen.getByRole('button', { name: 'Bấm vào đây' });
    expect(button).toBeInTheDocument();
    expect(button.tagName.toLowerCase()).toBe('button');
    expect(button).toHaveClass('bg-teal-600');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
  });

  it('renders with all variant options correctly', () => {
    const variants = [
      { variant: 'default', expectedClass: 'bg-teal-600' },
      { variant: 'destructive', expectedClass: 'bg-rose-600' },
      { variant: 'outline', expectedClass: 'border-slate-200' },
      { variant: 'secondary', expectedClass: 'text-slate-900' },
      { variant: 'ghost', expectedClass: 'hover:bg-slate-100' },
      { variant: 'link', expectedClass: 'underline-offset-4' },
    ] as const;

    for (const { variant, expectedClass } of variants) {
      const { unmount } = render(
        <Button variant={variant}>Nút {variant}</Button>,
      );
      const button = screen.getByRole('button', { name: `Nút ${variant}` });
      expect(button).toHaveClass(expectedClass);
      unmount();
    }
  });

  it('renders with all size options correctly', () => {
    const sizes = [
      { size: 'default', expectedClass: 'h-10 px-4 py-2' },
      { size: 'sm', expectedClass: 'h-9 rounded-lg px-3' },
      { size: 'lg', expectedClass: 'h-11 rounded-lg px-8' },
      { size: 'icon', expectedClass: 'h-10 w-10' },
    ] as const;

    for (const { size, expectedClass } of sizes) {
      const { unmount } = render(
        <Button size={size}>Kích thước {size}</Button>,
      );
      const button = screen.getByRole('button', {
        name: `Kích thước ${size}`,
      });
      for (const cls of expectedClass.split(' ')) {
        expect(button).toHaveClass(cls);
      }
      unmount();
    }
  });

  it('merges custom className with default classes', () => {
    render(<Button className="custom-test-class shadow-lg">Tùy chỉnh</Button>);
    const button = screen.getByRole('button', { name: 'Tùy chỉnh' });
    expect(button).toHaveClass('custom-test-class');
    expect(button).toHaveClass('shadow-lg');
    expect(button).toHaveClass('bg-teal-600');
  });

  it('handles user click event', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Nhấn tôi</Button>);

    const button = screen.getByRole('button', { name: 'Nhấn tôi' });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Vô hiệu hóa
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Vô hiệu hóa' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('forwards ref correctly to the HTML button element', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Tham chiếu</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Tham chiếu');
  });

  it('renders child element via Slot when asChild is true', () => {
    const { container } = render(
      <Button asChild>
        <a href="/trang-chu">Liên kết trang chủ</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Liên kết trang chủ' });
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe('a');
    expect(link).toHaveAttribute('href', '/trang-chu');
    expect(link).toHaveClass('bg-teal-600');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders as button when asChild is explicitly false', () => {
    render(<Button asChild={false}>Nút thường</Button>);
    const button = screen.getByRole('button', { name: 'Nút thường' });
    expect(button.tagName.toLowerCase()).toBe('button');
  });

  it('passes HTML attributes like type and aria-label', () => {
    render(
      <Button type="submit" aria-label="Xác nhận gửi">
        Gửi
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Xác nhận gửi' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('has displayName set to Button', () => {
    expect(Button.displayName).toBe('Button');
  });
});

describe('buttonVariants function', () => {
  it('returns default classes when invoked with no arguments', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-teal-600');
    expect(classes).toContain('h-10 px-4 py-2');
  });

  it('returns correct classes for specified variant, size, and className', () => {
    const classes = buttonVariants({
      variant: 'destructive',
      size: 'sm',
      className: 'extra-class',
    });
    expect(classes).toContain('bg-rose-600');
    expect(classes).toContain('h-9');
    expect(classes).toContain('extra-class');
  });
});
