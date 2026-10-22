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
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  PAID: {
    label: 'Đã thanh toán',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  PACKING: {
    label: 'Đang đóng gói',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  SHIPPED: {
    label: 'Đang giao hàng',
    badgeClass: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
    color: 'text-slate-700',
    bg: 'bg-slate-50',
  },
  DELIVERED: {
    label: 'Giao thành công',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  CANCELED: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
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

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    orderCode: string,
  ) => {
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
          const message =
            typeof error?.response?.data?.message === 'string'
              ? error.response.data.message
              : 'Cập nhật thất bại. Vui lòng thử lại.';
          toast.error(message);
        },
      },
    );
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const config = ORDER_STATUS_MAP[status] || {
      label: status,
      badgeClass: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
      color: 'text-slate-700',
      bg: 'bg-slate-50',
    };
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.badgeClass)}>
        {config.label}
      </span>
    );
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
        <AlertCircle className="h-12 w-12 text-rose-600" />
        <h2 className="text-lg font-semibold text-slate-900">Không thể tải danh sách đơn hàng</h2>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700">Thử lại</Button>
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Quản lý đơn hàng</h1>
          <p className="text-slate-500 mt-1 text-sm">Theo dõi và xử lý các đơn hàng của cửa hàng.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm">
            <Calendar className="mr-2 h-4 w-4 text-teal-600" />
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </Button>
          <Button className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 shadow-sm">+ Tạo đơn hàng</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-slate-500">
              Tổng đơn hàng tháng này
            </CardDescription>
            <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-slate-900">{data?.total || 0}</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Tổng đơn trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-slate-500">
              Đang chờ xử lý
            </CardDescription>
            <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-amber-700">
              --
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">Cần xác nhận và đóng gói</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-slate-500">
              Doanh thu hôm nay
            </CardDescription>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-emerald-700">--</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Ghi nhận trong ngày</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs with counts */}
      <div className="overflow-x-auto pb-1 scrollbar-hide">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
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
                    ? 'bg-teal-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <span>{tab.label}</span>
                {isActive && typeof data?.total === 'number' && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                    {data.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo mã đơn, khách hàng..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white focus:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 transition-colors text-slate-900 placeholder:text-slate-400 text-sm rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-white border-slate-200 text-slate-900 rounded-lg shadow-none text-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              {Object.entries(ORDER_STATUS_MAP).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[700px] relative">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!data?.data?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p>Không tìm thấy đơn hàng nào</p>
                    </td>
                  </tr>
                ) : (
                  data?.data?.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="font-mono text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors"
                          >
                            {order.code}
                          </Link>
                          <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5 max-w-[280px]">
                          {order.items?.slice(0, 2).map((item: any, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              <div className="relative w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                                {item.variant?.product?.images?.[0] ? (
                                  <img
                                    src={item.variant.product.images[0]}
                                    alt="Product"
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-3.5 w-3.5 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-900 truncate" title={item.nameSnapshot}>
                                  {item.nameSnapshot}
                                </p>
                                <p className="text-[11px] text-slate-500 tabular-nums">
                                  x{item.quantity} {item.scentSnapshot && `• ${item.scentSnapshot}`}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(order.items?.length || 0) > 2 && (
                            <p className="text-[11px] text-slate-400 pl-1">
                              +{order.items!.length - 2} sản phẩm khác
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 text-xs">{order.user?.name || order.user?.email}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">{order.user?.phone || 'Chưa cập nhật SĐT'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 whitespace-pre-wrap max-w-xs truncate">
                          {parseAddress(order.addressJson)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold tabular-nums text-slate-900">{formatCurrency(order.total)}</div>
                        <div className="text-xs text-slate-400 mt-1 flex justify-end items-center gap-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal border-slate-200 bg-slate-50 text-slate-600">
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
                            onValueChange={(val) =>
                              handleUpdateStatus(
                                order.id,
                                val as OrderStatus,
                                order.code,
                              )
                            }
                          >
                            <SelectTrigger className="w-[125px] h-8 text-xs bg-white border-slate-200 text-slate-700 shadow-none rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                              {[order.status, ...(ALLOWED_NEXT_STATUSES[order.status] || [])].map((status) => (
                                <SelectItem key={status} value={status} className="text-xs">
                                  {ORDER_STATUS_MAP[status]?.label || status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" asChild>
                            <Link to={`/admin/orders/${order.id}`} aria-label={`Xem chi tiết đơn hàng ${order.code}`}>
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
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Trang <span className="font-semibold text-slate-900 tabular-nums">{page}</span> / {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg"
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
