import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a div element with default skeleton styles', () => {
    render(<Skeleton data-testid="skeleton-default" />);
    const skeleton = screen.getByTestId('skeleton-default');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.tagName).toBe('DIV');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
  });

  it('merges custom className with default classes', () => {
    render(
      <Skeleton
        className="h-12 w-12 rounded-full"
        data-testid="skeleton-custom"
      />,
    );
    const skeleton = screen.getByTestId('skeleton-custom');
    expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
    expect(skeleton).toHaveClass('animate-pulse', 'bg-muted');
  });

  it('renders without custom className (undefined className)', () => {
    render(<Skeleton data-testid="skeleton-undefined" />);
    const skeleton = screen.getByTestId('skeleton-undefined');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
  });

  it('passes through style and other HTML attributes', () => {
    render(
      <Skeleton
        data-testid="skeleton-attrs"
        style={{ width: '200px', height: '40px' }}
        role="status"
        aria-label="Đang tải dữ liệu"
      />,
    );
    const skeleton = screen.getByTestId('skeleton-attrs');
    expect(skeleton).toHaveStyle({ width: '200px', height: '40px' });
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Đang tải dữ liệu');
  });

  it('renders children when provided', () => {
    render(
      <Skeleton data-testid="skeleton-children">
        <span>Đang tải...</span>
      </Skeleton>,
    );
    const skeleton = screen.getByTestId('skeleton-children');
    expect(skeleton).toContainHTML('<span>Đang tải...</span>');
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('handles user events when attached', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Skeleton data-testid="skeleton-clickable" onClick={handleClick} />);
    const skeleton = screen.getByTestId('skeleton-clickable');
    await user.click(skeleton);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
