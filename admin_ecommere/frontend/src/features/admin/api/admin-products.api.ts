import apiClient from '@/lib/api';
import { Product } from '@/features/catalog/api/products.api';

export const adminProductsApi = {
    /**
     * Get product by ID (for admin edit)
     */
    async getById(id: string): Promise<Product> {
        const response = await apiClient.get(`/products/${id}`);
        const actualData = response.data.data || response.data;
        return actualData.data || actualData;
    },

    /**
     * Create new product
     */
    async create(data: CreateProductDto): Promise<Product> {
        const response = await apiClient.post('/products', data);
        const actualData = response.data.data || response.data;
        return actualData.data || actualData;
    },

    /**
     * Update existing product
     */
    async update(id: string, data: UpdateProductDto): Promise<Product> {
        const response = await apiClient.patch(`/products/${id}`, data);
        const actualData = response.data.data || response.data;
        return actualData.data || actualData;
    },

    /**
     * Delete product
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/products/${id}`);
    },
};

export interface CreateProductDto {
    name: string;
    slug?: string;
    description: string;
    categoryId: string;
    images: string[];
    basePrice: number;
    variants?: CreateVariantDto[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> { }

export interface CreateVariantDto {
    scent: string;
    volumeMl: number;
    price: number;
    salePrice?: number | null;
    stock: number;
    sku: string;
}
