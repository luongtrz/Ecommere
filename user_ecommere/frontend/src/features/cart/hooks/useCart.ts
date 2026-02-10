import { useCartStore } from '../store/cartStore';

export function useCart() {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalPrice: getTotalPrice(),
    totalItems: getTotalItems(),
    isOpen: useCartStore((state) => state.isOpen),
    openCart: useCartStore((state) => state.openCart),
    closeCart: useCartStore((state) => state.closeCart),
    toggleCart: useCartStore((state) => state.toggleCart),
  };
}
