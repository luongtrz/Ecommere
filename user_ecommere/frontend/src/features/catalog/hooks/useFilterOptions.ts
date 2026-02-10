import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import { QUERY_KEYS } from '@/lib/constants';

export function useFilterOptions() {
    return useQuery({
        queryKey: [QUERY_KEYS.PRODUCTS, 'filter-options'],
        queryFn: () => productsApi.getFilterOptions(),
        staleTime: 5 * 60 * 1000, // cache 5 phut
    });
}
