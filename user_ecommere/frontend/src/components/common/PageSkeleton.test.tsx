import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { PageSkeleton } from './PageSkeleton';

describe('PageSkeleton', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with role="status", aria-busy="true" and accessible Vietnamese label', () => {
    render(<PageSkeleton />);

    const container = screen.getByRole('status', { name: 'Đang tải trang' });
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-busy', 'true');
    expect(container).toHaveAttribute('aria-label', 'Đang tải trang');

    const srOnlyLabel = screen.getByText('Đang tải trang');
    expect(srOnlyLabel).toBeInTheDocument();
    expect(srOnlyLabel).toHaveClass('sr-only');
  });

  it('renders a 4-card grid of placeholder blocks without visible text', () => {
    render(<PageSkeleton />);

    const grid = screen.getByTestId('page-skeleton-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass(
      'grid',
      'grid-cols-1',
      'sm:grid-cols-2',
      'lg:grid-cols-4',
    );

    const cards = screen.getAllByTestId('page-skeleton-card');
    expect(cards).toHaveLength(4);

    // Verify there is no visible text (only the screen-reader-only announcement)
    const statusContainer = screen.getByRole('status');
    expect(statusContainer.textContent).toBe('Đang tải trang');
  });

  it('applies custom className to the outer container', () => {
    render(<PageSkeleton className="custom-skeleton-wrapper min-h-screen" />);

    const container = screen.getByRole('status');
    expect(container).toHaveClass(
      'custom-skeleton-wrapper',
      'min-h-screen',
      'container',
    );
  });
});
