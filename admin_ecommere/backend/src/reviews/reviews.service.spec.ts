import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { ReviewFilterDto } from './dtos/review-filter.dto';
import { AdminReviewFilterDto } from './dtos/admin-review-filter.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ReviewsService);
  });

  describe('Direct instantiation', () => {
    it('creates an instance of ReviewsService directly with PrismaService', () => {
      const directInstance = new ReviewsService(mockPrismaService as any);
      expect(directInstance).toBeDefined();
      expect(directInstance).toBeInstanceOf(ReviewsService);
    });
  });

  describe('createReview', () => {
    const userId = 'user-1';
    const createReviewDto: CreateReviewDto = {
      productId: 'product-1',
      rating: 5,
      content: 'Great product, high quality!',
    };

    const mockProduct = {
      id: 'product-1',
      name: 'Test Product',
      slug: 'test-product',
    };

    const mockDeliveredOrder = {
      id: 'order-1',
      userId,
      status: OrderStatus.DELIVERED,
      items: [
        {
          id: 'item-1',
          variant: {
            productId: 'product-1',
          },
        },
      ],
    };

    const mockCreatedReview = {
      id: 'review-1',
      userId,
      productId: 'product-1',
      rating: 5,
      content: 'Great product, high quality!',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      user: {
        id: userId,
        name: 'Nguyen Van A',
        email: 'user1@example.com',
      },
    };

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow('Product not found');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
      expect(mockPrismaService.order.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has not purchased the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow('You can only review products you have purchased');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          status: OrderStatus.DELIVERED,
          items: {
            some: {
              variant: {
                productId: 'product-1',
              },
            },
          },
        },
      });
      expect(mockPrismaService.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has already reviewed this product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.order.findFirst.mockResolvedValue(mockDeliveredOrder);
      mockPrismaService.review.findFirst.mockResolvedValue({
        id: 'existing-review',
        userId,
        productId: 'product-1',
      });

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow('You have already reviewed this product');

      expect(mockPrismaService.review.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          productId: 'product-1',
        },
      });
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should create and return the review when all checks pass', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.order.findFirst.mockResolvedValue(mockDeliveredOrder);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(mockCreatedReview);

      const result = await service.createReview(userId, createReviewDto);

      expect(result).toEqual(mockCreatedReview);
      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: {
          userId,
          productId: 'product-1',
          rating: 5,
          content: 'Great product, high quality!',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw BadRequestException when review creation triggers P2002 unique constraint violation', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `reviews_userId_productId_key`',
        { code: 'P2002', clientVersion: '5.8.0' },
      );

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.order.findFirst.mockResolvedValue(mockDeliveredOrder);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockRejectedValue(p2002Error);

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow('You have already reviewed this product');
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002', async () => {
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.8.0' },
      );

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.order.findFirst.mockResolvedValue(mockDeliveredOrder);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockRejectedValue(p2025Error);

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(p2025Error);
    });

    it('should rethrow generic non-Prisma error', async () => {
      const unexpectedError = new Error('Database connection failed');

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.order.findFirst.mockResolvedValue(mockDeliveredOrder);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockRejectedValue(unexpectedError);

      await expect(
        service.createReview(userId, createReviewDto),
      ).rejects.toThrow(unexpectedError);
    });
  });

  describe('getProductReviews', () => {
    const productId = 'product-1';

    const mockReviews = [
      {
        id: 'rev-1',
        productId,
        rating: 5,
        content: 'Loved it',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        user: { id: 'user-1', name: 'User 1' },
      },
      {
        id: 'rev-2',
        productId,
        rating: 4,
        content: 'Pretty good',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        user: { id: 'user-2', name: 'User 2' },
      },
    ];

    it('should return paginated product reviews with default pagination when filterDto is empty', async () => {
      const filterDto: ReviewFilterDto = {};
      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.review.count.mockResolvedValue(25);

      const result = await service.getProductReviews(productId, filterDto);

      expect(result).toEqual({
        data: mockReviews,
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { productId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(mockPrismaService.review.count).toHaveBeenCalledWith({
        where: { productId },
      });
    });

    it('should apply rating filter and handle page with hasNextPage=false, hasPreviousPage=true', async () => {
      const filterDto: ReviewFilterDto = {
        page: 2,
        limit: 5,
        rating: 5,
      };
      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.review.count.mockResolvedValue(10);

      const result = await service.getProductReviews(productId, filterDto);

      expect(result).toEqual({
        data: mockReviews,
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { productId, rating: 5 },
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(mockPrismaService.review.count).toHaveBeenCalledWith({
        where: { productId, rating: 5 },
      });
    });

    it('should return 0 totalPages and false flags when total is 0', async () => {
      const filterDto: ReviewFilterDto = { page: 1, limit: 10 };
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);

      const result = await service.getProductReviews(productId, filterDto);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should rethrow error when database query fails', async () => {
      const dbError = new Error('Query failed');
      mockPrismaService.review.findMany.mockRejectedValue(dbError);
      mockPrismaService.review.count.mockResolvedValue(0);

      await expect(service.getProductReviews(productId, {})).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('getMyReviews', () => {
    const userId = 'user-1';

    const mockMyReviews = [
      {
        id: 'rev-1',
        userId,
        productId: 'product-1',
        rating: 5,
        content: 'Great product',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        product: {
          id: 'product-1',
          name: 'Product 1',
          slug: 'product-1',
          images: ['img1.jpg'],
        },
      },
    ];

    it('should return paginated user reviews with default pagination parameters', async () => {
      const paginationDto: PaginationDto = {};
      mockPrismaService.review.findMany.mockResolvedValue(mockMyReviews);
      mockPrismaService.review.count.mockResolvedValue(15);

      const result = await service.getMyReviews(userId, paginationDto);

      expect(result).toEqual({
        data: mockMyReviews,
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      });
      expect(mockPrismaService.review.count).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return paginated user reviews with custom page and limit on the last page', async () => {
      const paginationDto: PaginationDto = { page: 3, limit: 5 };
      mockPrismaService.review.findMany.mockResolvedValue(mockMyReviews);
      mockPrismaService.review.count.mockResolvedValue(12);

      const result = await service.getMyReviews(userId, paginationDto);

      expect(result).toEqual({
        data: mockMyReviews,
        total: 12,
        page: 3,
        limit: 5,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 10,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      });
    });

    it('should rethrow error when database query fails', async () => {
      const dbError = new Error('Database error');
      mockPrismaService.review.findMany.mockRejectedValue(dbError);
      mockPrismaService.review.count.mockResolvedValue(0);

      await expect(service.getMyReviews(userId, {})).rejects.toThrow(dbError);
    });
  });

  describe('updateReview', () => {
    const userId = 'user-1';
    const reviewId = 'rev-1';
    const updateReviewDto: UpdateReviewDto = {
      rating: 4,
      content: 'Updated content',
    };

    const mockExistingReview = {
      id: reviewId,
      userId,
      productId: 'prod-1',
      rating: 5,
      content: 'Initial content',
    };

    const mockUpdatedReview = {
      id: reviewId,
      userId,
      productId: 'prod-1',
      rating: 4,
      content: 'Updated content',
      user: {
        id: userId,
        name: 'Nguyen Van A',
        email: 'user1@example.com',
      },
      product: {
        id: 'prod-1',
        name: 'Product 1',
        slug: 'product-1',
      },
    };

    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReview(userId, reviewId, updateReviewDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateReview(userId, reviewId, updateReviewDto),
      ).rejects.toThrow('Review not found');

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
      expect(mockPrismaService.review.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when review does not belong to the user', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        ...mockExistingReview,
        userId: 'other-user',
      });

      await expect(
        service.updateReview(userId, reviewId, updateReviewDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateReview(userId, reviewId, updateReviewDto),
      ).rejects.toThrow('Unauthorized');

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
      expect(mockPrismaService.review.update).not.toHaveBeenCalled();
    });

    it('should update and return review when review exists and belongs to user', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      mockPrismaService.review.update.mockResolvedValue(mockUpdatedReview);

      const result = await service.updateReview(
        userId,
        reviewId,
        updateReviewDto,
      );

      expect(result).toEqual(mockUpdatedReview);
      expect(mockPrismaService.review.update).toHaveBeenCalledWith({
        where: { id: reviewId },
        data: updateReviewDto,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    it('should rethrow error when update query fails', async () => {
      const dbError = new Error('Update failed');
      mockPrismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      mockPrismaService.review.update.mockRejectedValue(dbError);

      await expect(
        service.updateReview(userId, reviewId, updateReviewDto),
      ).rejects.toThrow(dbError);
    });
  });

  describe('deleteReview', () => {
    const userId = 'user-1';
    const reviewId = 'rev-1';

    const mockExistingReview = {
      id: reviewId,
      userId,
      productId: 'prod-1',
    };

    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        'Review not found',
      );

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
      expect(mockPrismaService.review.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when review does not belong to user', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        ...mockExistingReview,
        userId: 'different-user',
      });

      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        'Unauthorized',
      );

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
      expect(mockPrismaService.review.delete).not.toHaveBeenCalled();
    });

    it('should delete review and return success message when review belongs to user', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      mockPrismaService.review.delete.mockResolvedValue(mockExistingReview);

      const result = await service.deleteReview(userId, reviewId);

      expect(result).toEqual({ message: 'Review deleted successfully' });
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });

    it('should rethrow error when delete query fails', async () => {
      const dbError = new Error('Delete failed');
      mockPrismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      mockPrismaService.review.delete.mockRejectedValue(dbError);

      await expect(service.deleteReview(userId, reviewId)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('getAllReviewsForAdmin', () => {
    const mockAdminReviews = [
      {
        id: 'rev-1',
        productId: 'prod-1',
        userId: 'user-1',
        rating: 5,
        content: 'Review 1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        user: { id: 'user-1', name: 'User 1', email: 'user1@example.com' },
        product: { id: 'prod-1', name: 'Prod 1', slug: 'prod-1' },
      },
    ];

    it('should use default values and empty where clause when filter is undefined', async () => {
      mockPrismaService.review.findMany.mockResolvedValue(mockAdminReviews);
      mockPrismaService.review.count.mockResolvedValue(1);

      const result = await service.getAllReviewsForAdmin(undefined as any);

      expect(result).toEqual({
        data: mockAdminReviews,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
      expect(mockPrismaService.review.count).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should filter by productId when productId is provided', async () => {
      const filter: AdminReviewFilterDto = {
        productId: 'prod-1',
      };
      mockPrismaService.review.findMany.mockResolvedValue(mockAdminReviews);
      mockPrismaService.review.count.mockResolvedValue(1);

      const result = await service.getAllReviewsForAdmin(filter);

      expect(result.data).toEqual(mockAdminReviews);
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'prod-1' },
        }),
      );
      expect(mockPrismaService.review.count).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
      });
    });

    it('should filter by rating when rating is provided (including rating=0)', async () => {
      const filter: AdminReviewFilterDto = {
        rating: 0,
      };
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);

      const result = await service.getAllReviewsForAdmin(filter);

      expect(result.data).toEqual([]);
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rating: 0 },
        }),
      );
      expect(mockPrismaService.review.count).toHaveBeenCalledWith({
        where: { rating: 0 },
      });
    });

    it('should filter by both productId and rating with custom pagination flags (hasNextPage=true, hasPreviousPage=true)', async () => {
      const filter: AdminReviewFilterDto = {
        productId: 'prod-1',
        rating: 5,
        page: 2,
        limit: 10,
      };
      mockPrismaService.review.findMany.mockResolvedValue(mockAdminReviews);
      mockPrismaService.review.count.mockResolvedValue(30);

      const result = await service.getAllReviewsForAdmin(filter);

      expect(result).toEqual({
        data: mockAdminReviews,
        total: 30,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1', rating: 5 },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });

    it('should set hasNextPage=false on the last page', async () => {
      const filter: AdminReviewFilterDto = {
        page: 3,
        limit: 10,
      };
      mockPrismaService.review.findMany.mockResolvedValue(mockAdminReviews);
      mockPrismaService.review.count.mockResolvedValue(25);

      const result = await service.getAllReviewsForAdmin(filter);

      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should rethrow error when database query fails', async () => {
      const dbError = new Error('Database error');
      mockPrismaService.review.findMany.mockRejectedValue(dbError);
      mockPrismaService.review.count.mockResolvedValue(0);

      await expect(
        service.getAllReviewsForAdmin({ page: 1, limit: 20 }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('deleteReviewAsAdmin', () => {
    const reviewId = 'rev-admin-1';

    const mockReview = {
      id: reviewId,
      productId: 'prod-1',
      userId: 'user-1',
    };

    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.deleteReviewAsAdmin(reviewId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteReviewAsAdmin(reviewId)).rejects.toThrow(
        'Review not found',
      );

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
      expect(mockPrismaService.review.delete).not.toHaveBeenCalled();
    });

    it('should delete review and return success message when review exists', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.delete.mockResolvedValue(mockReview);

      const result = await service.deleteReviewAsAdmin(reviewId);

      expect(result).toEqual({ message: 'Review deleted successfully' });
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({
        where: { id: reviewId },
      });
    });

    it('should rethrow error when delete query fails', async () => {
      const dbError = new Error('Admin delete error');
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.delete.mockRejectedValue(dbError);

      await expect(service.deleteReviewAsAdmin(reviewId)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('getProductStats', () => {
    const productId = 'prod-stats-1';

    it('should compute review statistics and populate rating distribution when reviews exist', async () => {
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.666666666666667 },
        _count: { rating: 6 },
      });
      mockPrismaService.review.groupBy.mockResolvedValue([
        { rating: 5, _count: { rating: 4 } },
        { rating: 4, _count: { rating: 2 } },
      ]);

      const result = await service.getProductStats(productId);

      expect(result).toEqual({
        totalReviews: 6,
        averageRating: 4.67,
        ratingDistribution: {
          5: 4,
          4: 2,
          3: 0,
          2: 0,
          1: 0,
        },
      });
      expect(mockPrismaService.review.aggregate).toHaveBeenCalledWith({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      expect(mockPrismaService.review.groupBy).toHaveBeenCalledWith({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      });
    });

    it('should return 0 for averageRating when aggregate._avg.rating is null (no reviews)', async () => {
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrismaService.review.groupBy.mockResolvedValue([]);

      const result = await service.getProductStats(productId);

      expect(result).toEqual({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      });
    });

    it('should rethrow error when aggregate query fails', async () => {
      const dbError = new Error('Stats calculation error');
      mockPrismaService.review.aggregate.mockRejectedValue(dbError);
      mockPrismaService.review.groupBy.mockResolvedValue([]);

      await expect(service.getProductStats(productId)).rejects.toThrow(dbError);
    });
  });
});
