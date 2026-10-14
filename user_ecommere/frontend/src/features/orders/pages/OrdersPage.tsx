
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
      return { label: 'Chờ thanh toán', color: 'text-amber-700 bg-amber-50 border-amber-200 ring-1 ring-amber-200', icon: Clock };
    case 'PAID':
      return { label: 'Đã thanh toán', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200', icon: CheckCircle2 };
    case 'PACKING':
      return { label: 'Đang đóng gói', color: 'text-amber-700 bg-amber-50 border-amber-200 ring-1 ring-amber-200', icon: Package };
    case 'SHIPPED':
      return { label: 'Đang giao hàng', color: 'text-teal-700 bg-teal-50 border-teal-200 ring-1 ring-teal-200', icon: Truck };
    case 'DELIVERED':
      return { label: 'Giao thành công', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200', icon: CheckCircle2 };
    case 'CANCELED':
      return { label: 'Đã hủy', color: 'text-rose-700 bg-rose-50 border-rose-200 ring-1 ring-rose-200', icon: XCircle };
    case 'REFUNDED':
      return { label: 'Đã hoàn tiền', color: 'text-slate-700 bg-slate-50 border-slate-200 ring-1 ring-slate-200', icon: RotateCcw };
    default:
      return { label: status, color: 'text-slate-700 bg-slate-50 border-slate-200 ring-1 ring-slate-200', icon: AlertCircle };
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

      <div className="min-h-screen bg-slate-50 py-8 md:py-12">
        <div className="container max-w-5xl px-4 space-y-6 md:space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="uppercase tracking-wider text-xs font-semibold text-teal-600 block mb-1">Tài khoản cá nhân</span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Đơn hàng của tôi</h1>
              <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi đơn hàng</p>
            </div>

            {/* Filter Tabs */}
            {totalOrders > 0 && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto overflow-x-auto max-w-full">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
                      activeTab === tab.id
                        ? "bg-white text-teal-700 shadow-sm font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
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
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="uppercase tracking-wider text-xs font-medium text-slate-500">Tổng đơn</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{totalOrders}</div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="uppercase tracking-wider text-xs font-medium text-amber-700">Đang xử lý</div>
                <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
                  {allOrders.filter(o => ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'].includes(o.status)).length}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="uppercase tracking-wider text-xs font-medium text-emerald-700">Hoàn thành</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
                  {allOrders.filter(o => o.status === 'DELIVERED').length}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="uppercase tracking-wider text-xs font-medium text-slate-500">Chi tiêu</div>
                <div className="text-lg md:text-xl font-bold text-teal-700 mt-1 truncate tabular-nums">
                  {formatCurrency(allOrders.filter(o => o.status !== 'CANCELED').reduce((acc, curr) => acc + curr.total, 0))}
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 md:p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                <ShoppingBag className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {activeTab === 'ALL' ? 'Chưa có đơn hàng' : 'Không có đơn hàng'}
              </h3>
              <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto">
                {activeTab === 'ALL'
                  ? 'Hãy đặt hàng ngay hôm nay!'
                  : 'Không tìm thấy đơn hàng trong mục này.'}
              </p>
              {activeTab === 'ALL' && (
                <Button size="sm" className="rounded-lg bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 px-6 h-10 text-xs font-medium shadow-sm transition-colors" asChild>
                  <Link to="/catalog">Khám phá ngay</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const status = getStatusConfig(order.status);
                  const StatusIcon = status.icon;
                  const canCancel = ['PENDING_PAYMENT', 'PAID'].includes(order.status);

                  return (
                    <div
                      key={order.id}
                      className="transition-all duration-200"
                    >
                      <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white rounded-xl group">
                        {/* Header */}
                        <div className="px-5 md:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-900 text-sm md:text-base tracking-wider">#{order.orderNumber}</span>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
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
                        <div className="p-5 md:px-6 md:py-5">
                          {/* Horizontal List */}
                          <div className="mb-4">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                              {order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex-shrink-0 w-[240px] flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                                  <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-slate-200">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Package className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                    <h4 className="font-medium text-slate-900 text-xs truncate w-full" title={item.productName || item.name}>
                                      {item.productName || item.name}
                                    </h4>
                                    <div className="text-xs text-slate-500">
                                      x{item.quantity}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Tổng tiền:</span>
                              <span className="text-base md:text-lg font-bold text-slate-900 tabular-nums">
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
                                      className="h-8 px-3 text-xs rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                      onClick={() => setCancellingId(null)}
                                      disabled={cancelOrder.isPending}
                                    >
                                      Hủy
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-8 px-4 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-medium shadow-sm transition-colors"
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
                                    className="h-8 px-3 rounded-lg text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                    onClick={() => setCancellingId(order.id)}
                                  >
                                    Hủy đơn
                                  </Button>
                                )
                              )}

                              <Button size="sm" className="h-8 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors" asChild>
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
