import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with default props (size md, role="status", aria-label="Đang tải")', () => {
    const { container } = render(<LoadingSpinner />);

    const statusWrapper = screen.getByRole('status', { name: 'Đang tải' });
    expect(statusWrapper).toBeInTheDocument();
    expect(statusWrapper).toHaveClass('flex', 'items-center', 'justify-center');
    expect(statusWrapper).toHaveAttribute('aria-label', 'Đang tải');

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'text-primary', 'h-6', 'w-6');

    const srText = screen.getByText('Đang tải');
    expect(srText).toHaveClass('sr-only');
  });

  it('renders with small size (sm)', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'text-primary', 'h-4', 'w-4');
    expect(spinner).not.toHaveClass('h-6', 'w-6', 'h-8', 'w-8');
  });

  it('renders with medium size explicitly (md)', () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'text-primary', 'h-6', 'w-6');
    expect(spinner).not.toHaveClass('h-4', 'w-4', 'h-8', 'w-8');
  });

  it('renders with large size (lg)', () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'text-primary', 'h-8', 'w-8');
    expect(spinner).not.toHaveClass('h-4', 'w-4', 'h-6', 'w-6');
  });

  it('merges custom className with default classes', () => {
    const { container } = render(
      <LoadingSpinner className="custom-loader-class text-secondary" />,
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'animate-spin',
      'text-primary',
      'custom-loader-class',
      'text-secondary',
      'h-6',
      'w-6',
    );
  });

  it('applies custom className along with a specific size', () => {
    const { container } = render(
      <LoadingSpinner size="sm" className="opacity-75" />,
    );

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass(
      'animate-spin',
      'text-primary',
      'h-4',
      'w-4',
      'opacity-75',
    );
  });
});
