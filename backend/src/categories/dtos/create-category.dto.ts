import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Xịt Phòng' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'parent-category-id' })
  @IsString()
  parentId?: string;
}
