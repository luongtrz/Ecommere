import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class LowStockQueryDto {
  @ApiPropertyOptional({
    description: 'Stock threshold to consider low stock',
    default: 10,
    minimum: 0,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  threshold?: number = 10;

  @ApiPropertyOptional({
    description: 'Maximum number of items to return',
    default: 100,
    minimum: 1,
    maximum: 500,
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}
