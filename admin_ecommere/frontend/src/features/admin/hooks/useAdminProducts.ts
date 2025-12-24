import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProductsApi } from '../api/admin-products.api';
import { QUERY_KEYS } from '@/lib/constants';

/**
 * Hook to get product by ID for editing
 */
export function useAdminProduct(id: string | null) {
    return useQuery({
        queryKey: [QUERY_KEYS.PRODUCT_DETAIL, id],
        queryFn: () => adminProductsApi.getById(id!),
        enabled: !!id,
    });
}

/**
 * Hook to create new product
 */
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: adminProductsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
        },
    });
}

/**
 * Hook to update existing product
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            adminProductsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCT_DETAIL] });
        },
    });
}

/**
 * Hook to delete product
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: adminProductsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRODUCTS] });
        },
    });
}
