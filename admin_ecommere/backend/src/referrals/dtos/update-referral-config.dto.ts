import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CouponType } from '@prisma/client';

export class UpdateReferralConfigDto {
    @ApiProperty({ required: false, description: 'Kích hoạt tính năng referral' })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiProperty({ enum: CouponType, required: false, description: 'Loại coupon cho người giới thiệu' })
    @IsOptional()
    @IsEnum(CouponType)
    referrerCouponType?: CouponType;

    @ApiProperty({ required: false, example: 10, description: 'Giá trị coupon người giới thiệu' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    referrerCouponValue?: number;

    @ApiProperty({ required: false, description: 'Giảm tối đa cho người giới thiệu (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    referrerMaxDiscount?: number;

    @ApiProperty({ enum: CouponType, required: false, description: 'Loại coupon cho người được giới thiệu' })
    @IsOptional()
    @IsEnum(CouponType)
    refereeCouponType?: CouponType;

    @ApiProperty({ required: false, example: 5, description: 'Giá trị coupon người được giới thiệu' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    refereeCouponValue?: number;

    @ApiProperty({ required: false, description: 'Giảm tối đa cho người được giới thiệu (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    refereeMaxDiscount?: number;

    @ApiProperty({ required: false, description: 'Đơn hàng tối thiểu để sử dụng coupon (VND)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minOrderForCoupon?: number;

    @ApiProperty({ required: false, example: 30, description: 'Số ngày hiệu lực coupon' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    couponValidDays?: number;

    @ApiProperty({ required: false, description: 'Giới hạn số lượng người mới được mời' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxReferralsPerUser?: number;
}
