import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ShippingMethod } from '../shipping-fee';

export class CalculateShippingFeeDto {
  @ApiProperty({ example: 'Bangkok', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @ApiProperty({
    example: ShippingMethod.STANDARD,
    enum: ShippingMethod,
    required: false,
    default: ShippingMethod.STANDARD,
  })
  @IsOptional()
  @IsEnum(ShippingMethod)
  method?: ShippingMethod = ShippingMethod.STANDARD;
}
