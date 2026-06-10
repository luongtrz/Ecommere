import { useQuery } from '@tanstack/react-query';
import { productsApi, type ProductFilters } from '../api/products.api';
import { QUERY_KEYS } from '@/lib/constants';

interface UseProductsOptions {
  enabled?: boolean;
}

const PRODUCT_STALE_TIME = 10 * 60 * 1000;

export function useProducts(filters: ProductFilters = {}, options: UseProductsOptions = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, filters],
    queryFn: () => productsApi.getAll(filters),
    enabled: options.enabled ?? true,
    staleTime: PRODUCT_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });
}

export function useProductSearch(query: string, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, 'search', query, filters],
    queryFn: () => productsApi.search(query, filters),
    enabled: !!query,
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
