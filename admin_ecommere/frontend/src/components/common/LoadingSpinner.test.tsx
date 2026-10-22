import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
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

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass(
      'animate-spin',
      'text-teal-600',
      'transition-colors',
      'h-8',
      'w-8',
    );
  });

  it('renders with small size (sm)', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass(
      'animate-spin',
      'text-teal-600',
      'transition-colors',
      'h-4',
      'w-4',
    );
    expect(svg).not.toHaveClass('h-8', 'w-8', 'h-12', 'w-12');
  });

  it('renders with medium size explicitly (md)', () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass(
      'animate-spin',
      'text-teal-600',
      'transition-colors',
      'h-8',
      'w-8',
    );
    expect(svg).not.toHaveClass('h-4', 'w-4', 'h-12', 'w-12');
  });

  it('renders with large size (lg)', () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass(
      'animate-spin',
      'text-teal-600',
      'transition-colors',
      'h-12',
      'w-12',
    );
    expect(svg).not.toHaveClass('h-4', 'w-4', 'h-8', 'w-8');
  });

  it('merges custom className with default classes', () => {
    const { container } = render(
      <LoadingSpinner className="custom-loader-class text-secondary" />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass(
      'animate-spin',
      'custom-loader-class',
      'text-secondary',
      'h-8',
      'w-8',
    );
  });

  it('applies custom className along with a specific size', () => {
    const { container } = render(
      <LoadingSpinner size="sm" className="opacity-75" />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass(
      'animate-spin',
      'text-teal-600',
      'transition-colors',
      'h-4',
      'w-4',
      'opacity-75',
    );
  });
});
