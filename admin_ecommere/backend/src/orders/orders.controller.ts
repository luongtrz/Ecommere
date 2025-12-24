import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dtos/checkout.dto';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { OrderFilterDto } from './dtos/order-filter.dto';
import { OrderEntity } from './entities/order.entity';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout and create order from cart' })
  @ApiResponse({ status: 201, type: OrderEntity })
  async checkout(@CurrentUser('id') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.ordersService.checkout(userId, checkoutDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my orders' })
  @ApiResponse({ status: 200, type: [OrderEntity] })
  async getMyOrders(@CurrentUser('id') userId: string, @Query() filterDto: OrderFilterDto) {
    return this.ordersService.getMyOrders(userId, filterDto);
  }

  @Get('my/:orderId')
  @ApiOperation({ summary: 'Get my order by ID' })
  @ApiResponse({ status: 200, type: OrderEntity })
  async getMyOrderById(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    return this.ordersService.getMyOrderById(userId, orderId);
  }

  @Patch('my/:orderId/cancel')
  @ApiOperation({ summary: 'Cancel my order' })
  @ApiResponse({ status: 200, type: OrderEntity })
  async cancelOrder(@CurrentUser('id') userId: string, @Param('orderId') orderId: string) {
    return this.ordersService.cancelOrder(userId, orderId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, type: [OrderEntity] })
  async getAllOrders(@Query() filterDto: OrderFilterDto) {
    return this.ordersService.getAllOrders(filterDto);
  }

  @Get(':orderId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get order by ID (Admin only)' })
  @ApiResponse({ status: 200, type: OrderEntity })
  async getOrderById(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  @Patch(':orderId/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({ status: 200, type: OrderEntity })
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, updateOrderStatusDto);
  }
}
