
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
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
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

      <div className="min-h-screen bg-gray-50/30 pb-20">
        {/* Header Section with Gradient Background */}
        <div className="bg-white border-b border-gray-100">
          <div className="container max-w-5xl py-12 px-4">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3 tracking-tight">Đơn hàng của tôi</h1>
            <p className="text-gray-500 text-lg">Quản lý và theo dõi lịch sử mua sắm của bạn</p>

            {/* Stats Overview */}
            {allOrders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Tổng đơn</div>
                  <div className="text-2xl font-bold text-gray-900">{allOrders.length}</div>
                </div>
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
                  <div className="text-amber-600 text-xs font-medium uppercase tracking-wider mb-1">Đang xử lý</div>
                  <div className="text-2xl font-bold text-amber-700">
                    {allOrders.filter(o => ['PENDING_PAYMENT', 'PAID', 'PACKING', 'SHIPPED'].includes(o.status)).length}
                  </div>
                </div>
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                  <div className="text-emerald-600 text-xs font-medium uppercase tracking-wider mb-1">Hoàn thành</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {allOrders.filter(o => o.status === 'DELIVERED').length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Tổng chi tiêu</div>
                  <div className="text-lg font-bold text-gray-900 truncate">
                    {formatCurrency(allOrders.filter(o => o.status !== 'CANCELED').reduce((acc, curr) => acc + curr.total, 0))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-5xl px-4 mt-8">

          {/* Tabs Navigation */}
          {allOrders.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-gray-900 text-white shadow-md transform scale-[1.02]"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {activeTab === 'ALL' ? 'Bạn chưa có đơn hàng nào' : 'Không tìm thấy đơn hàng'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {activeTab === 'ALL'
                  ? 'Hãy khám phá các sản phẩm tuyệt vời của chúng tôi và đặt hàng ngay hôm nay!'
                  : 'Chưa có đơn hàng nào trong trạng thái này.'}
              </p>
              {activeTab === 'ALL' && (
                <Button size="lg" className="rounded-full bg-gray-900 hover:bg-black px-8" asChild>
                  <Link to="/catalog">Khám phá ngay</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order, index) => {
                const status = getStatusConfig(order.status);
                const StatusIcon = status.icon;
                const canCancel = ['PENDING_PAYMENT', 'PAID'].includes(order.status);

                return (
                  <div
                    key={order.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Card className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-2xl group hover:-translate-y-1">
                      {/* Order Header */}
                      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                            <Package className="w-5 h-5 text-gray-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-lg">#{order.orderNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDateTime(order.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={cn("px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-1.5", status.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </Badge>
                      </div>

                      {/* Order Body - Product List & Info */}
                      <div className="p-6">
                        {/* Horizontal Scrollable Product List */}
                        <div className="mb-6">
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex-shrink-0 w-[280px] flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-200">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <Package className="w-6 h-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <h4 className="font-medium text-gray-900 text-sm truncate w-full" title={item.productName || item.name}>
                                    {item.productName || item.name}
                                  </h4>
                                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                    <span>SL: x{item.quantity}</span>
                                    {/* Only show line total if needed, or keep minimal */}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="h-px bg-gray-100 w-full mb-6" />

                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Tổng tiền thanh toán</div>
                            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                              {formatCurrency(order.total)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            {canCancel && (
                              cancellingId === order.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    onClick={() => setCancellingId(null)}
                                    disabled={cancelOrder.isPending}
                                  >
                                    Hủy bỏ
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm"
                                    onClick={() => handleCancel(order.id)}
                                    disabled={cancelOrder.isPending}
                                  >
                                    {cancelOrder.isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="rounded-full border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                                  onClick={() => setCancellingId(order.id)}
                                >
                                  Hủy đơn hàng
                                </Button>
                              )
                            )}

                            <Button className="rounded-full bg-gray-900 hover:bg-black text-white px-6 shadow-md hover:shadow-lg transition-all" asChild>
                              <Link to={`/orders/${order.id}`} className="flex items-center gap-2">
                                Xem chi tiết
                                <ArrowRight className="w-4 h-4" />
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
