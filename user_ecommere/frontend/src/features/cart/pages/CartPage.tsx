import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '../hooks/useCart';
import { useRefreshCartPrices } from '../hooks/useRefreshCartPrices';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
} from 'lucide-react';

export function CartPage() {
  useRefreshCartPrices();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <>
        <SEO title="Giỏ hàng" />
        <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-12 md:py-20">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center transition-all duration-200">
            <EmptyState
              icon={<ShoppingBag className="text-teal-600 mx-auto" />}
              title="Giỏ hàng của bạn đang trống"
              description="Hãy khám phá bộ sưu tập nước hoa xịt thơm của chúng tôi"
              action={
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm font-semibold h-11 mt-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
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
      <div className="min-h-screen bg-slate-50 py-8 md:py-12">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-4 mb-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="p-0 h-auto hover:bg-transparent"
              >
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-500 hover:text-teal-600 transition-colors duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-md py-1"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 block mb-1">
                  Đơn hàng của bạn
                </span>
                <h1 className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 tracking-tight">
                  Giỏ hàng của bạn
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {items.length} sản phẩm trong giỏ hàng
                </p>
              </div>
              <Badge
                variant="secondary"
                className="self-start sm:self-auto text-base sm:text-lg px-4 py-1.5 rounded-xl font-sans font-bold bg-white text-slate-900 border border-slate-200 shadow-sm tabular-nums"
              >
                {formatCurrency(totalPrice)}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.variantId}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 border border-slate-200 group p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
                    <div className="flex gap-3.5 sm:gap-4 flex-1 min-w-0 items-start sm:items-center w-full sm:w-auto">
                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-50/80 border border-slate-200 p-1.5 flex items-center justify-center overflow-hidden">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <Badge className="absolute -top-2 -right-2 bg-teal-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 shadow-sm">
                          {item.quantity}
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-bold text-base text-slate-900 mb-1 truncate tracking-tight">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                          {item.scent && (
                            <Badge
                              variant="secondary"
                              className="text-xs rounded-md px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                            >
                              {item.scent}
                            </Badge>
                          )}
                          {item.volumeMl ? (
                            <Badge
                              variant="secondary"
                              className="text-xs rounded-md px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                            >
                              {item.volumeMl}ml
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-base sm:text-lg font-sans font-bold text-slate-900 tabular-nums tracking-tight">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                          Đơn giá: {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.variantId)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200 h-8 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          className="h-7 w-7 rounded-md hover:bg-white text-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-40"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold text-sm text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          disabled={
                            typeof item.stock === 'number' &&
                            item.quantity >= item.stock
                          }
                          className="h-7 w-7 rounded-md hover:bg-white text-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-24 overflow-hidden">
                <div className="bg-slate-50/80 p-5 sm:p-6 border-b border-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 block mb-1">
                    Tóm tắt
                  </span>
                  <h2 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
                    <CreditCard className="h-5 w-5 text-teal-600" />
                    Tổng đơn hàng
                  </h2>
                </div>
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Tạm tính ({items.length} sản phẩm):</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-teal-600" />
                        Phí vận chuyển:
                      </span>
                      <span className="text-emerald-600 font-semibold">
                        Miễn phí
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-5 space-y-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Tổng cộng:
                      </span>
                      <span className="text-2xl font-sans font-bold text-slate-900 tabular-nums tracking-tight">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    <Button
                      asChild
                      className="w-full h-11 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                      size="lg"
                    >
                      <Link
                        to="/checkout"
                        className="flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Tiến hành thanh toán
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                    >
                      <Link
                        to="/catalog"
                        className="flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Tiếp tục mua sắm
                      </Link>
                    </Button>
                  </div>

                  {/* Trust indicators */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Shield className="h-3.5 w-3.5 text-teal-600" />
                        Thanh toán an toàn
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Truck className="h-3.5 w-3.5 text-teal-600" />
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
