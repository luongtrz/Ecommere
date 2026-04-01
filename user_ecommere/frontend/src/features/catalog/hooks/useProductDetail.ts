import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { productsApi } from '../api/products.api';
import { QUERY_KEYS } from '@/lib/constants';

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCT_DETAIL, slug],
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/** Prefetch product detail on hover for instant navigation */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  return useCallback((slug: string) => {
    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.PRODUCT_DETAIL, slug],
      queryFn: () => productsApi.getBySlug(slug),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}
