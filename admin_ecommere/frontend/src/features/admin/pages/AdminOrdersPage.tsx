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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAdminOrders, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import { useDashboardStats } from '../hooks/useDashboardStats';
import {
  formatCurrency,
  formatDateTime,
  parseShippingAddress,
  cn,
} from '@/lib/utils';
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
  MoreHorizontal,
  Ban,
  RotateCcw,
} from 'lucide-react';
import type { OrderStatus } from '../api/admin-orders.api';
import { useToast } from '@/hooks/useToast';

const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; badgeClass: string; color: string; bg: string }
> = {
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

const FORWARD_WORKFLOW_MAP: Partial<
  Record<OrderStatus, { nextStatus: OrderStatus; label: string }>
> = {
  PENDING_PAYMENT: { nextStatus: 'PAID', label: 'Xác nhận thanh toán' },
  PAID: { nextStatus: 'PACKING', label: 'Xác nhận đóng gói' },
  PACKING: { nextStatus: 'SHIPPED', label: 'Giao hàng' },
  SHIPPED: { nextStatus: 'DELIVERED', label: 'Giao thành công' },
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
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const [confirmAction, setConfirmAction] = useState<{
    orderId: string;
    orderCode: string;
    newStatus: OrderStatus;
    title: string;
    description: string;
  } | null>(null);

  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useAdminOrders({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter !== 'ALL' ? (statusFilter as OrderStatus) : undefined,
  });

  const { data: dashboardStats } = useDashboardStats();

  useEffect(() => {
    if (typeof data?.total === 'number' && !debouncedSearch) {
      setStatusCounts((prev) => ({
        ...prev,
        [statusFilter]: data.total,
      }));
    }
  }, [data?.total, statusFilter, debouncedSearch]);

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
              <span className="font-semibold">
                Cập nhật trạng thái thành công!
              </span>
              <span className="text-sm">
                Đơn hàng #{orderCode} đã chuyển sang{' '}
                {ORDER_STATUS_MAP[newStatus]?.label || newStatus}
              </span>
            </div>,
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

  const promptDestructiveAction = (
    orderId: string,
    newStatus: OrderStatus,
    orderCode: string,
  ) => {
    if (newStatus === 'CANCELED') {
      setConfirmAction({
        orderId,
        orderCode,
        newStatus,
        title: 'Xác nhận hủy đơn hàng',
        description: `Bạn có chắc chắn muốn hủy đơn hàng #${orderCode}? Thao tác này không thể hoàn tác và tồn kho sẽ được hoàn trả.`,
      });
    } else if (newStatus === 'REFUNDED') {
      setConfirmAction({
        orderId,
        orderCode,
        newStatus,
        title: 'Xác nhận hoàn tiền đơn hàng',
        description: `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng #${orderCode} sang Đã hoàn tiền? Thao tác này không thể hoàn tác.`,
      });
    } else {
      handleUpdateStatus(orderId, newStatus, orderCode);
    }
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const config = ORDER_STATUS_MAP[status] || {
      label: status,
      badgeClass: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
      color: 'text-slate-700',
      bg: 'bg-slate-50',
    };
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          config.badgeClass,
        )}
      >
        {config.label}
      </span>
    );
  };

  // Parse address for display (safely)
  const parseAddress = (addressJson: string | null) => {
    const addr = parseShippingAddress(addressJson);
    if (!addr) return '';

    const parts = [addr.line1, addr.ward, addr.district, addr.province].filter(
      Boolean,
    );

    if (parts.length > 0) return parts.join(', ');

    return addr.address || '';
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Quản lý đơn hàng
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Theo dõi và xử lý các đơn hàng của cửa hàng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm min-h-[44px] sm:min-h-0"
          >
            <Calendar className="mr-2 h-4 w-4 text-teal-600" />
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500">
              Tổng đơn hàng
            </CardDescription>
            <div className="h-9 w-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-slate-900">
              {data?.total ?? 0}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Tổng đơn trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500">
              Đang chờ xử lý
            </CardDescription>
            <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-amber-700">
              {dashboardStats?.orders?.pendingOrders ?? '--'}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Cần xác nhận và đóng gói
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500">
              Doanh thu tháng này
            </CardDescription>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl font-bold tabular-nums text-emerald-700">
              {dashboardStats?.revenue?.monthlyRevenue
                ? formatCurrency(dashboardStats.revenue.monthlyRevenue)
                : '--'}
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Ghi nhận trong tháng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs with counts */}
      <div className="overflow-x-auto pb-1 scrollbar-hide">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            const count = isActive ? data?.total : statusCounts[tab.value];
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[44px] sm:min-h-0',
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                )}
              >
                <span>{tab.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm kiếm theo mã đơn, khách hàng..."
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white focus:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 transition-colors text-slate-900 placeholder:text-slate-400 text-sm rounded-lg min-h-[44px] sm:min-h-0 sm:h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Mobile-only status select dropdown fallback when horizontal tabs overflow */}
        <div className="sm:hidden w-full">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full bg-white border-slate-200 text-slate-900 rounded-lg shadow-none text-sm min-h-[44px]">
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

      {/* Orders Table Container */}
      <div className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                className="h-14 w-full rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-rose-600" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900">
                Không thể tải danh sách đơn hàng
              </h3>
              <p className="text-xs text-slate-500">
                Đã có lỗi xảy ra khi tải dữ liệu từ máy chủ. Vui lòng thử lại.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="min-h-[44px] sm:min-h-0 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
            >
              Thử lại
            </Button>
          </div>
        ) : !data?.data?.length ? (
          <div className="px-4 py-12 text-center text-slate-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">Không tìm thấy đơn hàng nào</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto relative">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="px-4 py-3 normal-case tracking-normal font-semibold text-xs text-slate-600">
                      Mã đơn
                    </TableHead>
                    <TableHead className="px-4 py-3 normal-case tracking-normal font-semibold text-xs text-slate-600">
                      Sản phẩm
                    </TableHead>
                    <TableHead className="px-4 py-3 normal-case tracking-normal font-semibold text-xs text-slate-600">
                      Khách hàng
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right normal-case tracking-normal font-semibold text-xs text-slate-600">
                      Tổng tiền
                    </TableHead>
                    <TableHead className="px-4 py-3 text-center normal-case tracking-normal font-semibold text-xs text-slate-600">
                      Trạng thái
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right normal-case tracking-normal font-semibold text-xs text-slate-600">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {data.data.map((order) => {
                    const forwardAction = FORWARD_WORKFLOW_MAP[order.status];
                    const canCancel =
                      order.status === 'PENDING_PAYMENT' ||
                      order.status === 'PAID' ||
                      order.status === 'PACKING';
                    const canRefund = order.status === 'DELIVERED';

                    return (
                      <TableRow
                        key={order.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <TableCell className="px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="font-mono text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors"
                            >
                              {order.code}
                            </Link>
                            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {formatDateTime(order.createdAt)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 align-top">
                          <div className="space-y-1.5 max-w-[280px]">
                            {order.items?.slice(0, 2).map((item: any, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2.5"
                              >
                                <div className="relative w-8 h-8 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                                  {item.variant?.product?.images?.[0] ? (
                                    <img
                                      src={item.variant.product.images[0]}
                                      alt={item.nameSnapshot || 'Product'}
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
                                  <p
                                    className="text-xs font-medium text-slate-900 truncate"
                                    title={item.nameSnapshot}
                                  >
                                    {item.nameSnapshot}
                                  </p>
                                  <p className="text-xs text-slate-500 tabular-nums">
                                    x{item.quantity}{' '}
                                    {item.scentSnapshot &&
                                      `• ${item.scentSnapshot}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {(order.items?.length || 0) > 2 && (
                              <p className="text-xs text-slate-500 pl-1">
                                +{order.items!.length - 2} sản phẩm khác
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-900 text-xs">
                            {order.user?.name ||
                              order.user?.email ||
                              'Khách vãng lai'}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
                            {order.user?.phone || 'Chưa cập nhật SĐT'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 whitespace-pre-wrap max-w-xs leading-relaxed">
                            {parseAddress(order.addressJson)}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-right align-top">
                          <div className="font-semibold tabular-nums text-slate-900 text-sm">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex justify-end items-center gap-1">
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0.5 h-5 font-normal border-slate-200 bg-slate-50 text-slate-700"
                            >
                              {order.paymentMethod}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-center align-top">
                          <StatusBadge status={order.status} />
                        </TableCell>

                        <TableCell className="px-4 py-3 text-right align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            {forwardAction && (
                              <Button
                                size="sm"
                                disabled={updateStatusMutation.isPending}
                                onClick={() =>
                                  handleUpdateStatus(
                                    order.id,
                                    forwardAction.nextStatus,
                                    order.code,
                                  )
                                }
                                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium h-8 px-2.5 rounded-lg shadow-sm"
                              >
                                {forwardAction.label}
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                              asChild
                            >
                              <Link
                                to={`/admin/orders/${order.id}`}
                                aria-label={`Xem chi tiết đơn hàng ${order.code}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>

                            {(canCancel || canRefund) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                    aria-label={`Thao tác khác cho đơn hàng ${order.code}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44 bg-white"
                                >
                                  {canCancel && (
                                    <DropdownMenuItem
                                      className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 text-xs py-2 cursor-pointer"
                                      onClick={() =>
                                        promptDestructiveAction(
                                          order.id,
                                          'CANCELED',
                                          order.code,
                                        )
                                      }
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Hủy đơn hàng
                                    </DropdownMenuItem>
                                  )}
                                  {canRefund && (
                                    <DropdownMenuItem
                                      className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 text-xs py-2 cursor-pointer"
                                      onClick={() =>
                                        promptDestructiveAction(
                                          order.id,
                                          'REFUNDED',
                                          order.code,
                                        )
                                      }
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Hoàn tiền
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {data.data.map((order) => {
                const forwardAction = FORWARD_WORKFLOW_MAP[order.status];
                const canCancel =
                  order.status === 'PENDING_PAYMENT' ||
                  order.status === 'PAID' ||
                  order.status === 'PACKING';
                const canRefund = order.status === 'DELIVERED';

                return (
                  <div key={order.id} className="p-4 space-y-3 bg-white">
                    {/* Header: Code, Date, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-mono text-sm font-bold text-slate-900 hover:text-teal-600 transition-colors"
                        >
                          {order.code}
                        </Link>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Customer & Address */}
                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="font-semibold text-slate-900 text-sm">
                        {order.user?.name ||
                          order.user?.email ||
                          'Khách vãng lai'}
                      </div>
                      <div className="text-slate-600 tabular-nums">
                        {order.user?.phone || 'Chưa cập nhật SĐT'}
                      </div>
                      {parseAddress(order.addressJson) && (
                        <div className="text-slate-500 leading-relaxed pt-0.5 border-t border-slate-200/60 mt-1">
                          {parseAddress(order.addressJson)}
                        </div>
                      )}
                    </div>

                    {/* Items preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item: any, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5"
                          >
                            <div className="relative w-9 h-9 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                              {item.variant?.product?.images?.[0] ? (
                                <img
                                  src={item.variant.product.images[0]}
                                  alt={item.nameSnapshot || 'Product'}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">
                                {item.nameSnapshot}
                              </p>
                              <p className="text-xs text-slate-500 tabular-nums">
                                x{item.quantity}{' '}
                                {item.scentSnapshot &&
                                  `• ${item.scentSnapshot}`}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-slate-500 pl-1">
                            +{order.items.length - 2} sản phẩm khác
                          </p>
                        )}
                      </div>
                    )}

                    {/* Total and Payment Method */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-xs text-slate-500">
                          Tổng tiền:
                        </span>
                        <span className="ml-1.5 font-bold text-sm text-slate-900 tabular-nums">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0.5 h-6 font-normal border-slate-200 bg-slate-50 text-slate-700"
                      >
                        {order.paymentMethod}
                      </Badge>
                    </div>

                    {/* Mobile Action Controls (Touch Target >= 44px) */}
                    <div className="flex items-center gap-2 pt-2">
                      {forwardAction && (
                        <Button
                          className="flex-1 min-h-[44px] bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                          disabled={updateStatusMutation.isPending}
                          onClick={() =>
                            handleUpdateStatus(
                              order.id,
                              forwardAction.nextStatus,
                              order.code,
                            )
                          }
                        >
                          {forwardAction.label}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
                        asChild
                      >
                        <Link
                          to={`/admin/orders/${order.id}`}
                          aria-label={`Xem chi tiết đơn hàng ${order.code}`}
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      </Button>
                      {(canCancel || canRefund) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-11 w-11 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
                              aria-label={`Thao tác khác cho đơn hàng ${order.code}`}
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-white"
                          >
                            {canCancel && (
                              <DropdownMenuItem
                                className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 text-xs py-2.5 cursor-pointer"
                                onClick={() =>
                                  promptDestructiveAction(
                                    order.id,
                                    'CANCELED',
                                    order.code,
                                  )
                                }
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Hủy đơn hàng
                              </DropdownMenuItem>
                            )}
                            {canRefund && (
                              <DropdownMenuItem
                                className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 text-xs py-2.5 cursor-pointer"
                                onClick={() =>
                                  promptDestructiveAction(
                                    order.id,
                                    'REFUNDED',
                                    order.code,
                                  )
                                }
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Hoàn tiền
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {data && data?.totalPages > 1 && (
          <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Trang{' '}
              <span className="font-semibold text-slate-900 tabular-nums">
                {page}
              </span>{' '}
              / {data.totalPages}
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 sm:h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 sm:h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg"
              >
                Sau
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Destructive Actions */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmAction?.title}</DialogTitle>
            <DialogDescription>{confirmAction?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              className="min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
            >
              Đóng
            </Button>
            <Button
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700 text-white min-h-[44px] sm:min-h-0 text-xs sm:text-sm"
              onClick={() => {
                if (confirmAction) {
                  handleUpdateStatus(
                    confirmAction.orderId,
                    confirmAction.newStatus,
                    confirmAction.orderCode,
                  );
                  setConfirmAction(null);
                }
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
