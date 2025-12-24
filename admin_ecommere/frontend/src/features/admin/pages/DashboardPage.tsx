import { useEffect } from 'react';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data for charts (since backend doesn't provide history yet)
const revenueData = [
  { name: 'T1', total: 12000000 },
  { name: 'T2', total: 18000000 },
  { name: 'T3', total: 15000000 },
  { name: 'T4', total: 22000000 },
  { name: 'T5', total: 28000000 },
  { name: 'T6', total: 24000000 },
  { name: 'T7', total: 32000000 },
];

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
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <Skeleton className="lg:col-span-4 h-96 rounded-xl" />
          <Skeleton className="lg:col-span-3 h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Đã có lỗi xảy ra</h2>
        <p className="text-muted-foreground">Không thể tải dữ liệu dashboard.</p>
        <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(stats.revenue.monthlyRevenue),
      icon: DollarSign,
      change: stats.revenue.monthlyChange,
      desc: 'so với tháng trước',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Đơn hàng mới',
      value: stats.orders.monthlyOrders.toString(),
      icon: ShoppingCart,
      change: stats.orders.monthlyChange,
      desc: 'so với tháng trước',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Sản phẩm',
      value: stats.products.totalProducts.toString(),
      icon: Package,
      change: undefined, // No change metric for total products usually
      desc: `${stats.products.newProductsThisMonth} sản phẩm mới`,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'Khách hàng',
      value: stats.customers.totalCustomers.toString(),
      icon: Users,
      change: stats.customers.monthlyChange,
      desc: 'so với tháng trước',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }> = {
      PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'outline' },
      PAID: { label: 'Đã thanh toán', variant: 'secondary' }, // Secondary often looks good for paid
      PACKING: { label: 'Đang đóng gói', variant: 'secondary' },
      SHIPPED: { label: 'Đã giao vận', variant: 'default' },
      DELIVERED: { label: 'Đã giao', variant: 'default' }, // Should differentiate if possible, but default is fine
      CANCELED: { label: 'Đã hủy', variant: 'destructive' },
      REFUNDED: { label: 'Đã hoàn tiền', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };

    // Custom style for DELIVERED/PAID if needed, but sticking to shadcn variants for consistency
    let className = "";
    if (status === 'PAID') className = "bg-green-100 text-green-700 hover:bg-green-200 border-transparent";
    if (status === 'DELIVERED') className = "bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent";

    if (className) {
      return <Badge className={className} variant="outline">{config.label}</Badge>;
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      <SEO title="Dashboard - Admin" />
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link to="/admin/orders">Quản lý đơn hàng</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {stat.change !== undefined && (
                    <span className={`flex items-center mr-1 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                  )}
                  <span>{stat.desc}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts & Tables Split */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Revenue Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Tổng quan doanh thu</CardTitle>
              <CardDescription>
                Biểu đồ doanh thu trong 7 tháng gần nhất (Mô phỏng)
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Đơn hàng gần đây</CardTitle>
                <CardDescription>
                  {stats.recentOrders.length} đơn hàng mới nhất
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/admin/orders"><ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Chưa có đơn hàng nào</div>
                ) : (
                  stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <Link to={`/admin/orders/${order.id}`} className="text-sm font-medium hover:underline group-hover:text-primary transition-colors">
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-bold">{formatCurrency(order.totalAmount)}</div>
                          <div className="text-[10px] text-muted-foreground">{order.status}</div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm bán chạy</CardTitle>
              <CardDescription>Top sản phẩm có doanh thu cao nhất tháng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative h-12 w-12 rounded overflow-hidden bg-muted border">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                        ) : (
                          <Package className="h-6 w-6 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">Đã bán: {product.soldQuantity}</p>
                      </div>
                    </div>
                    <div className="font-bold">{formatCurrency(product.revenue)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
