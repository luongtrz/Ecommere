import { apiClient } from '@/lib/api';
import { z } from 'zod';

// Order status enum
export const orderStatusEnum = z.enum([
  'PENDING_PAYMENT',
  'PAID',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
  'REFUNDED',
]);

export type OrderStatus = z.infer<typeof orderStatusEnum>;

// Order item schema
export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string(),
  nameSnapshot: z.string(),
  scentSnapshot: z.string(),
  volumeSnapshot: z.number(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Admin order schema
export const adminOrderSchema = z.object({
  id: z.string(),
  code: z.string(),
  userId: z.string(),
  status: orderStatusEnum,
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
  paymentMethod: z.string(),
  subtotal: z.number(),
  discount: z.number(),
  shippingFee: z.number(),
  total: z.number(),
  addressJson: z.string(),
  couponCode: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().transform((val) => new Date(val)),
  updatedAt: z.string().transform((val) => new Date(val)),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
  }).optional(),
  items: z.array(orderItemSchema).optional(),
});

export type AdminOrder = z.infer<typeof adminOrderSchema>;

// Orders list response
export const adminOrdersResponseSchema = z.object({
  data: z.array(adminOrderSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
}).passthrough(); // Allow extra fields like hasNextPage, hasPreviousPage

export type AdminOrdersResponse = z.infer<typeof adminOrdersResponseSchema>;

// Filter params
export interface AdminOrdersFilter {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}

/**
 * Lấy danh sách tất cả đơn hàng (Admin)
 */
export async function getAdminOrders(filter: AdminOrdersFilter = {}): Promise<AdminOrdersResponse> {
  const response = await apiClient.get('/orders', { params: filter });
  // Backend trả về: {data: {data: [...], total, page, ...}, statusCode, timestamp}
  return adminOrdersResponseSchema.parse(response.data.data);
}

/**
 * Lấy chi tiết đơn hàng (Admin)
 */
export async function getAdminOrderById(orderId: string): Promise<AdminOrder> {
  const response = await apiClient.get(`/orders/${orderId}`);
  return adminOrderSchema.parse(response.data.data);
}

/**
 * Cập nhật trạng thái đơn hàng (Admin)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<AdminOrder> {
  const response = await apiClient.patch(`/orders/${orderId}/status`, { status });
  return adminOrderSchema.parse(response.data.data);
}
