import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/categories.api';
import { QUERY_KEYS } from '@/lib/constants';

const CATEGORY_STALE_TIME = 30 * 60 * 1000; // 30 minutes - categories rarely change

export function useCategories() {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: () => categoriesApi.getAll(),
    staleTime: CATEGORY_STALE_TIME,
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES, slug],
    queryFn: () => categoriesApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: CATEGORY_STALE_TIME,
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES, 'tree'],
    queryFn: () => categoriesApi.getTree(),
    staleTime: CATEGORY_STALE_TIME,
  });
}
