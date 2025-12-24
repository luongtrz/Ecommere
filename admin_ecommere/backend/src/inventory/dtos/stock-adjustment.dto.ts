import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StockMovementType } from '@prisma/client';

export class StockAdjustmentDto {
  @ApiProperty({ example: 'variant-id' })
  @IsString()
  variantId: string;

  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false, example: 'Restocked from supplier' })
  @IsOptional()
  @IsString()
  notes?: string;
}
