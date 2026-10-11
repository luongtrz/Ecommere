import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { Public } from '@/common/decorators/public.decorator';

import { CalculateShippingFeeDto } from './dtos/calculate-shipping-fee.dto';
import { ShippingMethod } from './shipping-fee';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Public()
  @Get('calculate-fee')
  @ApiOperation({ summary: 'Calculate shipping fee (Mock)' })
  @ApiQuery({ name: 'province', example: 'Bangkok', required: false })
  @ApiQuery({
    name: 'method',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
    required: false,
  })
  @ApiResponse({ status: 200 })
  async calculateFee(@Query() query: CalculateShippingFeeDto) {
    const mockOrigin = {
      province: 'Bangkok',
      district: 'Chatuchak',
      ward: 'Lat Yao',
      line1: '123 Warehouse St.',
    };

    const destination = {
      province: query?.province || 'Bangkok',
      district: 'Unknown',
      ward: 'Unknown',
      line1: 'Customer address',
    };

    const method = query?.method ?? ShippingMethod.STANDARD;

    return this.shippingService.calculateFee(mockOrigin, destination, method);
  }

  @Public()
  @Get('track')
  @ApiOperation({ summary: 'Track shipment (Mock)' })
  @ApiQuery({ name: 'trackingNumber', example: 'THAI12345678' })
  @ApiResponse({ status: 200 })
  async trackShipment(@Query('trackingNumber') trackingNumber: string) {
    return this.shippingService.trackShipment(trackingNumber);
  }
}
