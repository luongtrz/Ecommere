import { describe, expect, it, vi, beforeEach } from 'vitest';
import { applyUiAction, type UiActionDeps } from './uiActions';

describe('uiActions', () => {
  let deps: UiActionDeps;

  beforeEach(() => {
    deps = {
      addToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      navigate: vi.fn(),
      invalidate: vi.fn(),
    };
  });

  describe('guard clauses and input validation', () => {
    it('returns early when action is null or undefined', () => {
      applyUiAction(
        null as unknown as { type: string; payload: Record<string, unknown> },
        deps,
      );
      applyUiAction(
        undefined as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
      expect(deps.clearCart).not.toHaveBeenCalled();
    });

    it('returns early when action is not an object', () => {
      applyUiAction(
        'cart.clear' as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      applyUiAction(
        123 as unknown as { type: string; payload: Record<string, unknown> },
        deps,
      );
      applyUiAction(
        true as unknown as { type: string; payload: Record<string, unknown> },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
      expect(deps.clearCart).not.toHaveBeenCalled();
    });

    it('returns early when action.type is not a string', () => {
      applyUiAction(
        {} as unknown as { type: string; payload: Record<string, unknown> },
        deps,
      );
      applyUiAction(
        { type: 123 } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      applyUiAction(
        { type: null } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      applyUiAction(
        { type: {} } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
      expect(deps.clearCart).not.toHaveBeenCalled();
    });

    it('returns early when deps is null or undefined', () => {
      expect(() => {
        applyUiAction(
          { type: 'cart.clear', payload: {} },
          null as unknown as UiActionDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          { type: 'cart.clear', payload: {} },
          undefined as unknown as UiActionDeps,
        );
      }).not.toThrow();
    });

    it('returns early when deps is not an object', () => {
      expect(() => {
        applyUiAction(
          { type: 'cart.clear', payload: {} },
          'invalid-deps' as unknown as UiActionDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          { type: 'cart.clear', payload: {} },
          123 as unknown as UiActionDeps,
        );
      }).not.toThrow();
    });

    it('falls back to empty object when action.payload is missing, null, or not an object', () => {
      applyUiAction(
        { type: 'cart.clear' } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      expect(deps.clearCart).toHaveBeenCalledTimes(1);

      applyUiAction(
        { type: 'cart.clear', payload: null } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      expect(deps.clearCart).toHaveBeenCalledTimes(2);

      applyUiAction(
        { type: 'cart.clear', payload: 'string-payload' } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      expect(deps.clearCart).toHaveBeenCalledTimes(3);
    });
  });

  describe('cart.add', () => {
    it('successfully calls deps.addToCart with full valid payload', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-101',
            quantity: 2,
            name: 'Tinh dầu hoa bưởi',
            price: 150000,
            productId: 'prod-001',
            image: 'https://example.com/buoi.jpg',
            scent: 'Hoa bưởi tự nhiên',
            volumeMl: 50,
          },
        },
        deps,
      );

      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-101',
        quantity: 2,
        name: 'Tinh dầu hoa bưởi',
        price: 150000,
        productId: 'prod-001',
        image: 'https://example.com/buoi.jpg',
        scent: 'Hoa bưởi tự nhiên',
        volumeMl: 50,
      });
    });

    it('successfully calls deps.addToCart with minimal valid payload', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-102',
            quantity: 1,
          },
        },
        deps,
      );

      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-102',
        quantity: 1,
      });
    });

    it('accepts zero price as a valid price', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-103',
            quantity: 1,
            price: 0,
          },
        },
        deps,
      );

      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-103',
        quantity: 1,
        price: 0,
      });
    });

    it('sets image to empty string when image is undefined and productId is provided', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-104',
            quantity: 1,
            productId: 'prod-002',
          },
        },
        deps,
      );

      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-104',
        quantity: 1,
        productId: 'prod-002',
        image: '',
      });
    });

    it('sets image to empty string when image is undefined and scent is provided', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-105',
            quantity: 1,
            scent: 'Hương sả chanh',
          },
        },
        deps,
      );

      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-105',
        quantity: 1,
        scent: 'Hương sả chanh',
        image: '',
      });
    });

    it('sets image to empty string when image is undefined and volumeMl is provided', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-106',
            quantity: 1,
            volumeMl: 30,
          },
        },
        deps,
      );

      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-106',
        quantity: 1,
        volumeMl: 30,
        image: '',
      });
    });

    it('rejects missing or invalid variantId', () => {
      applyUiAction({ type: 'cart.add', payload: { quantity: 1 } }, deps);
      applyUiAction(
        { type: 'cart.add', payload: { variantId: 123, quantity: 1 } },
        deps,
      );
      applyUiAction(
        { type: 'cart.add', payload: { variantId: '', quantity: 1 } },
        deps,
      );
      applyUiAction(
        { type: 'cart.add', payload: { variantId: '   ', quantity: 1 } },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('rejects invalid quantity values', () => {
      const invalidQuantities = [
        undefined,
        '1',
        1.5,
        NaN,
        Infinity,
        -Infinity,
        0,
        -1,
        100,
        999,
      ];

      for (const quantity of invalidQuantities) {
        applyUiAction(
          {
            type: 'cart.add',
            payload: {
              variantId: 'var-valid',
              quantity,
            },
          },
          deps,
        );
      }

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('accepts boundary quantity values (1 and 99)', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-boundary-1',
            quantity: 1,
          },
        },
        deps,
      );
      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-boundary-1',
        quantity: 1,
      });

      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-boundary-99',
            quantity: 99,
          },
        },
        deps,
      );
      expect(deps.addToCart).toHaveBeenCalledWith({
        variantId: 'var-boundary-99',
        quantity: 99,
      });
    });

    it('rejects invalid name when defined and not string', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            name: 123,
          },
        },
        deps,
      );
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            name: false,
          },
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('rejects invalid price when defined and not a valid non-negative number', () => {
      const invalidPrices = ['100', NaN, Infinity, -Infinity, -0.01, -100];

      for (const price of invalidPrices) {
        applyUiAction(
          {
            type: 'cart.add',
            payload: {
              variantId: 'var-1',
              quantity: 1,
              price,
            },
          },
          deps,
        );
      }

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('rejects invalid productId when defined and not a non-empty string', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            productId: 123,
          },
        },
        deps,
      );
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            productId: '',
          },
        },
        deps,
      );
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            productId: '   ',
          },
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('rejects invalid image when defined and not a string', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            image: 123,
          },
        },
        deps,
      );
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            image: true,
          },
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('rejects invalid scent when defined and not a string', () => {
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            scent: 123,
          },
        },
        deps,
      );
      applyUiAction(
        {
          type: 'cart.add',
          payload: {
            variantId: 'var-1',
            quantity: 1,
            scent: false,
          },
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('rejects invalid volumeMl when defined and not a positive finite number', () => {
      const invalidVolumes = ['50', NaN, Infinity, -Infinity, 0, -10];

      for (const volumeMl of invalidVolumes) {
        applyUiAction(
          {
            type: 'cart.add',
            payload: {
              variantId: 'var-1',
              quantity: 1,
              volumeMl,
            },
          },
          deps,
        );
      }

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('safely handles missing addToCart handler on deps', () => {
      const emptyDeps = {} as UiActionDeps;
      expect(() => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: {
              variantId: 'var-1',
              quantity: 1,
            },
          },
          emptyDeps,
        );
      }).not.toThrow();
    });
  });

  describe('cart.update', () => {
    it('successfully calls deps.updateCartItem with valid variantId and quantity', () => {
      applyUiAction(
        {
          type: 'cart.update',
          payload: {
            variantId: 'var-update-1',
            quantity: 5,
          },
        },
        deps,
      );

      expect(deps.updateCartItem).toHaveBeenCalledWith('var-update-1', 5);
    });

    it('accepts boundary quantities (1 and 99)', () => {
      applyUiAction(
        {
          type: 'cart.update',
          payload: {
            variantId: 'var-update-1',
            quantity: 1,
          },
        },
        deps,
      );
      expect(deps.updateCartItem).toHaveBeenCalledWith('var-update-1', 1);

      applyUiAction(
        {
          type: 'cart.update',
          payload: {
            variantId: 'var-update-1',
            quantity: 99,
          },
        },
        deps,
      );
      expect(deps.updateCartItem).toHaveBeenCalledWith('var-update-1', 99);
    });

    it('rejects invalid variantId', () => {
      applyUiAction({ type: 'cart.update', payload: { quantity: 5 } }, deps);
      applyUiAction(
        { type: 'cart.update', payload: { variantId: 123, quantity: 5 } },
        deps,
      );
      applyUiAction(
        { type: 'cart.update', payload: { variantId: '', quantity: 5 } },
        deps,
      );
      applyUiAction(
        { type: 'cart.update', payload: { variantId: '   ', quantity: 5 } },
        deps,
      );

      expect(deps.updateCartItem).not.toHaveBeenCalled();
    });

    it('rejects invalid quantity values', () => {
      const invalidQuantities = [
        undefined,
        '5',
        2.5,
        NaN,
        Infinity,
        -Infinity,
        0,
        -1,
        100,
        999,
      ];

      for (const quantity of invalidQuantities) {
        applyUiAction(
          {
            type: 'cart.update',
            payload: {
              variantId: 'var-update-1',
              quantity,
            },
          },
          deps,
        );
      }

      expect(deps.updateCartItem).not.toHaveBeenCalled();
    });

    it('safely handles missing updateCartItem handler on deps', () => {
      const emptyDeps = {} as UiActionDeps;
      expect(() => {
        applyUiAction(
          {
            type: 'cart.update',
            payload: {
              variantId: 'var-update-1',
              quantity: 2,
            },
          },
          emptyDeps,
        );
      }).not.toThrow();
    });
  });

  describe('cart.remove', () => {
    it('successfully calls deps.removeFromCart with valid variantId', () => {
      applyUiAction(
        {
          type: 'cart.remove',
          payload: {
            variantId: 'var-remove-1',
          },
        },
        deps,
      );

      expect(deps.removeFromCart).toHaveBeenCalledWith('var-remove-1');
    });

    it('rejects invalid variantId', () => {
      applyUiAction({ type: 'cart.remove', payload: {} }, deps);
      applyUiAction({ type: 'cart.remove', payload: { variantId: 999 } }, deps);
      applyUiAction({ type: 'cart.remove', payload: { variantId: '' } }, deps);
      applyUiAction(
        { type: 'cart.remove', payload: { variantId: '   ' } },
        deps,
      );

      expect(deps.removeFromCart).not.toHaveBeenCalled();
    });

    it('safely handles missing removeFromCart handler on deps', () => {
      const emptyDeps = {} as UiActionDeps;
      expect(() => {
        applyUiAction(
          {
            type: 'cart.remove',
            payload: {
              variantId: 'var-remove-1',
            },
          },
          emptyDeps,
        );
      }).not.toThrow();
    });
  });

  describe('cart.clear', () => {
    it('successfully calls deps.clearCart', () => {
      applyUiAction(
        {
          type: 'cart.clear',
          payload: {},
        },
        deps,
      );

      expect(deps.clearCart).toHaveBeenCalledTimes(1);
    });

    it('safely handles missing clearCart handler on deps', () => {
      const emptyDeps = {} as UiActionDeps;
      expect(() => {
        applyUiAction(
          {
            type: 'cart.clear',
            payload: {},
          },
          emptyDeps,
        );
      }).not.toThrow();
    });
  });

  describe('navigate', () => {
    it('prioritizes payload.to when present and valid', () => {
      applyUiAction(
        {
          type: 'navigate',
          payload: {
            to: '/products',
            path: '/other-path',
            route: '/other-route',
            url: '/other-url',
          },
        },
        deps,
      );

      expect(deps.navigate).toHaveBeenCalledWith('/products');
    });

    it('falls back to payload.path when to is not a string', () => {
      applyUiAction(
        {
          type: 'navigate',
          payload: {
            to: 123,
            path: '/cart',
            route: '/other-route',
            url: '/other-url',
          },
        },
        deps,
      );

      expect(deps.navigate).toHaveBeenCalledWith('/cart');
    });

    it('falls back to payload.route when to and path are not strings', () => {
      applyUiAction(
        {
          type: 'navigate',
          payload: {
            to: null,
            path: undefined,
            route: '/orders',
            url: '/other-url',
          },
        },
        deps,
      );

      expect(deps.navigate).toHaveBeenCalledWith('/orders');
    });

    it('falls back to payload.url when to, path, and route are not strings', () => {
      applyUiAction(
        {
          type: 'navigate',
          payload: {
            to: false,
            path: 456,
            route: {},
            url: '/profile',
          },
        },
        deps,
      );

      expect(deps.navigate).toHaveBeenCalledWith('/profile');
    });

    it('does not navigate when no target field is a string', () => {
      applyUiAction(
        {
          type: 'navigate',
          payload: {
            to: 123,
            path: null,
            route: false,
            url: {},
          },
        },
        deps,
      );

      expect(deps.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate when target string is empty', () => {
      applyUiAction(
        {
          type: 'navigate',
          payload: {
            to: '',
          },
        },
        deps,
      );

      expect(deps.navigate).not.toHaveBeenCalled();
    });

    it('rejects targets that do not start with a single slash', () => {
      const invalidTargets = [
        'relative/path',
        'products',
        'https://external.com/path',
        'javascript:alert(1)',
      ];

      for (const target of invalidTargets) {
        applyUiAction(
          {
            type: 'navigate',
            payload: {
              to: target,
            },
          },
          deps,
        );
      }

      expect(deps.navigate).not.toHaveBeenCalled();
    });

    it('rejects protocol-relative and backslash targets (starts with // or /\\)', () => {
      const maliciousTargets = [
        '//attacker.com/malicious',
        '//',
        '/\\attacker.com/path',
      ];

      for (const target of maliciousTargets) {
        applyUiAction(
          {
            type: 'navigate',
            payload: {
              to: target,
            },
          },
          deps,
        );
      }

      expect(deps.navigate).not.toHaveBeenCalled();
    });

    it('safely handles missing navigate handler on deps', () => {
      const emptyDeps = {} as UiActionDeps;
      expect(() => {
        applyUiAction(
          {
            type: 'navigate',
            payload: {
              to: '/valid-path',
            },
          },
          emptyDeps,
        );
      }).not.toThrow();
    });
  });

  describe('invalidate', () => {
    it('successfully calls deps.invalidate with array of string arrays', () => {
      const keys = [['products'], ['orders', 'detail', '123']];

      applyUiAction(
        {
          type: 'invalidate',
          payload: {
            keys,
          },
        },
        deps,
      );

      expect(deps.invalidate).toHaveBeenCalledWith(keys);
    });

    it('successfully calls deps.invalidate with an empty array', () => {
      applyUiAction(
        {
          type: 'invalidate',
          payload: {
            keys: [],
          },
        },
        deps,
      );

      expect(deps.invalidate).toHaveBeenCalledWith([]);
    });

    it('ignores payload when keys is not an array', () => {
      const nonArrays = [
        undefined,
        null,
        'products',
        123,
        true,
        { key: 'products' },
      ];

      for (const keys of nonArrays) {
        applyUiAction(
          {
            type: 'invalidate',
            payload: {
              keys,
            },
          },
          deps,
        );
      }

      expect(deps.invalidate).not.toHaveBeenCalled();
    });

    it('ignores payload when outer array elements are not arrays', () => {
      applyUiAction(
        {
          type: 'invalidate',
          payload: {
            keys: ['products', 'orders'],
          },
        },
        deps,
      );

      applyUiAction(
        {
          type: 'invalidate',
          payload: {
            keys: [['products'], 'orders'],
          },
        },
        deps,
      );

      expect(deps.invalidate).not.toHaveBeenCalled();
    });

    it('ignores payload when inner array elements are not strings', () => {
      applyUiAction(
        {
          type: 'invalidate',
          payload: {
            keys: [['products', 123]],
          },
        },
        deps,
      );

      applyUiAction(
        {
          type: 'invalidate',
          payload: {
            keys: [[null]],
          },
        },
        deps,
      );

      applyUiAction(
        {
          type: 'invalidate',
          payload: {
            keys: [[true, 'products']],
          },
        },
        deps,
      );

      expect(deps.invalidate).not.toHaveBeenCalled();
    });

    it('safely handles missing invalidate handler on deps', () => {
      const emptyDeps = {} as UiActionDeps;
      expect(() => {
        applyUiAction(
          {
            type: 'invalidate',
            payload: {
              keys: [['products']],
            },
          },
          emptyDeps,
        );
      }).not.toThrow();
    });
  });

  describe('default / unknown action types', () => {
    it('ignores unknown action types silently without calling any deps', () => {
      applyUiAction(
        {
          type: 'cart.unknown',
          payload: {
            variantId: 'var-1',
          },
        },
        deps,
      );

      applyUiAction(
        {
          type: 'user.login',
          payload: {
            userId: 'user-1',
          },
        },
        deps,
      );

      applyUiAction(
        {
          type: '',
          payload: {},
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
      expect(deps.updateCartItem).not.toHaveBeenCalled();
      expect(deps.removeFromCart).not.toHaveBeenCalled();
      expect(deps.clearCart).not.toHaveBeenCalled();
      expect(deps.navigate).not.toHaveBeenCalled();
      expect(deps.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('error resilience (try-catch)', () => {
    it('never throws when a deps callback throws an error', () => {
      const throwingDeps: UiActionDeps = {
        addToCart: vi.fn().mockImplementation(() => {
          throw new Error('addToCart failed');
        }),
        updateCartItem: vi.fn().mockImplementation(() => {
          throw new Error('updateCartItem failed');
        }),
        removeFromCart: vi.fn().mockImplementation(() => {
          throw new Error('removeFromCart failed');
        }),
        clearCart: vi.fn().mockImplementation(() => {
          throw new Error('clearCart failed');
        }),
        navigate: vi.fn().mockImplementation(() => {
          throw new Error('navigate failed');
        }),
        invalidate: vi.fn().mockImplementation(() => {
          throw new Error('invalidate failed');
        }),
      };

      expect(() => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'v1', quantity: 1 },
          },
          throwingDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'v1', quantity: 1 },
          },
          throwingDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          {
            type: 'cart.remove',
            payload: { variantId: 'v1' },
          },
          throwingDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          {
            type: 'cart.clear',
            payload: {},
          },
          throwingDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          {
            type: 'navigate',
            payload: { to: '/products' },
          },
          throwingDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          {
            type: 'invalidate',
            payload: { keys: [['products']] },
          },
          throwingDeps,
        );
      }).not.toThrow();
    });

    it('never throws when accessing payload properties throws an error', () => {
      const throwingAction = {
        type: 'cart.add',
        get payload() {
          throw new Error('payload property access error');
        },
      };

      expect(() => {
        applyUiAction(
          throwingAction as unknown as {
            type: string;
            payload: Record<string, unknown>;
          },
          deps,
        );
      }).not.toThrow();
    });
  });
});
