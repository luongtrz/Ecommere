import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from './create-payment.dto';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'payment-id' })
  @IsString()
  paymentId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.STRIPE })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 'order-id' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}


