import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, within } from '@testing-library/react';
import { Rating } from './Rating';

afterEach(() => {
  cleanup();
});

describe('Rating', () => {
  it('renders default 5 stars with sm size and without numeric value', () => {
    const { container } = render(<Rating value={3} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);

    // 3 full stars
    expect(svgs[0]).toHaveClass(
      'h-4',
      'w-4',
      'fill-yellow-400',
      'text-yellow-400',
    );
    expect(svgs[1]).toHaveClass(
      'h-4',
      'w-4',
      'fill-yellow-400',
      'text-yellow-400',
    );
    expect(svgs[2]).toHaveClass(
      'h-4',
      'w-4',
      'fill-yellow-400',
      'text-yellow-400',
    );

    // 2 empty stars
    expect(svgs[3]).toHaveClass('h-4', 'w-4', 'text-gray-300');
    expect(svgs[3]).not.toHaveClass('fill-yellow-400');
    expect(svgs[4]).toHaveClass('h-4', 'w-4', 'text-gray-300');
    expect(svgs[4]).not.toHaveClass('fill-yellow-400');

    // showValue is false by default
    expect(within(container).queryByText('3.0')).not.toBeInTheDocument();
  });

  it('renders half stars when value meets or exceeds the half-star threshold (i - 0.5)', () => {
    const { container } = render(<Rating value={3.5} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);

    // 3 full stars (value >= 1, 2, 3)
    expect(svgs[0]).toHaveClass('fill-yellow-400', 'text-yellow-400');
    expect(svgs[1]).toHaveClass('fill-yellow-400', 'text-yellow-400');
    expect(svgs[2]).toHaveClass('fill-yellow-400', 'text-yellow-400');

    // 4th star is half star (3.5 >= 4 - 0.5)
    expect(svgs[3]).toHaveClass('fill-yellow-400', 'text-yellow-400');

    // 5th star is empty star (3.5 < 5 - 0.5)
    expect(svgs[4]).toHaveClass('text-gray-300');
    expect(svgs[4]).not.toHaveClass('fill-yellow-400');
  });

  it('renders an empty star when value is below the half-star threshold', () => {
    const { container } = render(<Rating value={3.2} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);

    // 3 full stars
    expect(svgs[0]).toHaveClass('fill-yellow-400');
    expect(svgs[1]).toHaveClass('fill-yellow-400');
    expect(svgs[2]).toHaveClass('fill-yellow-400');

    // 4th star is empty because 3.2 < 3.5
    expect(svgs[3]).toHaveClass('text-gray-300');
    expect(svgs[3]).not.toHaveClass('fill-yellow-400');

    // 5th star is empty
    expect(svgs[4]).toHaveClass('text-gray-300');
  });

  it('renders a half star when value is between half and integer (e.g. 4.8)', () => {
    const { container } = render(<Rating value={4.8} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);

    // 4 full stars
    for (let i = 0; i < 4; i++) {
      expect(svgs[i]).toHaveClass('fill-yellow-400');
    }

    // 5th star is half star because 4.8 >= 4.5
    expect(svgs[4]).toHaveClass('fill-yellow-400');
  });

  it('renders all empty stars when value is 0', () => {
    const { container } = render(<Rating value={0} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);
    svgs.forEach((svg) => {
      expect(svg).toHaveClass('text-gray-300');
      expect(svg).not.toHaveClass('fill-yellow-400');
    });
  });

  it('renders all full stars when value equals max', () => {
    const { container } = render(<Rating value={5} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);
    svgs.forEach((svg) => {
      expect(svg).toHaveClass('fill-yellow-400', 'text-yellow-400');
    });
  });

  it('renders custom max number of stars', () => {
    const { container } = render(<Rating value={8} max={10} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(10);

    for (let i = 0; i < 8; i++) {
      expect(svgs[i]).toHaveClass('fill-yellow-400');
    }
    for (let i = 8; i < 10; i++) {
      expect(svgs[i]).toHaveClass('text-gray-300');
    }
  });

  it('applies sm size classes', () => {
    const { container } = render(<Rating value={1} size="sm" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs[0]).toHaveClass('h-4', 'w-4');
  });

  it('applies md size classes', () => {
    const { container } = render(<Rating value={1} size="md" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs[0]).toHaveClass('h-5', 'w-5');
  });

  it('applies lg size classes', () => {
    const { container } = render(<Rating value={1} size="lg" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs[0]).toHaveClass('h-6', 'w-6');
  });

  it('displays formatted numeric value to one decimal place when showValue is true', () => {
    const { container } = render(<Rating value={4} showValue />);
    const valueSpan = within(container).getByText('4.0');
    expect(valueSpan).toBeInTheDocument();
    expect(valueSpan).toHaveClass('ml-1', 'text-sm', 'font-medium');
  });

  it('displays fractional value formatted when showValue is true', () => {
    const { container } = render(<Rating value={4.67} showValue />);
    expect(within(container).getByText('4.7')).toBeInTheDocument();
  });

  it('applies custom className to the wrapper div', () => {
    const { container } = render(
      <Rating value={4} className="custom-rating-class" />,
    );
    expect(container.firstChild).toHaveClass(
      'flex',
      'items-center',
      'gap-1',
      'custom-rating-class',
    );
  });
});
