import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CustomerQueryDto } from './dtos/customer-query.dto';

@ApiTags('admin-customers')
@ApiBearerAuth('JWT-auth')
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách khách hàng (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách khách hàng phân trang',
  })
  async getCustomers(@Query() query: CustomerQueryDto) {
    return this.customersService.getCustomers(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết khách hàng (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết khách hàng và danh sách địa chỉ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy khách hàng',
  })
  async getCustomerById(@Param('id') id: string) {
    return this.customersService.getCustomerById(id);
  }
}
