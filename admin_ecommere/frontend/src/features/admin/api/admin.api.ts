import { apiClient } from '@/lib/api';
import { dashboardStatsSchema, type DashboardStats } from './admin.types';

/**
 * Lấy thống kê dashboard cho admin
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get('/admin/dashboard/stats');
  return dashboardStatsSchema.parse(response.data.data);
}
