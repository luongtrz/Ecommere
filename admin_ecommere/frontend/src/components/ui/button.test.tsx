import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from './button';

describe('Button component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a button element with default variants and children', () => {
    render(<Button>Bấm vào đây</Button>);
    const button = screen.getByRole('button', { name: 'Bấm vào đây' });

    expect(button).toBeInTheDocument();
    expect(button.tagName.toLowerCase()).toBe('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-primary-foreground');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
  });

  it('renders with all variant options correctly', () => {
    const variants = [
      { variant: 'default', expectedClass: 'bg-primary' },
      { variant: 'destructive', expectedClass: 'bg-destructive' },
      { variant: 'outline', expectedClass: 'border-input' },
      { variant: 'secondary', expectedClass: 'bg-secondary' },
      { variant: 'ghost', expectedClass: 'hover:bg-accent' },
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
      { size: 'sm', expectedClass: 'h-9 rounded-md px-3' },
      { size: 'lg', expectedClass: 'h-11 rounded-md px-8' },
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
    expect(button).toHaveClass('bg-primary');
  });

  it('handles user click event when enabled', async () => {
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

  it('renders child element via Slot when asChild is true and forwards ref', () => {
    const ref = React.createRef<HTMLAnchorElement>();
    const { container } = render(
      <Button asChild ref={ref as unknown as React.Ref<HTMLButtonElement>}>
        <a href="/admin/products">Danh sách sản phẩm</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Danh sách sản phẩm' });
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe('a');
    expect(link).toHaveAttribute('href', '/admin/products');
    expect(link).toHaveClass('bg-primary');
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('button')).toBeNull();
  });

  it('renders as button when asChild is explicitly false', () => {
    render(<Button asChild={false}>Nút thường</Button>);
    const button = screen.getByRole('button', { name: 'Nút thường' });
    expect(button.tagName.toLowerCase()).toBe('button');
  });

  it('passes HTML attributes like type, aria-label, and data attributes', () => {
    render(
      <Button type="submit" aria-label="Xác nhận lưu" data-testid="save-btn">
        Lưu
      </Button>,
    );
    const button = screen.getByTestId('save-btn');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Xác nhận lưu');
  });

  it('has displayName set to Button', () => {
    expect(Button.displayName).toBe('Button');
  });
});

describe('buttonVariants function', () => {
  it('returns default classes when invoked with no arguments', () => {
    const classes = buttonVariants();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('h-10 px-4 py-2');
  });

  it('returns default classes when invoked with empty object', () => {
    const classes = buttonVariants({});
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('h-10 px-4 py-2');
  });

  it('returns correct classes for specified variant, size, and className', () => {
    const classes = buttonVariants({
      variant: 'destructive',
      size: 'sm',
      className: 'extra-class',
    });
    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('h-9');
    expect(classes).toContain('extra-class');
  });

  it('returns correct classes for outline variant and lg size', () => {
    const classes = buttonVariants({
      variant: 'outline',
      size: 'lg',
    });
    expect(classes).toContain('border-input');
    expect(classes).toContain('h-11 rounded-md px-8');
  });

  it('returns correct classes for ghost variant and icon size', () => {
    const classes = buttonVariants({
      variant: 'ghost',
      size: 'icon',
    });
    expect(classes).toContain('hover:bg-accent');
    expect(classes).toContain('h-10 w-10');
  });

  it('returns correct classes for link variant and secondary variant', () => {
    const linkClasses = buttonVariants({ variant: 'link' });
    expect(linkClasses).toContain('underline-offset-4');

    const secondaryClasses = buttonVariants({ variant: 'secondary' });
    expect(secondaryClasses).toContain('bg-secondary');
  });
});
