import apiClient from '@/lib/api';

export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
    productCount?: number;
    children?: Category[];
    isLeaf?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCategoryDto {
    name: string;
    parentId?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    parentId?: string;
}

export const categoriesApi = {
    async getAll(): Promise<Category[]> {
        const response = await apiClient.get('/categories');
        const actualData = response.data.data || response.data;
        return actualData.data || actualData;
    },

    async getTree(): Promise<Category[]> {
        const response = await apiClient.get('/categories/tree');
        return response.data.data || response.data;
    },

    async getById(id: string): Promise<Category> {
        const response = await apiClient.get(`/categories/${id}`);
        const actualData = response.data.data || response.data;
        return actualData.data || actualData;
    },

    async create(data: CreateCategoryDto): Promise<Category> {
        const response = await apiClient.post('/categories', data);
        return response.data.data || response.data;
    },

    async update(id: string, data: UpdateCategoryDto): Promise<Category> {
        const response = await apiClient.patch(`/categories/${id}`, data);
        return response.data.data || response.data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/categories/${id}`);
    },
};
