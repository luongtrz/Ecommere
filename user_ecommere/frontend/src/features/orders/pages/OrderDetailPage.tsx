import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrderDetail, useCancelOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'DELIVERED':
      return { label: 'Giao thành công', variant: 'success' as const };
    case 'PENDING_PAYMENT':
      return { label: 'Chờ thanh toán', variant: 'secondary' as const };
    case 'PAID':
      return { label: 'Đã thanh toán', variant: 'secondary' as const };
    case 'PACKING':
      return { label: 'Đang đóng gói', variant: 'secondary' as const };
    case 'SHIPPED':
      return { label: 'Đang giao hàng', variant: 'secondary' as const };
    case 'CANCELED':
      return { label: 'Đã hủy', variant: 'destructive' as const };
    case 'REFUNDED':
      return { label: 'Đã hoàn tiền', variant: 'outline' as const };
    default:
      return { label: status, variant: 'outline' as const };
  }
};

const TIMELINE_STEPS = [
  { status: 'PENDING_PAYMENT', label: 'Đặt hàng' },
  { status: 'PACKING', label: 'Đóng gói' },
  { status: 'SHIPPED', label: 'Vận chuyển' },
  { status: 'DELIVERED', label: 'Giao hàng' },
];

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
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-background">
        <div className="surface max-w-md w-full p-8 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-muted-foreground text-sm mb-6">Đơn hàng bạn tìm kiếm có thể không tồn tại hoặc đã bị xóa.</p>
          <Button className="w-full" asChild>
            <Link to="/orders">Xem tất cả đơn hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const isCancelled = ['CANCELED', 'REFUNDED'].includes(order.status);
  const isDelivered = order.status === 'DELIVERED';

  const stepKeys = ['PENDING_PAYMENT', 'PACKING', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = stepKeys.indexOf(order.status) === -1
    ? (order.status === 'PAID' ? 0 : (isCancelled ? -1 : 0))
    : stepKeys.indexOf(order.status);

  return (
    <>
      <SEO title={`Đơn hàng #${order.orderNumber}`} />

      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="container max-w-6xl py-8 md:py-12">
          {/* Back link */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-muted-foreground hover:text-foreground">
              <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách đơn hàng
              </Link>
            </Button>
          </div>

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-border">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Chi tiết đơn hàng #{order.orderNumber}
                </h1>
                <Badge
                  variant={statusConfig.variant as any}
                  className={cn(
                    statusConfig.variant === 'success' && 'bg-success text-success-foreground border-transparent'
                  )}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 tabular">
                Ngày đặt hàng: {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Main Grid: Left content + Right sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 md:gap-10 items-start">
            {/* LEFT Column: Timeline + Items */}
            <div className="space-y-6">
              {/* Timeline */}
              {!isCancelled ? (
                <div className="surface p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
                    Tiến trình đơn hàng
                  </h2>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[5.5px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                    {TIMELINE_STEPS.map((step, index) => {
                      const isDone = isDelivered ? true : index < currentStepIndex;
                      const isCurrent = !isDelivered && index === currentStepIndex;
                      const isUpcoming = index > currentStepIndex;

                      return (
                        <div key={step.status} className="relative flex items-start gap-4">
                          <div
                            className={cn(
                              "absolute -left-6 top-1 h-3 w-3 rounded-full transition-colors z-10",
                              isDone && "bg-success",
                              isCurrent && "bg-primary ring-4 ring-primary/20",
                              isUpcoming && "border border-border bg-card"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium leading-none",
                                isCurrent ? "text-foreground font-semibold" : isDone ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-muted-foreground mt-1">Hiện tại</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="surface p-6 border-destructive/20 bg-destructive/5">
                  <div className="flex items-center gap-3 text-destructive">
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {order.status === 'CANCELED' ? 'Đơn hàng đã bị hủy' : 'Đơn hàng đã được hoàn tiền'}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="surface overflow-hidden">
                <div className="p-4 md:p-5 border-b border-border bg-muted/20">
                  <h2 className="text-sm font-semibold text-foreground">
                    Sản phẩm ({order.items.length})
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="p-4 md:p-5 flex items-center gap-4">
                      <div className="w-[72px] h-[72px] rounded-lg bg-secondary flex-shrink-0 overflow-hidden border border-border flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName || item.name || 'Sản phẩm'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm truncate">
                          {item.productName || item.name}
                        </h3>
                        {(item.variant?.name || item.variantName) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.variant?.name || item.variantName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 tabular">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-foreground tabular text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT Column: Stacked surface blocks */}
            <div className="space-y-6">
              {/* Shipping address */}
              <div className="surface p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Địa chỉ giao hàng
                </h2>
                {order.shippingAddress ? (
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-foreground">{order.shippingAddress.fullName}</div>
                    <div className="text-muted-foreground tabular">{order.shippingAddress.phone}</div>
                    <div className="text-muted-foreground leading-relaxed text-xs pt-1">
                      {[
                        order.shippingAddress.address,
                        order.shippingAddress.ward,
                        order.shippingAddress.district,
                        order.shippingAddress.province
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Không có thông tin địa chỉ</p>
                )}
              </div>

              {/* Payment method */}
              <div className="surface p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Thanh toán
                </h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Phương thức</span>
                  <span className="font-medium text-foreground">{order.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <Badge
                    variant={['PAID', 'DELIVERED'].includes(order.status) ? 'secondary' : (isCancelled ? 'destructive' : 'outline')}
                  >
                    {['PAID', 'DELIVERED'].includes(order.status) ? 'Đã thanh toán' : (isCancelled ? 'Đã hủy' : 'Chưa thanh toán')}
                  </Badge>
                </div>
              </div>

              {/* Price summary */}
              <div className="surface p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Tóm tắt chi phí
                </h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span className="tabular font-medium text-foreground">
                      {formatCurrency(order.total - order.shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển:</span>
                    <span className="tabular font-medium text-foreground">
                      {order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}
                    </span>
                  </div>
                </div>

                {/* Hairline before total */}
                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <span className="text-base font-semibold text-foreground">Tổng cộng:</span>
                  <span className="text-xl font-semibold text-foreground tabular">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                {/* Cancel action */}
                {canCancel && !showCancelConfirm && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                      onClick={() => setShowCancelConfirm(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Hủy đơn hàng
                    </Button>
                  </div>
                )}

                {showCancelConfirm && (
                  <div className="pt-2 p-3 bg-secondary/50 rounded-md border border-border space-y-3">
                    <p className="text-sm font-medium text-foreground">Bạn chắc chắn muốn hủy đơn hàng này?</p>
                    <p className="text-xs text-muted-foreground">Hành động này không thể hoàn tác. Sản phẩm sẽ được hoàn lại kho.</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={cancelOrder.isPending}
                      >
                        Không
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={handleCancelOrder}
                        disabled={cancelOrder.isPending}
                      >
                        {cancelOrder.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Support */}
                <div className="pt-3 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground mb-2">Gặp vấn đề với đơn hàng này?</p>
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" asChild>
                    <Link to="/support">Gửi yêu cầu hỗ trợ</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
