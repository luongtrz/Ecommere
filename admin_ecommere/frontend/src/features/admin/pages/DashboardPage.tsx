import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SEO } from '@/lib/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { cn, formatCurrency, formatDateTime, getImageUrl } from '@/lib/utils';
import { useDashboardStats } from '../hooks/useDashboardStats';

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    PENDING_PAYMENT: { label: 'Chờ thanh toán', className: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
    PAID: { label: 'Đã thanh toán', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
    PACKING: { label: 'Đang đóng gói', className: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
    SHIPPED: { label: 'Đang giao', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
    DELIVERED: { label: 'Đã giao', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
    CANCELED: { label: 'Đã hủy', className: 'bg-rose-500/15 text-rose-300 border-rose-500/25' },
    REFUNDED: { label: 'Hoàn tiền', className: 'bg-slate-500/15 text-slate-300 border-slate-500/25' },
  };

  const config = statusMap[status] || { label: status, className: 'bg-slate-500/15 text-slate-300 border-slate-500/25' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const toast = useToast();

  useEffect(() => {
    if (isError) {
      toast.error('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
    }
  }, [isError, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-52 rounded-[1.75rem]" />
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[430px] rounded-[1.75rem] xl:col-span-2" />
        </div>
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          <Skeleton className="h-[400px] rounded-[1.75rem]" />
          <Skeleton className="h-[400px] rounded-[1.75rem]" />
          <Skeleton className="h-[400px] rounded-[1.75rem]" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-border bg-card/60 p-10 text-center backdrop-blur-xl shadow-lg">
        <AlertCircle className="h-14 w-14 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Không thể tải dashboard</h2>
          <p className="mt-2 text-muted-foreground">API thống kê hiện không phản hồi hoặc dữ liệu chưa sẵn sàng.</p>
        </div>
        <Button onClick={() => window.location.reload()} className="rounded-full px-6">Tải lại</Button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(stats.revenue.monthlyRevenue),
      icon: DollarSign,
      change: stats.revenue.monthlyChange,
      description: 'so với tháng trước',
      borderClass: 'border-l-4 border-l-emerald-500/80 border-border',
      iconClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    },
    {
      title: 'Đơn hàng mới',
      value: stats.orders.monthlyOrders.toString(),
      icon: ShoppingCart,
      change: stats.orders.monthlyChange,
      description: `${stats.orders.pendingOrders} đơn đang chờ xử lý`,
      borderClass: 'border-l-4 border-l-primary border-border',
      iconClass: 'bg-primary/15 text-primary border border-primary/25',
    },
    {
      title: 'Sản phẩm hoạt động',
      value: stats.products.activeProducts.toString(),
      icon: Package,
      change: undefined,
      description: `${stats.products.lowStockProducts} sản phẩm sắp hết hàng`,
      borderClass: 'border-l-4 border-l-amber-500/80 border-border',
      iconClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    },
    {
      title: 'Khách hàng mới',
      value: stats.customers.newCustomersThisMonth.toString(),
      icon: Users,
      change: stats.customers.monthlyChange,
      description: `${stats.customers.totalCustomers} tài khoản toàn hệ thống`,
      borderClass: 'border-l-4 border-l-primary/60 border-border',
      iconClass: 'bg-secondary text-foreground border border-border',
    },
  ];

  return (
    <>
      <SEO title="Dashboard - Admin" />

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card/60 p-6 shadow-lg backdrop-blur-xl md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Tổng quan vận hành</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-semibold leading-tight text-foreground md:text-4xl">
                Doanh thu, đơn hàng và hàng bán chạy đang nằm trên cùng một màn hình gọn hơn.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Theo dõi thay đổi theo tháng, đơn hàng cần chú ý và nhóm sản phẩm kéo doanh thu tốt nhất để quyết định nhanh hơn.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-6 transition-transform duration-300 hover:scale-[1.02] shadow-lg shadow-primary/20">
                  <Link to="/admin/orders">
                    Xử lý đơn hàng
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-6 border-border bg-secondary/50 text-foreground transition-transform duration-300 hover:bg-secondary hover:scale-[1.02] shadow-sm">
                  <Link to="/admin/products">Cập nhật sản phẩm</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-primary/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Doanh thu toàn hệ thống</p>
                <p className="mt-2 text-2xl md:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">{formatCurrency(stats.revenue.totalRevenue)}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Tổng doanh thu đã ghi nhận từ trước đến nay trên hệ thống.</p>
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tốc độ giao dịch gần nhất</p>
                <p className="mt-2 text-2xl md:text-3xl font-extrabold text-foreground tracking-tight tabular-nums">{stats.orders.shippingOrders} đơn</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Tổng số đơn hàng đang trong trạng thái giao vận thực tế.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero row: KPI cards + Area chart */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 xl:col-span-1">
            {statCards.map((card) => (
              <Card key={card.title} className={cn("overflow-hidden rounded-2xl bg-card/60 border shadow-sm transition-all duration-300 hover:border-border hover:shadow-md", card.borderClass)}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                  <div>
                    <CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{card.title}</CardTitle>
                    <div className="mt-2 text-2xl font-bold text-foreground font-sans tracking-tight tabular-nums">{card.value}</div>
                  </div>
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", card.iconClass)}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                    {card.change !== undefined ? (
                      <span className={cn('inline-flex items-center gap-1 font-bold text-xs rounded-full px-2 py-0.5 tabular-nums', card.change >= 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-300 border border-rose-500/25')}>
                        {card.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground font-medium tabular-nums">{card.description}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-[1.75rem] border border-border bg-card/60 backdrop-blur-xl shadow-lg xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-wide text-foreground">Tín hiệu doanh thu</CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">Xu hướng doanh thu 7 kỳ gần nhất dựa trên dữ liệu hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 pr-2 md:pl-2">
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueHistory} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" dy={8} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => formatCompactCurrency(Number(value))}
                      dx={-8}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                      contentStyle={{
                        borderRadius: '1rem',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#dashboardRevenue)"
                      activeDot={{ r: 5, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Secondary row: Recent orders, Top products, Stock alerts */}
        <section className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          {/* Recent orders */}
          <Card className="rounded-[1.75rem] border border-border bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold tracking-wide text-foreground">Đơn gần đây</CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-medium">{stats.recentOrders.length} đơn mới nhất cần theo dõi.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-secondary">
                <Link to="/admin/orders" aria-label="Xem tất cả đơn hàng">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    Chưa có đơn hàng nào.
                  </div>
                ) : (
                  stats.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      className="block rounded-2xl border border-border/70 bg-card/50 px-4 py-3 shadow-sm transition-all duration-200 hover:bg-muted/40 hover:border-border"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 font-bold text-xs text-primary">
                            {order.customerName ? order.customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'KH'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground tracking-wide truncate">{order.orderNumber}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground font-medium truncate max-w-[130px]">{order.customerName}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground/80 font-medium tabular-nums">{formatDateTime(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-sm text-foreground tracking-tight tabular-nums">{formatCurrency(order.totalAmount)}</p>
                          <div className="mt-1.5 flex justify-end">{getStatusBadge(order.status)}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top products */}
          <Card className="rounded-[1.75rem] border border-border bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold tracking-wide text-foreground">Sản phẩm kéo doanh thu</CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">Nhóm có doanh thu cao nhất trong kỳ hiện tại.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/50 px-3.5 py-3 transition-colors hover:bg-muted/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-semibold text-foreground tabular-nums">
                        #{index + 1}
                      </div>
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border/40">
                        <img
                          src={getImageUrl(product.imageUrl, { width: 160 })}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">Đã bán {product.soldQuantity} sản phẩm</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-foreground tabular-nums">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock alert & Today's rhythm */}
          <Card className="rounded-[1.75rem] border border-border bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold tracking-wide text-foreground">Nhịp vận hành hôm nay</CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-medium">Các tín hiệu cần quan tâm khi theo dõi shop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-card/50 p-4 transition-colors hover:bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Đơn đang chờ xử lý</p>
                <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{stats.orders.pendingOrders}</p>
                <p className="mt-1 text-xs text-muted-foreground">Nên ưu tiên xác nhận và đẩy sang đóng gói sớm.</p>
              </div>
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 transition-colors">
                <p className="text-xs font-medium text-amber-300">Sản phẩm sắp hết hàng</p>
                <p className="mt-1 text-2xl font-bold text-amber-200 tabular-nums">{stats.products.lowStockProducts}</p>
                <p className="mt-1 text-xs text-amber-300/80">Theo dõi để tránh out-of-stock ở nhóm bán tốt.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/50 p-4 transition-colors hover:bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Khách hàng mới trong tháng</p>
                <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{stats.customers.newCustomersThisMonth}</p>
                <p className="mt-1 text-xs text-muted-foreground">Có thể tận dụng để chạy cross-sell hoặc referral.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
