import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { CartBadge } from './CartBadge';
import { useCartStore, type CartItem } from '@/features/cart/store/cartStore';

const createMockCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Xịt thơm phòng Lavender',
  image: '/test.png',
  price: 50000,
  quantity: 1,
  scent: 'Lavender',
  volumeMl: 50,
  ...overrides,
});

describe('CartBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
      vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {});
    }
    useCartStore.setState({ items: [] });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders shopping cart icon without badge when cart is empty', () => {
    const { container } = render(<CartBadge />);

    const wrapper = container.firstElementChild;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass(
      'relative',
      'flex',
      'h-9',
      'w-9',
      'items-center',
      'justify-center',
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-5', 'w-5');

    expect(screen.queryByText(/^[0-9]/)).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument();
  });

  it('does not render badge when items sum to 0 quantity', () => {
    useCartStore.setState({
      items: [createMockCartItem({ quantity: 0 })],
    });

    const { container } = render(<CartBadge />);
    expect(screen.queryByText(/^[0-9]/)).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument();
  });

  it('renders badge with count when cart has a single item (count = 1)', () => {
    useCartStore.setState({
      items: [createMockCartItem({ quantity: 1 })],
    });

    const { container } = render(<CartBadge />);

    const badge = container.querySelector('.rounded-full');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('1');
    expect(badge?.textContent).toBe('1');
    expect(badge).toHaveClass(
      'absolute',
      '-right-1',
      '-top-1',
      'flex',
      'h-5',
      'min-w-[20px]',
      'items-center',
      'justify-center',
      'rounded-full',
      'px-1',
      'text-[10px]',
      'bg-rose-50',
    );
  });

  it('renders badge with correct total quantity when cart has multiple items', () => {
    useCartStore.setState({
      items: [
        createMockCartItem({ variantId: 'var-1', quantity: 3 }),
        createMockCartItem({ variantId: 'var-2', quantity: 4 }),
      ],
    });

    const { container } = render(<CartBadge />);

    const badge = container.querySelector('.rounded-full');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('7');
    expect(badge?.textContent).toBe('7');
  });

  it('renders exact count when total quantity is 99 (boundary case)', () => {
    useCartStore.setState({
      items: [createMockCartItem({ quantity: 99 })],
    });

    const { container } = render(<CartBadge />);

    const badge = container.querySelector('.rounded-full');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('99');
    expect(badge?.textContent).toBe('99');
  });

  it('renders "99+" when total quantity is 100 (boundary case)', () => {
    useCartStore.setState({
      items: [createMockCartItem({ quantity: 100 })],
    });

    const { container } = render(<CartBadge />);

    const badge = container.querySelector('.rounded-full');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('99+');
    expect(badge?.textContent).toBe('99+');
  });

  it('renders "99+" when total quantity exceeds 100 across multiple items', () => {
    useCartStore.setState({
      items: [
        createMockCartItem({ variantId: 'var-1', quantity: 60 }),
        createMockCartItem({ variantId: 'var-2', quantity: 70 }),
      ],
    });

    const { container } = render(<CartBadge />);

    const badge = container.querySelector('.rounded-full');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('99+');
    expect(badge?.textContent).toBe('99+');
  });

  it('updates dynamically when store items change', () => {
    const { container } = render(<CartBadge />);

    // Initially empty -> no badge
    expect(screen.queryByText(/^[0-9]/)).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument();

    // Add item -> badge appears with count 2
    act(() => {
      useCartStore.setState({
        items: [createMockCartItem({ quantity: 2 })],
      });
    });
    const badge = container.querySelector('.rounded-full');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('2');
    expect(badge?.textContent).toBe('2');

    // Clear cart -> badge disappears
    act(() => {
      useCartStore.setState({ items: [] });
    });
    expect(screen.queryByText(/^[0-9]/)).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-full')).not.toBeInTheDocument();
  });
});
