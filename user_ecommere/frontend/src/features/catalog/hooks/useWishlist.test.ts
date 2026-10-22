import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWishlist, type WishlistItem } from './useWishlist';

describe('useWishlist', () => {
  const mockStorage: Record<string, string> = {};

  const mockItem1: WishlistItem = {
    productId: 'prod-001',
    name: 'Xịt Thơm Hoa Sen',
    slug: 'xit-thom-hoa-sen',
    image: '/images/lotus.jpg',
    price: 150000,
  };

  const mockItem2: WishlistItem = {
    productId: 'prod-002',
    name: 'Xịt Khử Mùi Sả Chanh',
    slug: 'xit-khu-mui-sa-chanh',
    image: '/images/lemon.jpg',
    price: 180000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

    if (typeof window !== 'undefined' && window.localStorage) {
      vi.spyOn(window.localStorage, 'getItem').mockImplementation(
        (key: string) => mockStorage[key] ?? null,
      );
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(
        (key: string, value: string) => {
          mockStorage[key] = value;
        },
      );
      vi.spyOn(window.localStorage, 'removeItem').mockImplementation(
        (key: string) => {
          delete mockStorage[key];
        },
      );
      vi.spyOn(window.localStorage, 'clear').mockImplementation(() => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      });
    }

    useWishlist.setState({ items: [] });
  });

  describe('Initial state', () => {
    it('starts with an empty items array', () => {
      expect(useWishlist.getState().items).toEqual([]);
    });

    it('returns empty items via renderHook', () => {
      const { result } = renderHook(() => useWishlist());
      expect(result.current.items).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('adds an item to the wishlist if it does not already exist', () => {
      const { result } = renderHook(() => useWishlist());

      act(() => {
        result.current.addItem(mockItem1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(mockItem1);
      expect(useWishlist.getState().items).toEqual([mockItem1]);
    });

    it('does not duplicate an item if it already exists in the wishlist', () => {
      const { result } = renderHook(() => useWishlist());

      act(() => {
        result.current.addItem(mockItem1);
      });
      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.addItem(mockItem1);
      });
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items).toEqual([mockItem1]);
    });

    it('allows adding multiple distinct items', () => {
      const { result } = renderHook(() => useWishlist());

      act(() => {
        result.current.addItem(mockItem1);
        result.current.addItem(mockItem2);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items).toEqual([mockItem1, mockItem2]);
    });
  });

  describe('removeItem', () => {
    it('removes an existing item by productId', () => {
      useWishlist.setState({ items: [mockItem1, mockItem2] });
      const { result } = renderHook(() => useWishlist());

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.removeItem(mockItem1.productId);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(mockItem2);
      expect(useWishlist.getState().items).toEqual([mockItem2]);
    });

    it('does not modify items if productId does not exist', () => {
      useWishlist.setState({ items: [mockItem1] });
      const { result } = renderHook(() => useWishlist());

      act(() => {
        result.current.removeItem('non-existent-id');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(mockItem1);
    });
  });

  describe('isInWishlist', () => {
    it('returns true when the item exists in the wishlist', () => {
      useWishlist.setState({ items: [mockItem1] });
      const { result } = renderHook(() => useWishlist());

      expect(result.current.isInWishlist(mockItem1.productId)).toBe(true);
      expect(useWishlist.getState().isInWishlist(mockItem1.productId)).toBe(
        true,
      );
    });

    it('returns false when the item does not exist in the wishlist', () => {
      useWishlist.setState({ items: [mockItem1] });
      const { result } = renderHook(() => useWishlist());

      expect(result.current.isInWishlist(mockItem2.productId)).toBe(false);
      expect(result.current.isInWishlist('unknown-prod')).toBe(false);
      expect(useWishlist.getState().isInWishlist('unknown-prod')).toBe(false);
    });
  });

  describe('toggleItem', () => {
    it('adds item to wishlist when it is not currently present', () => {
      const { result } = renderHook(() => useWishlist());

      expect(result.current.isInWishlist(mockItem1.productId)).toBe(false);

      act(() => {
        result.current.toggleItem(mockItem1);
      });

      expect(result.current.items).toEqual([mockItem1]);
      expect(result.current.isInWishlist(mockItem1.productId)).toBe(true);
    });

    it('removes item from wishlist when it is already present', () => {
      useWishlist.setState({ items: [mockItem1, mockItem2] });
      const { result } = renderHook(() => useWishlist());

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.toggleItem(mockItem1);
      });

      expect(result.current.items).toEqual([mockItem2]);
      expect(result.current.isInWishlist(mockItem1.productId)).toBe(false);
    });

    it('toggles an item back and forth repeatedly', () => {
      const { result } = renderHook(() => useWishlist());

      // 1. Add
      act(() => {
        result.current.toggleItem(mockItem1);
      });
      expect(result.current.items).toEqual([mockItem1]);

      // 2. Remove
      act(() => {
        result.current.toggleItem(mockItem1);
      });
      expect(result.current.items).toEqual([]);

      // 3. Add again
      act(() => {
        result.current.toggleItem(mockItem1);
      });
      expect(result.current.items).toEqual([mockItem1]);
    });
  });

  describe('clearWishlist', () => {
    it('clears all items from the wishlist', () => {
      useWishlist.setState({ items: [mockItem1, mockItem2] });
      const { result } = renderHook(() => useWishlist());

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.clearWishlist();
      });

      expect(result.current.items).toEqual([]);
      expect(useWishlist.getState().items).toEqual([]);
    });

    it('handles clearWishlist safely when wishlist is already empty', () => {
      const { result } = renderHook(() => useWishlist());

      act(() => {
        result.current.clearWishlist();
      });

      expect(result.current.items).toEqual([]);
    });
  });

  describe('Direct store method invocations', () => {
    it('supports direct store calls without hook wrapper', () => {
      // addItem
      useWishlist.getState().addItem(mockItem1);
      expect(useWishlist.getState().items).toEqual([mockItem1]);

      // addItem existing
      useWishlist.getState().addItem(mockItem1);
      expect(useWishlist.getState().items).toEqual([mockItem1]);

      // isInWishlist
      expect(useWishlist.getState().isInWishlist(mockItem1.productId)).toBe(
        true,
      );
      expect(useWishlist.getState().isInWishlist('unknown')).toBe(false);

      // toggleItem existing
      useWishlist.getState().toggleItem(mockItem1);
      expect(useWishlist.getState().items).toEqual([]);

      // toggleItem non-existing
      useWishlist.getState().toggleItem(mockItem2);
      expect(useWishlist.getState().items).toEqual([mockItem2]);

      // removeItem
      useWishlist.getState().removeItem(mockItem2.productId);
      expect(useWishlist.getState().items).toEqual([]);

      // clearWishlist
      useWishlist.getState().addItem(mockItem1);
      useWishlist.getState().clearWishlist();
      expect(useWishlist.getState().items).toEqual([]);
    });
  });
});
