import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';
import {
  Package,
  Calendar,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Order Status Helpers
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

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PROCESSING', label: 'Đang xử lý', statuses: ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'] },
  { id: 'COMPLETED', label: 'Hoàn thành', statuses: ['DELIVERED'] },
  { id: 'CANCELLED', label: 'Đã hủy', statuses: ['CANCELED', 'REFUNDED'] },
];

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders(page);
  const cancelOrder = useCancelOrder();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      setCancellingId(null);
    } catch (error) {
      console.error('Cancel order failed:', error);
      const serverMessage = (error as any)?.response?.data?.message;
      const message =
        (Array.isArray(serverMessage) ? serverMessage.map((m: any) => (typeof m === 'string' ? m : String(m))).filter(Boolean).join(', ') : null) ||
        (typeof serverMessage === 'string' && serverMessage.trim() ? serverMessage : null) ||
        'Hủy đơn hàng thất bại. Vui lòng thử lại.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const allOrders = data?.orders || [];
  const totalOrders = data?.total ?? 0;
  const limit = 10;
  const totalPages = data?.totalPages ?? Math.ceil(totalOrders / limit);

  // Filter orders based on active tab
  const filteredOrders = activeTab === 'ALL'
    ? allOrders
    : allOrders.filter(order => {
      const tab = TABS.find(t => t.id === activeTab);
      return tab?.statuses?.includes(order.status);
    });

  return (
    <>
      <SEO title="Đơn hàng của tôi" />

      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="container max-w-5xl py-8 md:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Đơn hàng của tôi
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Quản lý và theo dõi đơn hàng
            </p>
          </div>

          {/* Stats Overview */}
          {totalOrders > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="surface p-4">
                <div className="text-xs text-muted-foreground font-medium uppercase">Tổng đơn</div>
                <div className="text-2xl font-semibold text-foreground tabular mt-1">{totalOrders}</div>
              </div>
              <div className="surface p-4">
                <div className="text-xs text-muted-foreground font-medium uppercase">Đang xử lý</div>
                <div className="text-2xl font-semibold text-foreground tabular mt-1">
                  {allOrders.filter(o => ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'].includes(o.status)).length}
                </div>
              </div>
              <div className="surface p-4">
                <div className="text-xs text-muted-foreground font-medium uppercase">Hoàn thành</div>
                <div className="text-2xl font-semibold text-foreground tabular mt-1">
                  {allOrders.filter(o => o.status === 'DELIVERED').length}
                </div>
              </div>
              <div className="surface p-4">
                <div className="text-xs text-muted-foreground font-medium uppercase">Chi tiêu</div>
                <div className="text-2xl font-semibold text-foreground tabular mt-1 truncate">
                  {formatCurrency(allOrders.filter(o => o.status !== 'CANCELED').reduce((acc, curr) => acc + curr.total, 0))}
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {totalOrders > 0 && (
            <div className="flex items-center gap-6 border-b border-border mb-8 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "pb-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "border-primary text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Orders List / Empty State */}
          {filteredOrders.length === 0 ? (
            <div className="surface p-12 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/60 mx-auto mb-4" strokeWidth={1.5} />
              <h2 className="font-serif text-xl font-semibold text-foreground mb-1">
                {activeTab === 'ALL' ? 'Chưa có đơn hàng' : 'Không có đơn hàng'}
              </h2>
              <p className="text-muted-foreground text-sm max-w-[45ch] mx-auto mb-6">
                {activeTab === 'ALL'
                  ? 'Hãy đặt hàng ngay hôm nay!'
                  : 'Không tìm thấy đơn hàng trong mục này.'}
              </p>
              {activeTab === 'ALL' && (
                <Button asChild>
                  <Link to="/catalog">Khám phá ngay</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const status = getStatusConfig(order.status);
                  const canCancel = ['PENDING_PAYMENT', 'PAID'].includes(order.status);

                  return (
                    <div
                      key={order.id}
                      className="surface border border-border p-5 transition-colors duration-150 hover:border-foreground/30"
                    >
                      {/* Top bar: Order code, date, status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-medium text-foreground tabular text-sm md:text-base">
                            #{order.orderNumber}
                          </span>
                          <span className="text-border" aria-hidden="true">•</span>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="tabular">{formatDateTime(order.createdAt)}</span>
                          </div>
                        </div>
                        <Badge
                          variant={status.variant as any}
                          className={cn(
                            status.variant === 'success' && 'bg-success text-success-foreground border-transparent'
                          )}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      {/* Middle/Bottom: Thumbnails, Total, Actions */}
                      <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Thumbnails row */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="w-10 h-10 rounded-md bg-secondary overflow-hidden flex-shrink-0 border border-border flex items-center justify-center"
                              title={`${item.productName || item.name} (x${item.quantity})`}
                            >
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName || item.name || 'Sản phẩm'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                          <span className="text-xs text-muted-foreground pl-1 truncate max-w-[240px] md:max-w-[320px]">
                            {order.items.length === 1
                              ? (order.items[0]?.productName || order.items[0]?.name)
                              : `${order.items[0]?.productName || order.items[0]?.name} (+${order.items.length - 1})`}
                          </span>
                        </div>

                        {/* Total & Action buttons */}
                        <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                          <div className="text-left md:text-right">
                            <span className="text-xs text-muted-foreground block">Tổng tiền</span>
                            <span className="text-base font-semibold text-foreground tabular">
                              {formatCurrency(order.total)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {canCancel && (
                              cancellingId === order.id ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCancellingId(null)}
                                    disabled={cancelOrder.isPending}
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancel(order.id)}
                                    disabled={cancelOrder.isPending}
                                  >
                                    {cancelOrder.isPending ? '...' : 'Xác nhận'}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => setCancellingId(order.id)}
                                >
                                  Hủy đơn
                                </Button>
                              )
                            )}

                            <Link
                              to={`/orders/${order.id}`}
                              className="text-sm font-medium text-foreground hover:underline inline-flex items-center gap-1 min-h-[44px] md:min-h-0 py-2"
                            >
                              <span>Xem chi tiết</span>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center pt-8">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
