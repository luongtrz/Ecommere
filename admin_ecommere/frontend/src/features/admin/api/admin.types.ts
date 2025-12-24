import { z } from 'zod';

// Revenue Stats
export const revenueStatsSchema = z.object({
  totalRevenue: z.number(),
  monthlyRevenue: z.number(),
  monthlyChange: z.number(),
});

export type RevenueStats = z.infer<typeof revenueStatsSchema>;

// Order Stats
export const orderStatsSchema = z.object({
  totalOrders: z.number(),
  monthlyOrders: z.number(),
  monthlyChange: z.number(),
  pendingOrders: z.number(),
  shippingOrders: z.number(),
});

export type OrderStats = z.infer<typeof orderStatsSchema>;

// Product Stats
export const productStatsSchema = z.object({
  totalProducts: z.number(),
  activeProducts: z.number(),
  newProductsThisMonth: z.number(),
  lowStockProducts: z.number(),
});

export type ProductStats = z.infer<typeof productStatsSchema>;

// Customer Stats
export const customerStatsSchema = z.object({
  totalCustomers: z.number(),
  newCustomersThisMonth: z.number(),
  monthlyChange: z.number(),
});

export type CustomerStats = z.infer<typeof customerStatsSchema>;

// Recent Order
export const recentOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  totalAmount: z.number(),
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED']),
  createdAt: z.string().transform((val) => new Date(val)),
});

export type RecentOrder = z.infer<typeof recentOrderSchema>;

// Top Product
export const topProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  soldQuantity: z.number(),
  revenue: z.number(),
});

export type TopProduct = z.infer<typeof topProductSchema>;

// Dashboard Stats (main)
export const dashboardStatsSchema = z.object({
  revenue: revenueStatsSchema,
  orders: orderStatsSchema,
  products: productStatsSchema,
  customers: customerStatsSchema,
  recentOrders: z.array(recentOrderSchema),
  topProducts: z.array(topProductSchema),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
