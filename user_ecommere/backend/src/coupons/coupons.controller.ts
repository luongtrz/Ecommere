import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { ValidateCouponDto } from './dtos/validate-coupon.dto';
import { CouponEntity, CouponValidationEntity } from './entities/coupon.entity';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all coupons (Admin only)' })
  @ApiResponse({ status: 200, type: [CouponEntity] })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.couponsService.findAll(paginationDto);
  }

  @Get(':code')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get coupon by code (Admin only)' })
  @ApiResponse({ status: 200, type: CouponEntity })
  async findOne(@Param('code') code: string) {
    return this.couponsService.findOne(code);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create coupon (Admin only)' })
  @ApiResponse({ status: 201, type: CouponEntity })
  async create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Patch(':code')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update coupon (Admin only)' })
  @ApiResponse({ status: 200, type: CouponEntity })
  async update(@Param('code') code: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(code, updateCouponDto);
  }

  @Delete(':code')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete coupon (Admin only)' })
  @ApiResponse({ status: 200 })
  async remove(@Param('code') code: string) {
    return this.couponsService.remove(code);
  }

  @Post('validate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validate coupon code (Authenticated)' })
  @ApiResponse({ status: 200, type: CouponValidationEntity })
  async validateCoupon(
    @Body() validateCouponDto: ValidateCouponDto,
    @CurrentUser('id') userId: string,
    @Query('orderTotal') orderTotal?: string,
  ) {
    const total = orderTotal ? parseInt(orderTotal, 10) : 0;
    return this.couponsService.validateCoupon(validateCouponDto.code, userId, total);
  }
}
