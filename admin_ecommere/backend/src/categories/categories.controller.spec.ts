import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let mockCategoriesService: {
    findAll: jest.Mock;
    getTreeStructure: jest.Mock;
    findOne: jest.Mock;
    findBySlug: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCsrfGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    mockCategoriesService = {
      findAll: jest.fn(),
      getTreeStructure: jest.fn(),
      findOne: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

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
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(CsrfGuard)
      .useValue(mockCsrfGuard)
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories from service', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Aromatherapy',
          slug: 'aromatherapy',
          productCount: 5,
        },
        {
          id: 'cat-2',
          name: 'Sprays',
          slug: 'sprays',
          productCount: 2,
        },
      ];

      mockCategoriesService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.findAll();

      expect(result).toEqual(mockCategories);
      expect(mockCategoriesService.findAll).toHaveBeenCalledWith();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');
      mockCategoriesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
    });
  });

  describe('getTree', () => {
    it('should return hierarchical categories tree from service', async () => {
      const mockTree = [
        {
          id: 'cat-1',
          name: 'Aromatherapy',
          slug: 'aromatherapy',
          productCount: 0,
          isLeaf: false,
          children: [
            {
              id: 'cat-2',
              name: 'Sprays',
              slug: 'sprays',
              productCount: 3,
              isLeaf: true,
              children: [],
            },
          ],
        },
      ];

      mockCategoriesService.getTreeStructure.mockResolvedValue(mockTree);

      const result = await controller.getTree();

      expect(result).toEqual(mockTree);
      expect(mockCategoriesService.getTreeStructure).toHaveBeenCalledWith();
    });

    it('should propagate service errors', async () => {
      const error = new Error('Failed to build tree');
      mockCategoriesService.getTreeStructure.mockRejectedValue(error);

      await expect(controller.getTree()).rejects.toThrow(error);
    });
  });

  describe('findOne', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Aromatherapy',
      slug: 'aromatherapy',
      productCount: 5,
    };

    it('should return category when found by ID', async () => {
      mockCategoriesService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne('cat-1');

      expect(result).toEqual(mockCategory);
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith('cat-1');
    });

    it('should throw NotFoundException when category is not found', async () => {
      mockCategoriesService.findOne.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('non-existent')).rejects.toThrow(
        'Category not found',
      );
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(
        'non-existent',
      );
    });
  });

  describe('findBySlug', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Aromatherapy',
      slug: 'aromatherapy',
      productCount: 5,
    };

    it('should return category when found by slug', async () => {
      mockCategoriesService.findBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findBySlug('aromatherapy');

      expect(result).toEqual(mockCategory);
      expect(mockCategoriesService.findBySlug).toHaveBeenCalledWith(
        'aromatherapy',
      );
    });

    it('should throw NotFoundException when category slug is not found', async () => {
      mockCategoriesService.findBySlug.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(controller.findBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findBySlug('unknown-slug')).rejects.toThrow(
        'Category not found',
      );
      expect(mockCategoriesService.findBySlug).toHaveBeenCalledWith(
        'unknown-slug',
      );
    });
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      name: 'Room Sprays',
      parentId: 'parent-1',
    };

    const mockCreatedCategory = {
      id: 'cat-created',
      name: 'Room Sprays',
      slug: 'room-sprays',
      parentId: 'parent-1',
    };

    it('should create and return category', async () => {
      mockCategoriesService.create.mockResolvedValue(mockCreatedCategory);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreatedCategory);
      expect(mockCategoriesService.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException when category creation fails validation', async () => {
      mockCategoriesService.create.mockRejectedValue(
        new BadRequestException('Category with this name already exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createDto)).rejects.toThrow(
        'Category with this name already exists',
      );
      expect(mockCategoriesService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = {
      name: 'Updated Spray Name',
    };

    const mockUpdatedCategory = {
      id: 'cat-1',
      name: 'Updated Spray Name',
      slug: 'updated-spray-name',
      parentId: null,
    };

    it('should update and return category', async () => {
      mockCategoriesService.update.mockResolvedValue(mockUpdatedCategory);

      const result = await controller.update('cat-1', updateDto);

      expect(result).toEqual(mockUpdatedCategory);
      expect(mockCategoriesService.update).toHaveBeenCalledWith(
        'cat-1',
        updateDto,
      );
    });

    it('should throw NotFoundException when category to update is not found', async () => {
      mockCategoriesService.update.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(
        controller.update('non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update('non-existent', updateDto),
      ).rejects.toThrow('Category not found');
      expect(mockCategoriesService.update).toHaveBeenCalledWith(
        'non-existent',
        updateDto,
      );
    });

    it('should throw BadRequestException when update validation fails', async () => {
      mockCategoriesService.update.mockRejectedValue(
        new BadRequestException('Category hierarchy contains a cycle'),
      );

      await expect(controller.update('cat-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.update('cat-1', updateDto)).rejects.toThrow(
        'Category hierarchy contains a cycle',
      );
      expect(mockCategoriesService.update).toHaveBeenCalledWith(
        'cat-1',
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove category and return confirmation message', async () => {
      const successResponse = { message: 'Category deleted successfully' };
      mockCategoriesService.remove.mockResolvedValue(successResponse);

      const result = await controller.remove('cat-1');

      expect(result).toEqual(successResponse);
      expect(mockCategoriesService.remove).toHaveBeenCalledWith('cat-1');
    });

    it('should throw NotFoundException when category to remove is not found', async () => {
      mockCategoriesService.remove.mockRejectedValue(
        new NotFoundException('Category not found'),
      );

      await expect(controller.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove('non-existent')).rejects.toThrow(
        'Category not found',
      );
      expect(mockCategoriesService.remove).toHaveBeenCalledWith('non-existent');
    });

    it('should throw BadRequestException when category cannot be deleted', async () => {
      mockCategoriesService.remove.mockRejectedValue(
        new BadRequestException(
          'Cannot delete category with 2 subcategories. Please delete or move subcategories first.',
        ),
      );

      await expect(controller.remove('cat-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.remove('cat-1')).rejects.toThrow(
        'Cannot delete category with 2 subcategories. Please delete or move subcategories first.',
      );
      expect(mockCategoriesService.remove).toHaveBeenCalledWith('cat-1');
    });

    it('should throw ConflictException when category is in use', async () => {
      mockCategoriesService.remove.mockRejectedValue(
        new ConflictException('Danh mục đang được sử dụng'),
      );

      await expect(controller.remove('cat-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.remove('cat-1')).rejects.toThrow(
        'Danh mục đang được sử dụng',
      );
      expect(mockCategoriesService.remove).toHaveBeenCalledWith('cat-1');
    });
  });
});
