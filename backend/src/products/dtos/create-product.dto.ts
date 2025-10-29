import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsInt, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({ example: 'Lavender' })
  @IsString()
  scent: string;

  @ApiProperty({ example: 250 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  volumeMl: number;

  @ApiProperty({ example: 250000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ required: false, example: 200000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salePrice?: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barcode?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Xịt Phòng Lavender Premium' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Xịt phòng hương Lavender cao cấp từ Thái Lan...' })
  @IsString()
  description: string;

  @ApiProperty({ required: false, example: 'Thai Aroma' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: ['https://example.com/image.jpg'] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ example: 'category-id' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 120000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  basePrice: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ type: [CreateVariantDto] })
  @IsArray()
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
