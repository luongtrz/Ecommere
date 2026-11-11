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
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <>
        <SEO title="Giỏ hàng" />
        <div className="min-h-[60vh] bg-background flex items-center justify-center py-12">
          <div className="max-w-md w-full px-4">
            <EmptyState
              icon={<ShoppingBag className="h-16 w-16 text-muted-foreground" />}
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
      <div className="min-h-screen bg-background">
        <div className="container section-y">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent">
                <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Tiếp tục mua sắm
                </Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-border pb-6">
              <div>
                <h1 className="section-title font-serif">Giỏ hàng của bạn</h1>
                <p className="text-sm text-muted-foreground mt-1">{items.length} sản phẩm trong giỏ hàng</p>
              </div>
              <span className="text-sm font-medium tabular text-muted-foreground">
                Tổng cộng: <span className="text-foreground font-semibold text-base">{formatCurrency(totalPrice)}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">
            {/* Cart Items as a list with divide-y */}
            <div className="divide-y divide-border border-b border-border">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="py-6 flex gap-4 sm:gap-6 items-start"
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="w-24 h-24 rounded-md bg-muted object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-base text-foreground line-clamp-2">
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

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-md border border-border bg-card">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-9 text-center text-sm font-medium tabular text-foreground">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Line total */}
                      <div className="text-right min-w-[90px]">
                        <div className="font-semibold text-base tabular text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-muted-foreground tabular hidden sm:block">
                            {formatCurrency(item.price)} / sp
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.variantId)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 transition-colors"
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
                <h2 className="font-sans text-lg font-semibold text-foreground">
                  Tổng đơn hàng
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính ({items.length} sản phẩm):</span>
                    <span className="font-medium tabular text-foreground">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Truck className="h-4 w-4" />
                      Phí vận chuyển:
                    </span>
                    <span className="text-success font-medium">Miễn phí</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-baseline mb-6">
                    <span className="text-base font-semibold text-foreground">Tổng cộng:</span>
                    <span className="text-xl font-semibold tabular text-primary">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>

                  <Button asChild size="lg" className="w-full">
                    <Link to="/checkout" className="flex items-center justify-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Tiến hành thanh toán
                    </Link>
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
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
        </div>
      </div>
    </>
  );
}
