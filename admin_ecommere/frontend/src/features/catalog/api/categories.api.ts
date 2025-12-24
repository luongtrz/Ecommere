import apiClient from '@/lib/api';
import { z } from 'zod';

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
});

const categoriesResponseSchema = z.array(categorySchema);

export type Category = z.infer<typeof categorySchema>;

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get('/categories');
    const actualData = response.data.data || response.data;
    return categoriesResponseSchema.parse(actualData);
  },

  async getBySlug(slug: string): Promise<Category> {
    const response = await apiClient.get(`/categories/slug/${slug}`);
    const actualData = response.data.data || response.data;
    return categorySchema.parse(actualData);
  },
};
