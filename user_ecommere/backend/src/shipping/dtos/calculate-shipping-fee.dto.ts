import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ShippingMethod } from '@/orders/dtos/checkout.dto';

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

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;
}

export { ShippingMethod };
