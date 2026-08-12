import apiClient from '@/lib/api';
import { z } from 'zod';

const variantSchema = z.object({
  id: z.string(),
  scent: z.string(),
  volumeMl: z.number(),
  price: z.number(),
  salePrice: z.number().optional().nullable(),
  stock: z.number(),
  sku: z.string(),
  barcode: z.string().optional().nullable(),
});

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  images: z.array(z.string()),
  categoryId: z.string(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  variants: z.array(variantSchema),
  basePrice: z.number(),
  active: z.boolean(),
  averageRating: z.number().optional(), // Backend returns averageRating
  reviewCount: z.number().optional(),
  createdAt: z.string(),
}).transform(data => ({
  ...data,
  rating: data.averageRating, // Map to rating for frontend compatibility
}));

const productsResponseSchema = z.object({
  products: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof variantSchema>;
export type ProductsResponse = z.infer<typeof productsResponseSchema>;

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  scent?: string;
  volumeMl?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'best_selling' | 'rating';
}

async function getAllFromPath(path: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
  const response = await apiClient.get(path, { params: filters });

  // Backend wraps with TransformInterceptor: { data: <actual_data>, statusCode, timestamp }
  const actualData = response.data.data || response.data;

  const mapped = {
    products: actualData.data || [],
    total: actualData.total || 0,
    page: actualData.page || 1,
    limit: actualData.limit || 12,
    totalPages: actualData.totalPages || 1,
  };

  return productsResponseSchema.parse(mapped);
}

export const productsApi = {
  async getAll(filters: ProductFilters = {}): Promise<ProductsResponse> {
    return getAllFromPath('/products', filters);
  },

  async getAllAdmin(filters: ProductFilters = {}): Promise<ProductsResponse> {
    return getAllFromPath('/products/admin', filters);
  },

  async getBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get(`/products/slug/${slug}`);
    const actualData = response.data.data || response.data;
    return productSchema.parse(actualData.data || actualData);
  },

  async search(query: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
    const response = await apiClient.get('/products', {
      params: { search: query, ...filters },
    });

    const actualData = response.data.data || response.data;

    const mapped = {
      products: actualData.data || [],
      total: actualData.total || 0,
      page: actualData.page || 1,
      limit: actualData.limit || 12,
      totalPages: actualData.totalPages || 1,
    };

    return productsResponseSchema.parse(mapped);
  },
};
