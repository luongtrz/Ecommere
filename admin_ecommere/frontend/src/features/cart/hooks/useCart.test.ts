import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';
import { useCartStore, type CartItem } from '../store/cartStore';

const sampleItem1: CartItem = {
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Xịt thơm phòng Quế Gỗ 100ml',
  image: '/images/que-go.jpg',
  price: 150000,
  quantity: 2,
  scent: 'Quế Gỗ',
  volumeMl: 100,
};

const sampleItem2: CartItem = {
  productId: 'prod-2',
  variantId: 'var-2',
  name: 'Xịt thơm phòng Hoa Nhài 50ml',
  image: '/images/hoa-nhai.jpg',
  price: 90000,
  quantity: 3,
  scent: 'Hoa Nhài',
  volumeMl: 50,
};

describe('useCart hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
      vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {});
      vi.spyOn(window.localStorage, 'clear').mockImplementation(() => {});
    }
    useCartStore.setState({ items: [] });
  });

  describe('initial state', () => {
    it('returns empty initial state and zero totals when cart is empty', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.items).toEqual([]);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalItems).toBe(0);
      expect(typeof result.current.addItem).toBe('function');
      expect(typeof result.current.removeItem).toBe('function');
      expect(typeof result.current.updateQuantity).toBe('function');
      expect(typeof result.current.clearCart).toBe('function');
    });

    it('calculates initial totalPrice and totalItems accurately when items exist in store', () => {
      useCartStore.setState({
        items: [sampleItem1, sampleItem2],
      });

      const { result } = renderHook(() => useCart());

      // (150000 * 2) + (90000 * 3) = 300000 + 270000 = 570000
      expect(result.current.totalPrice).toBe(570000);
      // 2 + 3 = 5
      expect(result.current.totalItems).toBe(5);
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0]).toEqual(sampleItem1);
      expect(result.current.items[1]).toEqual(sampleItem2);
    });
  });

  describe('addItem', () => {
    it('adds a new item to the cart and updates totals', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(sampleItem1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variantId).toBe('var-1');
      expect(result.current.totalPrice).toBe(300000);
      expect(result.current.totalItems).toBe(2);
    });

    it('adds an item without quantity and defaults quantity to 1', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem({
          productId: 'prod-3',
          variantId: 'var-3',
          name: 'Xịt thơm phòng Trầm Hương',
          image: '/images/tram-huong.jpg',
          price: 200000,
          scent: 'Trầm Hương',
          volumeMl: 80,
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.totalPrice).toBe(200000);
      expect(result.current.totalItems).toBe(1);
    });

    it('increments quantity and updates totals when adding an existing item', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem(sampleItem1);
      });
      act(() => {
        result.current.addItem({ ...sampleItem1, quantity: 3 });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(5);
      // 150000 * 5 = 750000
      expect(result.current.totalPrice).toBe(750000);
      expect(result.current.totalItems).toBe(5);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity of an existing item and recalculates totals', () => {
      useCartStore.setState({
        items: [sampleItem1],
      });

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.updateQuantity('var-1', 4);
      });

      expect(result.current.items[0].quantity).toBe(4);
      // 150000 * 4 = 600000
      expect(result.current.totalPrice).toBe(600000);
      expect(result.current.totalItems).toBe(4);
    });

    it('removes item when quantity is updated to 0', () => {
      useCartStore.setState({
        items: [sampleItem1],
      });

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.updateQuantity('var-1', 0);
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalItems).toBe(0);
    });

    it('removes item when quantity is updated to a negative value', () => {
      useCartStore.setState({
        items: [sampleItem1],
      });

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.updateQuantity('var-1', -2);
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalItems).toBe(0);
    });
  });

  describe('removeItem', () => {
    it('removes an item by variantId and recalculates totals', () => {
      useCartStore.setState({
        items: [sampleItem1, sampleItem2],
      });

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.removeItem('var-1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variantId).toBe('var-2');
      // 90000 * 3 = 270000
      expect(result.current.totalPrice).toBe(270000);
      expect(result.current.totalItems).toBe(3);
    });

    it('leaves items unchanged when attempting to remove a non-existent variantId', () => {
      useCartStore.setState({
        items: [sampleItem1],
      });

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.removeItem('var-non-existent');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variantId).toBe('var-1');
      expect(result.current.totalPrice).toBe(300000);
      expect(result.current.totalItems).toBe(2);
    });
  });

  describe('clearCart', () => {
    it('removes all items from the cart and resets totals to zero', () => {
      useCartStore.setState({
        items: [sampleItem1, sampleItem2],
      });

      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalItems).toBe(0);
    });
  });

  describe('reactivity to external store updates', () => {
    it('updates returned items, totalPrice, and totalItems when store state changes externally', () => {
      const { result } = renderHook(() => useCart());

      expect(result.current.items).toEqual([]);
      expect(result.current.totalPrice).toBe(0);
      expect(result.current.totalItems).toBe(0);

      act(() => {
        useCartStore.setState({
          items: [sampleItem2],
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variantId).toBe('var-2');
      expect(result.current.totalPrice).toBe(270000);
      expect(result.current.totalItems).toBe(3);
    });
  });
});
