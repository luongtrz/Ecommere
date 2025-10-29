import { ApiProperty } from '@nestjs/swagger';
import { CouponType } from '@prisma/client';

export class CouponEntity {
  @ApiProperty()
  code: string;

  @ApiProperty({ enum: CouponType })
  type: CouponType;

  @ApiProperty()
  value: number;

  @ApiProperty({ required: false })
  minOrder?: number;

  @ApiProperty({ required: false })
  maxDiscount?: number;

  @ApiProperty({ required: false })
  validFrom?: Date;

  @ApiProperty({ required: false })
  validUntil?: Date;

  @ApiProperty({ required: false })
  maxUses?: number;

  @ApiProperty({ required: false })
  maxUsesPerUser?: number;

  @ApiProperty()
  usedCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<CouponEntity>) {
    Object.assign(this, partial);
  }
}

export class CouponValidationEntity {
  @ApiProperty()
  valid: boolean;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false, type: CouponEntity })
  coupon?: CouponEntity;

  @ApiProperty({ required: false })
  discountAmount?: number;

  constructor(partial: Partial<CouponValidationEntity>) {
    Object.assign(this, partial);
  }
}
