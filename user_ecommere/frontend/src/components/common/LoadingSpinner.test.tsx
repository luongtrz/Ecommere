import { describe, expect, it, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with default props (size md and without additional className)', () => {
    const { container } = render(<LoadingSpinner />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'rounded-full',
      'border-teal-100',
      'border-t-teal-600',
      'animate-spin',
      'h-8',
      'w-8',
      'border-[2.5px]',
    );
  });

  it('renders with small size (sm)', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'rounded-full',
      'border-teal-100',
      'border-t-teal-600',
      'animate-spin',
      'h-5',
      'w-5',
      'border-2',
    );
    expect(spinner).not.toHaveClass('h-8', 'w-8', 'h-12', 'w-12');
  });

  it('renders with medium size explicitly (md)', () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'rounded-full',
      'border-teal-100',
      'border-t-teal-600',
      'animate-spin',
      'h-8',
      'w-8',
      'border-[2.5px]',
    );
    expect(spinner).not.toHaveClass('h-5', 'w-5', 'h-12', 'w-12');
  });

  it('renders with large size (lg)', () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'rounded-full',
      'border-teal-100',
      'border-t-teal-600',
      'animate-spin',
      'h-12',
      'w-12',
      'border-[3px]',
    );
    expect(spinner).not.toHaveClass('h-5', 'w-5', 'h-8', 'w-8');
  });

  it('merges custom className with default classes', () => {
    const { container } = render(
      <LoadingSpinner className="custom-loader-class text-secondary" />,
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'rounded-full',
      'border-teal-100',
      'border-t-teal-600',
      'animate-spin',
      'custom-loader-class',
      'text-secondary',
      'h-8',
      'w-8',
      'border-[2.5px]',
    );
  });

  it('applies custom className along with a specific size', () => {
    const { container } = render(
      <LoadingSpinner size="sm" className="opacity-75" />,
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'rounded-full',
      'border-teal-100',
      'border-t-teal-600',
      'animate-spin',
      'h-5',
      'w-5',
      'border-2',
      'opacity-75',
    );
  });
});
