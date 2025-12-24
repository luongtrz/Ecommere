import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ example: 'SUMMER2025' })
  @IsString()
  code: string;
}
