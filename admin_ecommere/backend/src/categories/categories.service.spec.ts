import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockPrismaService: {
    category: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    product: {
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    mockPrismaService = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaService);
      }
      return callback;
    });

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
    it('should return all categories mapped with productCount and ordered by name asc', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Aromatherapy',
          slug: 'aromatherapy',
          parentId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          _count: { products: 4 },
        },
        {
          id: 'cat-2',
          name: 'Room Sprays',
          slug: 'room-sprays',
          parentId: 'cat-1',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          _count: { products: 0 },
        },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: 'cat-1',
          name: 'Aromatherapy',
          slug: 'aromatherapy',
          parentId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          _count: { products: 4 },
          productCount: 4,
        },
        {
          id: 'cat-2',
          name: 'Room Sprays',
          slug: 'room-sprays',
          parentId: 'cat-1',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          _count: { products: 0 },
          productCount: 0,
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

    it('should return an empty array when no categories exist', async () => {
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
      name: 'Aromatherapy',
      slug: 'aromatherapy',
      parentId: null,
      parent: null,
      children: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { products: 7 },
    };

    it('should return the category with productCount when found', async () => {
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

    it('should throw NotFoundException when category is not found', async () => {
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
      name: 'Aromatherapy',
      slug: 'aromatherapy',
      parentId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { products: 3 },
    };

    it('should return category with productCount when found by slug', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('aromatherapy');

      expect(result).toEqual({
        ...mockCategory,
        productCount: 3,
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'aromatherapy' },
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
    const createDto: CreateCategoryDto = {
      name: 'Room Sprays',
    };

    const mockCreatedCategory = {
      id: 'cat-created',
      name: 'Room Sprays',
      slug: 'room-sprays',
      parentId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('should create a root category successfully when parentId is not provided', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.slug === 'room-sprays') {
            return null;
          }
          return null;
        },
      );
      mockPrismaService.category.create.mockResolvedValue(mockCreatedCategory);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'room-sprays' },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Room Sprays',
          slug: 'room-sprays',
          parentId: undefined,
        },
      });
    });

    it('should create a child category successfully when parent is valid and has 0 products', async () => {
      const dtoWithParent: CreateCategoryDto = {
        name: 'Lavender Sprays',
        parentId: 'parent-1',
      };

      const mockChild = {
        id: 'cat-child',
        name: 'Lavender Sprays',
        slug: 'lavender-sprays',
        parentId: 'parent-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'parent-1') {
            return { id: 'parent-1', parentId: null };
          }
          if (where.slug === 'lavender-sprays') {
            return null;
          }
          return null;
        },
      );
      mockPrismaService.product.count.mockResolvedValue(0);
      mockPrismaService.category.create.mockResolvedValue(mockChild);

      const result = await service.create(dtoWithParent);

      expect(result).toEqual(mockChild);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        select: { id: true, parentId: true },
      });
      expect(mockPrismaService.product.count).toHaveBeenCalledWith({
        where: { categoryId: 'parent-1' },
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'lavender-sprays' },
      });
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Lavender Sprays',
          slug: 'lavender-sprays',
          parentId: 'parent-1',
        },
      });
    });

    it('should throw BadRequestException when parent category is not found', async () => {
      const dtoWithParent: CreateCategoryDto = {
        name: 'Child Category',
        parentId: 'non-existent-parent',
      };

      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(dtoWithParent)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dtoWithParent)).rejects.toThrow(
        'Parent category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-parent' },
        select: { id: true, parentId: true },
      });
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when parent category hierarchy contains a cycle', async () => {
      const dtoWithParent: CreateCategoryDto = {
        name: 'Child Category',
        parentId: 'parent-a',
      };

      // Cycle: parent-a -> parent-b -> parent-a
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'parent-a') {
            return { id: 'parent-a', parentId: 'parent-b' };
          }
          if (where.id === 'parent-b') {
            return { id: 'parent-b', parentId: 'parent-a' };
          }
          return null;
        },
      );

      await expect(service.create(dtoWithParent)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dtoWithParent)).rejects.toThrow(
        'Category hierarchy contains a cycle',
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when parent category already contains products', async () => {
      const dtoWithParent: CreateCategoryDto = {
        name: 'Child Category',
        parentId: 'parent-1',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'parent-1') {
            return { id: 'parent-1', parentId: null };
          }
          return null;
        },
      );
      mockPrismaService.product.count.mockResolvedValue(5);

      await expect(service.create(dtoWithParent)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dtoWithParent)).rejects.toThrow(
        'Danh mục cha không được chứa sản phẩm',
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category with slug already exists', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.slug === 'room-sprays') {
            return {
              id: 'existing-id',
              name: 'Room Sprays',
              slug: 'room-sprays',
            };
          }
          return null;
        },
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Category with this name already exists',
      );
      expect(mockPrismaService.category.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Prisma create throws P2002 unique constraint error', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `categories_slug_key`',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.category.create.mockRejectedValue(p2002Error);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Category with this name already exists',
      );
    });

    it('should rethrow unexpected non-Prisma errors on create', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      const dbError = new Error('Database connection failed');
      mockPrismaService.category.create.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toThrow(dbError);
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002 on create', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      const otherPrismaError = new Prisma.PrismaClientKnownRequestError(
        'Some other error',
        { code: 'P2025', clientVersion: '5.8.0' },
      );
      mockPrismaService.category.create.mockRejectedValue(otherPrismaError);

      await expect(service.create(createDto)).rejects.toThrow(otherPrismaError);
    });
  });

  describe('update', () => {
    const existingCategory = {
      id: 'cat-1',
      name: 'Original Spray',
      slug: 'original-spray',
      parentId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('should throw NotFoundException when category to update is not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent', { name: 'Updated' }),
      ).rejects.toThrow('Category not found');
    });

    it('should update category without re-checking slug when name is unchanged', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Original Spray',
      };

      mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);
      mockPrismaService.category.update.mockResolvedValue(existingCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(existingCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { name: 'Original Spray' },
      });
    });

    it('should update category without checking slug when name is not provided', async () => {
      const updateDto: UpdateCategoryDto = {};

      mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);
      mockPrismaService.category.update.mockResolvedValue(existingCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(existingCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {},
      });
    });

    it('should update category when new name does not conflict with existing slugs', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Brand New Spray',
      };

      const updatedCategory = {
        ...existingCategory,
        name: 'Brand New Spray',
        slug: 'brand-new-spray',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
          }
          if (where.slug === 'brand-new-spray') {
            return null;
          }
          return null;
        },
      );
      mockPrismaService.category.update.mockResolvedValue(updatedCategory);

      const result = await service.update('cat-1', updateDto);

      expect(result).toEqual(updatedCategory);
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'brand-new-spray' },
      });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'Brand New Spray',
          slug: 'brand-new-spray',
        },
      });
    });

    it('should allow updating name if slug match is the current category itself', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Original Spray 2',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
          }
          if (where.slug === 'original-spray-2') {
            return {
              id: 'cat-1',
              slug: 'original-spray-2',
            };
          }
          return null;
        },
      );
      mockPrismaService.category.update.mockResolvedValue({
        ...existingCategory,
        name: 'Original Spray 2',
      });

      const result = await service.update('cat-1', updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'Original Spray 2',
          slug: 'original-spray-2',
        },
      });
    });

    it('should throw BadRequestException when updated name conflicts with another category slug', async () => {
      const updateDto: UpdateCategoryDto = {
        name: 'Taken Name',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
          }
          if (where.slug === 'taken-name') {
            return {
              id: 'cat-2',
              slug: 'taken-name',
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

    it('should allow setting parentId to undefined without validating ancestors', async () => {
      const categoryWithParent = {
        ...existingCategory,
        parentId: 'parent-old',
      };

      const updateDto: UpdateCategoryDto = {
        parentId: undefined,
      };

      mockPrismaService.category.findUnique.mockResolvedValue(
        categoryWithParent,
      );
      mockPrismaService.category.update.mockResolvedValue({
        ...categoryWithParent,
      });

      const result = await service.update('cat-1', updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.product.count).not.toHaveBeenCalled();
    });

    it('should allow setting parentId explicitly to null and return early in validateParentCategory', async () => {
      const categoryWithParent = {
        ...existingCategory,
        parentId: 'parent-old',
      };

      const updateDto: UpdateCategoryDto = {
        parentId: null as any,
      };

      mockPrismaService.category.findUnique.mockResolvedValue(
        categoryWithParent,
      );
      mockPrismaService.category.update.mockResolvedValue({
        ...categoryWithParent,
        parentId: null,
      });

      const result = await service.update('cat-1', updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.product.count).not.toHaveBeenCalled();
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { parentId: null },
      });
    });

    it('should throw BadRequestException when category is nested directly under itself', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'cat-1',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
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

    it('should throw BadRequestException when category is nested under its descendant', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'grandchild-1',
      };

      // Chain: grandchild-1 -> child-1 -> cat-1
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
          }
          if (where.id === 'grandchild-1') {
            return { id: 'grandchild-1', parentId: 'child-1' };
          }
          if (where.id === 'child-1') {
            return { id: 'child-1', parentId: 'cat-1' };
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

    it('should throw BadRequestException when updating parentId and parent category is not found', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'missing-parent',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
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

    it('should throw BadRequestException when updating parentId and hierarchy contains a cycle', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'p-1',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
          }
          if (where.id === 'p-1') {
            return { id: 'p-1', parentId: 'p-2' };
          }
          if (where.id === 'p-2') {
            return { id: 'p-2', parentId: 'p-1' };
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

    it('should throw BadRequestException when updating parentId and target parent contains products', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'parent-with-prods',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
          }
          if (where.id === 'parent-with-prods') {
            return { id: 'parent-with-prods', parentId: null };
          }
          return null;
        },
      );
      mockPrismaService.product.count.mockResolvedValue(3);

      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', updateDto)).rejects.toThrow(
        'Danh mục cha không được chứa sản phẩm',
      );
      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });

    it('should successfully update parentId when new parent is valid and has 0 products', async () => {
      const updateDto: UpdateCategoryDto = {
        parentId: 'valid-parent',
      };

      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where }) => {
          if (where.id === 'cat-1') {
            return existingCategory;
          }
          if (where.id === 'valid-parent') {
            return { id: 'valid-parent', parentId: null };
          }
          return null;
        },
      );
      mockPrismaService.product.count.mockResolvedValue(0);
      mockPrismaService.category.update.mockResolvedValue({
        ...existingCategory,
        parentId: 'valid-parent',
      });

      const result = await service.update('cat-1', updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { parentId: 'valid-parent' },
      });
    });

    it('should throw BadRequestException when Prisma update throws P2002 error', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation on update',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.category.update.mockRejectedValue(p2002Error);

      await expect(service.update('cat-1', {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cat-1', {})).rejects.toThrow(
        'Category with this name already exists',
      );
    });

    it('should rethrow unexpected non-Prisma errors on update', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);

      const dbError = new Error('Disk full');
      mockPrismaService.category.update.mockRejectedValue(dbError);

      await expect(service.update('cat-1', {})).rejects.toThrow(dbError);
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002 on update', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);

      const otherPrismaError = new Prisma.PrismaClientKnownRequestError(
        'Record to update not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );
      mockPrismaService.category.update.mockRejectedValue(otherPrismaError);

      await expect(service.update('cat-1', {})).rejects.toThrow(
        otherPrismaError,
      );
    });
  });

  describe('remove', () => {
    const existingCategory = {
      id: 'cat-1',
      name: 'To Delete',
      slug: 'to-delete',
      parentId: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('should throw NotFoundException when category to remove is not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category has subcategories', async () => {
      mockPrismaService.category.findUnique.mockImplementation(
        async ({ where, include }) => {
          if (where.id === 'cat-1') {
            if (include?.children) {
              return {
                id: 'cat-1',
                children: [{ id: 'sub-1' }, { id: 'sub-2' }],
                _count: { products: 0 },
              };
            }
            return existingCategory;
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
            return existingCategory;
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

    it('should remove category successfully when it has no subcategories and no products', async () => {
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
            return existingCategory;
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

    it('should throw ConflictException when foreign key constraint P2003 error occurs (PrismaClientKnownRequestError)', async () => {
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
            return existingCategory;
          }
          return null;
        },
      );

      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed on the field: `categoryId`',
        { code: 'P2003', clientVersion: '5.8.0' },
      );
      mockPrismaService.category.delete.mockRejectedValue(p2003Error);

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
      await expect(service.remove('cat-1')).rejects.toThrow(
        'Danh mục đang được sử dụng',
      );
    });

    it('should throw ConflictException when error object has code P2003 (generic object branch)', async () => {
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
            return existingCategory;
          }
          return null;
        },
      );

      const customP2003Error = {
        code: 'P2003',
        message: 'Custom foreign key error',
      };
      mockPrismaService.category.delete.mockRejectedValue(customP2003Error);

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
      await expect(service.remove('cat-1')).rejects.toThrow(
        'Danh mục đang được sử dụng',
      );
    });

    it('should rethrow unexpected errors occurring during deletion', async () => {
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
            return existingCategory;
          }
          return null;
        },
      );

      const dbError = new Error('Database locked');
      mockPrismaService.category.delete.mockRejectedValue(dbError);

      await expect(service.remove('cat-1')).rejects.toThrow(dbError);
    });
  });

  describe('getTreeStructure', () => {
    it('should return an empty tree when no categories exist', async () => {
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

    it('should construct hierarchical tree with nested children, productCount, and isLeaf indicator', async () => {
      const mockCategories = [
        {
          id: 'root-1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          _count: { products: 0 },
        },
        {
          id: 'child-1',
          name: 'Phones',
          slug: 'phones',
          parentId: 'root-1',
          _count: { products: 2 },
        },
        {
          id: 'grandchild-1',
          name: 'Smartphones',
          slug: 'smartphones',
          parentId: 'child-1',
          _count: { products: 10 },
        },
        {
          id: 'root-2',
          name: 'Books',
          slug: 'books',
          parentId: null,
          _count: { products: 5 },
        },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getTreeStructure();

      expect(result).toEqual([
        {
          id: 'root-1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          productCount: 0,
          isLeaf: false,
          children: [
            {
              id: 'child-1',
              name: 'Phones',
              slug: 'phones',
              parentId: 'root-1',
              productCount: 2,
              isLeaf: false,
              children: [
                {
                  id: 'grandchild-1',
                  name: 'Smartphones',
                  slug: 'smartphones',
                  parentId: 'child-1',
                  productCount: 10,
                  isLeaf: true,
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: 'root-2',
          name: 'Books',
          slug: 'books',
          parentId: null,
          productCount: 5,
          isLeaf: true,
          children: [],
        },
      ]);
    });

    it('should place category as a root category if its parentId is not present in nodes map', async () => {
      const mockCategories = [
        {
          id: 'orphan-1',
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
          id: 'orphan-1',
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
    it('should throw NotFoundException when category is not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.isLeafCategory('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.isLeafCategory('unknown-id')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'unknown-id' },
        include: { children: true },
      });
    });

    it('should return true when category has empty children array', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        children: [],
      });

      const result = await service.isLeafCategory('cat-1');

      expect(result).toBe(true);
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
    });
  });

  describe('canDelete', () => {
    it('should throw NotFoundException when category is not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.canDelete('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.canDelete('unknown-id')).rejects.toThrow(
        'Category not found',
      );
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'unknown-id' },
        include: {
          children: true,
          _count: {
            select: { products: true },
          },
        },
      });
    });

    it('should return canDelete false with subcategory count message when category has children', async () => {
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

    it('should return canDelete false with product count message when category has products', async () => {
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

    it('should use provided transaction client tx instead of this.prisma when tx is passed', async () => {
      const mockTx = {
        category: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'cat-1',
            children: [],
            _count: { products: 0 },
          }),
        },
      } as unknown as Prisma.TransactionClient;

      const result = await service.canDelete('cat-1', mockTx);

      expect(result).toEqual({ canDelete: true });
      expect(mockTx.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: {
          children: true,
          _count: {
            select: { products: true },
          },
        },
      });
      expect(mockPrismaService.category.findUnique).not.toHaveBeenCalled();
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
    });

    it('should throw BadRequestException when category is not a leaf category', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'parent-cat',
        children: [{ id: 'child-cat' }],
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
  });

  describe('getDescendantIds', () => {
    it('should return an empty array if categoryId is empty string or falsy', async () => {
      const result1 = await service.getDescendantIds('');
      const result2 = await service.getDescendantIds(null as any);

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(mockPrismaService.category.findMany).not.toHaveBeenCalled();
    });

    it('should return an empty array if category does not exist in category records', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-1', parentId: null },
        { id: 'cat-2', parentId: 'cat-1' },
      ]);

      const result = await service.getDescendantIds('non-existent-id');

      expect(result).toEqual([]);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        select: { id: true, parentId: true },
      });
    });

    it('should return only the categoryId if the category exists and has no descendants', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-1', parentId: null },
        { id: 'cat-2', parentId: null },
      ]);

      const result = await service.getDescendantIds('cat-1');

      expect(result).toEqual(['cat-1']);
    });

    it('should return categoryId and all descendants across multiple levels and sibling branches', async () => {
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'root', parentId: null },
        { id: 'child-1', parentId: 'root' },
        { id: 'child-2', parentId: 'root' },
        { id: 'grandchild-1-1', parentId: 'child-1' },
        { id: 'unrelated', parentId: null },
      ]);

      const result = await service.getDescendantIds('root');

      expect(result).toEqual(['root', 'child-1', 'grandchild-1-1', 'child-2']);
    });

    it('should gracefully handle cyclic category hierarchies without infinite recursion', async () => {
      // Cyclic relations: cat-1 -> cat-2 -> cat-1
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-1', parentId: 'cat-2' },
        { id: 'cat-2', parentId: 'cat-1' },
      ]);

      const result = await service.getDescendantIds('cat-1');

      expect(result).toEqual(['cat-1', 'cat-2']);
    });
  });
});
