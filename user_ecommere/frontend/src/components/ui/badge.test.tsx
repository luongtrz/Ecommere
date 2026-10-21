import * as React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Badge, badgeVariants } from './badge';

afterEach(() => {
  cleanup();
});

describe('Badge Component', () => {
  it('renders children with default variant classes when no variant is specified', () => {
    render(<Badge>Hàng mới về</Badge>);

    const badge = screen.getByText('Hàng mới về');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold',
      'transition-colors',
      'border-transparent',
      'bg-primary',
      'text-primary-foreground',
    );
  });

  it('renders with variant="default"', () => {
    render(<Badge variant="default">Mặc định</Badge>);

    const badge = screen.getByText('Mặc định');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-primary',
      'text-primary-foreground',
    );
  });

  it('renders with variant="secondary"', () => {
    render(<Badge variant="secondary">Đang xử lý</Badge>);

    const badge = screen.getByText('Đang xử lý');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-secondary',
      'text-secondary-foreground',
    );
  });

  it('renders with variant="destructive"', () => {
    render(<Badge variant="destructive">Đã hủy</Badge>);

    const badge = screen.getByText('Đã hủy');
    expect(badge).toHaveClass(
      'border-transparent',
      'bg-destructive',
      'text-destructive-foreground',
    );
  });

  it('renders with variant="outline"', () => {
    render(<Badge variant="outline">Hết hàng</Badge>);

    const badge = screen.getByText('Hết hàng');
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass(
      'border-transparent',
      'bg-primary',
      'bg-secondary',
      'bg-destructive',
    );
  });

  it('merges custom className with variant classes', () => {
    render(
      <Badge
        variant="secondary"
        className="custom-extra-class shadow-sm"
        data-testid="custom-badge"
      >
        Khuyến mãi
      </Badge>,
    );

    const badge = screen.getByTestId('custom-badge');
    expect(badge).toHaveClass(
      'custom-extra-class',
      'shadow-sm',
      'bg-secondary',
    );
  });

  it('forwards standard HTML attributes and handles interactions', () => {
    const handleClick = vi.fn();
    render(
      <Badge
        id="badge-id"
        role="status"
        aria-label="Trạng thái đơn hàng"
        data-testid="interactive-badge"
        onClick={handleClick}
      >
        Nhấp vào đây
      </Badge>,
    );

    const badge = screen.getByTestId('interactive-badge');
    expect(badge).toHaveAttribute('id', 'badge-id');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label', 'Trạng thái đơn hàng');

    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('badgeVariants helper function', () => {
  it('returns default variant classes when invoked without arguments', () => {
    const classes = badgeVariants();
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('text-primary-foreground');
    expect(classes).toContain('rounded-full');
  });

  it('returns default variant classes when variant is explicitly "default"', () => {
    const classes = badgeVariants({ variant: 'default' });
    expect(classes).toContain('bg-primary');
    expect(classes).toContain('border-transparent');
  });

  it('returns secondary variant classes', () => {
    const classes = badgeVariants({ variant: 'secondary' });
    expect(classes).toContain('bg-secondary');
    expect(classes).toContain('text-secondary-foreground');
  });

  it('returns destructive variant classes', () => {
    const classes = badgeVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('text-destructive-foreground');
  });

  it('returns outline variant classes', () => {
    const classes = badgeVariants({ variant: 'outline' });
    expect(classes).toContain('text-foreground');
    expect(classes).not.toContain('bg-primary');
    expect(classes).not.toContain('border-transparent');
  });

  it('appends custom className passed to badgeVariants', () => {
    const classes = badgeVariants({
      variant: 'outline',
      className: 'uppercase tracking-wider',
    });
    expect(classes).toContain('uppercase');
    expect(classes).toContain('tracking-wider');
    expect(classes).toContain('text-foreground');
  });
});
