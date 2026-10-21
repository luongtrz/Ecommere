import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { ReviewFilterDto } from './dtos/review-filter.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let reviewsService: ReviewsService;

  const mockReviewsService = {
    createReview: jest.fn(),
    getProductReviews: jest.fn(),
    getProductStats: jest.fn(),
    getMyReviews: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
    deleteReviewAsAdmin: jest.fn(),
  };

  const canActivateStub = jest.fn((_context?: ExecutionContext) => true);

  const mockReview = {
    id: 'rev-1',
    userId: 'user-1',
    productId: 'prod-1',
    rating: 5,
    content: 'Great product! Highly recommended.',
    createdAt: new Date('2026-01-10T00:00:00.000Z'),
    updatedAt: new Date('2026-01-10T00:00:00.000Z'),
    user: {
      id: 'user-1',
      name: 'Nguyen Van A',
      email: 'user1@example.com',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    canActivateStub.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
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

    controller = module.get<ReviewsController>(ReviewsController);
    reviewsService = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(reviewsService).toBeDefined();
  });

  describe('Route Guards and Metadata', () => {
    it('should have route guards overridden with canActivate returning true', () => {
      expect(canActivateStub()).toBe(true);
    });

    it('should have @Public() metadata on public route handlers', () => {
      const reflector = new Reflector();

      expect(reflector.get(IS_PUBLIC_KEY, controller.getProductReviews)).toBe(
        true,
      );
      expect(reflector.get(IS_PUBLIC_KEY, controller.getProductStats)).toBe(
        true,
      );
      expect(
        reflector.get(IS_PUBLIC_KEY, controller.createReview),
      ).toBeUndefined();
      expect(
        reflector.get(IS_PUBLIC_KEY, controller.getMyReviews),
      ).toBeUndefined();
      expect(
        reflector.get(IS_PUBLIC_KEY, controller.updateReview),
      ).toBeUndefined();
      expect(
        reflector.get(IS_PUBLIC_KEY, controller.deleteReview),
      ).toBeUndefined();
      expect(
        reflector.get(IS_PUBLIC_KEY, controller.deleteReviewAsAdmin),
      ).toBeUndefined();
    });

    it('should have @Roles(Role.ADMIN) metadata on deleteReviewAsAdmin handler', () => {
      const reflector = new Reflector();

      expect(reflector.get(ROLES_KEY, controller.deleteReviewAsAdmin)).toEqual([
        Role.ADMIN,
      ]);
      expect(reflector.get(ROLES_KEY, controller.createReview)).toBeUndefined();
      expect(reflector.get(ROLES_KEY, controller.getMyReviews)).toBeUndefined();
      expect(reflector.get(ROLES_KEY, controller.updateReview)).toBeUndefined();
      expect(reflector.get(ROLES_KEY, controller.deleteReview)).toBeUndefined();
    });
  });

  describe('POST /reviews (createReview)', () => {
    const createReviewDto: CreateReviewDto = {
      productId: 'prod-1',
      rating: 5,
      content: 'Great product! Highly recommended.',
    };

    it('should delegate to reviewsService.createReview with authenticated userId and body DTO', async () => {
      mockReviewsService.createReview.mockResolvedValue(mockReview);

      const result = await controller.createReview('user-1', createReviewDto);

      expect(result).toEqual(mockReview);
      expect(mockReviewsService.createReview).toHaveBeenCalledWith(
        'user-1',
        createReviewDto,
      );
    });

    it('should propagate NotFoundException when product is not found', async () => {
      const error = new NotFoundException('Product not found');
      mockReviewsService.createReview.mockRejectedValue(error);

      await expect(
        controller.createReview('user-1', createReviewDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockReviewsService.createReview).toHaveBeenCalledWith(
        'user-1',
        createReviewDto,
      );
    });

    it('should propagate BadRequestException when user has not purchased product or already reviewed', async () => {
      const error = new BadRequestException(
        'You can only review products you have purchased',
      );
      mockReviewsService.createReview.mockRejectedValue(error);

      await expect(
        controller.createReview('user-1', createReviewDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockReviewsService.createReview).toHaveBeenCalledWith(
        'user-1',
        createReviewDto,
      );
    });
  });

  describe('GET /reviews/product/:productId (getProductReviews)', () => {
    const filterDto: ReviewFilterDto = {
      page: 1,
      limit: 10,
      rating: 5,
    };

    const mockPaginatedReviews = {
      data: [mockReview],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };

    it('should delegate to reviewsService.getProductReviews with productId and filterDto', async () => {
      mockReviewsService.getProductReviews.mockResolvedValue(
        mockPaginatedReviews,
      );

      const result = await controller.getProductReviews('prod-1', filterDto);

      expect(result).toEqual(mockPaginatedReviews);
      expect(mockReviewsService.getProductReviews).toHaveBeenCalledWith(
        'prod-1',
        filterDto,
      );
    });

    it('should delegate with empty filterDto and return reviews', async () => {
      const emptyResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockReviewsService.getProductReviews.mockResolvedValue(emptyResult);

      const result = await controller.getProductReviews('prod-1', {});

      expect(result).toEqual(emptyResult);
      expect(mockReviewsService.getProductReviews).toHaveBeenCalledWith(
        'prod-1',
        {},
      );
    });

    it('should propagate errors from reviewsService.getProductReviews', async () => {
      const error = new Error('Database read failure');
      mockReviewsService.getProductReviews.mockRejectedValue(error);

      await expect(
        controller.getProductReviews('prod-1', filterDto),
      ).rejects.toThrow(error);
      expect(mockReviewsService.getProductReviews).toHaveBeenCalledWith(
        'prod-1',
        filterDto,
      );
    });
  });

  describe('GET /reviews/product/:productId/stats (getProductStats)', () => {
    const mockStats = {
      totalReviews: 6,
      averageRating: 4.33,
      ratingDistribution: {
        5: 3,
        4: 2,
        3: 1,
        2: 0,
        1: 0,
      },
    };

    it('should delegate to reviewsService.getProductStats with productId param and return stats', async () => {
      mockReviewsService.getProductStats.mockResolvedValue(mockStats);

      const result = await controller.getProductStats('prod-1');

      expect(result).toEqual(mockStats);
      expect(mockReviewsService.getProductStats).toHaveBeenCalledWith('prod-1');
    });

    it('should propagate errors from reviewsService.getProductStats', async () => {
      const error = new Error('Stats computation failed');
      mockReviewsService.getProductStats.mockRejectedValue(error);

      await expect(controller.getProductStats('prod-1')).rejects.toThrow(error);
      expect(mockReviewsService.getProductStats).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('GET /reviews/my (getMyReviews)', () => {
    const paginationDto: PaginationDto = {
      page: 2,
      limit: 5,
    };

    const mockMyReviews = {
      data: [
        {
          ...mockReview,
          product: {
            id: 'prod-1',
            name: 'Lavender Spray',
            slug: 'lavender-spray',
            images: ['img1.jpg'],
          },
        },
      ],
      total: 6,
      page: 2,
      limit: 5,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    };

    it('should delegate to reviewsService.getMyReviews with authenticated userId and pagination query', async () => {
      mockReviewsService.getMyReviews.mockResolvedValue(mockMyReviews);

      const result = await controller.getMyReviews('user-1', paginationDto);

      expect(result).toEqual(mockMyReviews);
      expect(mockReviewsService.getMyReviews).toHaveBeenCalledWith(
        'user-1',
        paginationDto,
      );
    });

    it('should delegate with empty paginationDto and return user reviews', async () => {
      const emptyResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockReviewsService.getMyReviews.mockResolvedValue(emptyResult);

      const result = await controller.getMyReviews('user-1', {});

      expect(result).toEqual(emptyResult);
      expect(mockReviewsService.getMyReviews).toHaveBeenCalledWith(
        'user-1',
        {},
      );
    });

    it('should propagate errors from reviewsService.getMyReviews', async () => {
      const error = new Error('Failed to retrieve user reviews');
      mockReviewsService.getMyReviews.mockRejectedValue(error);

      await expect(
        controller.getMyReviews('user-1', paginationDto),
      ).rejects.toThrow(error);
      expect(mockReviewsService.getMyReviews).toHaveBeenCalledWith(
        'user-1',
        paginationDto,
      );
    });
  });

  describe('PATCH /reviews/:reviewId (updateReview)', () => {
    const updateReviewDto: UpdateReviewDto = {
      rating: 4,
      content: 'Updated review content - still very satisfied.',
    };

    it('should delegate to reviewsService.updateReview with userId, reviewId param, and body DTO', async () => {
      const updatedReview = {
        ...mockReview,
        rating: 4,
        content: 'Updated review content - still very satisfied.',
        updatedAt: new Date('2026-01-12T00:00:00.000Z'),
      };
      mockReviewsService.updateReview.mockResolvedValue(updatedReview);

      const result = await controller.updateReview(
        'user-1',
        'rev-1',
        updateReviewDto,
      );

      expect(result).toEqual(updatedReview);
      expect(mockReviewsService.updateReview).toHaveBeenCalledWith(
        'user-1',
        'rev-1',
        updateReviewDto,
      );
    });

    it('should propagate NotFoundException when review does not exist', async () => {
      const error = new NotFoundException('Review not found');
      mockReviewsService.updateReview.mockRejectedValue(error);

      await expect(
        controller.updateReview('user-1', 'rev-999', updateReviewDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockReviewsService.updateReview).toHaveBeenCalledWith(
        'user-1',
        'rev-999',
        updateReviewDto,
      );
    });

    it('should propagate ForbiddenException when user does not own the review', async () => {
      const error = new ForbiddenException('Unauthorized');
      mockReviewsService.updateReview.mockRejectedValue(error);

      await expect(
        controller.updateReview('user-2', 'rev-1', updateReviewDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockReviewsService.updateReview).toHaveBeenCalledWith(
        'user-2',
        'rev-1',
        updateReviewDto,
      );
    });
  });

  describe('DELETE /reviews/:reviewId (deleteReview)', () => {
    const deleteResult = { message: 'Review deleted successfully' };

    it('should delegate to reviewsService.deleteReview with authenticated userId and reviewId param', async () => {
      mockReviewsService.deleteReview.mockResolvedValue(deleteResult);

      const result = await controller.deleteReview('user-1', 'rev-1');

      expect(result).toEqual(deleteResult);
      expect(mockReviewsService.deleteReview).toHaveBeenCalledWith(
        'user-1',
        'rev-1',
      );
    });

    it('should propagate NotFoundException when review does not exist', async () => {
      const error = new NotFoundException('Review not found');
      mockReviewsService.deleteReview.mockRejectedValue(error);

      await expect(controller.deleteReview('user-1', 'rev-999')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockReviewsService.deleteReview).toHaveBeenCalledWith(
        'user-1',
        'rev-999',
      );
    });

    it('should propagate ForbiddenException when user does not own the review', async () => {
      const error = new ForbiddenException('Unauthorized');
      mockReviewsService.deleteReview.mockRejectedValue(error);

      await expect(controller.deleteReview('user-2', 'rev-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockReviewsService.deleteReview).toHaveBeenCalledWith(
        'user-2',
        'rev-1',
      );
    });
  });

  describe('DELETE /reviews/admin/:reviewId (deleteReviewAsAdmin)', () => {
    const adminDeleteResult = { message: 'Review deleted successfully' };

    it('should delegate to reviewsService.deleteReviewAsAdmin with reviewId param', async () => {
      mockReviewsService.deleteReviewAsAdmin.mockResolvedValue(
        adminDeleteResult,
      );

      const result = await controller.deleteReviewAsAdmin('rev-1');

      expect(result).toEqual(adminDeleteResult);
      expect(mockReviewsService.deleteReviewAsAdmin).toHaveBeenCalledWith(
        'rev-1',
      );
    });

    it('should propagate NotFoundException when review does not exist', async () => {
      const error = new NotFoundException('Review not found');
      mockReviewsService.deleteReviewAsAdmin.mockRejectedValue(error);

      await expect(
        controller.deleteReviewAsAdmin('rev-999'),
      ).rejects.toThrow(NotFoundException);
      expect(mockReviewsService.deleteReviewAsAdmin).toHaveBeenCalledWith(
        'rev-999',
      );
    });
  });
});
