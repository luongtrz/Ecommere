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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-[1.8rem] border border-border/60 shadow-luxury p-8 md:p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-muted-foreground text-sm mb-6">Đơn hàng bạn tìm kiếm có thể không tồn tại hoặc đã bị xóa.</p>
          <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11" asChild>
            <Link to="/orders">Xem tất cả đơn hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/25';
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25';
      case 'PACKING':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/25';
      case 'SHIPPED':
        return 'bg-secondary text-foreground border-border';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25';
      case 'CANCELED':
        return 'bg-rose-500/10 text-rose-700 border-rose-500/25';
      case 'REFUNDED':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
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

      <div className="min-h-screen bg-background py-8 md:py-16">
        <div className="container max-w-6xl px-4 space-y-8">
          {/* Header Section */}
          <div className="space-y-4 pb-6 border-b border-border/60">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
              <Link to="/orders" className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách đơn hàng
              </Link>
            </Button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground block mb-1">Chi tiết giao dịch</span>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">Chi tiết đơn hàng</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="font-mono font-semibold text-foreground">#{order.orderNumber}</span>
                  <span>•</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn("px-4 py-2 rounded-full flex items-center gap-2 border shadow-sm self-start md:self-auto", getStatusColor(order.status))}>
                {getStatusIcon(order.status)}
                <span className="font-semibold text-xs">{getStatusLabel(order.status)}</span>
              </Badge>
            </div>
          </div>

          {/* Status Timeline */}
          {!isCancelled && (
            <Card className="shadow-luxury border border-border/60 rounded-[1.8rem] bg-card overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-border/60 -translate-y-1/2 rounded-full hidden md:block" />
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
                            "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                            isCompleted
                              ? "bg-primary border-primary text-primary-foreground shadow-luxury"
                              : "bg-card border-border text-muted-foreground/40"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className={cn("font-semibold text-sm", isCompleted ? "text-foreground" : "text-muted-foreground/60")}>
                              {step.label}
                            </div>
                            {isCurrent && (
                              <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent-foreground mt-0.5">Hiện tại</div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="shadow-luxury border border-border/60 overflow-hidden rounded-[1.8rem] bg-card">
                <CardHeader className="bg-secondary/40 border-b border-border/50 py-4 px-6">
                  <CardTitle className="text-lg font-serif font-semibold text-foreground flex items-center gap-2.5">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Sản phẩm ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-5 md:p-6 hover:bg-secondary/20 transition-colors">
                        <div className="w-20 h-20 bg-secondary/40 rounded-xl overflow-hidden flex-shrink-0 border border-border/60">
                          {/* Placeholder for item image if available in future API response */}
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                            <Package className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-base mb-1 truncate">{item.name}</h4>
                          <div className="text-sm text-muted-foreground mb-2">Số lượng: {item.quantity}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-muted-foreground tabular-nums">
                              {formatCurrency(item.price)}
                            </div>
                            <div className="font-serif font-bold text-foreground text-base tabular-nums">
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
                <Card className="shadow-luxury border border-border/60 overflow-hidden rounded-[1.8rem] bg-card">
                  <CardHeader className="bg-secondary/40 border-b border-border/50 py-4 px-6">
                    <CardTitle className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Địa chỉ giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center text-foreground">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="font-semibold text-foreground">{order.shippingAddress?.fullName}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center text-foreground">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div className="text-foreground">{order.shippingAddress?.phone}</div>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed border border-border/40">
                        {order.shippingAddress?.address}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card className="shadow-luxury border border-border/60 overflow-hidden rounded-[1.8rem] bg-card">
                  <CardHeader className="bg-secondary/40 border-b border-border/50 py-4 px-6">
                    <CardTitle className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-11 h-11 bg-secondary rounded-xl flex items-center justify-center text-foreground">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Phương thức</div>
                        <div className="font-semibold text-foreground text-base mt-0.5">{order.paymentMethod}</div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border",
                        ['PAID', 'DELIVERED'].includes(order.status)
                          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25"
                          : (isCancelled
                            ? "bg-rose-500/10 text-rose-700 border-rose-500/25"
                            : "bg-amber-500/10 text-amber-700 border-amber-500/25")
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
              <Card className="shadow-luxury border border-border/60 sticky top-24 overflow-hidden rounded-[1.8rem] bg-card">
                <CardHeader className="bg-primary text-primary-foreground py-5 px-6">
                  <CardTitle className="text-base font-serif font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary-foreground/80" />
                    Tóm tắt chi phí
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Order Info */}
                  <div className="mb-6 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Ngày đặt hàng</div>
                        <div className="text-sm font-semibold text-foreground">{formatDateTime(order.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span className="font-medium text-foreground tabular-nums">{formatCurrency(order.total - order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phí vận chuyển:</span>
                      <span className="font-medium text-emerald-700 tabular-nums">
                        {order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/50 rounded-2xl flex justify-between items-baseline mb-6 border border-border/40">
                    <span className="text-sm font-semibold text-foreground">Tổng cộng:</span>
                    <span className="text-2xl font-serif font-bold text-foreground tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {/* Cancel Order */}
                  {canCancel && !showCancelConfirm && (
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-rose-500/30 text-rose-700 hover:bg-rose-500/10 hover:text-rose-800 transition-all h-10 text-xs"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Hủy đơn hàng
                      </Button>
                    </div>
                  )}

                  {showCancelConfirm && (
                    <div className="mb-4 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/25 space-y-3">
                      <p className="text-sm font-semibold text-rose-900">Bạn chắc chắn muốn hủy đơn hàng này?</p>
                      <p className="text-xs text-rose-700">Hành động này không thể hoàn tác. Sản phẩm sẽ được hoàn lại kho.</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full border-border text-xs"
                          onClick={() => setShowCancelConfirm(false)}
                          disabled={cancelOrder.isPending}
                        >
                          Không
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
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
                    <p className="text-xs text-muted-foreground mb-3">Gặp vấn đề với đơn hàng này?</p>
                    <Button variant="outline" className="w-full rounded-full border-border hover:bg-secondary text-foreground h-10 text-xs" asChild>
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
