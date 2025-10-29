import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useOrders } from '../hooks/useOrders';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { formatDateTime } from '@/lib/utils';
import { Package } from 'lucide-react';

export function OrdersPage() {
  const { data, isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="container py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const orders = data?.orders || [];

  return (
    <>
      <SEO title="Đơn hàng của tôi" />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Đơn hàng của tôi</h1>

        {orders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-16 w-16" />}
            title="Chưa có đơn hàng"
            description="Bạn chưa có đơn hàng nào"
            action={
              <Button asChild>
                <Link to="/catalog">Bắt đầu mua sắm</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold">Đơn hàng #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <Badge>{order.status}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.items.length} sản phẩm
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                    
                    <Button asChild variant="outline">
                      <Link to={`/orders/${order.id}`}>Xem chi tiết</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
