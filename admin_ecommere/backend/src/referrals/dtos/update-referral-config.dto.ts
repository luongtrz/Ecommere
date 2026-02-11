import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CouponType } from '@prisma/client';

export class UpdateReferralConfigDto {
    @ApiProperty({ required: false, description: 'Kich hoat tinh nang referral' })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiProperty({ enum: CouponType, required: false, description: 'Loai coupon cho nguoi gioi thieu' })
    @IsOptional()
    @IsEnum(CouponType)
    referrerCouponType?: CouponType;

    @ApiProperty({ required: false, example: 10, description: 'Gia tri coupon nguoi gioi thieu' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    referrerCouponValue?: number;

    @ApiProperty({ required: false, description: 'Giam toi da cho nguoi gioi thieu (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    referrerMaxDiscount?: number;

    @ApiProperty({ enum: CouponType, required: false, description: 'Loai coupon cho nguoi duoc gioi thieu' })
    @IsOptional()
    @IsEnum(CouponType)
    refereeCouponType?: CouponType;

    @ApiProperty({ required: false, example: 5, description: 'Gia tri coupon nguoi duoc gioi thieu' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    refereeCouponValue?: number;

    @ApiProperty({ required: false, description: 'Giam toi da cho nguoi duoc gioi thieu (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    refereeMaxDiscount?: number;

    @ApiProperty({ required: false, description: 'Don hang toi thieu de su dung coupon (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minOrderForCoupon?: number;

    @ApiProperty({ required: false, example: 30, description: 'So ngay hieu luc coupon' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    couponValidDays?: number;

    @ApiProperty({ required: false, description: 'Gioi han so luong nguoi moi duoc moi' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxReferralsPerUser?: number;
}
