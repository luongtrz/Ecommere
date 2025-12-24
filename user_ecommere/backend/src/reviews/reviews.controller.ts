import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { UpdateReviewDto } from './dtos/update-review.dto';
import { ReviewFilterDto } from './dtos/review-filter.dto';
import { ReviewEntity } from './entities/review.entity';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create product review (only for purchased products)' })
  @ApiResponse({ status: 201, type: ReviewEntity })
  async createReview(@CurrentUser('id') userId: string, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.createReview(userId, createReviewDto);
  }

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'Get product reviews' })
  @ApiResponse({ status: 200, type: [ReviewEntity] })
  async getProductReviews(@Param('productId') productId: string, @Query() filterDto: ReviewFilterDto) {
    return this.reviewsService.getProductReviews(productId, filterDto);
  }

  @Public()
  @Get('product/:productId/stats')
  @ApiOperation({ summary: 'Get product review statistics' })
  @ApiResponse({ status: 200 })
  async getProductStats(@Param('productId') productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  @Get('my')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my reviews' })
  @ApiResponse({ status: 200, type: [ReviewEntity] })
  async getMyReviews(@CurrentUser('id') userId: string, @Query() paginationDto: PaginationDto) {
    return this.reviewsService.getMyReviews(userId, paginationDto);
  }

  @Patch(':reviewId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update my review' })
  @ApiResponse({ status: 200, type: ReviewEntity })
  async updateReview(
    @CurrentUser('id') userId: string,
    @Param('reviewId') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(userId, reviewId, updateReviewDto);
  }

  @Delete(':reviewId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete my review' })
  @ApiResponse({ status: 200 })
  async deleteReview(@CurrentUser('id') userId: string, @Param('reviewId') reviewId: string) {
    return this.reviewsService.deleteReview(userId, reviewId);
  }

  @Delete('admin/:reviewId')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete any review (Admin only)' })
  @ApiResponse({ status: 200 })
  async deleteReviewAsAdmin(@Param('reviewId') reviewId: string) {
    return this.reviewsService.deleteReviewAsAdmin(reviewId);
  }
}
