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
      findFirst: jest.fn(),
      findUnique: jest.fn(),
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
  });

  describe('createReview', () => {
    const createReviewDto: CreateReviewDto = {
      productId: 'prod-1',
      rating: 5,
      content: 'Great product! Smells amazing and lasts long.',
    };

    const mockCreatedReview = {
      id: 'review-1',
      userId: 'user-1',
      productId: 'prod-1',
      rating: 5,
      content: 'Great product! Smells amazing and lasts long.',
      createdAt: new Date('2026-01-10T00:00:00.000Z'),
      updatedAt: new Date('2026-01-10T00:00:00.000Z'),
      user: {
        id: 'user-1',
        name: 'Nguyen Van A',
        email: 'user1@example.com',
      },
    };

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow('Product not found');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(mockPrismaService.order.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has not purchased the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow('You can only review products you have purchased');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: OrderStatus.DELIVERED,
          items: {
            some: {
              variant: {
                productId: 'prod-1',
              },
            },
          },
        },
      });
      expect(mockPrismaService.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has already reviewed the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'order-1' });
      mockPrismaService.review.findFirst.mockResolvedValue({
        id: 'review-existing',
        userId: 'user-1',
        productId: 'prod-1',
      });

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow('You have already reviewed this product');

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: OrderStatus.DELIVERED,
          items: {
            some: {
              variant: {
                productId: 'prod-1',
              },
            },
          },
        },
      });
      expect(mockPrismaService.review.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          productId: 'prod-1',
        },
      });
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should create and return the review when product exists, user purchased it, and has not reviewed yet', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'order-1' });
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(mockCreatedReview);

      const result = await service.createReview('user-1', createReviewDto);

      expect(result).toEqual(mockCreatedReview);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: OrderStatus.DELIVERED,
          items: {
            some: {
              variant: {
                productId: 'prod-1',
              },
            },
          },
        },
      });
      expect(mockPrismaService.review.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          productId: 'prod-1',
        },
      });
      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          productId: 'prod-1',
          rating: 5,
          content: 'Great product! Smells amazing and lasts long.',
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

    it('should throw BadRequestException when Prisma throws P2002 unique constraint error on review creation', async () => {
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `reviews_user_product_key`',
        { code: 'P2002', clientVersion: '5.8.0' },
      );

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'order-1' });
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockRejectedValue(p2002Error);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow('You have already reviewed this product');

      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          productId: 'prod-1',
          rating: 5,
          content: 'Great product! Smells amazing and lasts long.',
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

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002', async () => {
      const p2003Error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.8.0' },
      );

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'order-1' });
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockRejectedValue(p2003Error);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(p2003Error);
    });

    it('should rethrow unexpected non-Prisma errors during review creation', async () => {
      const dbError = new Error('Database connection failed');

      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'order-1' });
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockRejectedValue(dbError);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(dbError);
    });

    it('should rethrow error when product lookup fails (dependency failure)', async () => {
      const dbError = new Error('Product DB read failed');
      mockPrismaService.product.findUnique.mockRejectedValue(dbError);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(dbError);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(mockPrismaService.order.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should rethrow error when order lookup fails (dependency failure)', async () => {
      const dbError = new Error('Order DB read failed');
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockRejectedValue(dbError);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(dbError);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: OrderStatus.DELIVERED,
          items: {
            some: {
              variant: {
                productId: 'prod-1',
              },
            },
          },
        },
      });
      expect(mockPrismaService.review.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });

    it('should rethrow error when review existence lookup fails (dependency failure)', async () => {
      const dbError = new Error('Review DB read failed');
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'order-1' });
      mockPrismaService.review.findFirst.mockRejectedValue(dbError);

      await expect(
        service.createReview('user-1', createReviewDto),
      ).rejects.toThrow(dbError);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(mockPrismaService.order.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          status: OrderStatus.DELIVERED,
          items: {
            some: {
              variant: {
                productId: 'prod-1',
              },
            },
          },
        },
      });
      expect(mockPrismaService.review.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          productId: 'prod-1',
        },
      });
      expect(mockPrismaService.review.create).not.toHaveBeenCalled();
    });
  });

  describe('getProductReviews', () => {
    const mockReviews = [
      {
        id: 'review-1',
        productId: 'prod-1',
        rating: 5,
        content: 'Great!',
        createdAt: new Date('2026-01-10T00:00:00.000Z'),
        user: { id: 'user-1', name: 'User 1' },
      },
      {
        id: 'review-2',
        productId: 'prod-1',
        rating: 4,
        content: 'Good',
        createdAt: new Date('2026-01-09T00:00:00.000Z'),
        user: { id: 'user-2', name: 'User 2' },
      },
    ];

    it('should return paginated product reviews with default pagination and no rating filter', async () => {
      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.review.count.mockResolvedValue(2);

      const result = await service.getProductReviews('prod-1', {});

      expect(result).toEqual({
        data: mockReviews,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
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
        where: { productId: 'prod-1' },
      });
    });

    it('should filter reviews by rating when rating is provided', async () => {
      const filterDto: ReviewFilterDto = { rating: 5, page: 1, limit: 10 };

      mockPrismaService.review.findMany.mockResolvedValue([mockReviews[0]]);
      mockPrismaService.review.count.mockResolvedValue(1);

      const result = await service.getProductReviews('prod-1', filterDto);

      expect(result.data).toEqual([mockReviews[0]]);
      expect(result.total).toBe(1);
      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1', rating: 5 },
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
        where: { productId: 'prod-1', rating: 5 },
      });
    });

    it('should calculate hasNextPage=true and hasPreviousPage=true for middle pages', async () => {
      const filterDto: ReviewFilterDto = { page: 2, limit: 5 };

      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(15);

      const result = await service.getProductReviews('prod-1', filterDto);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);

      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
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
        where: { productId: 'prod-1' },
      });
    });

    it('should calculate hasNextPage=false and hasPreviousPage=true on the last page', async () => {
      const filterDto: ReviewFilterDto = { page: 3, limit: 5 };

      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(15);

      const result = await service.getProductReviews('prod-1', filterDto);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle zero reviews correctly', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);

      const result = await service.getProductReviews('prod-1', {});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should rethrow error when review findMany fails (dependency failure)', async () => {
      const dbError = new Error('Database read error');
      mockPrismaService.review.findMany.mockRejectedValue(dbError);
      mockPrismaService.review.count.mockResolvedValue(0);

      await expect(service.getProductReviews('prod-1', {})).rejects.toThrow(
        dbError,
      );
    });

    it('should rethrow error when review count fails (dependency failure)', async () => {
      const dbError = new Error('Count query error');
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockRejectedValue(dbError);

      await expect(service.getProductReviews('prod-1', {})).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('getMyReviews', () => {
    const mockUserReviews = [
      {
        id: 'review-1',
        userId: 'user-1',
        productId: 'prod-1',
        rating: 5,
        content: 'Love it',
        createdAt: new Date('2026-01-10T00:00:00.000Z'),
        product: {
          id: 'prod-1',
          name: 'Lavender Spray',
          slug: 'lavender-spray',
          images: ['img1.jpg'],
        },
      },
    ];

    it('should return user reviews with default pagination parameters', async () => {
      mockPrismaService.review.findMany.mockResolvedValue(mockUserReviews);
      mockPrismaService.review.count.mockResolvedValue(1);

      const result = await service.getMyReviews('user-1', {});

      expect(result).toEqual({
        data: mockUserReviews,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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
        where: { userId: 'user-1' },
      });
    });

    it('should return user reviews with custom pagination parameters', async () => {
      const paginationDto: PaginationDto = { page: 2, limit: 5 };

      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(12);

      const result = await service.getMyReviews('user-1', paginationDto);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(12);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);

      expect(mockPrismaService.review.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        skip: 5,
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

    it('should calculate hasNextPage=false on the last page of user reviews', async () => {
      const paginationDto: PaginationDto = { page: 3, limit: 5 };

      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(12);

      const result = await service.getMyReviews('user-1', paginationDto);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should handle zero user reviews correctly', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockResolvedValue(0);

      const result = await service.getMyReviews('user-1', {});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should rethrow error when findMany fails for user reviews (dependency failure)', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.review.findMany.mockRejectedValue(dbError);
      mockPrismaService.review.count.mockResolvedValue(0);

      await expect(service.getMyReviews('user-1', {})).rejects.toThrow(dbError);
    });

    it('should rethrow error when count fails for user reviews (dependency failure)', async () => {
      const dbError = new Error('Count query failed');
      mockPrismaService.review.findMany.mockResolvedValue([]);
      mockPrismaService.review.count.mockRejectedValue(dbError);

      await expect(service.getMyReviews('user-1', {})).rejects.toThrow(dbError);
    });
  });

  describe('updateReview', () => {
    const updateReviewDto: UpdateReviewDto = {
      rating: 4,
      content: 'Updated review content',
    };

    const mockExistingReview = {
      id: 'review-1',
      userId: 'user-1',
      productId: 'prod-1',
      rating: 5,
      content: 'Original content',
    };

    const mockUpdatedReview = {
      id: 'review-1',
      userId: 'user-1',
      productId: 'prod-1',
      rating: 4,
      content: 'Updated review content',
      createdAt: new Date('2026-01-10T00:00:00.000Z'),
      updatedAt: new Date('2026-01-12T00:00:00.000Z'),
      user: {
        id: 'user-1',
        name: 'Nguyen Van A',
        email: 'user1@example.com',
      },
      product: {
        id: 'prod-1',
        name: 'Lavender Spray',
        slug: 'lavender-spray',
      },
    };

    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReview('user-1', 'review-999', updateReviewDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateReview('user-1', 'review-999', updateReviewDto),
      ).rejects.toThrow('Review not found');

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-999' },
      });
      expect(mockPrismaService.review.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not the owner of the review', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'other-user',
      });

      await expect(
        service.updateReview('user-1', 'review-1', updateReviewDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateReview('user-1', 'review-1', updateReviewDto),
      ).rejects.toThrow('Unauthorized');

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(mockPrismaService.review.update).not.toHaveBeenCalled();
    });

    it('should update and return the review when user is the owner', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      mockPrismaService.review.update.mockResolvedValue(mockUpdatedReview);

      const result = await service.updateReview(
        'user-1',
        'review-1',
        updateReviewDto,
      );

      expect(result).toEqual(mockUpdatedReview);
      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(mockPrismaService.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
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

    it('should rethrow error when review findUnique fails during update (dependency failure)', async () => {
      const dbError = new Error('Database read failed');
      mockPrismaService.review.findUnique.mockRejectedValue(dbError);

      await expect(
        service.updateReview('user-1', 'review-1', updateReviewDto),
      ).rejects.toThrow(dbError);
    });

    it('should rethrow error when review update fails (dependency failure)', async () => {
      const dbError = new Error('Database update failed');
      mockPrismaService.review.findUnique.mockResolvedValue(mockExistingReview);
      mockPrismaService.review.update.mockRejectedValue(dbError);

      await expect(
        service.updateReview('user-1', 'review-1', updateReviewDto),
      ).rejects.toThrow(dbError);
    });
  });

  describe('deleteReview', () => {
    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteReview('user-1', 'review-999'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteReview('user-1', 'review-999'),
      ).rejects.toThrow('Review not found');

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-999' },
      });
      expect(mockPrismaService.review.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not the owner of the review', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'other-user',
      });

      await expect(service.deleteReview('user-1', 'review-1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.deleteReview('user-1', 'review-1')).rejects.toThrow(
        'Unauthorized',
      );

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(mockPrismaService.review.delete).not.toHaveBeenCalled();
    });

    it('should delete the review and return success message when user is the owner', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'user-1',
      });
      mockPrismaService.review.delete.mockResolvedValue({ id: 'review-1' });

      const result = await service.deleteReview('user-1', 'review-1');

      expect(result).toEqual({ message: 'Review deleted successfully' });
      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
    });

    it('should rethrow error when findUnique fails during delete (dependency failure)', async () => {
      const dbError = new Error('Database read failed');
      mockPrismaService.review.findUnique.mockRejectedValue(dbError);

      await expect(service.deleteReview('user-1', 'review-1')).rejects.toThrow(
        dbError,
      );
    });

    it('should rethrow error when review delete fails (dependency failure)', async () => {
      const dbError = new Error('Database delete failed');
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'user-1',
      });
      mockPrismaService.review.delete.mockRejectedValue(dbError);

      await expect(service.deleteReview('user-1', 'review-1')).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('deleteReviewAsAdmin', () => {
    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(service.deleteReviewAsAdmin('review-999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteReviewAsAdmin('review-999')).rejects.toThrow(
        'Review not found',
      );

      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-999' },
      });
      expect(mockPrismaService.review.delete).not.toHaveBeenCalled();
    });

    it('should delete the review and return success message regardless of who owns it', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'any-user',
      });
      mockPrismaService.review.delete.mockResolvedValue({ id: 'review-1' });

      const result = await service.deleteReviewAsAdmin('review-1');

      expect(result).toEqual({ message: 'Review deleted successfully' });
      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(mockPrismaService.review.delete).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
    });

    it('should rethrow error when findUnique fails in deleteReviewAsAdmin (dependency failure)', async () => {
      const dbError = new Error('Database read failed');
      mockPrismaService.review.findUnique.mockRejectedValue(dbError);

      await expect(service.deleteReviewAsAdmin('review-1')).rejects.toThrow(
        dbError,
      );
    });

    it('should rethrow error when delete fails in deleteReviewAsAdmin (dependency failure)', async () => {
      const dbError = new Error('Database delete failed');
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'any-user',
      });
      mockPrismaService.review.delete.mockRejectedValue(dbError);

      await expect(service.deleteReviewAsAdmin('review-1')).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('getProductStats', () => {
    it('should calculate totalReviews, rounded averageRating, and ratingDistribution correctly', async () => {
      mockPrismaService.review.aggregate.mockResolvedValue({
        _count: { rating: 6 },
        _avg: { rating: 4.333333333 },
      });
      mockPrismaService.review.groupBy.mockResolvedValue([
        { rating: 5, _count: { rating: 3 } },
        { rating: 4, _count: { rating: 2 } },
        { rating: 3, _count: { rating: 1 } },
      ]);

      const result = await service.getProductStats('prod-1');

      expect(result).toEqual({
        totalReviews: 6,
        averageRating: 4.33,
        ratingDistribution: {
          5: 3,
          4: 2,
          3: 1,
          2: 0,
          1: 0,
        },
      });

      expect(mockPrismaService.review.aggregate).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        _avg: { rating: true },
        _count: { rating: true },
      });
      expect(mockPrismaService.review.groupBy).toHaveBeenCalledWith({
        by: ['rating'],
        where: { productId: 'prod-1' },
        _count: { rating: true },
      });
    });

    it('should return default stats with averageRating 0 and zero distribution when product has no reviews', async () => {
      mockPrismaService.review.aggregate.mockResolvedValue({
        _count: { rating: 0 },
        _avg: { rating: null },
      });
      mockPrismaService.review.groupBy.mockResolvedValue([]);

      const result = await service.getProductStats('prod-1');

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

      expect(mockPrismaService.review.aggregate).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        _avg: { rating: true },
        _count: { rating: true },
      });
      expect(mockPrismaService.review.groupBy).toHaveBeenCalledWith({
        by: ['rating'],
        where: { productId: 'prod-1' },
        _count: { rating: true },
      });
    });

    it('should handle integer average ratings properly', async () => {
      mockPrismaService.review.aggregate.mockResolvedValue({
        _count: { rating: 2 },
        _avg: { rating: 5 },
      });
      mockPrismaService.review.groupBy.mockResolvedValue([
        { rating: 5, _count: { rating: 2 } },
      ]);

      const result = await service.getProductStats('prod-1');

      expect(result).toEqual({
        totalReviews: 2,
        averageRating: 5,
        ratingDistribution: {
          5: 2,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      });
    });

    it('should rethrow error when aggregate query fails (dependency failure)', async () => {
      const dbError = new Error('Aggregate query failed');
      mockPrismaService.review.aggregate.mockRejectedValue(dbError);
      mockPrismaService.review.groupBy.mockResolvedValue([]);

      await expect(service.getProductStats('prod-1')).rejects.toThrow(dbError);
    });

    it('should rethrow error when groupBy query fails (dependency failure)', async () => {
      const dbError = new Error('GroupBy query failed');
      mockPrismaService.review.aggregate.mockResolvedValue({
        _count: { rating: 0 },
        _avg: { rating: null },
      });
      mockPrismaService.review.groupBy.mockRejectedValue(dbError);

      await expect(service.getProductStats('prod-1')).rejects.toThrow(dbError);
    });
  });
});
