import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import { QUERY_KEYS } from '@/lib/constants';

export function useOrders(page = 1, limit = 10) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDERS, page, limit],
    queryFn: () => ordersApi.getAll(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDER_DETAIL, orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancel(orderId),
    onSuccess: (_data, orderId) => {
      // Invalidate both the order list and the specific order detail
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDER_DETAIL, orderId] });
    },
  });
}
