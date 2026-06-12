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
    PENDING_PAYMENT: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    PAID: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PACKING: { label: 'Đang đóng gói', className: 'bg-sky-50 text-sky-700 border-sky-200' },
    SHIPPED: { label: 'Đang giao', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    DELIVERED: { label: 'Đã giao', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    CANCELED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700 border-rose-200' },
    REFUNDED: { label: 'Hoàn tiền', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const config = statusMap[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
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
        <Skeleton className="h-52 rounded-[2rem]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[1.75rem]" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Skeleton className="h-[420px] rounded-[1.75rem]" />
          <Skeleton className="h-[420px] rounded-[1.75rem]" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="admin-surface flex min-h-[55vh] flex-col items-center justify-center gap-4 p-10 text-center">
        <AlertCircle className="h-14 w-14 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-semibold">Không thể tải dashboard</h2>
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
      borderClass: 'border-l-4 border-l-emerald-500/80 border-t border-r border-b border-white/80',
      iconClass: 'bg-emerald-50/80 text-emerald-600 border border-emerald-100/50 shadow-inner',
    },
    {
      title: 'Đơn hàng mới',
      value: stats.orders.monthlyOrders.toString(),
      icon: ShoppingCart,
      change: stats.orders.monthlyChange,
      description: `${stats.orders.pendingOrders} đơn đang chờ xử lý`,
      borderClass: 'border-l-4 border-l-blue-500/80 border-t border-r border-b border-white/80',
      iconClass: 'bg-blue-50/80 text-blue-600 border border-blue-100/50 shadow-inner',
    },
    {
      title: 'Sản phẩm hoạt động',
      value: stats.products.activeProducts.toString(),
      icon: Package,
      change: undefined,
      description: `${stats.products.lowStockProducts} sản phẩm sắp hết hàng`,
      borderClass: 'border-l-4 border-l-amber-500/80 border-t border-r border-b border-white/80',
      iconClass: 'bg-amber-50/80 text-amber-600 border border-amber-100/50 shadow-inner',
    },
    {
      title: 'Khách hàng mới',
      value: stats.customers.newCustomersThisMonth.toString(),
      icon: Users,
      change: stats.customers.monthlyChange,
      description: `${stats.customers.totalCustomers} tài khoản toàn hệ thống`,
      borderClass: 'border-l-4 border-l-purple-500/80 border-t border-r border-b border-white/80',
      iconClass: 'bg-purple-50/80 text-purple-600 border border-purple-100/50 shadow-inner',
    },
  ];

  return (
    <>
      <SEO title="Dashboard - Admin" />

      <div className="space-y-6">
        <section className="admin-surface overflow-hidden p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Tổng quan vận hành</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-foreground md:text-5xl">
                Doanh thu, đơn hàng và hàng bán chạy đang nằm trên cùng một màn hình gọn hơn.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Theo dõi thay đổi theo tháng, đơn hàng cần chú ý và nhóm sản phẩm kéo doanh thu tốt nhất để quyết định nhanh hơn.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-6 transition-transform duration-300 hover:scale-[1.02] shadow-lg shadow-primary/10">
                  <Link to="/admin/orders">
                    Xử lý đơn hàng
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-6 bg-white/45 border-white/60 transition-transform duration-300 hover:scale-[1.02] shadow-sm">
                  <Link to="/admin/products">Cập nhật sản phẩm</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(145deg,rgba(12,84,163,0.06),rgba(255,255,255,0.8))] border border-white/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_12px_30px_rgba(12,84,163,0.08)] group">
                <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                <p className="text-sm font-semibold text-muted-foreground tracking-wide">Doanh thu toàn hệ thống</p>
                <p className="mt-2 text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(stats.revenue.totalRevenue)}</p>
                <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">Tổng doanh thu đã ghi nhận từ trước đến nay trên hệ thống.</p>
              </div>
              <div className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(145deg,rgba(16,185,129,0.06),rgba(255,255,255,0.8))] border border-white/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_12px_30px_rgba(16,185,129,0.08)] group">
                <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                <p className="text-sm font-semibold text-muted-foreground tracking-wide">Tốc độ giao dịch gần nhất</p>
                <p className="mt-2 text-3xl font-extrabold text-foreground tracking-tight">{stats.orders.shippingOrders} đơn</p>
                <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">Tổng số đơn hàng đang trong trạng thái giao vận thực tế.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title} className={cn("overflow-hidden rounded-[1.75rem] bg-white/90 border border-white/85 shadow-[0_10px_35px_rgba(0,0,0,0.02)] admin-glow hover:-translate-y-1 transition-all duration-300", card.borderClass)}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{card.title}</CardTitle>
                  <div className="mt-3 text-2xl font-bold text-foreground font-serif tracking-tight">{card.value}</div>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40", card.iconClass)}>
                  <card.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  {card.change !== undefined ? (
                    <span className={cn('inline-flex items-center gap-1 font-bold text-xs rounded-full px-2 py-0.5', card.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                      {card.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {Math.abs(card.change).toFixed(1)}%
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground/90 font-medium">{card.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Card className="admin-surface border-0">
            <CardHeader>
              <CardTitle>Tín hiệu doanh thu</CardTitle>
              <CardDescription>Xu hướng doanh thu 7 kỳ gần nhất dựa trên dữ liệu hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0 pr-2 md:pl-2">
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueHistory} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0c54a3" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#0c54a3" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e0e8e3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#64748b"
                      tickFormatter={(value) => formatCompactCurrency(Number(value))}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        boxShadow: '0 18px 50px -30px rgba(24, 46, 37, 0.25)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#0c54a3"
                      strokeWidth={3}
                      fill="url(#dashboardRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Đơn gần đây</CardTitle>
                <CardDescription>{stats.recentOrders.length} đơn mới nhất cần theo dõi.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" asChild className="rounded-full">
                <Link to="/admin/orders">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentOrders.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-secondary/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Chưa có đơn hàng nào.
                  </div>
                ) : (
                  stats.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      className="block rounded-[1.35rem] border border-white/85 bg-white/95 px-4 py-4 shadow-[0_4px_15px_rgba(0,0,0,0.01)] admin-glow hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{order.orderNumber}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{order.customerName}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{formatCurrency(order.totalAmount)}</p>
                          <div className="mt-2 flex justify-end">{getStatusBadge(order.status)}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="admin-surface border-0">
            <CardHeader>
              <CardTitle>Sản phẩm kéo doanh thu</CardTitle>
              <CardDescription>Nhóm có doanh thu cao nhất trong kỳ hiện tại.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-border/70 bg-white/75 px-4 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold text-foreground">
                        #{index + 1}
                      </div>
                      <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-secondary">
                        <img
                          src={getImageUrl(product.imageUrl, { width: 160 })}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{product.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Đã bán {product.soldQuantity} sản phẩm</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface border-0">
            <CardHeader>
              <CardTitle>Nhịp vận hành hôm nay</CardTitle>
              <CardDescription>Các tín hiệu cần quan tâm khi theo dõi shop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                <p className="text-sm font-semibold text-foreground">Đơn đang chờ xử lý</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.orders.pendingOrders}</p>
                <p className="mt-1 text-sm text-muted-foreground">Nên ưu tiên xác nhận và đẩy sang đóng gói sớm.</p>
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                <p className="text-sm font-semibold text-foreground">Sản phẩm sắp hết hàng</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.products.lowStockProducts}</p>
                <p className="mt-1 text-sm text-muted-foreground">Theo dõi để tránh out-of-stock ở nhóm bán tốt.</p>
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-white/80 p-4">
                <p className="text-sm font-semibold text-foreground">Khách hàng mới trong tháng</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.customers.newCustomersThisMonth}</p>
                <p className="mt-1 text-sm text-muted-foreground">Có thể tận dụng để chạy cross-sell hoặc referral.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
