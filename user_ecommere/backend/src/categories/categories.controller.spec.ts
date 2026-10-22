import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: CategoriesService;

  const canActivateStub = jest.fn(() => true);

  const mockCategoriesService = {
    findAll: jest.fn(),
    getTreeStructure: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: canActivateStub })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(categoriesService).toBeDefined();
  });

  describe('Route guards', () => {
    it('overrides route guards with a canActivate stub returning true', () => {
      expect(canActivateStub()).toBe(true);
    });
  });

  describe('Route: GET /categories (findAll)', () => {
    it('delegates to categoriesService.findAll and returns category list', async () => {
      const expectedCategories = [
        {
          id: 'cat-1',
          name: 'Sơn nội thất',
          slug: 'son-noi-that',
          parentId: null,
          productCount: 12,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-2',
          name: 'Sơn ngoại thất',
          slug: 'son-ngoai-that',
          parentId: null,
          productCount: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCategoriesService.findAll.mockResolvedValue(expectedCategories);

      const result = await controller.findAll();

      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedCategories);
    });

    it('propagates errors when categoriesService.findAll rejects', async () => {
      const error = new Error('Database read failure');
      mockCategoriesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
    });
  });

  describe('Route: GET /categories/tree (getTree)', () => {
    it('delegates to categoriesService.getTreeStructure and returns hierarchical categories', async () => {
      const expectedTree = [
        {
          id: 'cat-parent-1',
          name: 'Sơn xây dựng',
          slug: 'son-xay-dung',
          parentId: null,
          productCount: 20,
          children: [
            {
              id: 'cat-child-1',
              name: 'Sơn lót',
              slug: 'son-lot',
              parentId: 'cat-parent-1',
              productCount: 5,
              children: [],
            },
          ],
        },
      ];

      mockCategoriesService.getTreeStructure.mockResolvedValue(expectedTree);

      const result = await controller.getTree();

      expect(mockCategoriesService.getTreeStructure).toHaveBeenCalledWith();
      expect(result).toEqual(expectedTree);
    });

    it('propagates errors when categoriesService.getTreeStructure rejects', async () => {
      const error = new Error('Failed to build tree structure');
      mockCategoriesService.getTreeStructure.mockRejectedValue(error);

      await expect(controller.getTree()).rejects.toThrow(error);
      expect(mockCategoriesService.getTreeStructure).toHaveBeenCalledWith();
    });
  });

  describe('Route: GET /categories/:id (findOne)', () => {
    const categoryId = 'category-uuid-123';

    it('delegates id param to categoriesService.findOne and returns the category', async () => {
      const expectedCategory = {
        id: categoryId,
        name: 'Sơn chống rỉ',
        slug: 'son-chong-ri',
        parentId: null,
        productCount: 4,
        children: [],
        parent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesService.findOne.mockResolvedValue(expectedCategory);

      const result = await controller.findOne(categoryId);

      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(expectedCategory);
    });

    it('propagates NotFoundException when category is not found', async () => {
      const error = new NotFoundException('Category not found');
      mockCategoriesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(categoryId)).rejects.toThrow(error);
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('Route: GET /categories/slug/:slug (findBySlug)', () => {
    const slug = 'son-chong-tham';

    it('delegates slug param to categoriesService.findBySlug and returns the category', async () => {
      const expectedCategory = {
        id: 'category-uuid-456',
        name: 'Sơn chống thấm',
        slug,
        parentId: null,
        productCount: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesService.findBySlug.mockResolvedValue(expectedCategory);

      const result = await controller.findBySlug(slug);

      expect(mockCategoriesService.findBySlug).toHaveBeenCalledWith(slug);
      expect(result).toEqual(expectedCategory);
    });

    it('propagates NotFoundException when category slug does not exist', async () => {
      const error = new NotFoundException('Category not found');
      mockCategoriesService.findBySlug.mockRejectedValue(error);

      await expect(controller.findBySlug(slug)).rejects.toThrow(error);
      expect(mockCategoriesService.findBySlug).toHaveBeenCalledWith(slug);
    });
  });

  describe('Route: POST /categories (create)', () => {
    const createCategoryDto: CreateCategoryDto = {
      name: 'Sơn epoxy',
      parentId: 'parent-category-uuid',
    };

    it('delegates createCategoryDto body to categoriesService.create and returns created category', async () => {
      const expectedCreated = {
        id: 'category-uuid-epoxy',
        name: createCategoryDto.name,
        slug: 'son-epoxy',
        parentId: createCategoryDto.parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesService.create.mockResolvedValue(expectedCreated);

      const result = await controller.create(createCategoryDto);

      expect(mockCategoriesService.create).toHaveBeenCalledWith(
        createCategoryDto,
      );
      expect(result).toEqual(expectedCreated);
    });

    it('propagates BadRequestException when category creation fails', async () => {
      const error = new BadRequestException(
        'Category with this name already exists',
      );
      mockCategoriesService.create.mockRejectedValue(error);

      await expect(controller.create(createCategoryDto)).rejects.toThrow(error);
      expect(mockCategoriesService.create).toHaveBeenCalledWith(
        createCategoryDto,
      );
    });
  });

  describe('Route: PATCH /categories/:id (update)', () => {
    const categoryId = 'category-uuid-update';
    const updateCategoryDto: UpdateCategoryDto = {
      name: 'Sơn epoxy phủ bóng',
      parentId: 'new-parent-id',
    };

    it('delegates id param and updateCategoryDto body to categoriesService.update and returns updated category', async () => {
      const expectedUpdated = {
        id: categoryId,
        name: updateCategoryDto.name,
        slug: 'son-epoxy-phu-bong',
        parentId: updateCategoryDto.parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCategoriesService.update.mockResolvedValue(expectedUpdated);

      const result = await controller.update(categoryId, updateCategoryDto);

      expect(mockCategoriesService.update).toHaveBeenCalledWith(
        categoryId,
        updateCategoryDto,
      );
      expect(result).toEqual(expectedUpdated);
    });

    it('propagates NotFoundException when category to update does not exist', async () => {
      const error = new NotFoundException('Category not found');
      mockCategoriesService.update.mockRejectedValue(error);

      await expect(
        controller.update(categoryId, updateCategoryDto),
      ).rejects.toThrow(error);

      expect(mockCategoriesService.update).toHaveBeenCalledWith(
        categoryId,
        updateCategoryDto,
      );
    });

    it('propagates BadRequestException when update validation fails', async () => {
      const error = new BadRequestException(
        'Category with this name already exists',
      );
      mockCategoriesService.update.mockRejectedValue(error);

      await expect(
        controller.update(categoryId, updateCategoryDto),
      ).rejects.toThrow(error);

      expect(mockCategoriesService.update).toHaveBeenCalledWith(
        categoryId,
        updateCategoryDto,
      );
    });
  });

  describe('Route: DELETE /categories/:id (remove)', () => {
    const categoryId = 'category-uuid-delete';

    it('delegates id param to categoriesService.remove and returns removal result', async () => {
      const expectedResult = { message: 'Category deleted successfully' };

      mockCategoriesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(categoryId);

      expect(mockCategoriesService.remove).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(expectedResult);
    });

    it('propagates NotFoundException when category to remove does not exist', async () => {
      const error = new NotFoundException('Category not found');
      mockCategoriesService.remove.mockRejectedValue(error);

      await expect(controller.remove(categoryId)).rejects.toThrow(error);
      expect(mockCategoriesService.remove).toHaveBeenCalledWith(categoryId);
    });

    it('propagates BadRequestException when category cannot be deleted', async () => {
      const error = new BadRequestException(
        'Cannot delete category with associated products',
      );
      mockCategoriesService.remove.mockRejectedValue(error);

      await expect(controller.remove(categoryId)).rejects.toThrow(error);
      expect(mockCategoriesService.remove).toHaveBeenCalledWith(categoryId);
    });
  });
});
