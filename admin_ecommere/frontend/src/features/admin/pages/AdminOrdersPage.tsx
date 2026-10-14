import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import { formatCurrency, formatDateTime, parseShippingAddress, cn } from '@/lib/utils';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Package,
  Calendar,
  Filter,
  ShoppingBag,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { OrderStatus } from '../api/admin-orders.api';
import { useToast } from '@/hooks/useToast';

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; badgeClass: string; color: string; bg: string }> = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    color: 'text-amber-300',
    bg: 'bg-amber-500/15 border-amber-500/25',
  },
  PAID: {
    label: 'Đã thanh toán',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15 border-emerald-500/25',
  },
  PACKING: {
    label: 'Đang đóng gói',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    color: 'text-amber-300',
    bg: 'bg-amber-500/15 border-amber-500/25',
  },
  SHIPPED: {
    label: 'Đang giao hàng',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    color: 'text-slate-300',
    bg: 'bg-slate-500/15 border-slate-500/25',
  },
  DELIVERED: {
    label: 'Giao thành công',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15 border-emerald-500/25',
  },
  CANCELED: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    color: 'text-rose-300',
    bg: 'bg-rose-500/15 border-rose-500/25',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
    color: 'text-rose-300',
    bg: 'bg-rose-500/15 border-rose-500/25',
  },
};

const ALLOWED_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELED'],
  PAID: ['PACKING', 'CANCELED'],
  PACKING: ['SHIPPED', 'CANCELED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELED: [],
  REFUNDED: [],
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'PACKING', label: 'Đang đóng gói' },
  { value: 'SHIPPED', label: 'Đang giao hàng' },
  { value: 'DELIVERED', label: 'Giao thành công' },
  { value: 'CANCELED', label: 'Đã hủy' },
  { value: 'REFUNDED', label: 'Đã hoàn tiền' },
];

export function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useAdminOrders({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter !== 'ALL' ? (statusFilter as OrderStatus) : undefined,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, orderCode: string) => {
    updateStatusMutation.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Cập nhật trạng thái thành công!</span>
              <span className="text-sm">Đơn hàng #{orderCode} đã chuyển sang {ORDER_STATUS_MAP[newStatus]?.label || newStatus}</span>
            </div>
          );
        },
        onError: (error: any) => {
          const message = typeof error?.response?.data?.message === 'string'
            ? error.response.data.message
            : 'Cập nhật thất bại. Vui lòng thử lại.';
          toast.error(message);
        },
      }
    );
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const config = ORDER_STATUS_MAP[status] || {
      label: status,
      badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
      color: 'text-slate-300',
      bg: 'bg-slate-500/15 border-slate-500/25',
    };
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', config.badgeClass)}>
        {config.label}
      </span>
    );
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center bg-card border border-border rounded-xl">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">Không thể tải danh sách đơn hàng</h2>
        <Button onClick={() => window.location.reload()} variant="outline">Thử lại</Button>
      </div>
    );
  }

  // Parse address for display (safely)
  const parseAddress = (addressJson: string | null) => {
    const addr = parseShippingAddress(addressJson);
    if (!addr) return '';

    const parts = [
      addr.line1,
      addr.ward,
      addr.district,
      addr.province,
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(', ');

    return addr.address || '';
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Quản lý đơn hàng</h1>
          <p className="text-muted-foreground mt-1 text-sm">Theo dõi và xử lý các đơn hàng của cửa hàng.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden md:flex border-border text-foreground hover:bg-muted/40">
            <Calendar className="mr-2 h-4 w-4 text-primary" />
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </Button>
          <Button>+ Tạo đơn hàng</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-card border-border shadow-sm hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Tổng đơn hàng tháng này
            </CardDescription>
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground">{data?.total || 0}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Tổng đơn trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm hover:border-amber-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Đang chờ xử lý
            </CardDescription>
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-300" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-amber-300">
              --
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Cần xác nhận và đóng gói</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
              Doanh thu hôm nay
            </CardDescription>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-emerald-300">--</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Ghi nhận trong ngày</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs with counts */}
      <div className="overflow-x-auto pb-1 scrollbar-hide">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <span>{tab.label}</span>
                {isActive && typeof data?.total === 'number' && (
                  <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.2 text-[10px] font-bold tabular-nums">
                    {data.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo mã đơn, khách hàng..."
            className="pl-9 bg-background border-border focus:bg-background/80 transition-colors text-foreground placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[200px] bg-background border-border text-foreground">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {Object.entries(ORDER_STATUS_MAP).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-border shadow-sm bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[700px] relative">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {!data?.data?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p>Không tìm thấy đơn hàng nào</p>
                    </td>
                  </tr>
                ) : (
                  data?.data?.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/40 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="font-mono text-xs font-bold text-foreground group-hover:text-primary transition-colors"
                          >
                            {order.code}
                          </Link>
                          <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5 max-w-[280px]">
                          {order.items?.slice(0, 2).map((item: any, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              <div className="relative w-8 h-8 rounded-md border border-border overflow-hidden shrink-0 bg-muted/30">
                                {item.variant?.product?.images?.[0] ? (
                                  <img
                                    src={item.variant.product.images[0]}
                                    alt="Product"
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate" title={item.nameSnapshot}>
                                  {item.nameSnapshot}
                                </p>
                                <p className="text-[11px] text-muted-foreground tabular-nums">
                                  x{item.quantity} {item.scentSnapshot && `• ${item.scentSnapshot}`}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-[11px] text-muted-foreground pl-1">
                              +{order.items!.length - 2} sản phẩm khác
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">{order.user?.name || order.user?.email}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{order.user?.phone || 'Chưa cập nhật SĐT'}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap max-w-xs truncate">
                          {parseAddress(order.addressJson)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold tabular-nums text-foreground">{formatCurrency(order.total)}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex justify-end items-center gap-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal border-border text-muted-foreground">
                            {order.paymentMethod}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(val) => handleUpdateStatus(order.id, val as OrderStatus, order.code)}
                          >
                            <SelectTrigger className="w-[125px] h-8 text-xs bg-background border-border text-foreground shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                              {[order.status, ...(ALLOWED_NEXT_STATUSES[order.status] || [])].map((status) => (
                                <SelectItem key={status} value={status} className="text-xs">
                                  {ORDER_STATUS_MAP[status]?.label || status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                            <Link to={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data?.totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-card/50">
            <span className="text-xs text-muted-foreground">
              Trang <span className="font-medium text-foreground tabular-nums">{page}</span> / {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 text-xs border-border"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="h-8 text-xs border-border"
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
