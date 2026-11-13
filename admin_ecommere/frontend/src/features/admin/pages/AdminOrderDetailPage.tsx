import { useState } from 'react';
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
  Printer,
  Copy,
  AlertCircle,
  FileText,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
    label: 'Đang giao hàng',
    badgeClass: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
    variant: 'default',
    icon: Package,
  },
  DELIVERED: {
    label: 'Giao thành công',
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

const PAYMENT_STATUS_MAP: Record<
  string,
  {
    label: string;
    badgeClass: string;
  }
> = {
  PENDING: {
    label: 'Chờ thanh toán',
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  COMPLETED: {
    label: 'Đã thanh toán',
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  FAILED: {
    label: 'Thất bại',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  },
};

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [statusToConfirm, setStatusToConfirm] = useState<OrderStatus | null>(
    null,
  );

  // Fetch single order by ID
  const { data: rawOrder, isLoading, refetch } = useAdminOrder(id || '');

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

  const handleStatusSelect = (newStatus: OrderStatus) => {
    if (!order || newStatus === order.status) return;

    if (newStatus === 'CANCELED' || newStatus === 'REFUNDED') {
      setStatusToConfirm(newStatus);
      return;
    }

    handleUpdateStatus(newStatus);
  };

  const handleConfirmStatusChange = () => {
    if (statusToConfirm) {
      handleUpdateStatus(statusToConfirm);
      setStatusToConfirm(null);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error(`Không thể sao chép ${label}`);
    }
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
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy đơn hàng
          </h1>
          {id && (
            <p className="text-sm text-slate-500 font-mono">
              Mã tra cứu: #{id}
            </p>
          )}
          <p className="text-xs text-slate-400 max-w-sm">
            Đơn hàng không tồn tại hoặc đã xảy ra lỗi kết nối khi tải dữ liệu.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch?.()}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg min-h-11 sm:min-h-9"
          >
            Thử lại
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm rounded-lg min-h-11 sm:min-h-9"
          >
            <Link to="/admin/orders">Quay lại danh sách</Link>
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = ORDER_STATUS_MAP[order.status]?.icon || Clock;
  const availableStatuses = STATUS_TRANSITIONS[order.status] || [];

  const addressParts = [
    order.shippingAddress?.line1,
    order.shippingAddress?.line2,
    order.shippingAddress?.ward,
    order.shippingAddress?.district,
    order.shippingAddress?.province,
  ].filter(Boolean);

  const formattedAddress =
    addressParts.length > 0
      ? addressParts.join(', ')
      : order.shippingAddress?.address || 'Chưa có thông tin địa chỉ';

  return (
    <>
      <SEO title={`Đơn hàng ${order.code}`} />

      <div className="space-y-6 animate-in fade-in duration-300 print:space-y-4">
        {/* Header with status and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 print:hidden"
            >
              <Link to="/admin/orders" aria-label="Quay lại danh sách đơn hàng">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-2">
                <span className="font-mono">#{order.code}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(order.code, 'mã đơn hàng')}
                  className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md print:hidden"
                  aria-label="Sao chép mã đơn hàng"
                  title="Sao chép mã đơn hàng"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="min-h-11 sm:min-h-9 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-none rounded-lg text-xs print:hidden"
            >
              <Printer className="h-4 w-4 mr-1.5 text-slate-600" />
              In đơn hàng
            </Button>

            {availableStatuses.length > 0 && (
              <Select value={order.status} onValueChange={handleStatusSelect}>
                <SelectTrigger className="w-[180px] min-h-11 sm:min-h-9 bg-white border-slate-200 text-slate-900 rounded-lg shadow-none text-xs print:hidden">
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

        {/* Responsive Grid: Items table & Timeline on left, 3 Cards on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Items Table + Timeline) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Item Table */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden print:shadow-none print:border print:border-slate-300">
              <CardHeader className="py-3.5 px-4 md:px-6 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <Package className="h-4 w-4 text-teal-600" />
                  Sản phẩm ({order.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile View: Stacked Item Cards */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {order.items?.map((item: any, index: number) => {
                    const productName =
                      item.nameSnapshot ||
                      item.variant?.product?.name ||
                      'Sản phẩm';
                    const scent = item.scentSnapshot || item.variant?.scent;
                    const volume =
                      item.volumeSnapshot ?? item.variant?.volumeMl;
                    const sku = item.variant?.sku || 'N/A';
                    const image = item.variant?.product?.images?.[0];

                    return (
                      <div key={index} className="p-4 space-y-3">
                        <div className="flex gap-3">
                          <div className="w-14 h-14 bg-slate-50 rounded-lg flex-shrink-0 border border-slate-200 overflow-hidden">
                            {image ? (
                              <img
                                src={image}
                                alt={productName}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="font-medium text-sm text-slate-900 leading-snug"
                              title={productName}
                            >
                              {productName}
                            </p>
                            {(scent || volume !== undefined) && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                Phân loại:{' '}
                                {[
                                  scent,
                                  volume !== undefined && volume !== null
                                    ? `${volume}ml`
                                    : '',
                                ]
                                  .filter(Boolean)
                                  .join(' - ')}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              SKU: {sku}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="text-slate-600">
                            <span className="tabular-nums">
                              {formatCurrency(item.unitPrice)}
                            </span>
                            <span className="mx-1.5 text-slate-300">×</span>
                            <span className="font-medium text-slate-900 tabular-nums">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-900 text-sm tabular-nums">
                            {formatCurrency(item.lineTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-center">Số lượng</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items?.map((item: any, index: number) => {
                        const productName =
                          item.nameSnapshot ||
                          item.variant?.product?.name ||
                          'Sản phẩm';
                        const scent = item.scentSnapshot || item.variant?.scent;
                        const volume =
                          item.volumeSnapshot ?? item.variant?.volumeMl;
                        const sku = item.variant?.sku || 'N/A';
                        const image = item.variant?.product?.images?.[0];

                        return (
                          <tr
                            key={index}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex gap-3 items-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-lg flex-shrink-0 border border-slate-200 overflow-hidden">
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={productName}
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
                                    title={productName}
                                  >
                                    {productName}
                                  </p>
                                  {(scent || volume !== undefined) && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Phân loại:{' '}
                                      {[
                                        scent,
                                        volume !== undefined && volume !== null
                                          ? `${volume}ml`
                                          : '',
                                      ]
                                        .filter(Boolean)
                                        .join(' - ')}
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-400 font-mono">
                                    SKU: {sku}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* History of status changes (Timeline) */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl print:hidden">
              <CardHeader className="py-3.5 px-4 md:px-6 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <Clock className="h-4 w-4 text-teal-600" />
                  Lịch sử đơn hàng
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

                  {new Date(order.updatedAt).getTime() !==
                    new Date(order.createdAt).getTime() && (
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
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-1',
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

          {/* Right Column: 3 Dedicated Cards (Thanh toán, Giao hàng, Khách hàng) */}
          <div className="space-y-6">
            {/* Card 1: Thanh toán */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl print:shadow-none print:border print:border-slate-300">
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
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      PAYMENT_STATUS_MAP[order.paymentStatus]?.badgeClass ||
                        'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
                    )}
                  >
                    {PAYMENT_STATUS_MAP[order.paymentStatus]?.label ||
                      order.paymentStatus}
                  </span>
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
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      Giảm giá
                      {order.couponCode && (
                        <Badge
                          variant="outline"
                          className="border-teal-200 bg-teal-50 text-teal-700 text-xs font-mono px-1.5 py-0 shadow-none"
                        >
                          {order.couponCode}
                        </Badge>
                      )}
                    </span>
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
              </CardContent>
            </Card>

            {/* Card 2: Giao hàng */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl print:shadow-none print:border print:border-slate-300">
              <CardHeader className="py-3.5 px-4 md:px-6 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  Giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4 text-sm">
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200/60 text-xs">
                  <p className="font-semibold text-slate-900 text-sm">
                    {order.shippingAddress?.fullName ||
                      'Chưa có tên người nhận'}
                  </p>
                  {order.shippingAddress?.phone ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${order.shippingAddress.phone}`}
                        className="text-teal-600 hover:text-teal-700 hover:underline tabular-nums font-medium"
                      >
                        {order.shippingAddress.phone}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCopy(
                            order.shippingAddress!.phone!,
                            'số điện thoại',
                          )
                        }
                        className="h-6 w-6 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-md print:hidden"
                        aria-label="Sao chép số điện thoại"
                        title="Sao chép số điện thoại"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-slate-400">Chưa có số điện thoại</p>
                  )}
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <p className="text-slate-600 leading-relaxed">
                      {formattedAddress}
                    </p>
                    {formattedAddress !== 'Chưa có thông tin địa chỉ' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCopy(formattedAddress, 'địa chỉ giao hàng')
                        }
                        className="h-6 w-6 shrink-0 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-md print:hidden"
                        aria-label="Sao chép địa chỉ"
                        title="Sao chép địa chỉ"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Ghi chú đơn hàng */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    <span>Ghi chú đơn hàng</span>
                  </div>
                  <p
                    className={cn(
                      'text-xs leading-relaxed',
                      order.notes
                        ? 'text-slate-800 bg-amber-50/70 p-3 rounded-lg border border-amber-200/60'
                        : 'text-slate-400 italic',
                    )}
                  >
                    {order.notes || 'Không có ghi chú'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Khách hàng */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl print:shadow-none print:border print:border-slate-300">
              <CardHeader className="py-3.5 px-4 md:px-6 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900">
                  <User className="h-4 w-4 text-teal-600" />
                  Khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Tên:</span>
                  <span className="font-medium text-slate-900">
                    {order.user?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email:</span>
                  {order.user?.email ? (
                    <a
                      href={`mailto:${order.user.email}`}
                      className="font-medium text-teal-600 hover:text-teal-700 hover:underline truncate ml-2"
                    >
                      {order.user.email}
                    </a>
                  ) : (
                    <span className="font-medium text-slate-900 truncate ml-2">
                      N/A
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">SĐT:</span>
                  {order.user?.phone ? (
                    <a
                      href={`tel:${order.user.phone}`}
                      className="font-medium text-teal-600 hover:text-teal-700 hover:underline tabular-nums"
                    >
                      {order.user.phone}
                    </a>
                  ) : (
                    <span className="font-medium text-slate-900 tabular-nums">
                      N/A
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Irreversible status change confirmation dialog */}
        <Dialog
          open={!!statusToConfirm}
          onOpenChange={(open) => !open && setStatusToConfirm(null)}
        >
          <DialogContent className="sm:max-w-md bg-white border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-900">
                Xác nhận chuyển trạng thái đơn hàng
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Bạn có chắc chắn muốn chuyển đơn hàng{' '}
                <strong className="font-mono text-slate-900">
                  #{order.code}
                </strong>{' '}
                sang trạng thái{' '}
                <strong className="text-rose-600">
                  "
                  {statusToConfirm
                    ? ORDER_STATUS_MAP[statusToConfirm]?.label
                    : ''}
                  "
                </strong>
                ? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-200 hover:bg-slate-50 min-h-11 sm:min-h-9"
                onClick={() => setStatusToConfirm(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="min-h-11 sm:min-h-9 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleConfirmStatusChange}
              >
                Xác nhận thay đổi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
