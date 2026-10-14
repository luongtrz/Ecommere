import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@/common/dtos/pagination.dto';

export class CustomerQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên, số điện thoại hoặc email',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
