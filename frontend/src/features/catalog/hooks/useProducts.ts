import { useQuery } from '@tanstack/react-query';
import { productsApi, type ProductFilters } from '../api/products.api';
import { QUERY_KEYS } from '@/lib/constants';

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, filters],
    queryFn: () => productsApi.getAll(filters),
  });
}

export function useProductSearch(query: string, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, 'search', query, filters],
    queryFn: () => productsApi.search(query, filters),
    enabled: !!query,
  });
}
