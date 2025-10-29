import { useParams } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrderDetail } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useOrderDetail(orderId!);

  if (isLoading) {
    return (
      <div className="container py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return <div className="container py-12">Không tìm thấy đơn hàng</div>;
  }

  return (
    <>
      <SEO title={`Đơn hàng #${order.orderNumber}`} />
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Đơn hàng #{order.orderNumber}</h1>
            <p className="text-muted-foreground">{formatDateTime(order.createdAt)}</p>
          </div>
          <Badge>{order.status}</Badge>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Số lượng: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(order.total - order.shippingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span>{formatCurrency(order.shippingFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Địa chỉ giao hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress?.phone}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {order.shippingAddress?.address}, {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thanh toán</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{order.paymentMethod}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
