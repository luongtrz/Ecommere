import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { SalesReportQueryDto } from './dtos/sales-report-query.dto';
import { TopProductsQueryDto } from './dtos/top-products-query.dto';

@ApiTags('admin-reports')
@ApiBearerAuth('JWT-auth')
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Báo cáo doanh thu bán hàng' })
  @ApiResponse({
    status: 200,
    description: 'Báo cáo doanh thu bán hàng theo chu kỳ',
  })
  async getSalesReport(@Query() query: SalesReportQueryDto) {
    return this.reportsService.getSalesReport(query);
  }

  @Get('top-products')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Báo cáo sản phẩm bán chạy nhất' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách top sản phẩm bán chạy',
  })
  async getTopProducts(@Query() query: TopProductsQueryDto) {
    return this.reportsService.getTopProducts(query);
  }
}
