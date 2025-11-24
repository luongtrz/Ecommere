import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrders } from '../hooks/useOrders';
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
  Plus
} from 'lucide-react';

export function OrdersPage() {
  const { data, isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const orders = data?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PACKING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />;
      case 'SHIPPED':
        return <Truck className="h-4 w-4" />;
      case 'PENDING_PAYMENT':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <>
      <SEO title="Đơn hàng của tôi" />

      <div className="min-h-screen bg-gray-50">
        <div className="container py-8 max-w-6xl">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Chưa có đơn hàng nào</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Bạn chưa đặt đơn hàng nào. Hãy bắt đầu mua sắm để có những trải nghiệm tuyệt vời!
              </p>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                <Link to="/catalog" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Bắt đầu mua sắm
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Header */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Lịch sử đơn hàng</h2>
                      <p className="text-gray-600">Tổng cộng {orders.length} đơn hàng</p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/catalog">Tiếp tục mua sắm</Link>
                  </Button>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">#{order.orderNumber}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Calendar className="h-4 w-4" />
                              {formatDateTime(order.createdAt)}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 px-3 py-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{order.items.length}</div>
                            <div className="text-sm text-gray-600">Sản phẩm</div>
                          </div>
                          <div className="w-px h-12 bg-gray-200"></div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(order.total)}</div>
                            <div className="text-sm text-gray-600">Tổng tiền</div>
                          </div>
                        </div>

                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                          <Link to={`/orders/${order.id}`} className="flex items-center gap-2">
                            Xem chi tiết
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Help Section */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cần hỗ trợ?</h3>
                  <p className="text-gray-600 mb-4">
                    Nếu bạn có câu hỏi về đơn hàng, hãy liên hệ với chúng tôi
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/support">Liên hệ hỗ trợ</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
