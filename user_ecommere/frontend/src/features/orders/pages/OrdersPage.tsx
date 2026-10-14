
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';
import {
  Package,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Order Status Helpers
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { label: 'Chờ thanh toán', color: 'text-amber-700 bg-amber-500/10 border-amber-500/25', icon: Clock };
    case 'PAID':
      return { label: 'Đã thanh toán', color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 };
    case 'PACKING':
      return { label: 'Đang đóng gói', color: 'text-amber-700 bg-amber-500/10 border-amber-500/25', icon: Package };
    case 'SHIPPED':
      return { label: 'Đang giao hàng', color: 'text-foreground bg-secondary border-border', icon: Truck };
    case 'DELIVERED':
      return { label: 'Giao thành công', color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 };
    case 'CANCELED':
      return { label: 'Đã hủy', color: 'text-rose-700 bg-rose-500/10 border-rose-500/25', icon: XCircle };
    case 'REFUNDED':
      return { label: 'Đã hoàn tiền', color: 'text-muted-foreground bg-muted border-border', icon: RotateCcw };
    default:
      return { label: status, color: 'text-muted-foreground bg-muted border-border', icon: AlertCircle };
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

      <div className="min-h-screen bg-background py-8 md:py-16">
        <div className="container max-w-5xl px-4 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
            <div>
              <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground block mb-2">Tài khoản cá nhân</span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">Đơn hàng của tôi</h1>
              <p className="text-muted-foreground text-sm mt-1">Quản lý và theo dõi đơn hàng</p>
            </div>

            {/* Filter Tabs */}
            {totalOrders > 0 && (
              <div className="flex items-center gap-1.5 bg-secondary/80 p-1.5 rounded-full border border-border/60 self-start md:self-auto overflow-x-auto max-w-full">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      activeTab === tab.id
                        ? "bg-card text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats Overview */}
          {totalOrders > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground">Tổng đơn</div>
                <div className="text-2xl font-serif font-bold text-foreground mt-1 tabular-nums">{totalOrders}</div>
              </div>
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="uppercase tracking-[0.2em] text-[10px] font-bold text-amber-700">Đang xử lý</div>
                <div className="text-2xl font-serif font-bold text-amber-700 mt-1 tabular-nums">
                  {allOrders.filter(o => ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'].includes(o.status)).length}
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="uppercase tracking-[0.2em] text-[10px] font-bold text-emerald-700">Hoàn thành</div>
                <div className="text-2xl font-serif font-bold text-emerald-700 mt-1 tabular-nums">
                  {allOrders.filter(o => o.status === 'DELIVERED').length}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-luxury transition-all duration-300 hover:-translate-y-0.5">
                <div className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground">Chi tiêu</div>
                <div className="text-lg md:text-xl font-serif font-bold text-foreground mt-1 truncate tabular-nums">
                  {formatCurrency(allOrders.filter(o => o.status !== 'CANCELED').reduce((acc, curr) => acc + curr.total, 0))}
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-[1.8rem] border border-border/60 bg-card p-12 md:p-16 text-center shadow-luxury animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-secondary/80 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/80" />
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">
                {activeTab === 'ALL' ? 'Chưa có đơn hàng' : 'Không có đơn hàng'}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm max-w-sm mx-auto">
                {activeTab === 'ALL'
                  ? 'Hãy đặt hàng ngay hôm nay!'
                  : 'Không tìm thấy đơn hàng trong mục này.'}
              </p>
              {activeTab === 'ALL' && (
                <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-10 text-xs shadow-sm" asChild>
                  <Link to="/catalog">Khám phá ngay</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredOrders.map((order, index) => {
                  const status = getStatusConfig(order.status);
                  const StatusIcon = status.icon;
                  const canCancel = ['PENDING_PAYMENT', 'PAID'].includes(order.status);

                  return (
                    <div
                      key={order.id}
                      className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Card className="overflow-hidden border border-border/60 shadow-luxury hover:shadow-luxury-glow transition-all duration-300 hover:-translate-y-0.5 bg-card rounded-[1.8rem] group">
                        {/* Header */}
                        <div className="px-5 md:px-6 py-4 border-b border-border/50 bg-secondary/30 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-foreground text-sm md:text-base tracking-wider">#{order.orderNumber}</span>
                            <span className="text-border">|</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDateTime(order.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 text-xs font-medium pointer-events-none", status.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </Badge>
                        </div>

                        {/* Body */}
                        <div className="p-5 md:p-6">
                          {/* Horizontal List */}
                          <div className="mb-4">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex-shrink-0 w-[240px] flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 border border-border/40 hover:border-border transition-colors">
                                  <div className="w-12 h-12 rounded-lg bg-card overflow-hidden flex-shrink-0 border border-border/60">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                                        <Package className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                    <h4 className="font-medium text-foreground text-xs truncate w-full" title={item.productName || item.name}>
                                      {item.productName || item.name}
                                    </h4>
                                    <div className="text-xs text-muted-foreground">
                                      x{item.quantity}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs uppercase tracking-[0.15em] font-bold text-muted-foreground">Tổng tiền:</span>
                              <span className="text-base md:text-lg font-serif font-bold text-foreground tabular-nums">
                                {formatCurrency(order.total)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {canCancel && (
                                cancellingId === order.id ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-3 text-xs rounded-full text-muted-foreground hover:text-foreground"
                                      onClick={() => setCancellingId(null)}
                                      disabled={cancelOrder.isPending}
                                    >
                                      Hủy
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-8 px-4 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs shadow-sm"
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
                                    className="h-8 px-3 rounded-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setCancellingId(order.id)}
                                  >
                                    Hủy đơn
                                  </Button>
                                )
                              )}

                              <Button size="sm" className="h-8 px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-sm" asChild>
                                <Link to={`/orders/${order.id}`} className="flex items-center gap-1.5">
                                  Chi tiết
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center pt-6">
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
