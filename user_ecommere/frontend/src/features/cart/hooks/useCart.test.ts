import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';
import { useCartStore, type CartItem } from '../store/cartStore';

const sampleItem1: CartItem = {
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Nước hoa Charme Guility 100ml',
  image: '/images/charme-guility.jpg',
  price: 500000,
  quantity: 2,
  scent: 'Hương thơm nam tính sang trọng',
  volumeMl: 100,
  stock: 10,
};

const sampleItem2: CartItem = {
  productId: 'prod-2',
  variantId: 'var-2',
  name: 'Nước hoa Charme King 60ml',
  image: '/images/charme-king.jpg',
  price: 400000,
  quantity: 3,
  scent: 'Hương gỗ quyến rũ',
  volumeMl: 60,
  stock: 15,
};

describe('useCart hook', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('returns empty initial state and zero totals', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.totalPrice).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(typeof result.current.addItem).toBe('function');
    expect(typeof result.current.removeItem).toBe('function');
    expect(typeof result.current.updateQuantity).toBe('function');
    expect(typeof result.current.clearCart).toBe('function');
    expect(typeof result.current.openCart).toBe('function');
    expect(typeof result.current.closeCart).toBe('function');
    expect(typeof result.current.toggleCart).toBe('function');
    expect(typeof result.current.replaceItems).toBe('function');
  });

  it('calculates totalPrice and totalItems correctly when items exist', () => {
    useCartStore.setState({
      items: [sampleItem1, sampleItem2],
      isOpen: false,
    });

    const { result } = renderHook(() => useCart());

    // (500000 * 2) + (400000 * 3) = 1000000 + 1200000 = 2200000
    expect(result.current.totalPrice).toBe(2200000);
    // 2 + 3 = 5
    expect(result.current.totalItems).toBe(5);
    expect(result.current.items).toHaveLength(2);
  });

  it('adds an item to cart and auto-opens drawer', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem(sampleItem1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].variantId).toBe('var-1');
    expect(result.current.isOpen).toBe(true);
    expect(result.current.totalPrice).toBe(1000000);
    expect(result.current.totalItems).toBe(2);
  });

  it('updates quantity of an item and recalculates totals', () => {
    useCartStore.setState({
      items: [sampleItem1],
      isOpen: false,
    });

    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.updateQuantity('var-1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalPrice).toBe(2500000);
    expect(result.current.totalItems).toBe(5);
  });

  it('removes an item from cart by variantId', () => {
    useCartStore.setState({
      items: [sampleItem1, sampleItem2],
      isOpen: true,
    });

    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.removeItem('var-1');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].variantId).toBe('var-2');
    expect(result.current.totalPrice).toBe(1200000);
    expect(result.current.totalItems).toBe(3);
  });

  it('clears all items from cart', () => {
    useCartStore.setState({
      items: [sampleItem1, sampleItem2],
      isOpen: true,
    });

    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalPrice).toBe(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('controls drawer state via openCart, closeCart, and toggleCart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.openCart();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeCart();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.toggleCart();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggleCart();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('replaces items using replaceItems and updates memoized values', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.replaceItems([
        { ...sampleItem1, quantity: 1, price: 300000 },
        { ...sampleItem2, quantity: 2, price: 200000 },
      ]);
    });

    expect(result.current.items).toHaveLength(2);
    // 300000 * 1 + 200000 * 2 = 700000
    expect(result.current.totalPrice).toBe(700000);
    expect(result.current.totalItems).toBe(3);
  });

  it('preserves memoized totalPrice and totalItems across re-renders when items do not change', () => {
    useCartStore.setState({
      items: [sampleItem1],
      isOpen: false,
    });

    const { result, rerender } = renderHook(() => useCart());

    const initialPrice = result.current.totalPrice;
    const initialItems = result.current.totalItems;

    rerender();

    expect(result.current.totalPrice).toBe(initialPrice);
    expect(result.current.totalItems).toBe(initialItems);
  });
});
