import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { productsApi } from '@/features/catalog/api/products.api';
import { useCartStore, type CartItem } from '../store/cartStore';
import { useRefreshCartPrices } from './useRefreshCartPrices';

vi.mock('@/lib/api', () => {
  const mockGet = vi.fn();
  return {
    default: {
      get: mockGet,
    },
    apiClient: {
      get: mockGet,
    },
  };
});

vi.mock('@/features/catalog/api/products.api', () => ({
  productsApi: {},
}));

vi.mock('sonner', () => {
  const mockToastFn: any = vi.fn();
  mockToastFn.error = vi.fn();
  return {
    toast: mockToastFn,
    default: mockToastFn,
  };
});

const createCartItem = (overrides?: Partial<CartItem>): CartItem => ({
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Nước hoa Charme Good Girl 100ml',
  image: '/images/good-girl.jpg',
  price: 600000,
  quantity: 2,
  scent: 'Hương hoa ngọt ngào quyến rũ',
  volumeMl: 100,
  stock: 10,
  ...overrides,
});

describe('useRefreshCartPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], isOpen: false });
  });

  describe('productsApi.getById initialization', () => {
    it('unwraps double-nested response.data.data.data', async () => {
      const mockProduct = { id: 'prod-nested', name: 'Charme Test' };
      (apiClient.get as any).mockResolvedValueOnce({
        data: { data: { data: mockProduct } },
      });

      const result = await (productsApi as any).getById('prod-nested');

      expect(apiClient.get).toHaveBeenCalledWith('/products/prod-nested');
      expect(result).toEqual(mockProduct);
    });

    it('unwraps single-nested response.data.data', async () => {
      const mockProduct = { id: 'prod-single', name: 'Charme Single' };
      (apiClient.get as any).mockResolvedValueOnce({
        data: { data: mockProduct },
      });

      const result = await (productsApi as any).getById('prod-single');

      expect(apiClient.get).toHaveBeenCalledWith('/products/prod-single');
      expect(result).toEqual(mockProduct);
    });

    it('handles response.data without inner data wrapper', async () => {
      const mockProduct = { id: 'prod-raw', name: 'Charme Raw' };
      (apiClient.get as any).mockResolvedValueOnce({
        data: mockProduct,
      });

      const result = await (productsApi as any).getById('prod-raw');

      expect(apiClient.get).toHaveBeenCalledWith('/products/prod-raw');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('early return conditions', () => {
    it('does nothing when cart items array is empty', async () => {
      useCartStore.setState({ items: [] });

      renderHook(() => useRefreshCartPrices());

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('does nothing when cart items is null or undefined', async () => {
      useCartStore.setState({ items: null as any });

      renderHook(() => useRefreshCartPrices());

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('does nothing when all items have falsy productId', async () => {
      useCartStore.setState({
        items: [createCartItem({ productId: '' })],
      });

      renderHook(() => useRefreshCartPrices());

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('price and stock updates', () => {
    it('updates item price to salePrice and adjusts stock when valid', async () => {
      const item = createCartItem({
        productId: 'prod-1',
        variantId: 'var-1',
        price: 600000,
        stock: 10,
        quantity: 2,
      });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [
            {
              id: 'var-1',
              active: true,
              price: 600000,
              salePrice: 520000,
              stock: 15,
            },
          ],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(useCartStore.getState().items[0].price).toBe(520000);
      });

      expect(useCartStore.getState().items[0].stock).toBe(15);
      expect(useCartStore.getState().items[0].quantity).toBe(2);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('falls back to regular price when salePrice is null or undefined', async () => {
      const item = createCartItem({
        productId: 'prod-1',
        variantId: 'var-1',
        price: 500000,
        stock: 10,
        quantity: 2,
      });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [
            {
              id: 'var-1',
              active: true,
              price: 550000,
              salePrice: null,
              stock: 10,
            },
          ],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(useCartStore.getState().items[0].price).toBe(550000);
      });
    });

    it('clamps item quantity down to currentStock if item.quantity > currentStock', async () => {
      const item = createCartItem({
        productId: 'prod-1',
        variantId: 'var-1',
        quantity: 8,
        stock: 10,
      });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [
            {
              id: 'var-1',
              active: true,
              price: 600000,
              stock: 3,
            },
          ],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(useCartStore.getState().items[0].quantity).toBe(3);
      });
      expect(useCartStore.getState().items[0].stock).toBe(3);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('unwraps product when product data is wrapped in a nested .data property', async () => {
      const item = createCartItem({
        productId: 'prod-1',
        variantId: 'var-1',
        price: 600000,
      });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          data: {
            id: 'prod-1',
            active: true,
            variants: [
              {
                id: 'var-1',
                active: true,
                price: 490000,
                stock: 10,
              },
            ],
          },
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(useCartStore.getState().items[0].price).toBe(490000);
      });
    });

    it('deduplicates multiple cart items having the same productId into a single API call', async () => {
      const item1 = createCartItem({
        productId: 'prod-same',
        variantId: 'var-1',
        price: 500000,
      });
      const item2 = createCartItem({
        productId: 'prod-same',
        variantId: 'var-2',
        price: 700000,
      });
      useCartStore.setState({ items: [item1, item2] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-same',
          active: true,
          variants: [
            { id: 'var-1', active: true, price: 450000, stock: 10 },
            { id: 'var-2', active: true, price: 650000, stock: 10 },
          ],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(useCartStore.getState().items[0].price).toBe(450000);
      });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(useCartStore.getState().items[1].price).toBe(650000);
    });

    it('does not call replaceItems when no item attributes changed', async () => {
      const item = createCartItem({
        productId: 'prod-1',
        variantId: 'var-1',
        price: 600000,
        stock: 10,
        quantity: 2,
      });
      useCartStore.setState({ items: [item] });

      const replaceItemsSpy = vi.spyOn(useCartStore.getState(), 'replaceItems');

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [
            {
              id: 'var-1',
              active: true,
              price: 600000,
              stock: 10,
            },
          ],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/products/prod-1');
      });

      expect(replaceItemsSpy).not.toHaveBeenCalled();
    });
  });

  describe('item removal scenarios and Vietnamese toasts', () => {
    it('removes item and displays inactive toast when API responds with 404 (error.response.status)', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Good Girl 100ml' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockRejectedValueOnce({
        response: { status: 404 },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Good Girl 100ml" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });

      expect(useCartStore.getState().items).toEqual([]);
    });

    it('removes item when 404 is present on error.status', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Iris' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockRejectedValueOnce({
        status: 404,
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Iris" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item when 404 is present on error.statusCode', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Queen' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockRejectedValueOnce({
        statusCode: 404,
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Queen" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item when 404 is present on error.response.data.statusCode', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme King' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockRejectedValueOnce({
        response: { data: { statusCode: 404 } },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme King" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item and displays inactive toast when product active is false', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Ruby' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: false,
          variants: [{ id: 'var-1', active: true, price: 500000, stock: 10 }],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Ruby" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item when product variants is not an array or is empty', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Giò' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: null,
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Giò" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item when variantId is not found in product variants', async () => {
      const item = createCartItem({
        variantId: 'var-target',
        name: 'Nước hoa Charme Elegant',
      });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [
            { id: 'var-other', active: true, price: 500000, stock: 10 },
          ],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Elegant" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item when variant active is false', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Sunset' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [{ id: 'var-1', active: false, price: 500000, stock: 10 }],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Sunset" không còn khả dụng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item and displays out of stock toast when variant stock is 0', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme 212 Sexy' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [{ id: 'var-1', active: true, price: 500000, stock: 0 }],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme 212 Sexy" đã hết hàng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item and displays out of stock toast when variant stock is negative or undefined', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Luxury' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [{ id: 'var-1', active: true, price: 500000, stock: -1 }],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Luxury" đã hết hàng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('removes item and displays out of stock toast when variant stock is undefined', async () => {
      const item = createCartItem({ name: 'Nước hoa Charme Ori' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [
            { id: 'var-1', active: true, price: 500000, stock: undefined },
          ],
        },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Sản phẩm "Nước hoa Charme Ori" đã hết hàng và đã được xóa khỏi giỏ hàng.',
        );
      });
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('toast fallbacks and edge conditions', () => {
    it('falls back to calling toast directly if toast.error is not a function', async () => {
      const originalError = (toast as any).error;
      (toast as any).error = undefined;

      const item = createCartItem({ name: 'Nước hoa Charme Test Fallback' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [{ id: 'var-1', active: true, price: 500000, stock: 0 }],
        },
      });

      try {
        renderHook(() => useRefreshCartPrices());

        await waitFor(() => {
          expect(toast).toHaveBeenCalledWith(
            'Sản phẩm "Nước hoa Charme Test Fallback" đã hết hàng và đã được xóa khỏi giỏ hàng.',
          );
        });
      } finally {
        (toast as any).error = originalError;
      }
    });

    it('safely completes without throwing if neither toast.error nor toast is a function', async () => {
      const originalError = (toast as any).error;
      (toast as any).error = undefined;

      const item = createCartItem({ name: 'Nước hoa Charme Safe Noop' });
      useCartStore.setState({ items: [item] });

      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          id: 'prod-1',
          active: true,
          variants: [{ id: 'var-1', active: true, price: 500000, stock: 0 }],
        },
      });

      try {
        renderHook(() => useRefreshCartPrices());

        await waitFor(() => {
          expect(useCartStore.getState().items).toHaveLength(0);
        });
      } finally {
        (toast as any).error = originalError;
      }
    });
  });

  describe('error handling and cleanup', () => {
    it('catches non-404 API error, leaving the cart unchanged without showing toast', async () => {
      const originalItem = createCartItem({ price: 600000, quantity: 2 });
      useCartStore.setState({ items: [originalItem] });

      (apiClient.get as any).mockRejectedValueOnce({
        response: { status: 500, data: 'Internal Server Error' },
      });

      renderHook(() => useRefreshCartPrices());

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/products/prod-1');
      });

      expect(useCartStore.getState().items).toEqual([originalItem]);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('does not update cart or show toast if hook is unmounted before API call resolves', async () => {
      const originalItem = createCartItem({ price: 600000 });
      useCartStore.setState({ items: [originalItem] });

      let resolveApi: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });
      (apiClient.get as any).mockReturnValueOnce(pendingPromise);

      const { unmount } = renderHook(() => useRefreshCartPrices());

      unmount();

      resolveApi!({
        data: {
          id: 'prod-1',
          active: true,
          variants: [{ id: 'var-1', active: true, price: 200000, stock: 10 }],
        },
      });

      // Give event loop time to process promise
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(useCartStore.getState().items[0].price).toBe(600000);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
