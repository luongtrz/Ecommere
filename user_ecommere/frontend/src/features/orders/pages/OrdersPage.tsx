
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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
      return { label: 'Chờ thanh toán', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock };
    case 'PAID':
      return { label: 'Đã thanh toán', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle2 };
    case 'PACKING':
      return { label: 'Đang đóng gói', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Package };
    case 'SHIPPED':
      return { label: 'Đang giao hàng', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: Truck };
    case 'DELIVERED':
      return { label: 'Giao thành công', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
    case 'CANCELED':
      return { label: 'Đã hủy', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: XCircle };
    case 'REFUNDED':
      return { label: 'Đã hoàn tiền', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: RotateCcw };
    default:
      return { label: status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: AlertCircle };
  }
};

const TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PROCESSING', label: 'Đang xử lý', statuses: ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'] },
  { id: 'COMPLETED', label: 'Hoàn thành', statuses: ['DELIVERED'] },
  { id: 'CANCELLED', label: 'Đã hủy', statuses: ['CANCELED', 'REFUNDED'] },
];

export function OrdersPage() {
  const { data, isLoading } = useOrders();
  const cancelOrder = useCancelOrder();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      setCancellingId(null);
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

  const allOrders = data?.orders || [];

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

      <div className="bg-gray-50/30 pb-10 min-h-[calc(100vh-4rem)]">
        {/* Header Section Compact */}
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container max-w-5xl py-6 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Đơn hàng của tôi</h1>
                <p className="text-gray-500 text-sm">Quản lý và theo dõi đơn hàng</p>
              </div>

              {/* Tabs moved to Header for compactness */}
              {allOrders.length > 0 && (
                <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg self-start md:self-center overflow-x-auto max-w-full">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
                        activeTab === tab.id
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Overview Compact */}
            {allOrders.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Tổng đơn</div>
                  <div className="text-xl font-bold text-gray-900">{allOrders.length}</div>
                </div>
                <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50 flex items-center justify-between">
                  <div className="text-amber-600 text-xs font-medium uppercase tracking-wider">Đang xử lý</div>
                  <div className="text-xl font-bold text-amber-700">
                    {allOrders.filter(o => ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'].includes(o.status)).length}
                  </div>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 flex items-center justify-between">
                  <div className="text-emerald-600 text-xs font-medium uppercase tracking-wider">Hoàn thành</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {allOrders.filter(o => o.status === 'DELIVERED').length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Chi tiêu</div>
                  <div className="text-lg font-bold text-gray-900 truncate">
                    {formatCurrency(allOrders.filter(o => o.status !== 'CANCELED').reduce((acc, curr) => acc + curr.total, 0))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-5xl px-4 mt-6">
          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {activeTab === 'ALL' ? 'Chưa có đơn hàng' : 'Không có đơn hàng'}
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                {activeTab === 'ALL'
                  ? 'Hãy đặt hàng ngay hôm nay!'
                  : 'Không tìm thấy đơn hàng trong mục này.'}
              </p>
              {activeTab === 'ALL' && (
                <Button size="sm" className="rounded-full bg-gray-900 hover:bg-black px-6" asChild>
                  <Link to="/catalog">Khám phá ngay</Link>
                </Button>
              )}
            </div>
          ) : (
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
                    <Card className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-xl group">
                      {/* Compact Header */}
                      <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 text-base">#{order.orderNumber}</span>
                          <span className="text-gray-300">|</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </div>
                        <Badge className={cn("px-2 py-1 rounded-md border shadow-sm flex items-center gap-1 text-xs font-normal", status.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </div>

                      {/* Compact Body */}
                      <div className="p-4">
                        {/* Horizontal List */}
                        <div className="mb-4">
                          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex-shrink-0 w-[220px] flex gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="w-12 h-12 rounded-md bg-white overflow-hidden flex-shrink-0 border border-gray-200">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                  <h4 className="font-medium text-gray-900 text-xs truncate w-full" title={item.productName || item.name}>
                                    {item.productName || item.name}
                                  </h4>
                                  <div className="text-xs text-gray-500">
                                    x{item.quantity}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Tổng tiền:</span>
                            <span className="text-base font-bold text-gray-900">
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
                                    className="h-8 px-3 text-xs text-gray-600"
                                    onClick={() => setCancellingId(null)}
                                    disabled={cancelOrder.isPending}
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white text-xs"
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
                                  className="h-8 px-3 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setCancellingId(order.id)}
                                >
                                  Hủy đơn
                                </Button>
                              )
                            )}

                            <Button size="sm" className="h-8 px-4 rounded-full bg-gray-900 hover:bg-black text-white text-xs shadow-sm" asChild>
                              <Link to={`/orders/${order.id}`} className="flex items-center gap-1">
                                Chi tiết
                                <ArrowRight className="w-3 h-3" />
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
          )}
        </div>
      </div>
    </>
  );
}
