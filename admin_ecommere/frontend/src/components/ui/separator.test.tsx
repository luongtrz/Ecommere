import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders with default props (horizontal orientation and decorative=true)', () => {
    render(<Separator data-testid="separator-default" />);
    const separator = screen.getByTestId('separator-default');

    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).toHaveAttribute('role', 'none');
    expect(separator).toHaveClass('shrink-0', 'bg-slate-200', 'h-[1px]', 'w-full');
  });

  it('renders with explicit horizontal orientation', () => {
    render(
      <Separator orientation="horizontal" data-testid="separator-horizontal" />,
    );
    const separator = screen.getByTestId('separator-horizontal');

    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).toHaveClass('h-[1px]', 'w-full');
  });

  it('renders with vertical orientation', () => {
    render(
      <Separator orientation="vertical" data-testid="separator-vertical" />,
    );
    const separator = screen.getByTestId('separator-vertical');

    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveClass('shrink-0', 'bg-slate-200', 'h-full', 'w-[1px]');
    expect(separator).not.toHaveClass('h-[1px]', 'w-full');
  });

  it('renders non-decorative horizontal separator with role="separator"', () => {
    render(<Separator decorative={false} aria-label="Nội dung phân cách" />);
    const separator = screen.getByRole('separator', {
      name: 'Nội dung phân cách',
    });

    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders non-decorative vertical separator with role="separator" and aria-orientation', () => {
    render(
      <Separator
        decorative={false}
        orientation="vertical"
        aria-label="Phân cách dọc"
      />,
    );
    const separator = screen.getByRole('separator', { name: 'Phân cách dọc' });

    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
  });

  it('merges custom className with default classes', () => {
    render(
      <Separator className="custom-sep my-4" data-testid="separator-custom" />,
    );
    const separator = screen.getByTestId('separator-custom');

    expect(separator).toHaveClass(
      'custom-sep',
      'my-4',
      'shrink-0',
      'bg-slate-200',
    );
  });

  it('forwards ref to the underlying DOM element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} data-testid="separator-ref" />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByTestId('separator-ref'));
  });

  it('forwards additional HTML attributes correctly', () => {
    render(
      <Separator
        data-testid="separator-attrs"
        id="sep-section-1"
        data-custom="custom-val"
      />,
    );
    const separator = screen.getByTestId('separator-attrs');

    expect(separator).toHaveAttribute('id', 'sep-section-1');
    expect(separator).toHaveAttribute('data-custom', 'custom-val');
  });

  it('has the displayName matching SeparatorPrimitive.Root.displayName', () => {
    expect(Separator.displayName).toBe(SeparatorPrimitive.Root.displayName);
  });
});
