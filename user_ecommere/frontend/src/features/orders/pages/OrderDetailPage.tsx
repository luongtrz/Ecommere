import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrderDetail, useCancelOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingBag,
  Calendar,
  Phone,
  User,
  XCircle,
  RotateCcw
} from 'lucide-react';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrderDetail(orderId!);
  const cancelOrder = useCancelOrder();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canCancel = order && ['PENDING_PAYMENT', 'PAID'].includes(order.status);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    try {
      await cancelOrder.mutateAsync(orderId);
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Cancel order failed:', error);
      alert('Hủy đơn hàng thất bại. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
            <AlertCircle className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Không tìm thấy đơn hàng</h2>
          <p className="text-slate-500 text-sm mb-6">Đơn hàng bạn tìm kiếm có thể không tồn tại hoặc đã bị xóa.</p>
          <Button className="w-full rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 h-11 font-medium transition-colors" asChild>
            <Link to="/orders">Xem tất cả đơn hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200';
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-200';
      case 'PACKING':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200';
      case 'SHIPPED':
        return 'bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-200';
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-200';
      case 'CANCELED':
        return 'bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200';
      case 'REFUNDED':
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 ring-1 ring-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'SHIPPED':
        return <Truck className="h-3.5 w-3.5" />;
      case 'PENDING_PAYMENT':
        return <Clock className="h-3.5 w-3.5" />;
      case 'CANCELED':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'REFUNDED':
        return <RotateCcw className="h-3.5 w-3.5" />;
      default:
        return <Package className="h-3.5 w-3.5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Chờ thanh toán';
      case 'PAID': return 'Đã thanh toán';
      case 'PACKING': return 'Đang đóng gói';
      case 'SHIPPED': return 'Đang giao hàng';
      case 'DELIVERED': return 'Giao thành công';
      case 'CANCELED': return 'Đã hủy';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  // Status steps for timeline
  const steps = ['PENDING_PAYMENT', 'PACKING', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = steps.indexOf(order.status) === -1
    ? (order.status === 'PAID' ? 0 : (['CANCELED', 'REFUNDED'].includes(order.status) ? -1 : 0))
    : steps.indexOf(order.status);

  const isCancelled = ['CANCELED', 'REFUNDED'].includes(order.status);

  return (
    <>
      <SEO title={`Đơn hàng #${order.orderNumber}`} />

      <div className="min-h-screen bg-slate-50 py-8 md:py-12">
        <div className="container max-w-6xl px-4 space-y-6 md:space-y-8">
          {/* Header Section */}
          <div className="space-y-4 pb-6 border-b border-slate-200">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-slate-500 hover:text-teal-600">
              <Link to="/orders" className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách đơn hàng
              </Link>
            </Button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="uppercase tracking-wider text-xs font-semibold text-teal-600 block mb-1">Chi tiết giao dịch</span>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Chi tiết đơn hàng</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                  <span className="font-mono font-semibold text-slate-900">#{order.orderNumber}</span>
                  <span>•</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn("px-4 py-1.5 rounded-full flex items-center gap-2 border text-xs font-semibold shadow-sm self-start md:self-auto", getStatusColor(order.status))}>
                {getStatusIcon(order.status)}
                <span>{getStatusLabel(order.status)}</span>
              </Badge>
            </div>
          </div>

          {/* Status Timeline */}
          {!isCancelled && (
            <Card className="shadow-sm border border-slate-200 rounded-xl bg-white overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -translate-y-1/2 rounded-full hidden md:block" />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                    {[
                      { status: 'PENDING_PAYMENT', label: 'Đặt hàng', icon: Clock },
                      { status: 'PACKING', label: 'Đóng gói', icon: Package },
                      { status: 'SHIPPED', label: 'Vận chuyển', icon: Truck },
                      { status: 'DELIVERED', label: 'Giao hàng', icon: CheckCircle }
                    ].map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.status} className="flex md:flex-col items-center gap-4 md:gap-3 md:text-center">
                          <div className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border-2",
                            isCompleted
                              ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-400"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className={cn("font-semibold text-sm", isCompleted ? "text-slate-900" : "text-slate-400")}>
                              {step.label}
                            </div>
                            {isCurrent && (
                              <div className="text-[10px] uppercase tracking-wider font-bold text-teal-600 mt-0.5">Hiện tại</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="shadow-sm border border-slate-200 overflow-hidden rounded-xl bg-white">
                <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-6">
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2.5">
                    <ShoppingBag className="h-5 w-5 text-teal-600" />
                    Sản phẩm ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-5 md:p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                          {/* Placeholder for item image if available in future API response */}
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-base mb-1 truncate">{item.name}</h4>
                          <div className="text-sm text-slate-500 mb-2">Số lượng: {item.quantity}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-500 tabular-nums">
                              {formatCurrency(item.price)}
                            </div>
                            <div className="font-semibold text-slate-900 text-base tabular-nums">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden rounded-xl bg-white">
                  <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-6">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      Địa chỉ giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="font-semibold text-slate-900">{order.shippingAddress?.fullName}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div className="text-slate-900 font-medium">{order.shippingAddress?.phone}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3.5 text-sm text-slate-600 leading-relaxed border border-slate-200/70">
                        {order.shippingAddress?.address}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card className="shadow-sm border border-slate-200 overflow-hidden rounded-xl bg-white">
                  <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-6">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-teal-600" />
                      Thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Phương thức</div>
                        <div className="font-semibold text-slate-900 text-base mt-0.5">{order.paymentMethod}</div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border",
                        ['PAID', 'DELIVERED'].includes(order.status)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-200"
                          : (isCancelled
                            ? "bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-200")
                      )}
                    >
                      {['PAID', 'DELIVERED'].includes(order.status) ? 'Đã thanh toán' : (isCancelled ? 'Đã hủy' : 'Chưa thanh toán')}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-sm border border-slate-200 sticky top-24 overflow-hidden rounded-xl bg-white">
                <CardHeader className="bg-teal-600 text-white py-4 px-6">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-white/90" />
                    Tóm tắt chi phí
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Order Info */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-teal-600">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Ngày đặt hàng</div>
                        <div className="text-sm font-semibold text-slate-900">{formatDateTime(order.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tạm tính:</span>
                      <span className="font-medium text-slate-900 tabular-nums">{formatCurrency(order.total - order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Phí vận chuyển:</span>
                      <span className="font-medium text-emerald-600 tabular-nums">
                        {order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-baseline mb-6 border border-slate-200">
                    <span className="text-sm font-semibold text-slate-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {/* Cancel Order */}
                  {canCancel && !showCancelConfirm && (
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        className="w-full rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors h-10 text-xs font-medium"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Hủy đơn hàng
                      </Button>
                    </div>
                  )}

                  {showCancelConfirm && (
                    <div className="mb-4 p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
                      <p className="text-sm font-semibold text-rose-900">Bạn chắc chắn muốn hủy đơn hàng này?</p>
                      <p className="text-xs text-rose-700">Hành động này không thể hoàn tác. Sản phẩm sẽ được hoàn lại kho.</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={cancelOrder.isPending}
                        >
                          Không
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-medium shadow-sm transition-colors"
                          onClick={handleCancelOrder}
                          disabled={cancelOrder.isPending}
                        >
                          {cancelOrder.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Support */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-400 mb-3">Gặp vấn đề với đơn hàng này?</p>
                    <Button variant="outline" className="w-full rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-10 text-xs font-medium" asChild>
                      <Link to="/support">Gửi yêu cầu hỗ trợ</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
