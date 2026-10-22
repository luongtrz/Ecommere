import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import {
  categoriesApi,
  type Category,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from './categories.api';

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

describe('categoriesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategory1: Category = {
    id: 'cat-1',
    name: 'Nước hoa nam',
    slug: 'nuoc-hoa-nam',
    productCount: 15,
    isLeaf: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  };

  const mockCategory2: Category = {
    id: 'cat-2',
    name: 'Nước hoa nữ',
    slug: 'nuoc-hoa-nu',
    parentId: 'cat-root',
    productCount: 20,
    isLeaf: false,
    children: [
      {
        id: 'cat-3',
        name: 'Nước hoa mini',
        slug: 'nuoc-hoa-mini',
        parentId: 'cat-2',
        productCount: 5,
        isLeaf: true,
      },
    ],
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  };

  describe('getAll', () => {
    it('unwraps double-nested data (response.data.data.data)', async () => {
      const mockList: Category[] = [mockCategory1, mockCategory2];
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          data: {
            data: mockList,
          },
        },
      });

      const result = await categoriesApi.getAll();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockList);
    });

    it('unwraps single-nested data (response.data.data)', async () => {
      const mockList: Category[] = [mockCategory1];
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          data: mockList,
        },
      });

      const result = await categoriesApi.getAll();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockList);
    });

    it('falls back to response.data when response.data.data is falsy', async () => {
      const mockList: Category[] = [mockCategory2];
      (apiClient.get as any).mockResolvedValueOnce({
        data: mockList,
      });

      const result = await categoriesApi.getAll();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockList);
    });

    it('handles empty category list response', async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          data: [],
        },
      });

      const result = await categoriesApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual([]);
    });

    it('throws error when apiClient.get fails', async () => {
      const networkError = new Error('Network error');
      (apiClient.get as any).mockRejectedValueOnce(networkError);

      await expect(categoriesApi.getAll()).rejects.toThrow('Network error');
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
    });
  });

  describe('getTree', () => {
    it('unwraps nested data from response.data.data', async () => {
      const mockTree: Category[] = [mockCategory2];
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          data: mockTree,
        },
      });

      const result = await categoriesApi.getTree();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories/tree');
      expect(result).toEqual(mockTree);
    });

    it('falls back to response.data when response.data.data is undefined', async () => {
      const mockTree: Category[] = [mockCategory1];
      (apiClient.get as any).mockResolvedValueOnce({
        data: mockTree,
      });

      const result = await categoriesApi.getTree();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories/tree');
      expect(result).toEqual(mockTree);
    });

    it('throws error when apiClient.get fails', async () => {
      const treeError = new Error('Lỗi lấy cây danh mục');
      (apiClient.get as any).mockRejectedValueOnce(treeError);

      await expect(categoriesApi.getTree()).rejects.toThrow(
        'Lỗi lấy cây danh mục',
      );
      expect(apiClient.get).toHaveBeenCalledWith('/categories/tree');
    });
  });

  describe('getById', () => {
    it('unwraps double-nested data (response.data.data.data)', async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          data: {
            data: mockCategory1,
          },
        },
      });

      const result = await categoriesApi.getById('cat-1');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories/cat-1');
      expect(result).toEqual(mockCategory1);
    });

    it('unwraps single-nested data (response.data.data)', async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          data: mockCategory1,
        },
      });

      const result = await categoriesApi.getById('cat-1');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories/cat-1');
      expect(result).toEqual(mockCategory1);
    });

    it('falls back to response.data when response.data.data is falsy', async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: mockCategory1,
      });

      const result = await categoriesApi.getById('cat-1');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories/cat-1');
      expect(result).toEqual(mockCategory1);
    });

    it('throws error when apiClient.get fails for id', async () => {
      const notFoundError = new Error('Không tìm thấy danh mục');
      (apiClient.get as any).mockRejectedValueOnce(notFoundError);

      await expect(categoriesApi.getById('invalid-id')).rejects.toThrow(
        'Không tìm thấy danh mục',
      );
      expect(apiClient.get).toHaveBeenCalledWith('/categories/invalid-id');
    });
  });

  describe('create', () => {
    it('creates a category with parentId and unwraps response.data.data', async () => {
      const dto: CreateCategoryDto = {
        name: 'Nước hoa mini',
        parentId: 'cat-2',
      };
      const createdCategory: Category = {
        id: 'cat-new-1',
        name: 'Nước hoa mini',
        slug: 'nuoc-hoa-mini',
        parentId: 'cat-2',
      };

      (apiClient.post as any).mockResolvedValueOnce({
        data: {
          data: createdCategory,
        },
      });

      const result = await categoriesApi.create(dto);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith('/categories', dto);
      expect(result).toEqual(createdCategory);
    });

    it('creates a category without parentId and falls back to response.data', async () => {
      const dto: CreateCategoryDto = {
        name: 'Chai xịt body mist',
      };
      const createdCategory: Category = {
        id: 'cat-new-2',
        name: 'Chai xịt body mist',
        slug: 'chai-xit-body-mist',
      };

      (apiClient.post as any).mockResolvedValueOnce({
        data: createdCategory,
      });

      const result = await categoriesApi.create(dto);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith('/categories', dto);
      expect(result).toEqual(createdCategory);
    });

    it('throws error when apiClient.post fails', async () => {
      const createError = new Error('Tên danh mục đã tồn tại');
      (apiClient.post as any).mockRejectedValueOnce(createError);

      const dto: CreateCategoryDto = { name: 'Danh mục trùng' };
      await expect(categoriesApi.create(dto)).rejects.toThrow(
        'Tên danh mục đã tồn tại',
      );
      expect(apiClient.post).toHaveBeenCalledWith('/categories', dto);
    });
  });

  describe('update', () => {
    it('updates a category with name and parentId and unwraps response.data.data', async () => {
      const dto: UpdateCategoryDto = {
        name: 'Nước hoa nam cao cấp',
        parentId: 'cat-parent-updated',
      };
      const updatedCategory: Category = {
        ...mockCategory1,
        name: 'Nước hoa nam cao cấp',
        parentId: 'cat-parent-updated',
      };

      (apiClient.patch as any).mockResolvedValueOnce({
        data: {
          data: updatedCategory,
        },
      });

      const result = await categoriesApi.update('cat-1', dto);

      expect(apiClient.patch).toHaveBeenCalledTimes(1);
      expect(apiClient.patch).toHaveBeenCalledWith('/categories/cat-1', dto);
      expect(result).toEqual(updatedCategory);
    });

    it('updates category name only and falls back to response.data', async () => {
      const dto: UpdateCategoryDto = {
        name: 'Nước hoa xịt thơm',
      };
      const updatedCategory: Category = {
        ...mockCategory1,
        name: 'Nước hoa xịt thơm',
      };

      (apiClient.patch as any).mockResolvedValueOnce({
        data: updatedCategory,
      });

      const result = await categoriesApi.update('cat-1', dto);

      expect(apiClient.patch).toHaveBeenCalledTimes(1);
      expect(apiClient.patch).toHaveBeenCalledWith('/categories/cat-1', dto);
      expect(result).toEqual(updatedCategory);
    });

    it('throws error when apiClient.patch fails', async () => {
      const updateError = new Error('Lỗi cập nhật danh mục');
      (apiClient.patch as any).mockRejectedValueOnce(updateError);

      const dto: UpdateCategoryDto = { name: 'Lỗi' };
      await expect(categoriesApi.update('cat-1', dto)).rejects.toThrow(
        'Lỗi cập nhật danh mục',
      );
      expect(apiClient.patch).toHaveBeenCalledWith('/categories/cat-1', dto);
    });
  });

  describe('delete', () => {
    it('sends delete request to /categories/:id and returns void', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await categoriesApi.delete('cat-1');

      expect(apiClient.delete).toHaveBeenCalledTimes(1);
      expect(apiClient.delete).toHaveBeenCalledWith('/categories/cat-1');
      expect(result).toBeUndefined();
    });

    it('throws error when apiClient.delete fails', async () => {
      const deleteError = new Error('Danh mục có sản phẩm, không thể xóa');
      (apiClient.delete as any).mockRejectedValueOnce(deleteError);

      await expect(categoriesApi.delete('cat-1')).rejects.toThrow(
        'Danh mục có sản phẩm, không thể xóa',
      );
      expect(apiClient.delete).toHaveBeenCalledWith('/categories/cat-1');
    });
  });
});
