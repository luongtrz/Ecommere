import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories with productCount mapped from _count.products ordered by name asc', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          _count: { products: 12 },
        },
        {
          id: 'cat-2',
          name: 'Laptops',
          slug: 'laptops',
          parentId: 'cat-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          _count: { products: 5 },
        },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          ...mockCategories[0],
          productCount: 12,
        },
        {
          ...mockCategories[1],
          productCount: 5,
        },
      ]);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should return an empty array when no categories are found', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      parentId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { products: 7 },
      children: [],
      parent: null,
    };

    it('should return category with productCount when found by id', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('cat-1');

      expect(result).toEqual({
        ...mockCategory,
        productCount: 7,
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: {
          _count: {
            select: { products: true },
          },
          children: true,
          parent: true,
        },
      });
    });

    it('should throw NotFoundException when category does not exist by id', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        include: {
          _count: {
            select: { products: true },
          },
          children: true,
          parent: true,
        },
      });
    });
  });

  describe('findBySlug', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      parentId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { products: 9 },
    };

    it('should return category with productCount when found by slug', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('electronics');

      expect(result).toEqual({
        ...mockCategory,
        productCount: 9,
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'electronics' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });

    it('should throw NotFoundException when category is not found by slug', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'unknown-slug' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });
  });

  describe('create', () => {
    const createRootDto: CreateCategoryDto = {
      name: 'Electronics',
    };

    const createChildDto: CreateCategoryDto = {
      name: 'Smartphones',
      parentId: 'parent-1',
    };

    it('should successfully create a root category without parentId', async () => {
      const mockCreatedCategory = {
        id: 'cat-1',
        name: 'Electronics',
        slug: 'electronics',
        parentId: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(mockCreatedCategory);

      const result = await service.create(createRootDto);

      expect(result).toEqual(mockCreatedCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'electronics' },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          parentId: undefined,
        },
      });
    });

    it('should successfully create a child category with a valid parentId', async () => {
      const mockCreatedChild = {
        id: 'cat-2',
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: 'parent-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'parent-1') {
            return { id: 'parent-1', parentId: null };
          }
          if (where.slug === 'smartphones') {
            return null;
          }
          return null;
        },
      );
      mockPrismaService.category.create.mockResolvedValue(mockCreatedChild);

      const result = await service.create(createChildDto);

      expect(result).toEqual(mockCreatedChild);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        select: { id: true, parentId: true },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'smartphones' },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Smartphones',
          slug: 'smartphones',
          parentId: 'parent-1',
        },
      });
    });

    it('should throw BadRequestException when parent category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createChildDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createChildDto)).rejects.toThrow(
        'Parent category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        select: { id: true, parentId: true },
      });
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category hierarchy contains a cycle', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'parent-1') {
            return { id: 'parent-1', parentId: 'parent-2' };
          }
          if (where.id === 'parent-2') {
            return { id: 'parent-2', parentId: 'parent-1' };
          }
          return null;
        },
      );

      await expect(service.create(createChildDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createChildDto)).rejects.toThrow(
        'Category hierarchy contains a cycle',
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category slug already exists', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.slug === 'electronics') {
            return {
              id: 'existing-id',
              name: 'Electronics',
              slug: 'electronics',
            };
          }
          return null;
        },
      );

      await expect(service.create(createRootDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createRootDto)).rejects.toThrow(
        'Category with this name already exists',
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Prisma create throws P2002 error', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `categories_slug_key`',
        { code: 'P2002', clientVersion: '5.8.0' },
      );

      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockRejectedValue(p2002Error);

      await expect(service.create(createRootDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createRootDto)).rejects.toThrow(
        'Category with this name already exists',
      );
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002', async () => {
      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.8.0' },
      );

      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockRejectedValue(p2003Error);

      await expect(service.create(createRootDto)).rejects.toThrow(p2003Error);
    });

    it('should rethrow unexpected generic errors during creation', async () => {
      const unknownError = new Error('Database connection failed');

      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockRejectedValue(unknownError);

      await expect(service.create(createRootDto)).rejects.toThrow(unknownError);
    });
  });

  describe('update', () => {
    const mockExistingCategory = {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      parentId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('should throw NotFoundException when category to update does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow('Category not found');

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should update category without slug lookup when name is unchanged and parentId is undefined', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Electronics',
      };

      const mockUpdatedCategory = {
        ...mockExistingCategory,
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      };

      mockPrismaService.category.findUnique.mockResolvedValue(
        mockExistingCategory,
      );
      mockPrismaService.category.update.mockResolvedValue(mockUpdatedCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: updateDto,
      });
    });

    it('should update category name and generate new slug when name changes and new slug is not taken', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Consumer Electronics',
      };

      const mockUpdatedCategory = {
        ...mockExistingCategory,
        name: 'Consumer Electronics',
        slug: 'consumer-electronics',
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return mockExistingCategory;
          }
          if (where.slug === 'consumer-electronics') {
            return null;
          }
          return null;
        },
      );
      mockPrismaService.category.update.mockResolvedValue(mockUpdatedCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'consumer-electronics' },
      });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'Consumer Electronics',
          slug: 'consumer-electronics',
        },
      });
    });

    it('should allow updating name if generated slug matches the category itself', async () => {
      const categoryWithDifferentName = {
        id: 'cat-1',
        name: 'Old Electronics',
        slug: 'electronics',
        parentId: null,
      };

      const updateDto: UpdateCategoryDto = {
        name: 'Electronics',
      };

      const mockUpdatedCategory = {
        ...categoryWithDifferentName,
        name: 'Electronics',
        slug: 'electronics',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return categoryWithDifferentName;
          }
          if (where.slug === 'electronics') {
            return { id: 'cat-1', slug: 'electronics' };
          }
          return null;
        },
      );
      mockPrismaService.category.update.mockResolvedValue(mockUpdatedCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'Electronics',
          slug: 'electronics',
        },
      });
    });

    it('should throw BadRequestException when updating name to one whose slug belongs to another category', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Home Appliances',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return mockExistingCategory;
          }
          if (where.slug === 'home-appliances') {
            return {
              id: 'cat-2',
              name: 'Home Appliances',
              slug: 'home-appliances',
            };
          }
          return null;
        },
      );

      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        'Category with this name already exists',
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should successfully update category parentId to null (moving to root)', async () => {
      const categoryWithParent = {
        ...mockExistingCategory,
        parentId: 'parent-1',
      };

      const updateDto: UpdateCategoryDto = {
        parentId: null,
      };

      const mockUpdatedCategory = {
        ...categoryWithParent,
        parentId: null,
      };

      mockPrismaService.category.findUnique.mockResolvedValue(
        categoryWithParent,
      );
      mockPrismaService.category.update.mockResolvedValue(mockUpdatedCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { parentId: null },
      });
    });

    it('should successfully update category parentId to a valid parent category', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'parent-valid',
      };

      const mockUpdatedCategory = {
        ...mockExistingCategory,
        parentId: 'parent-valid',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return mockExistingCategory;
          }
          if (where.id === 'parent-valid') {
            return { id: 'parent-valid', parentId: null };
          }
          return null;
        },
      );
      mockPrismaService.category.update.mockResolvedValue(mockUpdatedCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { parentId: 'parent-valid' },
      });
    });

    it('should throw BadRequestException when parentId is set to the category itself', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'cat-1',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return { id: 'cat-1', parentId: null };
          }
          return null;
        },
      );

      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        'Category cannot be nested under itself or its descendant',
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when parentId is set to a descendant category', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'cat-descendant',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return { id: 'cat-1', parentId: null };
          }
          if (where.id === 'cat-descendant') {
            return { id: 'cat-descendant', parentId: 'cat-1' };
          }
          return null;
        },
      );

      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        'Category cannot be nested under itself or its descendant',
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when parent category does not exist during update', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'missing-parent',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return mockExistingCategory;
          }
          if (where.id === 'missing-parent') {
            return null;
          }
          return null;
        },
      );

      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        'Parent category not found',
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when parent hierarchy cycle is detected during update', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'parent-a',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return mockExistingCategory;
          }
          if (where.id === 'parent-a') {
            return { id: 'parent-a', parentId: 'parent-b' };
          }
          if (where.id === 'parent-b') {
            return { id: 'parent-b', parentId: 'parent-a' };
          }
          return null;
        },
      );

      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        'Category hierarchy contains a cycle',
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Prisma update throws P2002 error', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '5.8.0' },
      );

      mockPrismaService.category.findUnique.mockResolvedValue(
        mockExistingCategory,
      );
      mockPrismaService.category.update.mockRejectedValue(p2002Error);

      await expect(
        service.update('cat-1', { name: 'Existing Name' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('cat-1', { name: 'Existing Name' }),
      ).rejects.toThrow('Category with this name already exists');
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );

      mockPrismaService.category.findUnique.mockResolvedValue(
        mockExistingCategory,
      );
      mockPrismaService.category.update.mockRejectedValue(p2025Error);

      await expect(
        service.update('cat-1', { name: 'New Name' }),
      ).rejects.toThrow(p2025Error);
    });

    it('should rethrow unexpected errors during update', async () => {
      const unknownError = new Error('Database write error');

      mockPrismaService.category.findUnique.mockResolvedValue(
        mockExistingCategory,
      );
      mockPrismaService.category.update.mockRejectedValue(unknownError);

      await expect(
        service.update('cat-1', { name: 'New Name' }),
      ).rejects.toThrow(unknownError);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when category to remove does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category has subcategories', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where, include }) => {
          if (where.id === 'cat-1') {
            if (include?.children) {
              return {
                id: 'cat-1',
                children: [{ id: 'child-1' }, { id: 'child-2' }],
                _count: { products: 0 },
              };
            }
            return { id: 'cat-1' };
          }
          return null;
        },
      );

      await expect(service.remove('cat-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('cat-1')).rejects.toThrow(
        'Cannot delete category with 2 subcategories. Please delete or move subcategories first.',
      );
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category has products', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where, include }) => {
          if (where.id === 'cat-1') {
            if (include?.children) {
              return {
                id: 'cat-1',
                children: [],
                _count: { products: 4 },
              };
            }
            return { id: 'cat-1' };
          }
          return null;
        },
      );

      await expect(service.remove('cat-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('cat-1')).rejects.toThrow(
        'Cannot delete category with 4 products. Please reassign products first.',
      );
      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });

    it('should delete category and return success message when category has no children and no products', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where, include }) => {
          if (where.id === 'cat-1') {
            if (include?.children) {
              return {
                id: 'cat-1',
                children: [],
                _count: { products: 0 },
              };
            }
            return { id: 'cat-1' };
          }
          return null;
        },
      );
      mockPrismaService.category.delete.mockResolvedValue({ id: 'cat-1' });

      const result = await service.remove('cat-1');

      expect(result).toEqual({ message: 'Category deleted successfully' });
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });
  });

  describe('getTreeStructure', () => {
    it('should return an empty array when no categories exist', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([]);

      const result = await service.getTreeStructure();

      expect(result).toEqual([]);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should construct a hierarchical tree structure with roots, children, grandchildren and isLeaf flags', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          _count: { products: 0 },
        },
        {
          id: 'cat-2',
          name: 'Computers',
          slug: 'computers',
          parentId: 'cat-1',
          _count: { products: 2 },
        },
        {
          id: 'cat-3',
          name: 'Laptops',
          slug: 'laptops',
          parentId: 'cat-2',
          _count: { products: 10 },
        },
        {
          id: 'cat-4',
          name: 'Clothing',
          slug: 'clothing',
          parentId: null,
          _count: { products: 5 },
        },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getTreeStructure();

      expect(result).toEqual([
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          productCount: 0,
          isLeaf: false,
          children: [
            {
              id: 'cat-2',
              name: 'Computers',
              slug: 'computers',
              parentId: 'cat-1',
              productCount: 2,
              isLeaf: false,
              children: [
                {
                  id: 'cat-3',
                  name: 'Laptops',
                  slug: 'laptops',
                  parentId: 'cat-2',
                  productCount: 10,
                  isLeaf: true,
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: 'cat-4',
          name: 'Clothing',
          slug: 'clothing',
          parentId: null,
          productCount: 5,
          isLeaf: true,
          children: [],
        },
      ]);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    });

    it('should treat categories whose parent is not present in the list as root categories', async () => {
      const mockCategories = [
        {
          id: 'cat-orphan',
          name: 'Orphan Category',
          slug: 'orphan-category',
          parentId: 'missing-parent-id',
          _count: { products: 1 },
        },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getTreeStructure();

      expect(result).toEqual([
        {
          id: 'cat-orphan',
          name: 'Orphan Category',
          slug: 'orphan-category',
          parentId: 'missing-parent-id',
          productCount: 1,
          isLeaf: true,
          children: [],
        },
      ]);
    });
  });

  describe('isLeafCategory', () => {
    it('should throw NotFoundException when category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.isLeafCategory('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.isLeafCategory('non-existent')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        include: { children: true },
      });
    });

    it('should return true when category has an empty children array', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: [],
      });

      const result = await service.isLeafCategory('cat-1');

      expect(result).toBe(true);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: { children: true },
      });
    });

    it('should return true when category children property is null or undefined', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: null,
      });

      const result = await service.isLeafCategory('cat-1');

      expect(result).toBe(true);
    });

    it('should return false when category has one or more children', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: [{ id: 'child-1' }],
      });

      const result = await service.isLeafCategory('cat-1');

      expect(result).toBe(false);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: { children: true },
      });
    });
  });

  describe('canDelete', () => {
    it('should throw NotFoundException when category does not exist', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.canDelete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.canDelete('non-existent')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        include: {
          children: true,
          _count: {
            select: { products: true },
          },
        },
      });
    });

    it('should return canDelete false with reason when category has subcategories', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: [{ id: 'child-1' }, { id: 'child-2' }, { id: 'child-3' }],
        _count: { products: 0 },
      });

      const result = await service.canDelete('cat-1');

      expect(result).toEqual({
        canDelete: false,
        reason:
          'Cannot delete category with 3 subcategories. Please delete or move subcategories first.',
      });
    });

    it('should return canDelete false with reason when category has products', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: [],
        _count: { products: 8 },
      });

      const result = await service.canDelete('cat-1');

      expect(result).toEqual({
        canDelete: false,
        reason:
          'Cannot delete category with 8 products. Please reassign products first.',
      });
    });

    it('should return canDelete true when category has no subcategories and no products', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: [],
        _count: { products: 0 },
      });

      const result = await service.canDelete('cat-1');

      expect(result).toEqual({ canDelete: true });
    });
  });

  describe('validateProductAssignment', () => {
    it('should resolve without error when category is a leaf category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'leaf-cat',
        children: [],
      });

      await expect(
        service.validateProductAssignment('leaf-cat'),
      ).resolves.toBeUndefined();
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'leaf-cat' },
        include: { children: true },
      });
    });

    it('should throw BadRequestException when category is not a leaf category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'parent-cat',
        children: [{ id: 'sub-cat' }],
      });

      await expect(
        service.validateProductAssignment('parent-cat'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateProductAssignment('parent-cat'),
      ).rejects.toThrow(
        'Products can only be assigned to leaf categories (categories without subcategories)',
      );
    });

    it('should throw NotFoundException when category is not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.validateProductAssignment('non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.validateProductAssignment('non-existent'),
      ).rejects.toThrow('Category not found');
    });
  });

  describe('getDescendantIds', () => {
    it('should return an empty array when category is not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      const result = await service.getDescendantIds('non-existent');

      expect(result).toEqual([]);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        include: { children: true },
      });
    });

    it('should return only the category id when category has no children', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'leaf-cat',
        children: [],
      });

      const result = await service.getDescendantIds('leaf-cat');

      expect(result).toEqual(['leaf-cat']);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'leaf-cat' },
        include: { children: true },
      });
    });

    it('should return category id and all descendant ids recursively across multiple hierarchy levels', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          switch (where.id) {
            case 'root':
              return {
                id: 'root',
                children: [{ id: 'child-1' }, { id: 'child-2' }],
              };
            case 'child-1':
              return {
                id: 'child-1',
                children: [{ id: 'grandchild-1' }],
              };
            case 'grandchild-1':
              return {
                id: 'grandchild-1',
                children: [],
              };
            case 'child-2':
              return {
                id: 'child-2',
                children: [],
              };
            default:
              return null;
          }
        },
      );

      const result = await service.getDescendantIds('root');

      expect(result).toEqual(['root', 'child-1', 'grandchild-1', 'child-2']);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'root' },
        include: { children: true },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'child-1' },
        include: { children: true },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'grandchild-1' },
        include: { children: true },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'child-2' },
        include: { children: true },
      });
    });
  });
});
