import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
    productId: string;
    name: string;
    slug: string;
    image: string;
    price: number;
}

interface WishlistState {
    items: WishlistItem[];
    addItem: (item: WishlistItem) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleItem: (item: WishlistItem) => void;
}

export const useWishlist = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const { items } = get();
                if (!items.find((i) => i.productId === item.productId)) {
                    set({ items: [...items, item] });
                }
            },
            removeItem: (productId) => {
                set({ items: get().items.filter((i) => i.productId !== productId) });
            },
            isInWishlist: (productId) => {
                return !!get().items.find((i) => i.productId === productId);
            },
            toggleItem: (item) => {
                const { items } = get();
                if (items.find((i) => i.productId === item.productId)) {
                    set({ items: items.filter((i) => i.productId !== item.productId) });
                } else {
                    set({ items: [...items, item] });
                }
            }
        }),
        {
            name: 'wishlist-storage',
        }
    )
);
