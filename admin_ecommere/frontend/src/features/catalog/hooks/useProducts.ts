import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { productsApi, type ProductFilters, type ProductsResponse } from '../api/products.api';
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

export function useInfiniteProducts(filters: ProductFilters = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, 'infinite', filters],
    queryFn: ({ pageParam = 1 }) => productsApi.getAll({ ...filters, page: pageParam as number, limit: 20 }), // Increasing limit for infinite scroll efficiency
    getNextPageParam: (lastPage: ProductsResponse) => {
      // API returns page, totalPages. Next page is page + 1 if page < totalPages
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
