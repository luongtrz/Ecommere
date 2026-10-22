import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import {
  adminProductsApi,
  type CreateProductDto,
  type UpdateProductDto,
} from './admin-products.api';
import type { Product } from '@/features/catalog/api/products.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminProductsApi', () => {
  const mockedApiClient = {
    get: vi.mocked(apiClient.get),
    post: vi.mocked(apiClient.post),
    patch: vi.mocked(apiClient.patch),
    delete: vi.mocked(apiClient.delete),
  };

  const mockProduct: Product = {
    id: 'prod-001',
    name: 'Nước hoa Charme King 100ml',
    slug: 'nuoc-hoa-charme-king-100ml',
    description: 'Hương thơm nam tính mạnh mẽ',
    images: ['/images/king-1.jpg', '/images/king-2.jpg'],
    categoryId: 'cat-nam',
    basePrice: 550000,
    active: true,
    rating: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    variants: [
      {
        id: 'var-001',
        scent: 'Hương Gỗ',
        volumeMl: 100,
        price: 550000,
        salePrice: null,
        stock: 25,
        sku: 'KING-100',
        barcode: '893600001001',
      },
    ],
  };

  const sampleCreateDto: CreateProductDto = {
    name: 'Nước hoa Charme Queen',
    description: 'Hương thơm nữ tính quyến rũ',
    categoryId: 'cat-nu',
    images: ['/images/queen.jpg'],
    basePrice: 600000,
    active: true,
    variants: [
      {
        scent: 'Hoa Hồng',
        volumeMl: 50,
        price: 600000,
        stock: 30,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('fetches product by ID with double-wrapped response (.data.data.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            data: mockProduct,
          },
        },
      });

      const result = await adminProductsApi.getById('prod-001');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/products/admin/prod-001',
      );
      expect(result).toEqual(mockProduct);
    });

    it('fetches product by ID with single-wrapped response (.data.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: mockProduct,
        },
      });

      const result = await adminProductsApi.getById('prod-001');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/products/admin/prod-001',
      );
      expect(result).toEqual(mockProduct);
    });

    it('fetches product by ID with unwrapped response (.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: mockProduct,
      });

      const result = await adminProductsApi.getById('prod-001');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/products/admin/prod-001',
      );
      expect(result).toEqual(mockProduct);
    });

    it('fetches product by ID when response.data.data is undefined and actualData has no .data', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: {
          data: undefined,
          fallback: mockProduct,
        },
      });

      const result = await adminProductsApi.getById('prod-001');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/products/admin/prod-001',
      );
      expect(result).toEqual({ data: undefined, fallback: mockProduct });
    });

    it('throws error when getById request fails', async () => {
      const error = new Error('Không tìm thấy sản phẩm');
      mockedApiClient.get.mockRejectedValueOnce(error);

      await expect(adminProductsApi.getById('prod-unknown')).rejects.toThrow(
        'Không tìm thấy sản phẩm',
      );
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/products/admin/prod-unknown',
      );
    });
  });

  describe('create', () => {
    it('creates product with double-wrapped response (.data.data.data)', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: {
          data: {
            data: mockProduct,
          },
        },
      });

      const result = await adminProductsApi.create(sampleCreateDto);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/products',
        sampleCreateDto,
      );
      expect(result).toEqual(mockProduct);
    });

    it('creates product with single-wrapped response (.data.data)', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: {
          data: mockProduct,
        },
      });

      const result = await adminProductsApi.create(sampleCreateDto);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/products',
        sampleCreateDto,
      );
      expect(result).toEqual(mockProduct);
    });

    it('creates product with unwrapped response (.data)', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        data: mockProduct,
      });

      const result = await adminProductsApi.create(sampleCreateDto);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/products',
        sampleCreateDto,
      );
      expect(result).toEqual(mockProduct);
    });

    it('throws error when create request fails', async () => {
      const error = new Error('Tạo sản phẩm thất bại');
      mockedApiClient.post.mockRejectedValueOnce(error);

      await expect(adminProductsApi.create(sampleCreateDto)).rejects.toThrow(
        'Tạo sản phẩm thất bại',
      );
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/products',
        sampleCreateDto,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'Nước hoa Charme King New Edition',
      basePrice: 590000,
    };

    it('updates product with double-wrapped response (.data.data.data)', async () => {
      const updatedProduct = { ...mockProduct, ...updateDto };
      mockedApiClient.patch.mockResolvedValueOnce({
        data: {
          data: {
            data: updatedProduct,
          },
        },
      });

      const result = await adminProductsApi.update('prod-001', updateDto);

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/products/prod-001',
        updateDto,
      );
      expect(result).toEqual(updatedProduct);
    });

    it('updates product with single-wrapped response (.data.data)', async () => {
      const updatedProduct = { ...mockProduct, ...updateDto };
      mockedApiClient.patch.mockResolvedValueOnce({
        data: {
          data: updatedProduct,
        },
      });

      const result = await adminProductsApi.update('prod-001', updateDto);

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/products/prod-001',
        updateDto,
      );
      expect(result).toEqual(updatedProduct);
    });

    it('updates product with unwrapped response (.data)', async () => {
      const updatedProduct = { ...mockProduct, ...updateDto };
      mockedApiClient.patch.mockResolvedValueOnce({
        data: updatedProduct,
      });

      const result = await adminProductsApi.update('prod-001', updateDto);

      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/products/prod-001',
        updateDto,
      );
      expect(result).toEqual(updatedProduct);
    });

    it('throws error when update request fails', async () => {
      const error = new Error('Cập nhật sản phẩm thất bại');
      mockedApiClient.patch.mockRejectedValueOnce(error);

      await expect(
        adminProductsApi.update('prod-001', updateDto),
      ).rejects.toThrow('Cập nhật sản phẩm thất bại');
      expect(mockedApiClient.patch).toHaveBeenCalledWith(
        '/products/prod-001',
        updateDto,
      );
    });
  });

  describe('delete', () => {
    it('deletes product by ID successfully', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await adminProductsApi.delete('prod-001');

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/products/prod-001');
      expect(result).toBeUndefined();
    });

    it('throws error when delete request fails', async () => {
      const error = new Error('Xóa sản phẩm thất bại');
      mockedApiClient.delete.mockRejectedValueOnce(error);

      await expect(adminProductsApi.delete('prod-001')).rejects.toThrow(
        'Xóa sản phẩm thất bại',
      );
      expect(mockedApiClient.delete).toHaveBeenCalledWith('/products/prod-001');
    });
  });
});
