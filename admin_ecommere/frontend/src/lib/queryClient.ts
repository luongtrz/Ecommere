import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep cached data in memory longer
    },
    mutations: {
      retry: 0,
    },
  },
});

// Prefetch categories on app boot
import { categoriesApi } from '@/features/catalog/api/categories.api';

queryClient.prefetchQuery({
  queryKey: [QUERY_KEYS.CATEGORIES],
  queryFn: () => categoriesApi.getAll(),
  staleTime: 30 * 60 * 1000,
});
