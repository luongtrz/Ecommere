import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/features/cart/hooks/useCart';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const FREESHIP_THRESHOLD = 250000;

export function CartDrawer() {
  const { items, updateQuantity, removeItem, totalPrice, isOpen, closeCart } = useCart();

  const freeshipRemaining = Math.max(0, FREESHIP_THRESHOLD - totalPrice);
  const freeshipProgress = Math.min(100, Math.round((totalPrice / FREESHIP_THRESHOLD) * 100));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-l border-border bg-background shadow-luxury">
        <SheetHeader className="px-6 py-5 border-b border-border/80 bg-card/80 backdrop-blur-sm">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-foreground font-serif font-bold text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary border border-border/60">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span>Giỏ Hàng Của Bạn</span>
            </div>
            <span className="text-xs font-semibold text-foreground bg-secondary border border-border/80 px-3 py-1 rounded-full tabular-nums">
              {items.length} sản phẩm
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Freeship Progress Meter */}
        <div className="bg-secondary/50 border-b border-border/70 px-6 py-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Truck className="h-4 w-4 text-accent-foreground" />
              {freeshipRemaining === 0 ? (
                <span className="font-semibold text-foreground">Bạn đã đủ điều kiện FREESHIP!</span>
              ) : (
                <span>
                  Mua thêm <strong className="text-foreground font-semibold">{formatCurrency(freeshipRemaining)}</strong> để được Freeship
                </span>
              )}
            </div>
            <span className="font-serif font-bold text-foreground tabular-nums">{freeshipProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${freeshipProgress}%` }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-16 h-16 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground border border-border/50">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-foreground text-base">Giỏ hàng của bạn đang trống</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Hãy khám phá các dòng chai xịt Thái Lan đuổi chuột, diệt côn trùng và tẩy rửa tiện ích.
                </p>
              </div>
              <Button
                onClick={closeCart}
                asChild
                className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-11 shadow-luxury transition-all duration-300"
              >
                <Link to="/catalog">Khám Phá Sản Phẩm Ngay</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 px-6 overflow-y-auto divide-y divide-border/60">
              {items.map((item) => (
                <div key={item.variantId} className="py-4 flex gap-3.5 items-center group">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-black/[0.03] bg-card p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-serif font-semibold text-xs text-foreground line-clamp-1 leading-tight mb-1">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.scent && (
                          <Badge variant="secondary" className="px-2 py-0 text-[10px] font-medium bg-secondary text-secondary-foreground border-border/50 rounded-full">
                            {item.scent}
                          </Badge>
                        )}
                        {item.volumeMl ? (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {item.volumeMl}ml
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className="font-serif font-bold text-sm text-foreground tabular-nums">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center rounded-full border border-border bg-card p-0.5 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-muted text-foreground transition-colors"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-xs font-semibold text-foreground tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-muted text-foreground transition-colors"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-full hover:bg-muted"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/80 px-6 py-5 bg-card/95 backdrop-blur-sm space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tạm tính ({items.length} sản phẩm):</span>
                  <span className="font-medium text-foreground tabular-nums">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Vận chuyển:</span>
                  <span className={freeshipRemaining === 0 ? 'text-foreground font-semibold' : 'text-foreground font-medium'}>
                    {freeshipRemaining === 0 ? 'Miễn phí' : 'Tính khi thanh toán'}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-border flex justify-between items-baseline">
                  <span className="text-sm font-medium text-foreground">Tổng cộng:</span>
                  <span className="text-xl font-serif font-bold text-foreground tabular-nums">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Button
                  className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-luxury transition-all duration-300"
                  onClick={closeCart}
                  asChild
                >
                  <Link to="/checkout" className="flex items-center justify-center gap-2">
                    Tiến Hành Thanh Toán
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-11 rounded-full border-border hover:bg-muted text-xs font-medium text-foreground transition-all duration-300"
                  onClick={closeCart}
                  asChild
                >
                  <Link to="/cart">Xem Trang Giỏ Hàng Chi Tiết</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
