import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class SalesReportQueryDto {
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
    description: 'Nhóm theo ngày, tuần hoặc tháng',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'], {
    message: 'groupBy phải là day, week hoặc month',
  })
  groupBy?: 'day' | 'week' | 'month' = 'day';
}
