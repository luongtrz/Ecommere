import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import { QUERY_KEYS } from '@/lib/constants';

export function useCategories() {
    return useQuery({
        queryKey: [QUERY_KEYS.CATEGORIES],
        queryFn: () => categoriesApi.getAll(),
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}
