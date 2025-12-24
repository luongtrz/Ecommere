import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export enum PaymentMethod {
  STRIPE = 'stripe',
  MOMO = 'momo',
}

export class CreatePaymentDto {
  @ApiProperty({ example: 'order-id' })
  @IsString()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
