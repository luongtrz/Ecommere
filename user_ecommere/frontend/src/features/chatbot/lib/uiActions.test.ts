import { describe, expect, it, vi, beforeEach } from 'vitest';
import { applyUiAction, type UiActionDeps } from './uiActions';

function createMockDeps(overrides?: Partial<UiActionDeps>): UiActionDeps {
  return {
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    navigate: vi.fn(),
    invalidate: vi.fn(),
    ...overrides,
  };
}

describe('applyUiAction', () => {
  let deps: UiActionDeps;

  beforeEach(() => {
    deps = createMockDeps();
  });

  describe('guards and invalid inputs', () => {
    it('does nothing when action is null or undefined', () => {
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
      expect(deps.updateCartItem).not.toHaveBeenCalled();
      expect(deps.removeFromCart).not.toHaveBeenCalled();
      expect(deps.clearCart).not.toHaveBeenCalled();
      expect(deps.navigate).not.toHaveBeenCalled();
      expect(deps.invalidate).not.toHaveBeenCalled();
    });

    it('does nothing when action is not an object', () => {
      applyUiAction(
        'cart.add' as unknown as {
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
    });

    it('does nothing when action.type is not a string', () => {
      applyUiAction(
        {} as unknown as { type: string; payload: Record<string, unknown> },
        deps,
      );
      applyUiAction(
        { type: 123, payload: {} } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      applyUiAction(
        { type: null, payload: {} } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );
      applyUiAction(
        { type: undefined, payload: {} } as unknown as {
          type: string;
          payload: Record<string, unknown>;
        },
        deps,
      );

      expect(deps.addToCart).not.toHaveBeenCalled();
    });

    it('does nothing when deps is null, undefined, or not an object', () => {
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

      expect(() => {
        applyUiAction(
          { type: 'cart.clear', payload: {} },
          'not-an-object' as unknown as UiActionDeps,
        );
      }).not.toThrow();

      expect(() => {
        applyUiAction(
          { type: 'cart.clear', payload: {} },
          42 as unknown as UiActionDeps,
        );
      }).not.toThrow();
    });

    it('handles non-object or null action.payload gracefully by falling back to empty object', () => {
      applyUiAction(
        {
          type: 'cart.clear',
          payload: null as unknown as Record<string, unknown>,
        },
        deps,
      );
      expect(deps.clearCart).toHaveBeenCalledTimes(1);

      applyUiAction(
        {
          type: 'cart.clear',
          payload: undefined as unknown as Record<string, unknown>,
        },
        deps,
      );
      expect(deps.clearCart).toHaveBeenCalledTimes(2);

      applyUiAction(
        {
          type: 'cart.clear',
          payload: 'string-payload' as unknown as Record<string, unknown>,
        },
        deps,
      );
      expect(deps.clearCart).toHaveBeenCalledTimes(3);
    });

    it('catches and silently ignores any runtime errors thrown inside try block', () => {
      const throwingAction = {
        get type(): string {
          throw new Error('Getter failure');
        },
        payload: {},
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

      const throwingDeps = createMockDeps({
        clearCart: () => {
          throw new Error('deps method failure');
        },
      });

      expect(() => {
        applyUiAction({ type: 'cart.clear', payload: {} }, throwingDeps);
      }).not.toThrow();
    });
  });

  describe('cart.add', () => {
    describe('variantId validation', () => {
      it('ignores action when variantId is missing or not a string', () => {
        applyUiAction({ type: 'cart.add', payload: { quantity: 1 } }, deps);
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 123, quantity: 1 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.add', payload: { variantId: null, quantity: 1 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.add', payload: { variantId: {}, quantity: 1 } },
          deps,
        );

        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when variantId is empty or whitespace only', () => {
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
    });

    describe('quantity validation', () => {
      it('ignores action when quantity is missing or not a number', () => {
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1' } },
          deps,
        );
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: '1' } },
          deps,
        );
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: null } },
          deps,
        );

        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when quantity is not an integer', () => {
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: 1.5 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: NaN } },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: Infinity },
          },
          deps,
        );

        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when quantity is less than 1 or greater than 99', () => {
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: 0 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: -1 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: 100 } },
          deps,
        );

        expect(deps.addToCart).not.toHaveBeenCalled();
      });
    });

    describe('optional fields validation', () => {
      it('ignores action when name is defined but not a string', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, name: 123 },
          },
          deps,
        );
        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when price is defined but not a finite non-negative number', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, price: '350000' },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, price: -1 },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, price: NaN },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, price: Infinity },
          },
          deps,
        );

        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when productId is defined but not a non-empty string', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, productId: 123 },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, productId: '' },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, productId: '   ' },
          },
          deps,
        );

        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when image is defined but not a string', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, image: 123 },
          },
          deps,
        );
        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when scent is defined but not a string', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, scent: 123 },
          },
          deps,
        );
        expect(deps.addToCart).not.toHaveBeenCalled();
      });

      it('ignores action when volumeMl is defined but not a positive finite number', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, volumeMl: '50' },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, volumeMl: 0 },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, volumeMl: -10 },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, volumeMl: NaN },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, volumeMl: Infinity },
          },
          deps,
        );

        expect(deps.addToCart).not.toHaveBeenCalled();
      });
    });

    describe('successful executions and field assembly', () => {
      it('adds minimal item with only variantId and quantity (no optional fields)', () => {
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-1', quantity: 1 } },
          deps,
        );

        expect(deps.addToCart).toHaveBeenCalledTimes(1);
        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-1',
          quantity: 1,
        });
      });

      it('adds item with quantity boundary values (1 and 99)', () => {
        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-min', quantity: 1 } },
          deps,
        );
        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-min',
          quantity: 1,
        });

        applyUiAction(
          { type: 'cart.add', payload: { variantId: 'var-max', quantity: 99 } },
          deps,
        );
        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-max',
          quantity: 99,
        });
      });

      it('adds item with zero price', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-gift', quantity: 1, price: 0 },
          },
          deps,
        );

        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-gift',
          quantity: 1,
          price: 0,
        });
      });

      it('adds item with all optional fields provided', () => {
        const fullItem = {
          variantId: 'var-100',
          quantity: 3,
          name: 'Nước hoa Charme Iris 50ml',
          price: 350000,
          productId: 'prod-1',
          image: '/images/charme-iris.jpg',
          scent: 'Hương gỗ nồng ấm',
          volumeMl: 50,
        };

        applyUiAction({ type: 'cart.add', payload: fullItem }, deps);

        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-100',
          quantity: 3,
          name: 'Nước hoa Charme Iris 50ml',
          price: 350000,
          productId: 'prod-1',
          image: '/images/charme-iris.jpg',
          scent: 'Hương gỗ nồng ấm',
          volumeMl: 50,
        });
      });

      it('sets image to empty string when image is undefined and productId is present', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, productId: 'prod-1' },
          },
          deps,
        );

        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-1',
          quantity: 1,
          productId: 'prod-1',
          image: '',
        });
      });

      it('sets image to empty string when image is undefined and scent is present', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: {
              variantId: 'var-1',
              quantity: 1,
              scent: 'Hương cam chanh',
            },
          },
          deps,
        );

        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-1',
          quantity: 1,
          scent: 'Hương cam chanh',
          image: '',
        });
      });

      it('sets image to empty string when image is undefined and volumeMl is present', () => {
        applyUiAction(
          {
            type: 'cart.add',
            payload: { variantId: 'var-1', quantity: 1, volumeMl: 100 },
          },
          deps,
        );

        expect(deps.addToCart).toHaveBeenCalledWith({
          variantId: 'var-1',
          quantity: 1,
          volumeMl: 100,
          image: '',
        });
      });

      it('does not throw when deps.addToCart is not defined', () => {
        const noAddToCartDeps = createMockDeps();
        // @ts-expect-error testing optional chaining
        delete noAddToCartDeps.addToCart;

        expect(() => {
          applyUiAction(
            { type: 'cart.add', payload: { variantId: 'var-1', quantity: 1 } },
            noAddToCartDeps,
          );
        }).not.toThrow();
      });
    });
  });

  describe('cart.update', () => {
    describe('validation', () => {
      it('ignores action when variantId is missing, not a string, or empty', () => {
        applyUiAction({ type: 'cart.update', payload: { quantity: 2 } }, deps);
        applyUiAction(
          { type: 'cart.update', payload: { variantId: 123, quantity: 2 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.update', payload: { variantId: '', quantity: 2 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.update', payload: { variantId: '   ', quantity: 2 } },
          deps,
        );

        expect(deps.updateCartItem).not.toHaveBeenCalled();
      });

      it('ignores action when quantity is missing or not a number', () => {
        applyUiAction(
          { type: 'cart.update', payload: { variantId: 'var-1' } },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: '2' },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: null },
          },
          deps,
        );

        expect(deps.updateCartItem).not.toHaveBeenCalled();
      });

      it('ignores action when quantity is not an integer', () => {
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: 2.5 },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: NaN },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: Infinity },
          },
          deps,
        );

        expect(deps.updateCartItem).not.toHaveBeenCalled();
      });

      it('ignores action when quantity is less than 1 or greater than 99', () => {
        applyUiAction(
          { type: 'cart.update', payload: { variantId: 'var-1', quantity: 0 } },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: -10 },
          },
          deps,
        );
        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: 100 },
          },
          deps,
        );

        expect(deps.updateCartItem).not.toHaveBeenCalled();
      });
    });

    describe('successful update', () => {
      it('calls updateCartItem with variantId and quantity for valid inputs', () => {
        applyUiAction(
          { type: 'cart.update', payload: { variantId: 'var-1', quantity: 1 } },
          deps,
        );
        expect(deps.updateCartItem).toHaveBeenCalledWith('var-1', 1);

        applyUiAction(
          {
            type: 'cart.update',
            payload: { variantId: 'var-1', quantity: 99 },
          },
          deps,
        );
        expect(deps.updateCartItem).toHaveBeenCalledWith('var-1', 99);

        applyUiAction(
          { type: 'cart.update', payload: { variantId: 'var-2', quantity: 5 } },
          deps,
        );
        expect(deps.updateCartItem).toHaveBeenCalledWith('var-2', 5);
      });

      it('does not throw when deps.updateCartItem is not defined', () => {
        const noUpdateDeps = createMockDeps();
        // @ts-expect-error testing optional chaining
        delete noUpdateDeps.updateCartItem;

        expect(() => {
          applyUiAction(
            {
              type: 'cart.update',
              payload: { variantId: 'var-1', quantity: 2 },
            },
            noUpdateDeps,
          );
        }).not.toThrow();
      });
    });
  });

  describe('cart.remove', () => {
    describe('validation', () => {
      it('ignores action when variantId is missing, not a string, or empty', () => {
        applyUiAction({ type: 'cart.remove', payload: {} }, deps);
        applyUiAction(
          { type: 'cart.remove', payload: { variantId: 123 } },
          deps,
        );
        applyUiAction(
          { type: 'cart.remove', payload: { variantId: '' } },
          deps,
        );
        applyUiAction(
          { type: 'cart.remove', payload: { variantId: '   ' } },
          deps,
        );

        expect(deps.removeFromCart).not.toHaveBeenCalled();
      });
    });

    describe('successful removal', () => {
      it('calls removeFromCart with exact variantId', () => {
        applyUiAction(
          { type: 'cart.remove', payload: { variantId: 'var-to-remove' } },
          deps,
        );

        expect(deps.removeFromCart).toHaveBeenCalledTimes(1);
        expect(deps.removeFromCart).toHaveBeenCalledWith('var-to-remove');
      });

      it('does not throw when deps.removeFromCart is not defined', () => {
        const noRemoveDeps = createMockDeps();
        // @ts-expect-error testing optional chaining
        delete noRemoveDeps.removeFromCart;

        expect(() => {
          applyUiAction(
            { type: 'cart.remove', payload: { variantId: 'var-to-remove' } },
            noRemoveDeps,
          );
        }).not.toThrow();
      });
    });
  });

  describe('cart.clear', () => {
    it('calls clearCart with no arguments', () => {
      applyUiAction({ type: 'cart.clear', payload: {} }, deps);

      expect(deps.clearCart).toHaveBeenCalledTimes(1);
      expect(deps.clearCart).toHaveBeenCalledWith();
    });

    it('does not throw when deps.clearCart is not defined', () => {
      const noClearDeps = createMockDeps();
      // @ts-expect-error testing optional chaining
      delete noClearDeps.clearCart;

      expect(() => {
        applyUiAction({ type: 'cart.clear', payload: {} }, noClearDeps);
      }).not.toThrow();
    });
  });

  describe('navigate', () => {
    describe('target candidate resolution', () => {
      it('uses payload.to when to is a valid string', () => {
        applyUiAction({ type: 'navigate', payload: { to: '/products' } }, deps);
        expect(deps.navigate).toHaveBeenCalledWith('/products');
      });

      it('falls back to payload.path when to is missing or not a string', () => {
        applyUiAction({ type: 'navigate', payload: { path: '/cart' } }, deps);
        expect(deps.navigate).toHaveBeenCalledWith('/cart');

        applyUiAction(
          { type: 'navigate', payload: { to: 123, path: '/checkout' } },
          deps,
        );
        expect(deps.navigate).toHaveBeenCalledWith('/checkout');
      });

      it('falls back to payload.route when to and path are not strings', () => {
        applyUiAction(
          { type: 'navigate', payload: { route: '/profile' } },
          deps,
        );
        expect(deps.navigate).toHaveBeenCalledWith('/profile');

        applyUiAction(
          {
            type: 'navigate',
            payload: { to: null, path: undefined, route: '/orders' },
          },
          deps,
        );
        expect(deps.navigate).toHaveBeenCalledWith('/orders');
      });

      it('falls back to payload.url when to, path, and route are not strings', () => {
        applyUiAction(
          { type: 'navigate', payload: { url: '/settings' } },
          deps,
        );
        expect(deps.navigate).toHaveBeenCalledWith('/settings');

        applyUiAction(
          {
            type: 'navigate',
            payload: { to: 1, path: false, route: {}, url: '/contact' },
          },
          deps,
        );
        expect(deps.navigate).toHaveBeenCalledWith('/contact');
      });

      it('does nothing when none of to, path, route, url is a string', () => {
        applyUiAction({ type: 'navigate', payload: {} }, deps);
        applyUiAction(
          {
            type: 'navigate',
            payload: { to: 123, path: null, route: true, url: {} },
          },
          deps,
        );

        expect(deps.navigate).not.toHaveBeenCalled();
      });

      it('does nothing when candidate target is an empty string', () => {
        applyUiAction({ type: 'navigate', payload: { to: '' } }, deps);

        expect(deps.navigate).not.toHaveBeenCalled();
      });
    });

    describe('path safety and scheme validation', () => {
      it('does not navigate when target does not start with /', () => {
        applyUiAction({ type: 'navigate', payload: { to: 'products' } }, deps);
        applyUiAction(
          { type: 'navigate', payload: { to: 'https://evil.com' } },
          deps,
        );
        applyUiAction(
          { type: 'navigate', payload: { to: 'javascript:alert(1)' } },
          deps,
        );

        expect(deps.navigate).not.toHaveBeenCalled();
      });

      it('rejects protocol-relative targets starting with //', () => {
        applyUiAction(
          { type: 'navigate', payload: { to: '//malicious-phishing.com' } },
          deps,
        );
        applyUiAction({ type: 'navigate', payload: { to: '//' } }, deps);

        expect(deps.navigate).not.toHaveBeenCalled();
      });

      it('rejects paths starting with /\\', () => {
        applyUiAction(
          { type: 'navigate', payload: { to: '/\\malicious-phishing.com' } },
          deps,
        );
        applyUiAction({ type: 'navigate', payload: { to: '/\\' } }, deps);

        expect(deps.navigate).not.toHaveBeenCalled();
      });

      it('navigates successfully to root path /', () => {
        applyUiAction({ type: 'navigate', payload: { to: '/' } }, deps);

        expect(deps.navigate).toHaveBeenCalledWith('/');
      });

      it('navigates successfully to valid nested paths, search params, and hash fragments', () => {
        applyUiAction(
          {
            type: 'navigate',
            payload: { to: '/products/perfume-123?category=nuoc-hoa#spec' },
          },
          deps,
        );

        expect(deps.navigate).toHaveBeenCalledWith(
          '/products/perfume-123?category=nuoc-hoa#spec',
        );
      });

      it('does not throw when deps.navigate is not defined', () => {
        const noNavigateDeps = createMockDeps();
        // @ts-expect-error testing optional chaining
        delete noNavigateDeps.navigate;

        expect(() => {
          applyUiAction(
            { type: 'navigate', payload: { to: '/products' } },
            noNavigateDeps,
          );
        }).not.toThrow();
      });
    });
  });

  describe('invalidate', () => {
    describe('validation', () => {
      it('ignores action when keys is not an array', () => {
        applyUiAction({ type: 'invalidate', payload: {} }, deps);
        applyUiAction(
          { type: 'invalidate', payload: { keys: 'products' } },
          deps,
        );
        applyUiAction({ type: 'invalidate', payload: { keys: 123 } }, deps);
        applyUiAction({ type: 'invalidate', payload: { keys: null } }, deps);
        applyUiAction({ type: 'invalidate', payload: { keys: {} } }, deps);

        expect(deps.invalidate).not.toHaveBeenCalled();
      });

      it('ignores action when keys is an array containing non-array elements', () => {
        applyUiAction(
          { type: 'invalidate', payload: { keys: ['products', 'cart'] } },
          deps,
        );
        applyUiAction({ type: 'invalidate', payload: { keys: [123] } }, deps);
        applyUiAction({ type: 'invalidate', payload: { keys: [null] } }, deps);
        applyUiAction(
          { type: 'invalidate', payload: { keys: [['products'], 'cart'] } },
          deps,
        );

        expect(deps.invalidate).not.toHaveBeenCalled();
      });

      it('ignores action when inner arrays contain non-string elements', () => {
        applyUiAction(
          { type: 'invalidate', payload: { keys: [['products'], [123]] } },
          deps,
        );
        applyUiAction(
          { type: 'invalidate', payload: { keys: [['products', null]] } },
          deps,
        );
        applyUiAction(
          { type: 'invalidate', payload: { keys: [['products', undefined]] } },
          deps,
        );
        applyUiAction({ type: 'invalidate', payload: { keys: [[{}]] } }, deps);

        expect(deps.invalidate).not.toHaveBeenCalled();
      });
    });

    describe('successful invalidation', () => {
      it('calls invalidate with empty array when keys is []', () => {
        applyUiAction({ type: 'invalidate', payload: { keys: [] } }, deps);

        expect(deps.invalidate).toHaveBeenCalledWith([]);
      });

      it('calls invalidate with valid array of string tuples', () => {
        const queryKeys = [['products'], ['product-detail', 'p-1'], ['cart']];

        applyUiAction(
          { type: 'invalidate', payload: { keys: queryKeys } },
          deps,
        );

        expect(deps.invalidate).toHaveBeenCalledTimes(1);
        expect(deps.invalidate).toHaveBeenCalledWith(queryKeys);
      });

      it('does not throw when deps.invalidate is not defined', () => {
        const noInvalidateDeps = createMockDeps();
        // @ts-expect-error testing optional chaining
        delete noInvalidateDeps.invalidate;

        expect(() => {
          applyUiAction(
            { type: 'invalidate', payload: { keys: [['products']] } },
            noInvalidateDeps,
          );
        }).not.toThrow();
      });
    });
  });

  describe('unrecognized or default action type', () => {
    it('ignores unknown action types silently without doing anything', () => {
      applyUiAction({ type: 'unknown.type', payload: { data: 'test' } }, deps);
      applyUiAction({ type: 'notifications.show', payload: {} }, deps);
      applyUiAction({ type: 'auth.login', payload: {} }, deps);

      expect(deps.addToCart).not.toHaveBeenCalled();
      expect(deps.updateCartItem).not.toHaveBeenCalled();
      expect(deps.removeFromCart).not.toHaveBeenCalled();
      expect(deps.clearCart).not.toHaveBeenCalled();
      expect(deps.navigate).not.toHaveBeenCalled();
      expect(deps.invalidate).not.toHaveBeenCalled();
    });
  });
});
