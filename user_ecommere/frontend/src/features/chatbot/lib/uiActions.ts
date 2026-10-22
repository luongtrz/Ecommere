import type { QueryKey } from '@tanstack/react-query';

/**
 * Dependencies injected into UI action executor.
 *
 * Corresponding useCartStore actions (from src/features/cart/store/cartStore.ts):
 * - addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
 * - updateQuantity: (variantId: string, quantity: number) => void
 * - removeItem: (variantId: string) => void
 * - clearCart: () => void
 *
 * CartItem interface (from src/features/cart/store/cartStore.ts):
 * - productId: string
 * - variantId: string
 * - name: string
 * - image: string
 * - price: number
 * - quantity: number
 * - scent: string
 * - volumeMl: number
 *
 * Note: The component layer implements the UiActionDeps adapter linking these deps
 * to useCartStore, react-router-dom navigate, and TanStack Query client.
 */
export interface UiActionDeps {
  addToCart(item: {
    variantId: string;
    quantity: number;
    name?: string;
    price?: number;
    productId?: string;
    image?: string;
    scent?: string;
    volumeMl?: number;
  }): void;
  updateCartItem(variantId: string, quantity: number): void;
  removeFromCart(variantId: string): void;
  clearCart(): void;
  navigate(to: string): void;
  invalidate(keys: QueryKey[]): void;
}

/**
 * Applies a UI action emitted by chatbot response or tool execution.
 * Silently ignores unknown types or invalid payloads and never throws.
 */
export function applyUiAction(
  action: { type: string; payload: Record<string, unknown> },
  deps: UiActionDeps,
): void {
  try {
    if (
      !action ||
      typeof action !== 'object' ||
      typeof action.type !== 'string'
    ) {
      return;
    }
    if (!deps || typeof deps !== 'object') {
      return;
    }

    const payload =
      action.payload && typeof action.payload === 'object'
        ? action.payload
        : {};

    switch (action.type) {
      case 'cart.add': {
        const variantId = payload.variantId;
        const quantity = payload.quantity;
        const name = payload.name;
        const price = payload.price;
        const productId = payload.productId;
        const image = payload.image;
        const scent = payload.scent;
        const volumeMl = payload.volumeMl;

        if (typeof variantId !== 'string' || variantId.trim().length === 0) {
          return;
        }

        if (
          typeof quantity !== 'number' ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 99
        ) {
          return;
        }

        if (name !== undefined && typeof name !== 'string') {
          return;
        }

        if (
          price !== undefined &&
          (typeof price !== 'number' || !Number.isFinite(price) || price < 0)
        ) {
          return;
        }

        if (
          productId !== undefined &&
          (typeof productId !== 'string' || productId.trim().length === 0)
        ) {
          return;
        }

        if (image !== undefined && typeof image !== 'string') {
          return;
        }

        if (scent !== undefined && typeof scent !== 'string') {
          return;
        }

        if (
          volumeMl !== undefined &&
          (typeof volumeMl !== 'number' ||
            !Number.isFinite(volumeMl) ||
            volumeMl <= 0)
        ) {
          return;
        }

        const item: {
          variantId: string;
          quantity: number;
          name?: string;
          price?: number;
          productId?: string;
          image?: string;
          scent?: string;
          volumeMl?: number;
        } = {
          variantId,
          quantity,
        };

        if (typeof name === 'string') {
          item.name = name;
        }

        if (typeof price === 'number') {
          item.price = price;
        }

        if (typeof productId === 'string') {
          item.productId = productId;
        }

        if (typeof image === 'string') {
          item.image = image;
        } else if (
          image === undefined &&
          (typeof productId === 'string' ||
            typeof scent === 'string' ||
            typeof volumeMl === 'number')
        ) {
          item.image = '';
        }

        if (typeof scent === 'string') {
          item.scent = scent;
        }

        if (typeof volumeMl === 'number') {
          item.volumeMl = volumeMl;
        }

        deps.addToCart?.(item);
        break;
      }

      case 'cart.update': {
        const variantId = payload.variantId;
        const quantity = payload.quantity;

        if (typeof variantId !== 'string' || variantId.trim().length === 0) {
          return;
        }

        if (
          typeof quantity !== 'number' ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 99
        ) {
          return;
        }

        deps.updateCartItem?.(variantId, quantity);
        break;
      }

      case 'cart.remove': {
        const variantId = payload.variantId;

        if (typeof variantId !== 'string' || variantId.trim().length === 0) {
          return;
        }

        deps.removeFromCart?.(variantId);
        break;
      }

      case 'cart.clear': {
        deps.clearCart?.();
        break;
      }

      case 'navigate': {
        const target =
          typeof payload.to === 'string'
            ? payload.to
            : typeof payload.path === 'string'
              ? payload.path
              : typeof payload.route === 'string'
                ? payload.route
                : typeof payload.url === 'string'
                  ? payload.url
                  : null;

        if (!target) {
          return;
        }

        // Only a path that starts with a single '/' and not '//' is passed to deps.navigate.
        // Absolute URLs and other schemes are rejected.
        if (
          target.startsWith('/') &&
          !target.startsWith('//') &&
          !target.startsWith('/\\')
        ) {
          deps.navigate?.(target);
        }
        break;
      }

      case 'invalidate': {
        // payload.keys must be an array of arrays of strings; pass it to deps.invalidate. Anything else is ignored.
        const keys = payload.keys;
        if (
          Array.isArray(keys) &&
          keys.every(
            (inner) =>
              Array.isArray(inner) && inner.every((k) => typeof k === 'string'),
          )
        ) {
          deps.invalidate?.(keys as QueryKey[]);
        }
        break;
      }

      default: {
        // Unknown types are ignored.
        break;
      }
    }
  } catch {
    // applyUiAction never throws on any input.
  }
}
