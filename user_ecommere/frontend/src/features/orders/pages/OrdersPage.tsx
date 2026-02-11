import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrders, useCancelOrder } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';
import {
  Package,
  Calendar,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  ArrowRight,
  Plus,
  ShoppingBag,
  XCircle,
  RotateCcw
} from 'lucide-react';

export function OrdersPage() {
  const { data, isLoading } = useOrders();
  const cancelOrder = useCancelOrder();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const orders = data?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-100';
      case 'PAID':
        return 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-100';
      case 'PACKING':
        return 'bg-purple-100 text-purple-700 border-purple-200 ring-purple-100';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-indigo-100';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-100';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-700 border-rose-200 ring-rose-100';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-700 border-gray-200 ring-gray-100';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 ring-gray-100';
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
      case 'CANCELLED':
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
      case 'CANCELLED': return 'Đã hủy';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  return (
    <>
      <SEO title="Đơn hàng của tôi" />

      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-20 pt-10 px-4">
          <div className="container max-w-6xl">
            <h1 className="text-3xl font-bold mb-2">Lịch sử đơn hàng</h1>
            <p className="text-blue-100 opacity-90">Quản lý và theo dõi các đơn hàng của bạn</p>
          </div>
        </div>

        <div className="container py-8 max-w-6xl -mt-16 px-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100 animate-fade-in">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ShoppingBag className="h-10 w-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Bạn chưa đặt đơn hàng nào. Hãy bắt đầu mua sắm để có những trải nghiệm tuyệt vời tại Thai Spray Shop!
              </p>
              <Button size="lg" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20" asChild>
                <Link to="/catalog" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Bắt đầu mua sắm
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                    <div className="text-sm text-gray-500">Tổng đơn hàng</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {orders.filter(o => o.status === 'DELIVERED').length}
                    </div>
                    <div className="text-sm text-gray-500">Đơn hàng thành công</div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {orders.filter(o => ['PENDING_PAYMENT', 'PACKING', 'SHIPPED'].includes(o.status)).length}
                    </div>
                    <div className="text-sm text-gray-500">Đơn hàng đang xử lý</div>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-5">
                {orders.map((order, index) => (
                  <Card
                    key={order.id}
                    className="shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden rounded-2xl hover:-translate-y-1 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                              <Package className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">#{order.orderNumber}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDateTime(order.createdAt)}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${getStatusColor(order.status)} flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 my-4" />

                        {/* Product List */}
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Sản phẩm ({order.items.length})</div>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                      <Package className="h-6 w-6" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{item.name}</div>
                                  <div className="text-xs text-gray-500">x{item.quantity}</div>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="flex-shrink-0 flex items-center justify-center w-12 h-16 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Tổng tiền</div>
                            <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                              {formatCurrency(order.total)}
                            </div>
                          </div>

                          <div className="flex gap-3 w-full md:w-auto">
                            {['PENDING_PAYMENT', 'PAID'].includes(order.status) && (
                              cancellingId === order.id ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg border-gray-200"
                                    onClick={() => setCancellingId(null)}
                                    disabled={cancelOrder.isPending}
                                  >
                                    Không
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => handleCancel(order.id)}
                                    disabled={cancelOrder.isPending}
                                  >
                                    {cancelOrder.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => setCancellingId(order.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Hủy
                                </Button>
                              )
                            )}
                            <Button className="w-full md:w-auto rounded-xl bg-gray-900 hover:bg-black hover:shadow-lg transition-all" asChild>
                              <Link to={`/orders/${order.id}`} className="flex items-center justify-center gap-2">
                                Xem chi tiết
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Footer strip for visual appeal */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Support Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Cần hỗ trợ đơn hàng?</h3>
                    <p className="text-sm text-gray-600">Liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào</p>
                  </div>
                </div>
                <Button variant="outline" className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 rounded-xl" asChild>
                  <Link to="/support">Liên hệ hỗ trợ</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
