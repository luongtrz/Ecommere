import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useCartStore, type CartItem } from './cartStore';

const createCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Xịt thơm phòng Sả Chanh 100ml',
  image: '/images/sa-chanh.jpg',
  price: 120000,
  quantity: 1,
  scent: 'Sả Chanh',
  volumeMl: 100,
  ...overrides,
});

describe('useCartStore', () => {
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
    it('initializes with an empty items array and 0 totals', () => {
      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
      expect(state.getTotalPrice()).toBe(0);
      expect(state.getTotalItems()).toBe(0);
    });
  });

  describe('addItem', () => {
    it('adds a new item with specified quantity', () => {
      const item = createCartItem({ quantity: 3 });

      useCartStore.getState().addItem(item);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toEqual({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Xịt thơm phòng Sả Chanh 100ml',
        image: '/images/sa-chanh.jpg',
        price: 120000,
        quantity: 3,
        scent: 'Sả Chanh',
        volumeMl: 100,
      });
    });

    it('adds a new item with default quantity 1 when quantity is omitted or undefined', () => {
      const itemWithoutQuantity = {
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Xịt thơm phòng Oải Hương 50ml',
        image: '/images/oai-huong.jpg',
        price: 95000,
        scent: 'Oải Hương',
        volumeMl: 50,
      };

      useCartStore.getState().addItem(itemWithoutQuantity);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toEqual({
        ...itemWithoutQuantity,
        quantity: 1,
      });
    });

    it('adds a new item with default quantity 1 when quantity is 0', () => {
      const itemWithZeroQuantity = createCartItem({ quantity: 0 });

      useCartStore.getState().addItem(itemWithZeroQuantity);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(1);
    });

    it('increments quantity when adding an item that already exists in cart', () => {
      useCartStore.getState().addItem(createCartItem({ quantity: 2 }));
      useCartStore.getState().addItem(createCartItem({ quantity: 3 }));

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(5);
    });

    it('increments quantity by 1 when adding an existing item without quantity', () => {
      useCartStore.getState().addItem(createCartItem({ quantity: 2 }));
      useCartStore.getState().addItem({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Xịt thơm phòng Sả Chanh 100ml',
        image: '/images/sa-chanh.jpg',
        price: 120000,
        scent: 'Sả Chanh',
        volumeMl: 100,
      });

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
    });

    it('increments quantity by 1 when adding an existing item with quantity 0', () => {
      useCartStore.getState().addItem(createCartItem({ quantity: 2 }));
      useCartStore.getState().addItem(createCartItem({ quantity: 0 }));

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
    });

    it('does not mutate or alter other items when adding an existing item', () => {
      const item1 = createCartItem({ variantId: 'var-1', quantity: 2 });
      const item2 = createCartItem({
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Xịt thơm Quế Gỗ',
        quantity: 4,
      });

      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);

      useCartStore
        .getState()
        .addItem(createCartItem({ variantId: 'var-1', quantity: 3 }));

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items.find((i) => i.variantId === 'var-1')?.quantity).toBe(
        5,
      );
      expect(state.items.find((i) => i.variantId === 'var-2')?.quantity).toBe(
        4,
      );
    });

    it('appends multiple distinct items sequentially', () => {
      const item1 = createCartItem({ variantId: 'var-1', quantity: 1 });
      const item2 = createCartItem({ variantId: 'var-2', quantity: 2 });
      const item3 = createCartItem({ variantId: 'var-3', quantity: 5 });

      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);
      useCartStore.getState().addItem(item3);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(3);
      expect(state.items.map((i) => i.variantId)).toEqual([
        'var-1',
        'var-2',
        'var-3',
      ]);
    });
  });

  describe('removeItem', () => {
    it('removes the specified item by variantId', () => {
      const item1 = createCartItem({ variantId: 'var-1' });
      const item2 = createCartItem({ variantId: 'var-2' });

      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);

      useCartStore.getState().removeItem('var-1');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].variantId).toBe('var-2');
    });

    it('leaves items unchanged if variantId is not found in cart', () => {
      const item = createCartItem({ variantId: 'var-1' });
      useCartStore.getState().addItem(item);

      useCartStore.getState().removeItem('var-non-existent');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].variantId).toBe('var-1');
    });

    it('handles removing from an already empty cart without error', () => {
      useCartStore.getState().removeItem('var-1');

      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
    });
  });

  describe('updateQuantity', () => {
    it('updates the quantity of an existing item when quantity is greater than 0', () => {
      const item = createCartItem({ variantId: 'var-1', quantity: 2 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', 6);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(6);
    });

    it('removes the item when updated quantity is 0', () => {
      const item = createCartItem({ variantId: 'var-1', quantity: 2 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', 0);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('removes the item when updated quantity is negative', () => {
      const item = createCartItem({ variantId: 'var-1', quantity: 2 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', -1);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('does not mutate other items when updating quantity of a specific item', () => {
      const item1 = createCartItem({ variantId: 'var-1', quantity: 2 });
      const item2 = createCartItem({ variantId: 'var-2', quantity: 3 });
      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);

      useCartStore.getState().updateQuantity('var-1', 8);

      const state = useCartStore.getState();
      expect(state.items.find((i) => i.variantId === 'var-1')?.quantity).toBe(
        8,
      );
      expect(state.items.find((i) => i.variantId === 'var-2')?.quantity).toBe(
        3,
      );
    });

    it('leaves items unchanged when updating a non-existent variantId with positive quantity', () => {
      const item = createCartItem({ variantId: 'var-1', quantity: 2 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-non-existent', 5);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
    });
  });

  describe('clearCart', () => {
    it('removes all items from the cart', () => {
      useCartStore.getState().addItem(createCartItem({ variantId: 'var-1' }));
      useCartStore.getState().addItem(createCartItem({ variantId: 'var-2' }));

      expect(useCartStore.getState().items).toHaveLength(2);

      useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toEqual([]);
    });

    it('remains empty when clearing an already empty cart', () => {
      useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toEqual([]);
    });
  });

  describe('getTotalPrice', () => {
    it('returns 0 when cart is empty', () => {
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
    });

    it('calculates total price for a single item', () => {
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-1',
          price: 120000,
          quantity: 3,
        }),
      );

      expect(useCartStore.getState().getTotalPrice()).toBe(360000);
    });

    it('calculates total price across multiple items with different quantities and prices', () => {
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-1',
          price: 150000,
          quantity: 2,
        }),
      );
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-2',
          price: 250000,
          quantity: 3,
        }),
      );
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-3',
          price: 80000,
          quantity: 1,
        }),
      );

      // (150000 * 2) + (250000 * 3) + (80000 * 1) = 300000 + 750000 + 80000 = 1130000
      expect(useCartStore.getState().getTotalPrice()).toBe(1130000);
    });

    it('recalculates total price after item removal and clearCart', () => {
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-1',
          price: 100000,
          quantity: 2,
        }),
      );
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-2',
          price: 200000,
          quantity: 1,
        }),
      );

      expect(useCartStore.getState().getTotalPrice()).toBe(400000);

      useCartStore.getState().removeItem('var-1');
      expect(useCartStore.getState().getTotalPrice()).toBe(200000);

      useCartStore.getState().clearCart();
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
    });
  });

  describe('getTotalItems', () => {
    it('returns 0 when cart is empty', () => {
      expect(useCartStore.getState().getTotalItems()).toBe(0);
    });

    it('calculates total items for a single item', () => {
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-1',
          quantity: 4,
        }),
      );

      expect(useCartStore.getState().getTotalItems()).toBe(4);
    });

    it('calculates total items across multiple items', () => {
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-1',
          quantity: 2,
        }),
      );
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-2',
          quantity: 3,
        }),
      );
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-3',
          quantity: 5,
        }),
      );

      expect(useCartStore.getState().getTotalItems()).toBe(10);
    });

    it('recalculates total items after quantity update and item removal', () => {
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-1',
          quantity: 2,
        }),
      );
      useCartStore.getState().addItem(
        createCartItem({
          variantId: 'var-2',
          quantity: 3,
        }),
      );

      expect(useCartStore.getState().getTotalItems()).toBe(5);

      useCartStore.getState().updateQuantity('var-1', 6);
      expect(useCartStore.getState().getTotalItems()).toBe(9);

      useCartStore.getState().removeItem('var-2');
      expect(useCartStore.getState().getTotalItems()).toBe(6);

      useCartStore.getState().clearCart();
      expect(useCartStore.getState().getTotalItems()).toBe(0);
    });
  });

  describe('persistence configuration', () => {
    it('configures persist middleware with name "cart-storage"', () => {
      const persistOptions = (useCartStore as any).persist?.getOptions?.();
      expect(persistOptions?.name).toBe('cart-storage');
    });
  });
});
