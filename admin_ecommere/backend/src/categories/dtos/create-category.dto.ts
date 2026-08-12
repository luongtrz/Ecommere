import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Xịt Phòng' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'parent-category-id' })
  @IsOptional()
  @IsString()
  parentId?: string;
}
