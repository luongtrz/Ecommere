import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import {
  Package,
  Calendar,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function formatOrderDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

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
            <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
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
                <div className="text-xs text-muted-foreground font-medium">Tổng đơn</div>
                <div className="text-xl sm:text-2xl font-semibold text-foreground tabular mt-1">{totalOrders}</div>
              </div>
              <div className="surface p-4">
                <div className="text-xs text-muted-foreground font-medium">Đang xử lý</div>
                <div className="text-xl sm:text-2xl font-semibold text-foreground tabular mt-1">
                  {allOrders.filter(o => ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'].includes(o.status)).length}
                </div>
              </div>
              <div className="surface p-4">
                <div className="text-xs text-muted-foreground font-medium">Hoàn thành</div>
                <div className="text-xl sm:text-2xl font-semibold text-foreground tabular mt-1">
                  {allOrders.filter(o => o.status === 'DELIVERED').length}
                </div>
              </div>
              <div className="surface p-4">
                <div className="text-xs text-muted-foreground font-medium">Chi tiêu</div>
                <div className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground tabular mt-1 break-words">
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
            <div className="surface p-8 sm:p-12">
              <EmptyState
                icon={<ShoppingBag className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />}
                title={activeTab === 'ALL' ? 'Chưa có đơn hàng' : 'Không có đơn hàng'}
                description={
                  activeTab === 'ALL'
                    ? 'Bạn chưa có đơn hàng nào trong mục này.'
                    : 'Không tìm thấy đơn hàng trong mục này.'
                }
                action={
                  activeTab === 'ALL' ? (
                    <Button asChild className="min-h-[44px]">
                      <Link to="/catalog">Khám phá sản phẩm</Link>
                    </Button>
                  ) : undefined
                }
              />
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
                      className="surface border border-border p-4 sm:p-5 relative transition-colors duration-150 hover:border-foreground/30 rounded-lg group"
                    >
                      {/* Top bar: Order code, date, status */}
                      <div className="pb-3.5 border-b border-border">
                        {/* Row 1: Code and Status on mobile, or full bar on desktop */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Link
                              to={`/orders/${order.id}`}
                              className="font-semibold text-foreground tabular text-sm sm:text-base hover:underline relative z-10"
                            >
                              #{order.orderNumber}
                            </Link>
                            <span className="text-border hidden sm:inline" aria-hidden="true">•</span>
                            <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="tabular">{formatOrderDate(order.createdAt)}</span>
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

                        {/* Row 2 (Mobile only: sm:hidden): Date on left, Total on right */}
                        <div className="flex sm:hidden items-center justify-between gap-2 mt-2 pt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="tabular">{formatOrderDate(order.createdAt)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground mr-1">Tổng tiền:</span>
                            <span className="text-sm font-semibold text-foreground tabular">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle/Bottom: Thumbnails, Total (desktop), Actions */}
                      <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        {/* Thumbnails row */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                          {order.items.map((item: any, idx: number) => {
                            const slug = item.slug || item.productSlug || item.variant?.product?.slug;
                            const name = item.productName || item.name || 'Sản phẩm';
                            const thumbContent = (
                              <div
                                className="w-10 h-10 rounded-md bg-secondary overflow-hidden flex-shrink-0 border border-border flex items-center justify-center"
                                title={`${name} (x${item.quantity})`}
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            );

                            return slug ? (
                              <Link
                                key={idx}
                                to={`/p/${slug}`}
                                className="relative z-10 transition-opacity hover:opacity-80"
                              >
                                {thumbContent}
                              </Link>
                            ) : (
                              <div key={idx}>{thumbContent}</div>
                            );
                          })}
                          <span className="text-sm text-muted-foreground pl-1 line-clamp-2 break-words max-w-[200px] sm:max-w-[280px]">
                            {order.items.length === 1
                              ? (order.items[0]?.productName || order.items[0]?.name)
                              : `${order.items[0]?.productName || order.items[0]?.name} (+${order.items.length - 1})`}
                          </span>
                        </div>

                        {/* Total (Desktop only) & Action buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                          {/* Desktop total */}
                          <div className="hidden sm:block text-right">
                            <span className="text-xs text-muted-foreground block">Tổng tiền</span>
                            <span className="text-base font-semibold text-foreground tabular">
                              {formatCurrency(order.total)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                            {canCancel && (
                              <div className="relative z-10">
                                {cancellingId === order.id ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="min-h-[44px] px-3 text-sm"
                                      onClick={() => setCancellingId(null)}
                                      disabled={cancelOrder.isPending}
                                    >
                                      Hủy
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="min-h-[44px] px-3 text-sm"
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
                                    className="text-muted-foreground hover:text-destructive min-h-[44px] px-3 text-sm"
                                    onClick={() => setCancellingId(order.id)}
                                  >
                                    Hủy đơn
                                  </Button>
                                )}
                              </div>
                            )}

                            <Link
                              to={`/orders/${order.id}`}
                              className="text-sm font-medium text-foreground hover:underline inline-flex items-center gap-1 min-h-[44px] px-2 py-2 after:absolute after:inset-0 after:z-0"
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
