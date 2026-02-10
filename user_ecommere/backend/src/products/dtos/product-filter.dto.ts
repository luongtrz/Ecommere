import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dtos/pagination.dto';

export enum ProductSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  BEST_SELLING = 'best_selling',
}

export class ProductFilterDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiProperty({ required: false, enum: ProductSortBy, default: ProductSortBy.NEWEST })
  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy = ProductSortBy.NEWEST;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ required: false, description: 'Filter by brand (comma-separated for multiple)' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false, description: 'Filter by scent (comma-separated for multiple)' })
  @IsOptional()
  @IsString()
  scent?: string;

  @ApiProperty({ required: false, description: 'Filter by volume in ml (comma-separated for multiple)' })
  @IsOptional()
  @IsString()
  volumeMl?: string;
}
