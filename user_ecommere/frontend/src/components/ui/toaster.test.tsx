import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Toaster } from './toaster';

afterEach(() => {
  cleanup();
});

describe('Toaster', () => {
  it('is exported as a function component', () => {
    expect(Toaster).toBeDefined();
    expect(typeof Toaster).toBe('function');
  });

  it('renders the toast viewport element in the DOM', () => {
    const { container } = render(<Toaster />);
    const viewport = container.querySelector('ol');

    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveClass('fixed', 'top-0', 'z-[100]');
    expect(viewport).toHaveAttribute('tabindex', '-1');
  });

  it('unmounts cleanly from the DOM', () => {
    const { container, unmount } = render(<Toaster />);
    expect(container.querySelector('ol')).toBeInTheDocument();

    unmount();
    expect(container.querySelector('ol')).not.toBeInTheDocument();
  });

  it('renders multiple instances sequentially without error', () => {
    const first = render(<Toaster />);
    expect(first.container.querySelector('ol')).toBeInTheDocument();
    first.unmount();

    const second = render(<Toaster />);
    expect(second.container.querySelector('ol')).toBeInTheDocument();
    second.unmount();
  });
});
