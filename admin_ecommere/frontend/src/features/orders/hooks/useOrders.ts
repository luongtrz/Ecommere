import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import { QUERY_KEYS } from '@/lib/constants';

export function useOrders(page = 1, limit = 10) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDERS, page, limit],
    queryFn: () => ordersApi.getAll(page, limit),
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ORDER_DETAIL, orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
  });
}
