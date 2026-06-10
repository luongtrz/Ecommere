import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './constants';
import { categoriesApi } from '@/features/catalog/api/categories.api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

queryClient.prefetchQuery({
  queryKey: [QUERY_KEYS.CATEGORIES],
  queryFn: () => categoriesApi.getAll(),
  staleTime: 30 * 60 * 1000,
});

queryClient.prefetchQuery({
  queryKey: [QUERY_KEYS.CATEGORIES, 'tree'],
  queryFn: () => categoriesApi.getTree(),
  staleTime: 30 * 60 * 1000,
});
