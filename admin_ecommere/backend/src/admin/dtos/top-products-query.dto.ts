import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class TopProductsQueryDto {
  @ApiProperty({
    description: 'Từ ngày (YYYY-MM-DD)',
    example: '2026-01-01',
    required: true,
  })
  @IsNotEmpty({ message: 'from không được để trống' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from phải có định dạng YYYY-MM-DD',
  })
  from: string;

  @ApiProperty({
    description: 'Đến ngày (YYYY-MM-DD)',
    example: '2026-01-31',
    required: true,
  })
  @IsNotEmpty({ message: 'to không được để trống' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to phải có định dạng YYYY-MM-DD',
  })
  to: string;

  @ApiPropertyOptional({
    description: 'Số lượng sản phẩm lấy (1-50)',
    default: 5,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(50, { message: 'limit tối đa là 50' })
  limit?: number = 5;
}
