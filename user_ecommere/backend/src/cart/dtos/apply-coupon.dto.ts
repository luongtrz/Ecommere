import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({ required: false, example: 'SUMMER2025' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
