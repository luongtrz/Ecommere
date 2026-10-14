import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { ReviewFilterDto } from './dtos/review-filter.dto';
import { AdminReviewFilterDto } from './dtos/admin-review-filter.dto';
import { ReviewEntity } from './entities/review.entity';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reviews')
@Roles(Role.ADMIN)
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

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

  @Get('admin')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Danh sách đánh giá (admin)' })
  @ApiResponse({ status: 200 })
  async getAllReviewsForAdmin(@Query() filter: AdminReviewFilterDto) {
    return this.reviewsService.getAllReviewsForAdmin(filter);
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
