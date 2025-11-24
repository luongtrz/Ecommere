import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/admin.api';

/**
 * Hook để lấy thống kê dashboard
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });
}
