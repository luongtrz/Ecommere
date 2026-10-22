import { SEO } from '@/lib/seo';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAdminOrder, useUpdateOrderStatus } from '../hooks/useAdminOrders';
import {
  formatCurrency,
  formatDateTime,
  parseShippingAddress,
  cn,
} from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
} from 'lucide-react';
import type { OrderStatus } from '../api/admin-orders.api';
import { useToast } from '@/hooks/useToast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ORDER_STATUS_MAP: Record<
  string,
  {
    label: string;
    badgeClass: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: any;
  }
> = {
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    variant: 'outline',
    icon: Clock,
  },
  PAID: {
    label: 'Đã thanh toán',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    variant: 'default',
    icon: CheckCircle,
  },
  PACKING: {
    label: 'Đang đóng gói',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    variant: 'secondary',
    icon: Package,
  },
  SHIPPED: {
    label: 'Đã giao vận',
    badgeClass: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
    variant: 'default',
    icon: Package,
  },
  DELIVERED: {
    label: 'Đã giao',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    variant: 'default',
    icon: CheckCircle,
  },
  CANCELED: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    variant: 'destructive',
    icon: Clock,
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    variant: 'destructive',
    icon: Clock,
  },
};

const STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELED'],
  PAID: ['PACKING', 'CANCELED'],
  PACKING: ['SHIPPED', 'CANCELED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELED: [],
  REFUNDED: [],
};

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  // Fetch single order by ID
  const { data: rawOrder, isLoading } = useAdminOrder(id || '');

  const updateStatus = useUpdateOrderStatus();

  // Parse addressJson if it exists
  const order = rawOrder
    ? {
        ...rawOrder,
        shippingAddress: parseShippingAddress(rawOrder.addressJson),
      }
    : null;

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    toast.promise(
      updateStatus.mutateAsync({ orderId: order.id, status: newStatus }),
      {
        loading: `Đang cập nhật trạng thái đơn hàng ${order.code}...`,
        success: () => {
          return `Đơn hàng ${order.code} đã được cập nhật thành "${ORDER_STATUS_MAP[newStatus]?.label || newStatus}"`;
        },
        error: (err) => {
          return `Không thể cập nhật đơn hàng: ${err?.message || 'Lỗi không xác định'}`;
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Không tìm thấy đơn hàng
        </h1>
        <Button
          asChild
          variant="outline"
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg"
        >
          <Link to="/admin/orders">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = ORDER_STATUS_MAP[order.status]?.icon || Clock;
  const availableStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <>
      <SEO title={`Đơn hàng ${order.code}`} />

      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header with status and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
            >
              <Link to="/admin/orders" aria-label="Quay lại danh sách đơn hàng">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
                <span className="font-mono">#{order.code}</span>
                <span className="text-xs md:text-sm font-normal text-slate-500">
                  ({formatDateTime(order.createdAt)})
                </span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                ORDER_STATUS_MAP[order.status]?.badgeClass,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
              {ORDER_STATUS_MAP[order.status]?.label}
            </span>

            {availableStatuses.length > 0 && (
              <Select value={order.status} onValueChange={handleUpdateStatus}>
                <SelectTrigger className="w-[180px] h-9 bg-white border-slate-200 text-slate-900 rounded-lg shadow-none text-xs">
                  <SelectValue placeholder="Cập nhật trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                  <SelectItem value={order.status} disabled>
                    {ORDER_STATUS_MAP[order.status]?.label}
                  </SelectItem>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ORDER_STATUS_MAP[status]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Responsive Grid: Items table & Timeline on left, Summary card on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Items Table + Timeline) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Item Table */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="py-3.5 px-4 md:px-6 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <Package className="h-4 w-4 text-teal-600" />
                  Sản phẩm ({order.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-center">Số lượng</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items?.map((item: any, index: number) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex gap-3 items-center">
                              <div className="w-12 h-12 bg-slate-50 rounded-lg flex-shrink-0 border border-slate-200 overflow-hidden">
                                {item.variant?.product?.images?.[0] ? (
                                  <img
                                    src={item.variant.product.images[0]}
                                    alt={item.variant?.product?.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-4 w-4 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="font-medium text-sm text-slate-900 truncate"
                                  title={item.variant?.product?.name}
                                >
                                  {item.variant?.product?.name}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Phân loại: {item.variant?.scent} -{' '}
                                  {item.variant?.volumeMl}ml
                                </p>
                                <p className="text-xs text-slate-400 font-mono">
                                  SKU: {item.variant?.sku}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums text-slate-900 font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                            {formatCurrency(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Timeline of status changes */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="py-3.5 px-4 md:px-6 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <Clock className="h-4 w-4 text-teal-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-6 relative pl-3 border-l-2 border-slate-200 ml-2">
                  <div className="relative pl-5">
                    <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <p className="font-medium text-xs text-slate-400 mb-0.5 tabular-nums">
                      {formatDateTime(order.createdAt)}
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      Đơn hàng được tạo
                    </p>
                  </div>

                  {order.updatedAt !== order.createdAt && (
                    <div className="relative pl-5">
                      <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                      <p className="font-medium text-xs text-slate-400 mb-0.5 tabular-nums">
                        {formatDateTime(order.updatedAt)}
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        Cập nhật gần nhất
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Trạng thái:{' '}
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ml-1',
                            ORDER_STATUS_MAP[order.status]?.badgeClass,
                          )}
                        >
                          {ORDER_STATUS_MAP[order.status]?.label}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary card for totals and address */}
          <div className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
              <CardHeader className="py-3.5 px-4 md:px-6 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <CreditCard className="h-4 w-4 text-teal-600" />
                  Thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4 text-sm">
                {/* Payment method & status */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Phương thức</span>
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs"
                  >
                    {order.paymentMethod}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Trạng thái</span>
                  <Badge
                    variant="secondary"
                    className="border-slate-200 bg-slate-100 text-slate-700 text-xs shadow-none"
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                <Separator className="bg-slate-200" />

                {/* Subtotals & Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tạm tính</span>
                    <span className="tabular-nums text-slate-900">
                      {formatCurrency(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phí vận chuyển</span>
                    <span className="tabular-nums text-slate-900">
                      {formatCurrency(order.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giảm giá</span>
                    <span className="tabular-nums text-rose-600 font-medium">
                      -{formatCurrency(order.discount)}
                    </span>
                  </div>
                </div>

                <Separator className="bg-slate-200" />
                <div className="flex justify-between items-baseline text-base font-bold">
                  <span className="text-slate-900">Tổng cộng</span>
                  <span className="tabular-nums text-xl text-teal-600 font-bold">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                <Separator className="bg-slate-200 my-2" />

                {/* Delivery Address */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 mb-3">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    Giao hàng
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60 text-xs">
                    <p className="font-semibold text-slate-900 text-sm">
                      {order.shippingAddress?.fullName}
                    </p>
                    <p className="text-slate-500 tabular-nums">
                      {order.shippingAddress?.phone}
                    </p>
                    <p className="text-slate-600 leading-relaxed mt-1">
                      {order.shippingAddress?.line1}
                      {order.shippingAddress?.line2 &&
                        `, ${order.shippingAddress.line2}`}
                      , {order.shippingAddress?.ward},{' '}
                      {order.shippingAddress?.district},{' '}
                      {order.shippingAddress?.province}
                    </p>
                  </div>
                </div>

                <Separator className="bg-slate-200 my-2" />

                {/* Customer Information */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider text-slate-500 mb-3">
                    <User className="h-3.5 w-3.5 text-teal-600" />
                    Khách hàng
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tên:</span>
                      <span className="font-medium text-slate-900">
                        {order.user?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium text-slate-900 truncate ml-2">
                        {order.user?.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SĐT:</span>
                      <span className="font-medium text-slate-900 tabular-nums">
                        {order.user?.phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
