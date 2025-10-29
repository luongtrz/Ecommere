import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { VerifyPaymentDto } from './dtos/verify-payment.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create payment for order (Mock)' })
  @ApiResponse({ status: 201 })
  async createPayment(@CurrentUser('id') userId: string, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(userId, createPaymentDto.orderId, createPaymentDto.method);
  }

  @Post('verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify payment status (Mock)' })
  @ApiResponse({ status: 200 })
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto, @Body('method') method: string) {
    return this.paymentsService.verifyPayment(verifyPaymentDto.paymentId, method as any);
  }

  @Public()
  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint (Mock)' })
  @ApiResponse({ status: 200 })
  async stripeWebhook(@Body() payload: any) {
    return this.paymentsService.processPaymentWebhook('stripe', payload);
  }

  @Public()
  @Post('webhook/momo')
  @ApiOperation({ summary: 'MoMo webhook endpoint (Mock)' })
  @ApiResponse({ status: 200 })
  async momoWebhook(@Body() payload: any) {
    return this.paymentsService.processPaymentWebhook('momo', payload);
  }
}
