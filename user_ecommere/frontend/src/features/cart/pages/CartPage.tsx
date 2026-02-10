import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '../hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <>
        <SEO title="Giỏ hàng" />
        <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full animate-fade-in">
            <EmptyState
              icon={<ShoppingBag className="h-20 w-20 text-gray-300" />}
              title="Giỏ hàng của bạn đang trống"
              description="Hãy khám phá bộ sưu tập nước hoa xịt thơm của chúng tôi"
              action={
                <Button asChild size="lg" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                <Link to="/catalog" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
                <p className="text-gray-500 mt-1">{items.length} sản phẩm trong giỏ hàng</p>
              </div>
              <Badge variant="secondary" className="text-lg px-5 py-2 rounded-full font-bold bg-blue-50 text-blue-600">
                {formatCurrency(totalPrice)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.variantId}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="p-5">
                    <div className="flex gap-5">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-xl shadow-sm"
                        />
                        <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                          {item.quantity}
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs rounded-full">
                            {item.scent}
                          </Badge>
                          <Badge variant="secondary" className="text-xs rounded-full">
                            {item.volumeMl}ml
                          </Badge>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Đơn giá: {formatCurrency(item.price / item.quantity)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.variantId)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-8 w-8 rounded-lg"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            className="h-8 w-8 rounded-lg"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-32 overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Tổng đơn hàng
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tạm tính ({items.length} sản phẩm):</span>
                      <span className="font-medium">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Phí vận chuyển:
                      </span>
                      <span className="text-emerald-600 font-medium">Miễn phí</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-base font-semibold">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    <Button asChild className="w-full mb-3 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 font-semibold" size="lg">
                      <Link to="/checkout" className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tiến hành thanh toán
                      </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full rounded-xl border-gray-200">
                      <Link to="/catalog" className="flex items-center justify-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Tiếp tục mua sắm
                      </Link>
                    </Button>
                  </div>

                  {/* Trust indicators */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-center gap-5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        Thanh toán an toàn
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        Giao hàng tận nơi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
