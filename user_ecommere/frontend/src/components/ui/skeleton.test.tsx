import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Skeleton } from './skeleton';

afterEach(() => {
  cleanup();
});

describe('Skeleton', () => {
  it('renders a div element with default skeleton styles', () => {
    const { getByTestId } = render(<Skeleton data-testid="skeleton-default" />);
    const skeleton = getByTestId('skeleton-default');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.tagName).toBe('DIV');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-lg', 'bg-slate-200');
  });

  it('merges custom className with default classes', () => {
    const { getByTestId } = render(
      <Skeleton
        className="h-12 w-12 rounded-full"
        data-testid="skeleton-custom"
      />,
    );
    const skeleton = getByTestId('skeleton-custom');
    expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
    expect(skeleton).toHaveClass('animate-pulse', 'bg-slate-200');
  });

  it('renders without custom className (undefined className)', () => {
    const { getByTestId } = render(
      <Skeleton data-testid="skeleton-undefined" />,
    );
    const skeleton = getByTestId('skeleton-undefined');
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-lg', 'bg-slate-200');
  });

  it('passes through style and other HTML attributes', () => {
    const { getByTestId } = render(
      <Skeleton
        data-testid="skeleton-attrs"
        style={{ width: '200px', height: '40px' }}
        role="status"
        aria-label="Đang tải dữ liệu"
      />,
    );
    const skeleton = getByTestId('skeleton-attrs');
    expect(skeleton).toHaveStyle({ width: '200px', height: '40px' });
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Đang tải dữ liệu');
  });

  it('renders children when provided', () => {
    const { getByTestId, getByText } = render(
      <Skeleton data-testid="skeleton-children">
        <span>Đang tải...</span>
      </Skeleton>,
    );
    const skeleton = getByTestId('skeleton-children');
    expect(skeleton).toContainHTML('<span>Đang tải...</span>');
    expect(getByText('Đang tải...')).toBeInTheDocument();
  });
});
