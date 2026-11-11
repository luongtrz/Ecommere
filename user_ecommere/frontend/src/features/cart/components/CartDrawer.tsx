import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const FREESHIP_THRESHOLD = 250000;

export function CartDrawer() {
  const { items, updateQuantity, removeItem, totalPrice, isOpen, closeCart } = useCart();

  const freeshipRemaining = Math.max(0, FREESHIP_THRESHOLD - totalPrice);
  const freeshipProgress = Math.min(100, Math.round((totalPrice / FREESHIP_THRESHOLD) * 100));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border bg-background shadow-md">
        <SheetHeader className="px-6 py-4 border-b border-border bg-card">
          <SheetTitle className="font-sans flex items-center justify-between text-base font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Giỏ Hàng Của Bạn</span>
            </span>
            <span className="text-xs font-normal text-muted-foreground tabular">
              {items.length} sản phẩm
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Freeship Progress Meter */}
        <div className="bg-muted/50 border-b border-border px-6 py-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-foreground">
              <Truck className="h-4 w-4 text-muted-foreground" />
              {freeshipRemaining === 0 ? (
                <span className="text-success font-medium">🎉 Bạn đã đủ điều kiện FREESHIP!</span>
              ) : (
                <span>
                  Mua thêm <strong className="font-semibold text-foreground tabular">{formatCurrency(freeshipRemaining)}</strong> để được Freeship
                </span>
              )}
            </div>
            <span className="font-medium text-foreground tabular">{freeshipProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${freeshipRemaining === 0 ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${freeshipProgress}%` }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-foreground text-base">Giỏ hàng của bạn đang trống</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Hãy khám phá các dòng chai xịt Thái Lan đuổi chuột, diệt côn trùng và tẩy rửa tiện ích.
                </p>
              </div>
              <Button
                onClick={closeCart}
                asChild
                className="w-full"
              >
                <Link to="/catalog">Khám Phá Sản Phẩm Ngay</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 px-6 overflow-y-auto divide-y divide-border">
              {items.map((item) => (
                <div key={item.variantId} className="py-4 flex gap-3.5 items-start">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="h-16 w-16 rounded-md bg-muted object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground line-clamp-1">
                          {item.name}
                        </p>
                        {(item.scent || item.volumeMl) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[item.scent, item.volumeMl ? `${item.volumeMl}ml` : null].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.variantId)}
                        className="text-muted-foreground hover:text-destructive h-7 w-7 flex-shrink-0"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-md border border-border bg-card">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Giảm số lượng"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-7 text-center text-xs font-medium tabular text-foreground">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                          aria-label="Tăng số lượng"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <span className="font-semibold text-sm tabular text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-card p-5 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tạm tính ({items.length} sản phẩm):</span>
                  <span className="font-medium tabular text-foreground">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Vận chuyển:</span>
                  <span className={freeshipRemaining === 0 ? 'text-success font-medium' : 'text-foreground'}>
                    {freeshipRemaining === 0 ? 'Miễn phí' : 'Tính khi thanh toán'}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">Tổng cộng:</span>
                  <span className="text-lg font-semibold tabular text-primary">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={closeCart}
                  asChild
                >
                  <Link to="/checkout" className="flex items-center justify-center gap-2">
                    Tiến Hành Thanh Toán
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <div className="text-center">
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="inline-block text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    Xem Trang Giỏ Hàng Chi Tiết
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
