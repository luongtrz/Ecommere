import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  scent: string;
  volumeMl: number;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  replaceItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const existingItem = get().items.find(
          (i) => i.variantId === item.variantId,
        );
        if (existingItem) {
          const effectiveStock =
            typeof item.stock === 'number' ? item.stock : existingItem.stock;
          let newQuantity = existingItem.quantity + (item.quantity || 1);
          if (typeof effectiveStock === 'number') {
            if (effectiveStock > 0) {
              newQuantity = Math.max(1, Math.min(newQuantity, effectiveStock));
            } else {
              newQuantity = existingItem.quantity;
            }
          }
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId
                ? {
                    ...i,
                    ...(typeof item.stock === 'number'
                      ? { stock: item.stock }
                      : {}),
                    quantity: newQuantity,
                  }
                : i,
            ),
            isOpen: true, // Auto open drawer
          });
        } else {
          let newQuantity = item.quantity || 1;
          if (typeof item.stock === 'number' && item.stock > 0) {
            newQuantity = Math.max(1, Math.min(newQuantity, item.stock));
          }
          set({
            items: [...get().items, { ...item, quantity: newQuantity }],
            isOpen: true, // Auto open drawer
          });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        const item = get().items.find((i) => i.variantId === variantId);
        if (!item) return;

        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        // Raising a line is capped at its stock, so a sold-out line cannot go up.
        // Lowering or removing a line is always allowed.
        let newQuantity = quantity;
        if (quantity > item.quantity && typeof item.stock === 'number') {
          newQuantity = Math.max(item.quantity, Math.min(quantity, item.stock));
        }

        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: newQuantity } : i,
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },

      getTotalItems: () => {
        const total = get().items.reduce(
          (total, item) => total + item.quantity,
          0,
        );
        return total;
      },

      replaceItems: (items) => {
        set({
          items: items.map((item) => {
            if (
              typeof item.stock === 'number' &&
              item.stock > 0 &&
              item.quantity > item.stock
            ) {
              return { ...item, quantity: Math.max(1, item.stock) };
            }
            return item;
          }),
        });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items
    },
  ),
);
