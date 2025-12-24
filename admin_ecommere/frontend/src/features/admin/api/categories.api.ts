import apiClient from '@/lib/api';

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
}

export const categoriesApi = {
    async getAll(): Promise<Category[]> {
        const response = await apiClient.get('/categories');
        const actualData = response.data.data || response.data;
        return actualData.data || actualData;
    },

    async getById(id: string): Promise<Category> {
        const response = await apiClient.get(`/categories/${id}`);
        const actualData = response.data.data || response.data;
        return actualData.data || actualData;
    },
};
