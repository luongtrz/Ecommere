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
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SEO } from '@/lib/seo';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    PENDING_PAYMENT: {
      label: 'Chờ thanh toán',
      className:
        'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 border-transparent',
    },
    PAID: {
      label: 'Đã thanh toán',
      className:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 border-transparent',
    },
    PACKING: {
      label: 'Đang đóng gói',
      className:
        'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 border-transparent',
    },
    SHIPPED: {
      label: 'Đang giao',
      className:
        'bg-sky-50 text-sky-700 ring-1 ring-sky-200/80 border-transparent',
    },
    DELIVERED: {
      label: 'Đã giao',
      className:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 border-transparent',
    },
    CANCELED: {
      label: 'Đã hủy',
      className:
        'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 border-transparent',
    },
    REFUNDED: {
      label: 'Hoàn tiền',
      className:
        'bg-slate-100 text-slate-700 ring-1 ring-slate-200 border-transparent',
    },
  };

  const config = statusMap[status] || {
    label: status,
    className:
      'bg-slate-100 text-slate-700 ring-1 ring-slate-200 border-transparent',
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-tight shadow-none transition-colors duration-200',
        config.className,
      )}
    >
      {config.label}
    </Badge>
  );
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
      <div className="space-y-6 pb-8 md:space-y-8 font-sans px-1 sm:px-0 w-full max-w-full min-w-0">
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
            <div className="space-y-4">
              <Skeleton className="h-5 w-36 rounded-full bg-slate-200/70" />
              <Skeleton className="h-10 w-full max-w-xl rounded-lg bg-slate-200/70" />
              <Skeleton className="h-4 w-full max-w-md rounded bg-slate-200/70" />
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Skeleton className="h-10 w-36 rounded-xl bg-slate-200/70" />
                <Skeleton className="h-10 w-40 rounded-xl bg-slate-200/70" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 space-y-2.5">
                <Skeleton className="h-3.5 w-32 rounded bg-slate-200/70" />
                <Skeleton className="h-8 w-44 rounded-lg bg-slate-200/70" />
                <Skeleton className="h-3 w-56 rounded bg-slate-200/70" />
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5 space-y-2.5">
                <Skeleton className="h-3.5 w-32 rounded bg-slate-200/70" />
                <Skeleton className="h-8 w-28 rounded-lg bg-slate-200/70" />
                <Skeleton className="h-3 w-52 rounded bg-slate-200/70" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 xl:col-span-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-28 rounded bg-slate-200/70" />
                    <Skeleton className="h-7 w-32 rounded-lg bg-slate-200/70" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl bg-slate-200/70" />
                </div>
                <Skeleton className="h-4 w-40 rounded bg-slate-200/70" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded bg-slate-200/70" />
              <Skeleton className="h-3.5 w-64 rounded bg-slate-200/70" />
            </div>
            <Skeleton className="h-[340px] w-full rounded-xl bg-slate-200/70" />
          </div>
        </div>

        <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32 rounded bg-slate-200/70" />
                <Skeleton className="h-3.5 w-48 rounded bg-slate-200/70" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl bg-slate-200/70" />
                <Skeleton className="h-16 w-full rounded-xl bg-slate-200/70" />
                <Skeleton className="h-16 w-full rounded-xl bg-slate-200/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm md:p-12 font-sans max-w-xl mx-auto my-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-sm mb-2">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Không thể tải dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
            API thống kê hiện không phản hồi hoặc dữ liệu chưa sẵn sàng.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-teal-600 px-6 py-2.5 font-medium text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Tải lại
        </Button>
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
      iconClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      title: 'Đơn hàng mới',
      value: stats.orders.monthlyOrders.toString(),
      icon: ShoppingCart,
      change: stats.orders.monthlyChange,
      description: `${stats.orders.pendingOrders} đơn đang chờ xử lý`,
      iconClass: 'bg-teal-50 text-teal-600 border border-teal-100',
    },
    {
      title: 'Sản phẩm hoạt động',
      value: stats.products.activeProducts.toString(),
      icon: Package,
      change: undefined,
      description: `${stats.products.lowStockProducts} sản phẩm sắp hết hàng`,
      iconClass: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      title: 'Khách hàng mới',
      value: stats.customers.newCustomersThisMonth.toString(),
      icon: Users,
      change: stats.customers.monthlyChange,
      description: `${stats.customers.totalCustomers} tài khoản toàn hệ thống`,
      iconClass: 'bg-slate-100 text-slate-600 border border-slate-200',
    },
  ];

  return (
    <>
      <SEO title="Dashboard - Admin" />

      <div className="space-y-6 pb-10 md:space-y-8 font-sans px-1 sm:px-0 w-full max-w-full min-w-0">
        <section className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8 transition-all duration-200">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-500/5 blur-3xl"
            aria-hidden="true"
          />
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 border border-teal-200/60 text-xs font-semibold uppercase tracking-wider text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                Tổng quan vận hành
              </div>
              <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-slate-900 md:text-3xl lg:text-4xl leading-tight">
                Doanh thu, đơn hàng và hàng bán chạy đang nằm trên cùng một màn
                hình gọn hơn.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                Theo dõi thay đổi theo tháng, đơn hàng cần chú ý và nhóm sản
                phẩm kéo doanh thu tốt nhất để quyết định nhanh hơn.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
                <Button
                  asChild
                  className="group inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-700 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  <Link to="/admin/orders">
                    Xử lý đơn hàng
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]"
                >
                  <Link to="/admin/products">Cập nhật sản phẩm</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Doanh thu toàn hệ thống
                </p>
                <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {formatCurrency(stats.revenue.totalRevenue)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Tổng doanh thu đã ghi nhận từ trước đến nay trên hệ thống.
                </p>
              </div>
              <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/70 p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tốc độ giao dịch gần nhất
                </p>
                <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {stats.orders.shippingOrders} đơn
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Tổng số đơn hàng đang trong trạng thái giao vận thực tế.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero row: KPI cards + Area chart */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 xl:col-span-1">
            {statCards.map((card) => (
              <Card
                key={card.title}
                className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                  <div className="space-y-1 min-w-0 pr-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
                      {card.title}
                    </CardTitle>
                    <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {card.value}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors duration-200',
                      card.iconClass,
                    )}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    {card.change !== undefined ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 transition-colors',
                          card.change >= 0
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-rose-50 text-rose-700 ring-rose-200',
                        )}
                      >
                        {card.change >= 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {Math.abs(card.change).toFixed(1)}%
                      </span>
                    ) : null}
                    <span className="text-xs font-medium text-slate-500 tabular-nums">
                      {card.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md xl:col-span-2 overflow-hidden">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                Tín hiệu doanh thu
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Xu hướng doanh thu 7 kỳ gần nhất dựa trên dữ liệu hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 pl-0 pr-2 md:pl-2">
              <div className="h-[360px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.revenueHistory}
                    margin={{ left: 6, right: 6, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="dashboardRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="rgb(13, 148, 136)"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="rgb(13, 148, 136)"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="rgb(226, 232, 240)"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="rgb(148, 163, 184)"
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      stroke="rgb(148, 163, 184)"
                      tickFormatter={(value) =>
                        formatCompactCurrency(Number(value))
                      }
                      dx={-8}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid rgb(226, 232, 240)',
                        backgroundColor: 'rgb(255, 255, 255)',
                        color: 'rgb(15, 23, 42)',
                        boxShadow:
                          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="rgb(13, 148, 136)"
                      strokeWidth={2.5}
                      fill="url(#dashboardRevenue)"
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                        stroke: 'rgb(255, 255, 255)',
                        fill: 'rgb(13, 148, 136)',
                      }}
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
          <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                  Đơn gần đây
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500">
                  {stats.recentOrders.length} đơn mới nhất cần theo dõi.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors duration-200"
              >
                <Link to="/admin/orders" aria-label="Xem tất cả đơn hàng">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1">
              <div className="space-y-3">
                {stats.recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-12 text-center text-sm text-slate-500">
                    <ShoppingCart className="h-8 w-8 text-slate-300 mb-2 stroke-[1.5]" />
                    Chưa có đơn hàng nào.
                  </div>
                ) : (
                  stats.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      className="group block rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all duration-200 hover:border-teal-300 hover:bg-slate-50/70 hover:shadow-sm hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                    >
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold text-xs border border-teal-100 group-hover:border-teal-200 transition-colors">
                            {order.customerName
                              ? order.customerName
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'KH'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 tracking-tight truncate group-hover:text-teal-700 transition-colors">
                              {order.orderNumber}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600 truncate max-w-[130px]">
                              {order.customerName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400 font-normal tabular-nums">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm text-slate-900 tracking-tight tabular-nums">
                            {formatCurrency(order.totalAmount)}
                          </p>
                          <div className="mt-1.5 flex justify-end">
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top products */}
          <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md flex flex-col">
            <CardHeader className="p-5 pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                  Sản phẩm kéo doanh thu
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500">
                  Nhóm có doanh thu cao nhất trong kỳ hiện tại.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1">
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm hover:-translate-y-0.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums',
                          index === 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200',
                        )}
                      >
                        #{index + 1}
                      </div>
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                        <img
                          src={getImageUrl(product.imageUrl, { width: 160 })}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 tracking-tight">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                          Đã bán {product.soldQuantity} sản phẩm
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-slate-900 tabular-nums">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock alert & Today's rhythm */}
          <Card className="rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md flex flex-col">
            <CardHeader className="p-5 pb-3">
              <div className="space-y-0.5">
                <CardTitle className="text-base md:text-lg font-bold tracking-tight text-slate-900">
                  Nhịp vận hành hôm nay
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500">
                  Các tín hiệu cần quan tâm khi theo dõi shop.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3 flex-1">
              <div className="group rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-xs">
                <p className="text-xs font-semibold text-slate-600">
                  Đơn đang chờ xử lý
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                  {stats.orders.pendingOrders}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Nên ưu tiên xác nhận và đẩy sang đóng gói sớm.
                </p>
              </div>
              <div className="group rounded-xl border border-amber-200/80 bg-amber-50/80 p-4 transition-all duration-200 hover:border-amber-300 hover:bg-amber-50 hover:shadow-xs">
                <p className="text-xs font-semibold text-amber-800">
                  Sản phẩm sắp hết hàng
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700 tabular-nums">
                  {stats.products.lowStockProducts}
                </p>
                <p className="mt-1 text-xs text-amber-700/90">
                  Theo dõi để tránh out-of-stock ở nhóm bán tốt.
                </p>
              </div>
              <div className="group rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-xs">
                <p className="text-xs font-semibold text-slate-600">
                  Khách hàng mới trong tháng
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                  {stats.customers.newCustomersThisMonth}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Có thể tận dụng để chạy cross-sell hoặc referral.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
