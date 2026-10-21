import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsDate,
  IsNotEmpty,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER2025' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'code may contain only letters, digits, "-" and "_"',
  })
  code: string;

  @ApiProperty({ enum: CouponType, example: CouponType.PERCENT })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({
    example: 10,
    description: 'Percentage (0-100) or fixed amount in VND',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  value: number;

  @ApiProperty({
    required: false,
    example: 100000,
    description: 'Minimum order amount in VND',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minOrder?: number;

  @ApiProperty({
    required: false,
    example: 50000,
    description: 'Maximum discount amount in VND',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsesPerUser?: number;
}
