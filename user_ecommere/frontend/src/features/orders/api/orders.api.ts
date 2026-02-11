import apiClient from '@/lib/api';
import { z } from 'zod';

const orderSchema = z.object({
  id: z.string(),
  code: z.string().optional(),
  orderNumber: z.string().optional(),
  status: z.string(),
  total: z.number(),
  shippingFee: z.number(),
  items: z.array(z.any()),
  addressJson: z.string().optional(),
  shippingAddress: z.any().optional(),
  paymentMethod: z.string(),
  createdAt: z.string(),
}).transform(data => ({
  ...data,
  orderNumber: data.code || data.orderNumber,
  shippingAddress: data.addressJson ? JSON.parse(data.addressJson) : data.shippingAddress,
  items: data.items.map((item: any) => ({
    ...item,
    name: item.nameSnapshot,
    price: item.unitPrice,
    quantity: item.quantity,
    image: item.variant?.product?.images?.[0] || null,
    productName: item.variant?.product?.name || item.nameSnapshot,
  })),
}));

const ordersResponseSchema = z.object({
  orders: z.array(orderSchema),
  total: z.number(),
});

export type Order = z.infer<typeof orderSchema>;

export const ordersApi = {
  async getAll(page = 1, limit = 10) {
    const response = await apiClient.get('/orders/my', { params: { page, limit } });
    const actualData = response.data.data || response.data;
    const mapped = {
      orders: actualData.data || [],
      total: actualData.total || 0,
    };
    return ordersResponseSchema.parse(mapped);
  },

  async getById(id: string) {
    const response = await apiClient.get(`/orders/my/${id}`);
    const actualData = response.data.data || response.data;
    return orderSchema.parse(actualData);
  },

  async cancel(id: string) {
    const response = await apiClient.patch(`/orders/my/${id}/cancel`);
    return response.data.data || response.data;
  },
};
