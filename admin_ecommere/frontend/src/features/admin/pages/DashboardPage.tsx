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
  Sparkles,
  Clock,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SEO } from '@/lib/seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { cn, formatCurrency, getImageUrl } from '@/lib/utils';
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
    DELIVERED: { label: 'Đã giao', className: 'bg-teal-50 text-teal-700 border-teal-200' },
    CANCELED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700 border-rose-200' },
    REFUNDED: { label: 'Hoàn tiền', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const config = statusMap[status] || { label: status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
  return <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full border", config.className)}>{config.label}</Badge>;
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
        <Skeleton className="h-52 rounded-[2rem] bg-slate-200/60" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl bg-slate-200/60" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Skeleton className="h-[420px] rounded-2xl bg-slate-200/60" />
          <Skeleton className="h-[420px] rounded-2xl bg-slate-200/60" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 p-10 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
        <AlertCircle className="h-14 w-14 text-rose-500" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Không thể tải dashboard</h2>
          <p className="mt-2 text-slate-500">API thống kê hiện không phản hồi hoặc dữ liệu chưa sẵn sàng.</p>
        </div>
        <Button onClick={() => window.location.reload()} className="rounded-full px-6 bg-teal-600 text-white font-bold hover:bg-teal-700">Tải lại</Button>
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
      borderClass: 'border-l-4 border-l-emerald-500',
      iconClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      title: 'Đơn hàng mới',
      value: stats.orders.monthlyOrders.toString(),
      icon: ShoppingCart,
      change: stats.orders.monthlyChange,
      description: `${stats.orders.pendingOrders} đơn đang chờ xử lý`,
      borderClass: 'border-l-4 border-l-teal-500',
      iconClass: 'bg-teal-50 text-teal-600 border border-teal-100',
    },
    {
      title: 'Sản phẩm hoạt động',
      value: stats.products.activeProducts.toString(),
      icon: Package,
      change: undefined,
      description: `${stats.products.lowStockProducts} sản phẩm sắp hết`,
      borderClass: 'border-l-4 border-l-amber-500',
      iconClass: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    {
      title: 'Khách hàng mới',
      value: stats.customers.newCustomersThisMonth.toString(),
      icon: Users,
      change: stats.customers.monthlyChange,
      description: `${stats.customers.totalCustomers} tài khoản toàn hệ thống`,
      borderClass: 'border-l-4 border-l-blue-500',
      iconClass: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
  ];

  return (
    <>
      <SEO title="Bảng điều khiển - Thai Spray Control Center" />
      <div className="space-y-8">
        {/* Operations Overview Banner */}
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/20 p-6 sm:p-8 shadow-sm">
          <div className="relative grid gap-6 lg:grid-cols-[1.6fr_1fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>Control Platform • Real-time Sync</span>
              </div>
              <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                Bảng điều hành phân phối <span className="text-teal-700">Thai Spray</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
                Theo dõi thời gian thực lưu lượng đơn hàng, doanh số chai xịt chuột & diệt côn trùng Thái Lan chính ngạch từ cơ sở dữ liệu nội bộ.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl px-6 py-2.5 font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-700/20 transition-all duration-200">
                  <Link to="/admin/orders">
                    Xử lý đơn hàng
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl px-6 py-2.5 font-bold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">
                  <Link to="/admin/products">Quản lý sản phẩm</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Doanh thu toàn hệ thống</p>
                <p className="mt-1 text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.revenue.totalRevenue)}</p>
                <p className="mt-1 text-[11px] text-slate-500">Tích lũy từ mọi kênh bán hàng trực tuyến</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Đang giao vận chuyển</p>
                <p className="mt-1 text-2xl font-black text-teal-700 tracking-tight">{stats.orders.shippingOrders} đơn hàng</p>
                <p className="mt-1 text-[11px] text-slate-500">Đơn hàng đang trên đường đến tay khách hàng</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Stat Cards */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className={cn(
                "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                card.borderClass
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.iconClass)}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs">
                {card.change !== undefined ? (
                  <span className={cn(
                    'inline-flex items-center gap-1 font-bold rounded-full px-2 py-0.5 text-[11px]',
                    card.change >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  )}>
                    {card.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(card.change).toFixed(1)}%
                  </span>
                ) : null}
                <span className="text-slate-500 font-medium truncate">{card.description}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Revenue Chart & Recent Orders */}
        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 tracking-wide">Tín hiệu doanh thu</h2>
              <p className="text-xs text-slate-500 mt-0.5">Xu hướng doanh số theo 7 kỳ đối soát gần nhất.</p>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueHistory} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueLightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" dy={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="#94a3b8"
                    tickFormatter={(value) => formatCompactCurrency(Number(value))}
                    dx={-8}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0d9488"
                    strokeWidth={3}
                    fill="url(#revenueLightGrad)"
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff', fill: '#0d9488' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-wide">Đơn gần đây</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{stats.recentOrders.length} đơn cần theo dõi & đóng gói.</p>
                </div>
                <Button variant="ghost" size="icon" asChild className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                  <Link to="/admin/orders">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-2.5">
                {stats.recentOrders.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-8 text-center text-xs text-slate-500">
                    Chưa có đơn hàng mới phát sinh hôm nay.
                  </div>
                ) : (
                  stats.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/admin/orders/${order.id}`}
                      className="group block rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:border-teal-200 hover:bg-teal-50/40 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-teal-800 group-hover:text-teal-900">
                            #{order.orderNumber}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {order.customerName || 'Khách lẻ'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                          <div className="mt-1 flex justify-end">{getStatusBadge(order.status)}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link to="/admin/orders" className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center justify-center gap-1.5">
                Xem toàn bộ đơn hàng <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Top Products & Operational Signals */}
        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">Sản phẩm bán chạy</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-5">Xịt Thái Lan mang lại doanh thu cao nhất.</p>

            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-slate-200 transition-colors">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white font-bold text-xs text-teal-800 border border-slate-200 shadow-sm">
                      #{index + 1}
                    </div>
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white border border-slate-100 shrink-0">
                      <img
                        src={getImageUrl(product.imageUrl, { width: 120 })}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900">{product.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Đã bán {product.soldQuantity} chai</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-teal-800">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 tracking-wide">Nhịp vận hành hôm nay</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-5">Chỉ số ưu tiên cần xử lý ngay.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Đơn đang chờ xác nhận</p>
                    <p className="text-[11px] text-slate-500">Cần liên hệ khách hoặc đóng gói</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-600">{stats.orders.pendingOrders}</p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sản phẩm sắp hết hàng</p>
                    <p className="text-[11px] text-slate-500">Tồn kho dưới ngưỡng an toàn</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-rose-600">{stats.products.lowStockProducts}</p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Khách hàng mới tháng này</p>
                    <p className="text-[11px] text-slate-500">Tăng trưởng khách hàng đăng ký</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-teal-700">{stats.customers.newCustomersThisMonth}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
