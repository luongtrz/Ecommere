import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import { QUERY_KEYS } from '@/lib/constants';

export function useCategories() {
    return useQuery({
        queryKey: [QUERY_KEYS.CATEGORIES],
        queryFn: () => categoriesApi.getAll(),
    });
}
