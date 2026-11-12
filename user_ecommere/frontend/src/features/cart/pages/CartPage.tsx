import { Link } from 'react-router-dom';
import { SEO } from '@/lib/seo';
import { useCart } from '../hooks/useCart';
import { useRefreshCartPrices } from '../hooks/useRefreshCartPrices';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';

export function CartPage() {
  useRefreshCartPrices();
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCart();
  const totalQuantity = totalItems ?? items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <SEO title="Giỏ hàng" />
      <div className="min-h-screen bg-background">
        <div className="container section-y pb-36 lg:pb-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent min-h-11 inline-flex items-center">
                <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11">
                  <ArrowLeft className="h-4 w-4" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-border pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance text-foreground">
                  Giỏ hàng của bạn
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalQuantity === 0
                    ? 'Chưa có sản phẩm nào trong giỏ hàng'
                    : `${totalQuantity} sản phẩm trong giỏ hàng`}
                </p>
              </div>
              {totalQuantity > 0 && (
                <span className="text-sm font-medium tabular text-muted-foreground">
                  Tổng cộng: <span className="text-foreground font-semibold text-base">{formatCurrency(totalPrice)}</span>
                </span>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-12 max-w-md mx-auto px-4">
              <EmptyState
                icon={<ShoppingBag className="h-16 w-16 text-muted-foreground" />}
                title="Giỏ hàng của bạn đang trống"
                description="Hãy khám phá các sản phẩm xịt thơm và gia dụng của chúng tôi."
                action={
                  <Button asChild size="lg" className="w-full min-h-11">
                    <Link to="/catalog">Bắt đầu mua sắm</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
              {/* Cart Items as a list with divide-y */}
              <div className="divide-y divide-border border-b border-border">
                {items.map((item, index) => (
                  <div
                    key={item.variantId}
                    data-testid="cart-item"
                    style={{ animationDelay: `${index * 80}ms` }}
                    className="py-6 flex gap-4 sm:gap-6 items-start"
                  >
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-muted object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base text-foreground line-clamp-2 leading-snug">
                          {item.name}
                        </p>
                        {(item.scent || item.volumeMl) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {[item.scent, item.volumeMl ? `${item.volumeMl}ml` : null].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground tabular mt-1 sm:hidden">
                          Đơn giá: {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                        {/* Quantity stepper */}
                        <div className="flex items-center rounded-md border border-border bg-card">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-11 w-11 min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium tabular text-foreground select-none">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                            className="h-11 w-11 min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Line total */}
                        <div className="text-right min-w-[90px]">
                          <div className="font-semibold text-base tabular text-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-sm text-muted-foreground tabular hidden sm:block">
                              {formatCurrency(item.price)} / sản phẩm
                            </div>
                          )}
                        </div>

                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.variantId)}
                          className="text-muted-foreground hover:text-destructive h-11 w-11 min-h-11 min-w-11 transition-colors ml-1"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-28 self-start">
                <div className="surface p-6 space-y-6">
                  <h2 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground">
                    Tổng đơn hàng
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính ({totalQuantity} sản phẩm):</span>
                      <span className="font-medium tabular text-foreground">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Truck className="h-4 w-4" />
                        Phí vận chuyển:
                      </span>
                      <span className="text-muted-foreground font-medium">Tính ở bước thanh toán</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-baseline mb-6">
                      <span className="text-base font-semibold text-foreground">Tổng cộng:</span>
                      <span className="text-xl font-semibold tabular text-primary">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    <Button asChild size="lg" className="w-full min-h-11">
                      <Link to="/checkout" className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tiến hành thanh toán
                      </Link>
                    </Button>
                  </div>

                  {/* Trust indicators */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Shield className="h-4 w-4" />
                        Thanh toán an toàn
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4" />
                        Giao hàng tận nơi
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile sticky checkout bar above bottom nav (h-16) */}
        {items.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 p-3 lg:hidden bg-card/95 backdrop-blur-sm border-t border-border z-30 shadow-lg">
            <div className="container flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Tổng cộng ({totalQuantity} sản phẩm):</p>
                <p className="text-base font-semibold tabular text-primary">
                  {formatCurrency(totalPrice)}
                </p>
              </div>
              <Button asChild size="lg" className="min-h-11 shrink-0">
                <Link to="/checkout" className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tiến hành thanh toán
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
