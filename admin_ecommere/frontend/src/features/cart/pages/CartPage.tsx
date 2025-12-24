import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '../hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CreditCard, Truck } from 'lucide-react';

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <>
        <SEO title="Giỏ hàng" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <EmptyState
              icon={<ShoppingBag className="h-24 w-24 text-gray-300" />}
              title="Giỏ hàng của bạn đang trống"
              description="Hãy khám phá bộ sưu tập nước hoa xịt thơm của chúng tôi"
              action={
                <Button asChild size="lg" className="w-full">
                  <Link to="/catalog">Bắt đầu mua sắm</Link>
                </Button>
              }
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Giỏ hàng" />
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                <Link to="/catalog" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
                <p className="text-gray-600 mt-1">{items.length} sản phẩm trong giỏ hàng</p>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {formatCurrency(totalPrice)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.variantId} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="relative">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-lg shadow-sm"
                        />
                        <Badge className="absolute -top-2 -right-2 bg-blue-600">
                          {item.quantity}
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {item.scent}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.volumeMl}ml
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Đơn giá: {formatCurrency(item.price / item.quantity)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.variantId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium text-lg">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="h-8 w-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Tổng đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính ({items.length} sản phẩm):</span>
                      <span className="font-medium">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Phí vận chuyển:
                      </span>
                      <span className="text-green-600 font-medium">Miễn phí</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-semibold">Tổng cộng:</span>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    <Button asChild className="w-full mb-3" size="lg">
                      <Link to="/checkout" className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tiến hành thanh toán
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full">
                      <Link to="/catalog" className="flex items-center justify-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Tiếp tục mua sắm
                      </Link>
                    </Button>
                  </div>

                  {/* Trust indicators */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Giao hàng tận nơi
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Thanh toán an toàn
                      </span>
                    </div>
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
