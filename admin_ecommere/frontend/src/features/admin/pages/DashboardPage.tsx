import { useEffect } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';

export function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const toast = useToast();

  // Show error toast when data fails to load
  useEffect(() => {
    if (isError) {
      toast.error('❌ Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
    }
  }, [isError, toast]);

  if (isLoading) {
    return (
      <>
        <SEO title="Dashboard - Admin" />
        <div>
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (isError || !stats) {
    return (
      <>
        <SEO title="Dashboard - Admin" />
        <div>
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <div className="flex flex-col items-center justify-center gap-4 p-12 border rounded-lg bg-muted/50">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Không thể tải dữ liệu thống kê</p>
            <p className="text-sm text-muted-foreground">Vui lòng thử lại sau hoặc liên hệ quản trị viên</p>
          </div>
        </div>
      </>
    );
  }

  const statCards = [
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(stats.revenue.monthlyRevenue),
      icon: DollarSign,
      change: stats.revenue.monthlyChange,
      iconColor: 'text-green-600',
    },
    {
      title: 'Đơn hàng',
      value: stats.orders.monthlyOrders.toString(),
      icon: ShoppingCart,
      change: stats.orders.monthlyChange,
      subtitle: `${stats.orders.pendingOrders} chờ xử lý, ${stats.orders.shippingOrders} đang giao`,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Sản phẩm',
      value: stats.products.totalProducts.toString(),
      icon: Package,
      subtitle: `${stats.products.newProductsThisMonth} mới, ${stats.products.lowStockProducts} sắp hết`,
      iconColor: 'text-purple-600',
    },
    {
      title: 'Khách hàng',
      value: stats.customers.totalCustomers.toString(),
      icon: Users,
      change: stats.customers.monthlyChange,
      subtitle: `${stats.customers.newCustomersThisMonth} mới tháng này`,
      iconColor: 'text-orange-600',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'outline' },
      PAID: { label: 'Đã thanh toán', variant: 'default' },
      PACKING: { label: 'Đang đóng gói', variant: 'secondary' },
      SHIPPED: { label: 'Đã giao vận', variant: 'default' },
      DELIVERED: { label: 'Đã giao', variant: 'default' },
      CANCELED: { label: 'Đã hủy', variant: 'destructive' },
      REFUNDED: { label: 'Đã hoàn tiền', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <SEO title="Dashboard - Admin" />
      <div>
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                {stat.change !== undefined && (
                  <div className="flex items-center gap-1 text-xs">
                    {stat.change >= 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">+{stat.change.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="text-red-600">{stat.change.toFixed(1)}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground ml-1">so với tháng trước</span>
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm bán chạy</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
              ) : (
                <div className="space-y-4">
                  {stats.topProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Đã bán: {product.soldQuantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
