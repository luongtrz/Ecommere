import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Public()
  @Get('calculate-fee')
  @ApiOperation({ summary: 'Calculate shipping fee (Mock)' })
  @ApiQuery({ name: 'province', example: 'Bangkok' })
  @ApiQuery({ name: 'weight', example: 1, required: false })
  @ApiResponse({ status: 200 })
  async calculateFee(@Query('province') province: string, @Query('weight') weight?: number) {
    const mockOrigin = {
      province: 'Bangkok',
      district: 'Chatuchak',
      ward: 'Lat Yao',
      line1: '123 Warehouse St.',
    };

    const destination = {
      province: province || 'Bangkok',
      district: 'Unknown',
      ward: 'Unknown',
      line1: 'Customer address',
    };

    return this.shippingService.calculateFee(mockOrigin, destination, weight ? parseFloat(weight.toString()) : 1);
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
