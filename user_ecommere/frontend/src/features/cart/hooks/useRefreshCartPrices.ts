import { useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { productsApi, type Product } from '@/features/catalog/api/products.api';
import { useCartStore, type CartItem } from '../store/cartStore';

// Ensure productsApi has getById if not already defined
if (typeof (productsApi as any).getById !== 'function') {
  (productsApi as any).getById = async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    const actualData = response.data?.data || response.data;
    return actualData?.data || actualData;
  };
}

function showRemovalToast(item: CartItem, reason: 'out_of_stock' | 'inactive_or_deleted') {
  const message =
    reason === 'out_of_stock'
      ? `Sản phẩm "${item.name}" đã hết hàng và đã được xóa khỏi giỏ hàng.`
      : `Sản phẩm "${item.name}" không còn khả dụng và đã được xóa khỏi giỏ hàng.`;

  if (typeof toast.error === 'function') {
    toast.error(message);
  } else if (typeof toast === 'function') {
    toast(message);
  }
}

export function useRefreshCartPrices(): void {
  const replaceItems = useCartStore((state) => state.replaceItems);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const currentItems = useCartStore.getState().items;
      if (!currentItems || currentItems.length === 0) {
        return;
      }

      const distinctProductIds = Array.from(
        new Set(currentItems.map((item) => item.productId).filter(Boolean)),
      );

      if (distinctProductIds.length === 0) {
        return;
      }

      try {
        const productEntries = await Promise.all(
          distinctProductIds.map(async (productId) => {
            let product: Product | null = null;
            try {
              product = await (productsApi as any).getById(productId);
            } catch (error: any) {
              const status =
                error?.response?.status ??
                error?.status ??
                error?.statusCode ??
                error?.response?.data?.statusCode;
              if (status === 404) {
                product = null;
              } else {
                throw error;
              }
            }
            return [productId, product] as const;
          }),
        );

        if (cancelled) return;

        const productMap = new Map<string, Product | null>(productEntries);

        const removedItems: Array<{
          item: CartItem;
          reason: 'out_of_stock' | 'inactive_or_deleted';
        }> = [];
        const nextItems: CartItem[] = [];

        for (const item of currentItems) {
          let product: any = productMap.get(item.productId);

          if (
            product &&
            product.data &&
            typeof product.data === 'object' &&
            ('variants' in product.data || 'id' in product.data)
          ) {
            product = product.data;
          }

          // If product doesn't exist or is inactive
          if (!product || product.active === false) {
            removedItems.push({ item, reason: 'inactive_or_deleted' });
            continue;
          }

          // If variant doesn't exist or is inactive
          const variants = Array.isArray(product.variants) ? product.variants : [];
          const variant = variants.find((v: any) => v.id === item.variantId);

          if (!variant || variant.active === false) {
            removedItems.push({ item, reason: 'inactive_or_deleted' });
            continue;
          }

          const currentStock = typeof variant.stock === 'number' ? variant.stock : 0;

          // If current stock is 0
          if (currentStock <= 0) {
            removedItems.push({ item, reason: 'out_of_stock' });
            continue;
          }

          // Otherwise stock > 0
          const currentPrice = variant.salePrice ?? variant.price;
          const currentQuantity =
            item.quantity > currentStock ? currentStock : item.quantity;

          nextItems.push({
            ...item,
            price: currentPrice,
            stock: currentStock,
            quantity: currentQuantity,
          });
        }

        const hasChanged =
          nextItems.length !== currentItems.length ||
          nextItems.some((item, index) => {
            const orig = currentItems[index];
            return (
              item.productId !== orig.productId ||
              item.variantId !== orig.variantId ||
              item.price !== orig.price ||
              item.quantity !== orig.quantity ||
              item.stock !== orig.stock
            );
          });

        if (hasChanged) {
          replaceItems(nextItems);
        }

        for (const { item, reason } of removedItems) {
          showRemovalToast(item, reason);
        }
      } catch {
        // If a request fails, keep the stored cart unchanged and show no removal message.
        return;
      }
    };

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [replaceItems]);
}
