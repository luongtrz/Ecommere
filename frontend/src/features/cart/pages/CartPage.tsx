import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '../hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <>
        <SEO title="Giỏ hàng" />
        <div className="container py-12">
          <EmptyState
            icon={<ShoppingBag className="h-16 w-16" />}
            title="Giỏ hàng trống"
            description="Bạn chưa có sản phẩm nào trong giỏ hàng"
            action={
              <Button asChild>
                <Link to="/catalog">Tiếp tục mua sắm</Link>
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Giỏ hàng" />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng ({items.length})</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.variantId} className="p-4">
                <div className="flex gap-4">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.scent} - {item.volumeMl}ml
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.variantId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Tổng đơn hàng</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển:</span>
                  <span className="text-muted-foreground">Tính sau</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/checkout">Tiến hành thanh toán</Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full mt-2">
                <Link to="/catalog">Tiếp tục mua sắm</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
