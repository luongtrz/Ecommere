import { useQuery } from '@tanstack/react-query';
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
