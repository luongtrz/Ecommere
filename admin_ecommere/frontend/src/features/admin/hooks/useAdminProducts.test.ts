import React, { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from './useAdminProducts';
import { adminProductsApi } from '../api/admin-products.api';
import { QUERY_KEYS } from '@/lib/constants';
import type { Product } from '@/features/catalog/api/products.api';

vi.mock('../api/admin-products.api', () => ({
  adminProductsApi: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('useAdminProducts hooks', () => {
  const mockedApi = vi.mocked(adminProductsApi);

  const mockProduct: Product = {
    id: 'prod-001',
    name: 'Nước hoa Charme King 100ml',
    slug: 'nuoc-hoa-charme-king-100ml',
    description: 'Hương thơm nam tính mạnh mẽ',
    images: ['/images/king-1.jpg'],
    categoryId: 'cat-nam',
    basePrice: 550000,
    active: true,
    rating: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    variants: [
      {
        id: 'var-001',
        scent: 'Hương Gỗ',
        volumeMl: 100,
        price: 550000,
        salePrice: null,
        stock: 25,
        sku: 'KING-100',
        barcode: '893600001001',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAdminProduct', () => {
    it('fetches product by ID when a valid id is provided', async () => {
      mockedApi.getById.mockResolvedValueOnce(mockProduct);
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminProduct('prod-001'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.getById).toHaveBeenCalledWith('prod-001');
      expect(result.current.data).toEqual(mockProduct);
    });

    it('does not trigger fetch when id is null', () => {
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminProduct(null), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(mockedApi.getById).not.toHaveBeenCalled();
    });

    it('does not trigger fetch when id is empty string', () => {
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminProduct(''), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(mockedApi.getById).not.toHaveBeenCalled();
    });

    it('sets error state when API request fails', async () => {
      const error = new Error('Không tìm thấy sản phẩm');
      mockedApi.getById.mockRejectedValueOnce(error);
      const queryClient = createTestQueryClient();

      const { result } = renderHook(() => useAdminProduct('prod-err'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect((result.current.error as Error).message).toBe(
        'Không tìm thấy sản phẩm',
      );
    });
  });

  describe('useCreateProduct', () => {
    const createData = {
      name: 'Nước hoa Charme Queen',
      description: 'Hương thơm nữ tính',
      categoryId: 'cat-nu',
      images: ['/images/queen.jpg'],
      basePrice: 600000,
    };

    it('creates product and invalidates queries on success', async () => {
      mockedApi.create.mockResolvedValueOnce(mockProduct);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(createData);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.create).toHaveBeenCalledWith(
        createData,
        expect.anything(),
      );
      expect(result.current.data).toEqual(mockProduct);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.PRODUCTS],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.ADMIN_PRODUCTS],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'dashboard-stats'],
      });
    });

    it('handles mutation error and does not invalidate queries', async () => {
      const error = new Error('Lỗi tạo sản phẩm');
      mockedApi.create.mockRejectedValueOnce(error);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(createData);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateProduct', () => {
    const updatePayload = {
      id: 'prod-001',
      data: {
        name: 'Nước hoa Charme King Bản Nâng Cấp',
        basePrice: 590000,
      },
    };

    it('updates product and invalidates all related queries on success', async () => {
      const updatedProduct = { ...mockProduct, ...updatePayload.data };
      mockedApi.update.mockResolvedValueOnce(updatedProduct);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(updatePayload);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.update).toHaveBeenCalledWith(
        updatePayload.id,
        updatePayload.data,
      );
      expect(result.current.data).toEqual(updatedProduct);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.PRODUCTS],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.ADMIN_PRODUCTS],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.PRODUCT_DETAIL],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'dashboard-stats'],
      });
    });

    it('handles update failure and does not invalidate queries', async () => {
      const error = new Error('Lỗi cập nhật sản phẩm');
      mockedApi.update.mockRejectedValueOnce(error);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate(updatePayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('useDeleteProduct', () => {
    it('deletes product and invalidates queries on success', async () => {
      mockedApi.delete.mockResolvedValueOnce(undefined);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate('prod-001');
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApi.delete).toHaveBeenCalledWith(
        'prod-001',
        expect.anything(),
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.PRODUCTS],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.ADMIN_PRODUCTS],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'dashboard-stats'],
      });
    });

    it('handles delete failure and does not invalidate queries', async () => {
      const error = new Error('Lỗi xóa sản phẩm');
      mockedApi.delete.mockRejectedValueOnce(error);
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate('prod-001');
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });
});
