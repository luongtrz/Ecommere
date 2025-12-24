import { ApiProperty } from '@nestjs/swagger';

export class RevenueStatsDto {
  @ApiProperty({ description: 'Tổng doanh thu' })
  totalRevenue: number;

  @ApiProperty({ description: 'Doanh thu tháng này' })
  monthlyRevenue: number;

  @ApiProperty({ description: '% thay đổi so với tháng trước' })
  monthlyChange: number;
}

export class OrderStatsDto {
  @ApiProperty({ description: 'Tổng số đơn hàng' })
  totalOrders: number;

  @ApiProperty({ description: 'Đơn hàng tháng này' })
  monthlyOrders: number;

  @ApiProperty({ description: '% thay đổi so với tháng trước' })
  monthlyChange: number;

  @ApiProperty({ description: 'Đơn chờ xử lý' })
  pendingOrders: number;

  @ApiProperty({ description: 'Đơn đang giao' })
  shippingOrders: number;
}

export class ProductStatsDto {
  @ApiProperty({ description: 'Tổng số sản phẩm' })
  totalProducts: number;

  @ApiProperty({ description: 'Sản phẩm active' })
  activeProducts: number;

  @ApiProperty({ description: 'Sản phẩm mới tháng này' })
  newProductsThisMonth: number;

  @ApiProperty({ description: 'Sản phẩm sắp hết hàng (stock < 10)' })
  lowStockProducts: number;
}

export class CustomerStatsDto {
  @ApiProperty({ description: 'Tổng số khách hàng' })
  totalCustomers: number;

  @ApiProperty({ description: 'Khách hàng mới tháng này' })
  newCustomersThisMonth: number;

  @ApiProperty({ description: '% thay đổi so với tháng trước' })
  monthlyChange: number;
}

export class RecentOrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED'] })
  status: string;

  @ApiProperty()
  createdAt: Date;
}

export class TopProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  imageUrl: string | null;

  @ApiProperty({ description: 'Số lượng đã bán' })
  soldQuantity: number;

  @ApiProperty({ description: 'Doanh thu' })
  revenue: number;
}

export class DashboardStatsDto {
  @ApiProperty({ type: RevenueStatsDto })
  revenue: RevenueStatsDto;

  @ApiProperty({ type: OrderStatsDto })
  orders: OrderStatsDto;

  @ApiProperty({ type: ProductStatsDto })
  products: ProductStatsDto;

  @ApiProperty({ type: CustomerStatsDto })
  customers: CustomerStatsDto;

  @ApiProperty({ type: [RecentOrderDto], description: '10 đơn hàng gần nhất' })
  recentOrders: RecentOrderDto[];

  @ApiProperty({ type: [TopProductDto], description: '5 sản phẩm bán chạy nhất' })
  topProducts: TopProductDto[];
}
