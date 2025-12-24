import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { StockAdjustmentDto } from './dtos/stock-adjustment.dto';
import { StockMovementEntity } from './entities/stock-movement.entity';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Post('adjust')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Adjust stock levels (Admin only)' })
  @ApiResponse({ status: 201, type: StockMovementEntity })
  async adjustStock(
    @Body() adjustmentDto: StockAdjustmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.adjustStock(adjustmentDto, userId);
  }

  @Get('history/:variantId')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get stock movement history for a variant (Admin only)' })
  @ApiResponse({ status: 200, type: [StockMovementEntity] })
  async getStockHistory(
    @Param('variantId') variantId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.inventoryService.getStockHistory(variantId, paginationDto);
  }

  @Get('low-stock')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get variants with low stock (Admin only)' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200 })
  async getLowStockVariants(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStockVariants(threshold ? parseInt(threshold.toString(), 10) : 10);
  }

  @Get('stock-levels')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all stock levels (Admin only)' })
  @ApiResponse({ status: 200 })
  async getAllStockLevels(@Query() paginationDto: PaginationDto) {
    return this.inventoryService.getAllStockLevels(paginationDto);
  }
}
