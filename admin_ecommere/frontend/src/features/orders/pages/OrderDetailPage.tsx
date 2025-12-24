import { useParams } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrderDetail } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';
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
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrderDetail(orderId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-600 mb-6">Đơn hàng bạn tìm kiếm có thể không tồn tại hoặc đã bị xóa.</p>
          <Button asChild>
            <Link to="/orders">Xem tất cả đơn hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

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
      <SEO title={`Đơn hàng #${order.orderNumber}`} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="container py-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                <Link to="/orders" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách đơn hàng
                </Link>
              </Button>

              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
                <p className="text-sm text-gray-600 mt-1">#{order.orderNumber}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    Sản phẩm đã đặt ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Số lượng: {item.quantity} × {formatCurrency(item.price)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-blue-600">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    Địa chỉ giao hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900 mb-2">
                        {order.shippingAddress?.fullName}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Phone className="h-4 w-4" />
                        {order.shippingAddress?.phone}
                      </div>
                      <div className="text-gray-700 leading-relaxed">
                        {order.shippingAddress?.address}, {order.shippingAddress?.ward},{' '}
                        {order.shippingAddress?.district}, {order.shippingAddress?.province}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    Thông tin thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{order.paymentMethod}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Phương thức thanh toán đã chọn
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-xl sticky top-24">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Tóm tắt đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Order Info */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Ngày đặt hàng</div>
                        <div className="text-sm text-gray-600">{formatDateTime(order.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính ({order.items.length} sản phẩm):</span>
                      <span className="font-medium">{formatCurrency(order.total - order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Phí vận chuyển:
                      </span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(order.shippingFee)}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-semibold">Tổng cộng:</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-6">
                    <Badge className={`${getStatusColor(order.status)} w-full justify-center py-2 text-sm font-medium flex items-center gap-2`}>
                      {getStatusIcon(order.status)}
                      Trạng thái: {order.status}
                    </Badge>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <div className="text-xs font-medium text-gray-900">Đã xác nhận</div>
                    </div>
                    <div className="text-center">
                      <Truck className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs font-medium text-gray-900">Đang giao hàng</div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/orders">Xem tất cả đơn hàng</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
