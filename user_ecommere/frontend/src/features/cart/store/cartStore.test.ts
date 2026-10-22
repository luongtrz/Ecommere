import { describe, expect, it, beforeEach } from 'vitest';
import { useCartStore, type CartItem } from './cartStore';

const createItem = (overrides?: Partial<CartItem>): CartItem => ({
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Nước hoa Charme Iris 50ml',
  image: '/images/charme-iris.jpg',
  price: 350000,
  quantity: 1,
  scent: 'Hương gỗ nồng ấm',
  volumeMl: 50,
  stock: 10,
  ...overrides,
});

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false });
  });

  describe('initial state', () => {
    it('initializes with an empty items array and closed cart drawer', () => {
      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
      expect(state.isOpen).toBe(false);
    });
  });

  describe('addItem', () => {
    it('adds a new item with default quantity 1 when quantity is omitted', () => {
      const itemWithoutQuantity = {
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa Charme Iris 50ml',
        image: '/images/charme-iris.jpg',
        price: 350000,
        scent: 'Hương gỗ nồng ấm',
        volumeMl: 50,
      };

      useCartStore.getState().addItem(itemWithoutQuantity);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toEqual({
        ...itemWithoutQuantity,
        quantity: 1,
      });
      expect(state.isOpen).toBe(true);
    });

    it('adds a new item with specified quantity within stock', () => {
      const item = createItem({ quantity: 3, stock: 5 });

      useCartStore.getState().addItem(item);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(3);
      expect(state.isOpen).toBe(true);
    });

    it('clamps quantity to available stock when adding a new item with quantity exceeding stock', () => {
      const item = createItem({ quantity: 8, stock: 4 });

      useCartStore.getState().addItem(item);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(4);
      expect(state.isOpen).toBe(true);
    });

    it('does not clamp quantity when stock is <= 0 or not a positive number for a new item', () => {
      const itemZeroStock = createItem({
        variantId: 'var-zero',
        quantity: 3,
        stock: 0,
      });

      useCartStore.getState().addItem(itemZeroStock);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(3);
    });

    it('does not clamp quantity when stock is undefined for a new item', () => {
      const itemNoStock = createItem({
        variantId: 'var-no-stock',
        quantity: 5,
        stock: undefined,
      });

      useCartStore.getState().addItem(itemNoStock);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(5);
    });

    it('defaults new item quantity to 1 if passed quantity is 0', () => {
      const itemZeroQuantity = createItem({
        variantId: 'var-zero-qty',
        quantity: 0,
        stock: 10,
      });

      useCartStore.getState().addItem(itemZeroQuantity);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(1);
    });

    it('increments quantity and updates stock when adding an existing item', () => {
      useCartStore.getState().addItem(createItem({ quantity: 2, stock: 10 }));

      useCartStore.getState().addItem(createItem({ quantity: 3, stock: 8 }));

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(5);
      expect(state.items[0].stock).toBe(8);
      expect(state.isOpen).toBe(true);
    });

    it('clamps to effectiveStock when adding to an existing item exceeds stock', () => {
      useCartStore.getState().addItem(createItem({ quantity: 3, stock: 5 }));
      useCartStore.getState().addItem(createItem({ quantity: 4, stock: 5 }));

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(5);
      expect(state.items[0].stock).toBe(5);
    });

    it('falls back to existing stock when incoming item stock is not a number', () => {
      useCartStore.getState().addItem(createItem({ quantity: 2, stock: 6 }));

      useCartStore
        .getState()
        .addItem(createItem({ quantity: 2, stock: undefined }));

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(4);
      expect(state.items[0].stock).toBe(6);
    });

    it('does not change quantity when effectiveStock is 0 or negative', () => {
      useCartStore.getState().addItem(createItem({ quantity: 2, stock: 0 }));

      useCartStore.getState().addItem(createItem({ quantity: 2, stock: 0 }));

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(2);
    });

    it('adds quantity without stock cap when effectiveStock is undefined', () => {
      const noStockItem = createItem({
        variantId: 'var-no-stock',
        quantity: 3,
        stock: undefined,
      });

      useCartStore.getState().addItem(noStockItem);
      useCartStore.getState().addItem({ ...noStockItem, quantity: 4 });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(7);
      expect(state.items[0].stock).toBeUndefined();
    });

    it('defaults to adding 1 when item.quantity is omitted for an existing item', () => {
      useCartStore.getState().addItem(createItem({ quantity: 2, stock: 10 }));

      useCartStore.getState().addItem({
        productId: 'prod-1',
        variantId: 'var-1',
        name: 'Nước hoa Charme Iris 50ml',
        image: '/images/charme-iris.jpg',
        price: 350000,
        scent: 'Hương gỗ nồng ấm',
        volumeMl: 50,
      });

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(3);
    });

    it('does not mutate other items in the cart when adding an existing item', () => {
      const item1 = createItem({ variantId: 'var-1', quantity: 2 });
      const item2 = createItem({
        productId: 'prod-2',
        variantId: 'var-2',
        name: 'Nước hoa Charme Ruby',
        quantity: 4,
      });

      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);

      useCartStore
        .getState()
        .addItem(createItem({ variantId: 'var-1', quantity: 1 }));

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items.find((i) => i.variantId === 'var-1')?.quantity).toBe(
        3,
      );
      expect(state.items.find((i) => i.variantId === 'var-2')?.quantity).toBe(
        4,
      );
    });
  });

  describe('removeItem', () => {
    it('removes the specified item by variantId', () => {
      const item1 = createItem({ variantId: 'var-1' });
      const item2 = createItem({ variantId: 'var-2' });

      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);

      useCartStore.getState().removeItem('var-1');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].variantId).toBe('var-2');
    });

    it('leaves items unchanged if variantId is not in the cart', () => {
      const item = createItem({ variantId: 'var-1' });
      useCartStore.getState().addItem(item);

      useCartStore.getState().removeItem('non-existent-var');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].variantId).toBe('var-1');
    });
  });

  describe('updateQuantity', () => {
    it('returns early and does nothing if the item does not exist in cart', () => {
      const item = createItem({ variantId: 'var-1', quantity: 2 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('non-existent-var', 5);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(2);
    });

    it('removes item when updated quantity is 0', () => {
      const item = createItem({ variantId: 'var-1', quantity: 2 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', 0);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('removes item when updated quantity is negative', () => {
      const item = createItem({ variantId: 'var-1', quantity: 2 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', -2);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('updates quantity when increasing within stock limit', () => {
      const item = createItem({ variantId: 'var-1', quantity: 2, stock: 10 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', 6);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(6);
    });

    it('caps quantity at stock when increasing quantity exceeds stock', () => {
      const item = createItem({ variantId: 'var-1', quantity: 2, stock: 5 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', 10);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(5);
    });

    it('keeps current quantity if stock is lower than current quantity when attempting to raise', () => {
      // e.g. current quantity is 4, stock dropped to 2, user tries to increase to 6
      useCartStore.setState({
        items: [createItem({ variantId: 'var-1', quantity: 4, stock: 2 })],
        isOpen: false,
      });

      useCartStore.getState().updateQuantity('var-1', 6);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(4);
    });

    it('allows lowering quantity without capping by stock', () => {
      const item = createItem({ variantId: 'var-1', quantity: 5, stock: 10 });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', 2);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(2);
    });

    it('increases quantity without stock restriction when stock is undefined', () => {
      const item = createItem({
        variantId: 'var-1',
        quantity: 2,
        stock: undefined,
      });
      useCartStore.getState().addItem(item);

      useCartStore.getState().updateQuantity('var-1', 99);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(99);
    });

    it('does not mutate other items when updating one item', () => {
      const item1 = createItem({ variantId: 'var-1', quantity: 2 });
      const item2 = createItem({ variantId: 'var-2', quantity: 3 });
      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);

      useCartStore.getState().updateQuantity('var-1', 4);

      const state = useCartStore.getState();
      expect(state.items.find((i) => i.variantId === 'var-1')?.quantity).toBe(
        4,
      );
      expect(state.items.find((i) => i.variantId === 'var-2')?.quantity).toBe(
        3,
      );
    });
  });

  describe('clearCart', () => {
    it('removes all items from the cart', () => {
      useCartStore.getState().addItem(createItem({ variantId: 'var-1' }));
      useCartStore.getState().addItem(createItem({ variantId: 'var-2' }));

      expect(useCartStore.getState().items).toHaveLength(2);

      useCartStore.getState().clearCart();

      expect(useCartStore.getState().items).toEqual([]);
    });
  });

  describe('drawer controls (openCart, closeCart, toggleCart)', () => {
    it('opens the cart drawer with openCart', () => {
      expect(useCartStore.getState().isOpen).toBe(false);

      useCartStore.getState().openCart();
      expect(useCartStore.getState().isOpen).toBe(true);
    });

    it('closes the cart drawer with closeCart', () => {
      useCartStore.getState().openCart();
      expect(useCartStore.getState().isOpen).toBe(true);

      useCartStore.getState().closeCart();
      expect(useCartStore.getState().isOpen).toBe(false);
    });

    it('toggles the cart drawer open and closed with toggleCart', () => {
      expect(useCartStore.getState().isOpen).toBe(false);

      useCartStore.getState().toggleCart();
      expect(useCartStore.getState().isOpen).toBe(true);

      useCartStore.getState().toggleCart();
      expect(useCartStore.getState().isOpen).toBe(false);
    });
  });

  describe('getTotalPrice', () => {
    it('returns 0 when cart is empty', () => {
      expect(useCartStore.getState().getTotalPrice()).toBe(0);
    });

    it('calculates the total price of all items accurately', () => {
      useCartStore.getState().addItem(
        createItem({
          variantId: 'var-1',
          price: 150000,
          quantity: 2,
        }),
      );
      useCartStore.getState().addItem(
        createItem({
          variantId: 'var-2',
          price: 200000,
          quantity: 3,
        }),
      );

      // (150000 * 2) + (200000 * 3) = 300000 + 600000 = 900000
      expect(useCartStore.getState().getTotalPrice()).toBe(900000);
    });
  });

  describe('getTotalItems', () => {
    it('returns 0 when cart is empty', () => {
      expect(useCartStore.getState().getTotalItems()).toBe(0);
    });

    it('calculates the total quantity of all items in cart', () => {
      useCartStore.getState().addItem(
        createItem({
          variantId: 'var-1',
          quantity: 3,
        }),
      );
      useCartStore.getState().addItem(
        createItem({
          variantId: 'var-2',
          quantity: 5,
        }),
      );

      expect(useCartStore.getState().getTotalItems()).toBe(8);
    });
  });

  describe('replaceItems', () => {
    it('replaces items and clamps item quantity to stock if quantity exceeds stock and stock > 0', () => {
      const itemsToReplace: CartItem[] = [
        createItem({
          variantId: 'var-1',
          quantity: 10,
          stock: 4,
        }),
        createItem({
          variantId: 'var-2',
          quantity: 2,
          stock: 5,
        }),
      ];

      useCartStore.getState().replaceItems(itemsToReplace);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].quantity).toBe(4);
      expect(state.items[1].quantity).toBe(2);
    });

    it('leaves items unchanged when stock is undefined or <= 0', () => {
      const itemsToReplace: CartItem[] = [
        createItem({
          variantId: 'var-no-stock',
          quantity: 7,
          stock: undefined,
        }),
        createItem({
          variantId: 'var-zero-stock',
          quantity: 3,
          stock: 0,
        }),
      ];

      useCartStore.getState().replaceItems(itemsToReplace);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(7);
      expect(state.items[1].quantity).toBe(3);
    });
  });

  describe('persistence partialize configuration', () => {
    it('persists only items and ignores isOpen', () => {
      const persistOptions = (useCartStore as any).persist?.getOptions?.();
      if (persistOptions && typeof persistOptions.partialize === 'function') {
        const fullState = {
          items: [createItem()],
          isOpen: true,
          addItem: () => {},
          removeItem: () => {},
          updateQuantity: () => {},
          clearCart: () => {},
          openCart: () => {},
          closeCart: () => {},
          toggleCart: () => {},
          getTotalPrice: () => 0,
          getTotalItems: () => 0,
          replaceItems: () => {},
        };
        const partial = persistOptions.partialize(fullState);
        expect(partial).toEqual({ items: fullState.items });
        expect(partial.isOpen).toBeUndefined();
      }
    });
  });
});
