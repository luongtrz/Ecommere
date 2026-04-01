import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrders, getAdminOrderById, updateOrderStatus, type AdminOrdersFilter, type OrderStatus } from '../api/admin-orders.api';

/**
 * Hook để lấy danh sách đơn hàng (Admin)
 */
export function useAdminOrders(filter: AdminOrdersFilter = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', filter],
    queryFn: () => getAdminOrders(filter),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook để lấy chi tiết đơn hàng (Admin)
 */
export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => getAdminOrderById(orderId),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook để cập nhật trạng thái đơn hàng
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
    },
  });
}
