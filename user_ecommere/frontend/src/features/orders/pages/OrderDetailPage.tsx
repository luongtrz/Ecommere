import { useParams, Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrderDetail } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  User,
  XCircle,
  RotateCcw
} from 'lucide-react';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrderDetail(orderId!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-500 mb-6">Đơn hàng bạn tìm kiếm có thể không tồn tại hoặc đã bị xóa.</p>
          <Button className="w-full rounded-xl" asChild>
            <Link to="/orders">Xem tất cả đơn hàng</Link>
          </Button>
        </div>
      </div>
    );
  }

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

  // Status steps for timeline
  const steps = ['PENDING_PAYMENT', 'PACKING', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = steps.indexOf(order.status) === -1
    ? (order.status === 'PAID' ? 0 : (['CANCELLED', 'REFUNDED'].includes(order.status) ? -1 : 0))
    : steps.indexOf(order.status);

  const isCancelled = ['CANCELLED', 'REFUNDED'].includes(order.status);

  return (
    <>
      <SEO title={`Đơn hàng #${order.orderNumber}`} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white pb-24 pt-8 px-4">
          <div className="container max-w-6xl">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto text-gray-300 hover:text-white mb-6">
              <Link to="/orders" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách đơn hàng
              </Link>
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">Chi tiết đơn hàng</h1>
                <div className="flex items-center gap-3 text-gray-300">
                  <span>#{order.orderNumber}</span>
                  <span>•</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
              </div>
              <Badge className={`${getStatusColor(order.status)} px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md bg-opacity-90`}>
                {getStatusIcon(order.status)}
                <span className="font-semibold">{getStatusLabel(order.status)}</span>
              </Badge>
            </div>
          </div>
        </div>

        <div className="container py-8 max-w-6xl -mt-16 px-4">
          {/* Status Timeline */}
          {!isCancelled && (
            <Card className="shadow-lg border-0 mb-8 overflow-hidden rounded-2xl animate-fade-in">
              <CardContent className="p-8">
                <div className="relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full hidden md:block" />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                    {[
                      { status: 'PENDING_PAYMENT', label: 'Đặt hàng', icon: Clock },
                      { status: 'PACKING', label: 'Đóng gói', icon: Package },
                      { status: 'SHIPPED', label: 'Vận chuyển', icon: Truck },
                      { status: 'DELIVERED', label: 'Giao hàng', icon: CheckCircle }
                    ].map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.status} className="flex md:flex-col items-center gap-4 md:gap-3 md:text-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 transition-all duration-300 ${isCompleted
                            ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200'
                            : 'bg-white border-gray-200 text-gray-300'
                            }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className={`font-semibold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </div>
                            {isCurrent && (
                              <div className="text-xs text-blue-600 font-medium">Hiện tại</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="shadow-md border border-gray-100 overflow-hidden rounded-2xl animate-fade-in" style={{ animationDelay: '100ms' }}>
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100 py-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    Sản phẩm ({order.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-50">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-5 hover:bg-gray-50/50 transition-colors">
                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                          {/* Placeholder for item image if available in future API response */}
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                            <Package className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-base mb-1 truncate">{item.name}</h4>
                          <div className="text-sm text-gray-500 mb-2">Số lượng: {item.quantity}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.price)}
                            </div>
                            <div className="font-bold text-blue-600 text-base">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <Card className="shadow-md border border-gray-100 overflow-hidden rounded-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-b border-gray-100 py-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Địa chỉ giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="font-semibold text-gray-900">{order.shippingAddress?.fullName}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div className="text-gray-900">{order.shippingAddress?.phone}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed border border-gray-100">
                        {order.shippingAddress?.address}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Info */}
                <Card className="shadow-md border border-gray-100 overflow-hidden rounded-2xl animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b border-gray-100 py-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phương thức</div>
                        <div className="font-semibold text-gray-900 text-lg">{order.paymentMethod}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`${isCancelled ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} px-3 py-1`}>
                      {['PAID', 'DELIVERED'].includes(order.status) ? 'Đã thanh toán' : (isCancelled ? 'Đã hủy' : 'Chưa thanh toán')}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 sticky top-24 overflow-hidden rounded-2xl bg-white animate-fade-in" style={{ animationDelay: '400ms' }}>
                <CardHeader className="bg-gray-900 text-white py-5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-400" />
                    Tóm tắt chi phí
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Order Info */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Ngày đặt hàng</div>
                        <div className="text-sm font-semibold text-gray-900">{formatDateTime(order.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(order.total - order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí vận chuyển:</span>
                      <span className="font-medium text-green-600">
                        {order.shippingFee === 0 ? 'Miễn phí' : formatCurrency(order.shippingFee)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center mb-6">
                    <span className="text-base font-bold text-gray-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {/* Support */}
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-3">Gặp vấn đề với đơn hàng này?</p>
                    <Button variant="outline" className="w-full rounded-xl border-gray-200 hover:bg-gray-50" asChild>
                      <Link to="/support">Gửi yêu cầu hỗ trợ</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
