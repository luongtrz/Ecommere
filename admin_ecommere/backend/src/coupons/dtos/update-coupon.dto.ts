import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCouponDto } from './create-coupon.dto';

export class UpdateCouponDto extends PartialType(OmitType(CreateCouponDto, ['code'] as const)) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
